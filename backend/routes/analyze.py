from backend.utils.parser import decode_resume_base64, extract_experience_block
from backend.utils.skill_normalizer import normalize_skills, extract_normalized_resume_skills
from backend.utils.prompt_builder import generate_hybrid_resume_prompt
from backend.utils.section_confidence import flag_low_confidence_sections
from backend.utils.diff_check import compare_resumes


from rapidfuzz import fuzz
import traceback
import json
import re

analyze_bp = Blueprint('analyze', __name__)

@analyze_bp.route('/analyze-jd-vs-resume', methods=['POST'])
def analyze_jd_vs_resume():
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'Request body must be JSON'}), 400

        job_text = data.get("jobText", "").strip()
        resume_raw = data.get("resumeText", "").strip()  # This might be base64 or plain text

        if not job_text or not resume_raw:
            return jsonify({'error': 'Job description (jobText) and resume (resumeText) are required'}), 400

        session_id = generate_session_id()

        try:
            resume_input = decode_resume_base64(resume_raw)
            if not resume_input:
                raise ValueError("Decoded resume text is empty.")
                print("--- INFO: Resume decoded successfully. ---")
        except Exception as e:
            print(f"!!! ERROR: Resume decoding failed: {e} !!!")
            return jsonify({"error": f"Resume parsing/decoding failed: {e}"}), 400  # Use 400 for bad input

        # -- Auto-detect job title and prepend it to the JD
        job_title = extract_job_title_from_text(job_text)
        print(f"--- INFO: Extracted Job Title: {job_title} ---")

        job_text_with_title = f"Job Title: {job_title}\n\n{job_text}"

        save_to_session(session_id, "jd.txt", job_text_with_title)
        save_to_session(session_id, "resume_raw.txt", resume_raw)
        save_to_session(session_id, "resume_decoded.txt", resume_input)

        # Truncate for API calls (do this *after* saving full versions)
        # Use character limits that are reasonable for context window but preserve key info
        MAX_JD_CHARS = 6000
        MAX_RESUME_CHARS = 6000
        job_text_trunc = job_text_with_title[:MAX_JD_CHARS]
        resume_input_trunc = resume_input[:MAX_RESUME_CHARS]

        # Extract experience blocks from DECODED text
        experience_blocks = extract_experience_block(resume_input)
        save_to_session(session_id, "resume_experience_blocks.txt",
                        "\n\n---\n\n".join(experience_blocks))

        # Structure experience data (simplified)
        structured_experience = []
        for i, block in enumerate(experience_blocks):
            lines = block.strip().split('\n')
            title_line = lines[0] if lines else f"Experience Block {i+1}"
            # Simple structure: just title and the full block text
            structured_experience.append({"title": title_line, "details": block})
        save_to_session(session_id, "resume_experience_structured.json",
                        json.dumps(structured_experience, indent=2))

        # --- Skill Extraction ---
        extracted_skills = []
        skill_scores = {}
        raw_skill_scores = {}
        matched_skills = []
        missing_skills = []
        match_score = 0

        # Attempt to load cached skills first
        cached_skill_data = load_cached_skills(job_text)  # Use original job_text for cache key

        if cached_skill_data and "choices" in cached_skill_data:
            print(f"--- INFO: Using cached skills for JD. ---")
            skill_list_raw = cached_skill_data['choices'][0]['message']['content']
            extracted_skills = skill_normalizer.normalize_skills(skill_list_raw)  # changed
        else:
            print(f"--- INFO: Fetching skills from LLM (cache miss or invalid). ---")
            extract_skills_prompt = [
                {"role": "system",
                 "content": "You are an expert recruitment analyst. Extract a list of key technical skills, soft skills, tools, and qualifications from the following job description. List each skill or qualification on a new line. Be concise."},
                {"role": "user", "content": f"""
            Carefully analyze the job description provided below and extract a list of skills and qualifications that a candidate should possess.
            

            **Instructions:**
            

            1.  Identify specific skills, tools, technologies, and qualifications mentioned or implied within the job description.
            2.  Include both technical skills (e.g., programming languages, software), soft skills (e.g., communication, leadership), and any other relevant qualifications (e.g., certifications, education).
            3.  Extract skills as concise phrases, точно as they are written in the job description.  Do not add any words.
            4.  If a skill is mentioned with a technology or tool (e.g., "Experience with Okta"), extract only the tool/technology ("Okta").
            5.  If a skill is described as an action, extract the skill as a noun (e.g., "Manage access control" should be extracted as "access control").
            6.  Prioritize skills that are explicitly stated or strongly implied as requirements.
            7.  Output the extracted skills as a list of strings, separated by commas.
            
            **Example**
            
            Job Description:
            
            * Manage and organise access control processes
            * Communicate with application administrators
            * Experience with access management tools such as Okta
            * Strong problem-solving skills
            * Relevant certifications (e.g., CISSP, CIAM) are a plus
            
            
            
            Output:
            
            access control, application administrators, Okta, problem solving, CISSP, CIAM
            

            Job Description:
            {job_text_trunc}
            """}  # Use truncated JD
            ]
            try:
                skill_response_data = call_your_model_api(
                    extract_skills_prompt)  # Use the unified API call function
                skill_list_raw = skill_response_data['content']
                extracted_skills = skill_normalizer.normalize_skills(skill_list_raw)  # changed
                # Save to cache if successful
                save_cached_skills(job_text, {"choices": [{"message": {"content": skill_list_raw}}]})  # Save in expected format
            except Exception as e:
                print(
                    f"!!! WARNING: Skill extraction API call failed: {e}. Proceeding without LLM skills. !!!")
                # Potential fallback: Rule-based extraction or rely only on resume skills? For now, continue with empty list.
                extracted_skills = []

        print(f"--- INFO: Normalized skills extracted from JD: {len(extracted_skills)} ---")
        print(f"--- DEBUG: Extracted Skills Sample: {extracted_skills[:15]} ---")  # Print sample
        save_to_session(session_id, "jd_extracted_skills.json", json.dumps(extracted_skills, indent=2))

        # --- Skill Matching ---
        if extracted_skills:
            # Normalize resume skills (more focused extraction)
            normalized_resume_skills_list = extract_normalized_resume_skills(resume_input)
            save_to_session(session_id, "resume_normalized_skills.json",
                                     json.dumps(normalized_resume_skills_list, indent=2))
            # Join resume skills into a single string for matching
            resume_skills_text_for_match = " \n ".join(normalized_resume_skills_list)
            # Alternative: Match against full resume text if skill section poor?
            # resume_text_for_match = resume_input

            print(f"--- INFO: Matching {len(extracted_skills)} JD skills against resume content. ---")
            matched_skills, missing_skills, skill_scores, raw_skill_scores = match_skills(
                extracted_skills,
                resume_input,  # Match against full decoded resume text
                scorer=fuzz.partial_ratio,  # Use partial_ratio for finding mentions
                threshold=75  # Adjust threshold based on testing (75 is a reasonable start)
            )
            match_score = round((len(matched_skills) / len(extracted_skills)) * 100,
                                 2) if extracted_skills else 0
            print(f"--- INFO: Skill Match Score: {match_score}% ---")
            print(f"--- DEBUG: Matched Skills: {matched_skills} ---")
            print(f"--- DEBUG: Missing Skills: {missing_skills} ---")
        else:
            print("--- INFO: No skills extracted from JD, skipping skill matching. ---")
            match_score = 0  # Or indicate N/A

        # --- AI Analysis (Summary & Questions) ---
        print("--- INFO: Generating AI summary and clarification questions. ---")
        analysis_prompt = [
            {"role": "system", "content": "You are a helpful career coach analyzing resume-job description alignment."},
            {"role": "user", "content": f'''
 Review the Job Description and the Candidate's Resume below.
 

  **Job Title:** {job_title}
 

  **Job Description (Excerpt):**
  {job_text_trunc}
 

  Candidate Resume:
  {resume_input_trunc}
 

  **Analysis Task:**
 

  1.  Write a concise paragraph (5-8 sentences) summarizing how well the candidate's resume aligns with the key requirements of the job description. Mention specific strengths, alignments, and notable gaps or areas for improvement. Be objective.
 

  2.  **Clarification Questions:** Provide 3-5 specific questions **for the job seeker** to help them improve their resume for this specific role. Focus on clarifying experience, quantifying achievements, or adding missing skills/keywords identified in the job description. Do **not** ask questions answerable from the provided texts. Phrase questions to elicit information that can be added to the resume.
 

  **Output Format:**
  [Alignment Summary Paragraph Here]
 

  **Clarification Questions:**
  1. [Question 1]
  2. [Question 2]
  3. [Question 3]
  ...
  '''}
        ]

        try:
            ai_response_data = call_your_model_api(analysis_prompt)
            analysis_output = ai_response_data['content']

            # Parse the output
            summary = "Could not parse summary."
            questions = []
            try:
                summary_part, questions_part = analysis_output.split("**Clarification Questions:**", 1)
                summary = summary_part.strip()
                # Extract questions (handle potential variations like numbered or bulleted lists)
                question_lines = questions_part.strip().split('\n')
                questions = [re.sub(r'^\s*[\d\.\*-]+\s*', '', line).strip() for line in
                             question_lines if line.strip() and len(
                                 re.sub(r'^\s*[\d\.\*-]+\s*', '', line).strip()) > 5]  # Basic filtering
            except ValueError:
                print(
                    "--- WARNING: Could not split AI analysis output as expected. Treating all as summary. ---")
                summary = analysis_output  # Use the whole output as summary if split fails
                questions = ["Could not parse questions."]

            print("--- INFO: AI Analysis generated successfully. ---")
            save_to_session(session_id, "ai_analysis.txt", analysis_output)  # Save raw output

        except Exception as e:
            print(f"!!! ERROR: AI analysis generation failed: {e} !!!")
            summary = "Error generating analysis."
            questions = ["Error generating questions."]

        # --- Response ---
        return jsonify({
            "summary": summary,
            "questions": questions,
            "analytics": {
                "match_score": match_score,
                "matched_skills": matched_skills,
                "missing_skills": missing_skills,
                "skill_scores": skill_scores,  # Scores for matched/missing
                # "raw_skills_scores": raw_skill_scores, # Optional: include if needed for detailed view
                "structured_experience": structured_experience,  # Simplified structure
                "extracted_jd_skills": extracted_skills,  # Send the list of skills looked for
            },
            "session_id": session_id
        })

    except Exception as e:
        # Catch-all for unexpected errors during request processing
        print(f"!!! FATAL ERROR in /analyze-jd-vs-resume endpoint !!!")
        print(f"Error type: {type(e).__name__}")
        print(f"Error details: {e}")
        traceback.print_exc()
        return jsonify({'error': f'An unexpected server error occurred: {str(e)}'}), 500