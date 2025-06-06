from flask import Blueprint, request, jsonify
import traceback
import json
import re
from rapidfuzz import fuzz #type: ignore
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.models import Resume, JobDescription, User
from backend.extensions import db
from backend.models import MatchResult

# === Utils & Services ===
from backend.utils.ats_score import calculate_ats_score
from backend.utils.parser import decode_resume_base64, extract_experience_block
from backend.utils.skill_normalizer import normalize_skills, extract_normalized_resume_skills
from backend.services.llm import thread_call_your_model_api
from backend.utils.shared import (
    generate_session_id,
    save_to_session,
    extract_job_title_from_text,
    load_cached_skills,
    save_cached_skills,
    match_skills
)

analyze_bp = Blueprint('analyze', __name__)

@analyze_bp.route('/analyze-jd-vs-resume', methods=['POST'])
@jwt_required()
def analyze_jd_vs_resume():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    try:
        data = request.json
        if not data:
            return jsonify({'error': 'Request body must be JSON'}), 400

        job_text = data.get("jobText", "").strip()
        resume_raw = data.get("resumeText", "").strip()

        if not job_text or not resume_raw:
            return jsonify({'error': 'Job description (jobText) and resume (resumeText) are required'}), 400

        session_id = generate_session_id()

        try:
            resume_input = decode_resume_base64(resume_raw)
            if not resume_input:
                raise ValueError("Decoded resume text is empty.")
        except Exception as e:
            return jsonify({"error": f"Resume parsing/decoding failed: {e}"}), 400

        # ✅ Get user ID
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404


        # Save resume and job description
        job_title = extract_job_title_from_text(job_text)
        resume_record = Resume(user_id=user_id, content=resume_input)
        jd_record = JobDescription(user_id=user_id, content=job_text, title=job_title)
   
        db.session.add_all([resume_record, jd_record])
        db.session.commit()

        print("--- Resume ID:", resume_record.id)
        print("--- JD ID:", jd_record.id)

        # Prepare inputs
        job_text_with_title = f"Job Title: {job_title}\n\n{job_text}"
        resume_input_trunc = resume_input[:6000]
        job_text_trunc = job_text_with_title[:6000]

        # Skill extraction (cached or fresh)
        cached_skill_data = load_cached_skills(job_text)
        if cached_skill_data and "choices" in cached_skill_data:
            skill_list_raw = cached_skill_data['choices'][0]['message']['content']
            extracted_skills = normalize_skills(skill_list_raw)
        else:
            try:
                extract_skills_prompt = [
                    {"role": "system", "content": "You are an expert recruitment analyst..."},
                    {"role": "user", "content": job_text_trunc}
                ]
                skill_response_data = call_your_model_api(extract_skills_prompt)
                skill_list_raw = skill_response_data['content']
                extracted_skills = normalize_skills(skill_list_raw)
                save_cached_skills(job_text, {"choices": [{"message": {"content": skill_list_raw}}]})
            except Exception as e:
                extracted_skills = []

        # Skill matching
        matched_skills, missing_skills, skill_scores, raw_skill_scores = match_skills(
            extracted_skills, resume_input, scorer=fuzz.partial_ratio, threshold=75
        ) if extracted_skills else ([], [], {}, {})
        match_score = round((len(matched_skills) / len(extracted_skills)) * 100, 2) if extracted_skills else 0

        # ATS score
        ats_scores = calculate_ats_score(resume_input, extracted_skills, "pdf") if extracted_skills else {
            "keyword_density_score": 0,
            "formatting_score": 0,
            "file_score": 0,
            "ats_score_total": 0
        }

        # AI analysis
        try:
            llm_prompt = f"""Compare the following job description with the resume below. Provide a 3-paragraph summary evaluating the resume's alignment with the job ad, including:
1. Key matching areas
2. Gaps or missing skills/experience
3. Suggestions for improvement

Job Description:
{job_text}

Resume:
{resume_input_trunc}"""
            future = thread_call_your_model_api(llm_prompt)
            ai_response_data = future.result(timeout=30)
            analysis_output = ai_response_data['content']

            try:
                summary_part, questions_part = analysis_output.split("**Clarification Questions:**", 1)
                summary = summary_part.strip()
                questions = [re.sub(r'^\s*[\d\.\*-]+\s*', '', q.strip()) for q in questions_part.strip().split('\n') if q.strip()]
            except ValueError:
                summary = analysis_output
                questions = ["Could not parse questions."]
        except Exception as e:
            summary = "Error generating analysis."
            questions = ["Error generating questions."]
            analysis_output = summary

        print(">>> About to save MatchResult")
        match_result = MatchResult(
            user_id=user_id,
            resume_id=resume_record.id,
            job_description_id=jd_record.id,
            match_score=match_score,
            summary=summary
        )
        db.session.add(match_result)
        db.session.commit()
        print(">>> MatchResult saved successfully")

        # ✅ Return response
        return jsonify({
            "job_title": job_title,
            "summary": summary,
            "questions": questions,
            "analytics": {
                "match_score": match_score,
                "matched_skills": matched_skills,
                "missing_skills": missing_skills,
                "skill_scores": skill_scores,
                "ats_score": ats_scores,
                "analysis_summary": analysis_output
            },
            "session_id": session_id
        })

    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': f'Server error: {str(e)}'}), 500


@analyze_bp.route('/analyze-preview', methods=['POST'])
def analyze_preview():
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'Request body must be JSON'}), 400

        job_text = data.get("jobText", "").strip()
        resume_raw = data.get("resumeText", "").strip()

        if not job_text or not resume_raw:
            return jsonify({'error': 'Job description (jobText) and resume (resumeText) are required'}), 400

        resume_input = decode_resume_base64(resume_raw)
        if not resume_input:
            return jsonify({'error': 'Resume decoding failed'}), 400

        job_title = extract_job_title_from_text(job_text)
        job_text_with_title = f"Job Title: {job_title}\n\n{job_text}"

        extracted_skills = []
        match_score = 0
        matched_skills = []
        missing_skills = []

        ats_scores = {
            "keyword_density_score": 0,
            "formatting_score": 0,
            "file_score": 0,
            "ats_score_total": 0
        }

        cached_skill_data = load_cached_skills(job_text)
        if cached_skill_data and "choices" in cached_skill_data:
            skill_list_raw = cached_skill_data['choices'][0]['message']['content']
            extracted_skills = normalize_skills(skill_list_raw)
        else:
            extract_skills_prompt = [
                {"role": "system", "content": "You are an expert recruitment analyst..."},
                {"role": "user", "content": job_text_with_title}
            ]
            try:
                skill_response_data = call_your_model_api(extract_skills_prompt)
                skill_list_raw = skill_response_data['content']
                extracted_skills = normalize_skills(skill_list_raw)
                save_cached_skills(job_text, {"choices": [{"message": {"content": skill_list_raw}}]})
            except Exception as e:
                print(f"Skill extraction failed: {e}")

        if extracted_skills:
            matched_skills, missing_skills, _, _ = match_skills(
                extracted_skills,
                resume_input,
                scorer=fuzz.partial_ratio,
                threshold=75
            )
            match_score = round((len(matched_skills) / len(extracted_skills)) * 100, 2)
            file_extension = "pdf"
            ats_scores = calculate_ats_score(resume_input, extracted_skills, file_extension)
            
        return jsonify({
            "summary": "Preview analysis complete. Log in to see full breakdown.",
            "match_score": match_score,
            "ats_score": ats_scores,
        })

    except Exception as e:
        print(f"Preview analysis error: {e}")
        return jsonify({'error': 'Something went wrong.'}), 500
