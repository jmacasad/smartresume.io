from flask import Blueprint, request, jsonify
import json
from backend.utils.parser import decode_resume_base64, extract_job_title_from_text
from backend.services.llm import llm_parse_resume
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.models import User, UserProfile, JobDescription
from backend.extensions import db
from json.decoder import JSONDecodeError

profile_bp = Blueprint('profile', __name__, url_prefix='/profile')

@profile_bp.route('/upload-resume', methods=['POST'])
@jwt_required()
def upload_resume():
    data = request.get_json()
    resume_raw = data.get("resume_base64")

    if not resume_raw:
        return jsonify({"error": "Resume text is missing"}), 400

    try:
        resume_text = decode_resume_base64(resume_raw)
        parsed = llm_parse_resume(resume_text)
        if "error" in parsed:
            return jsonify({"error": parsed["error"]}), 500
    except Exception as e:
        return jsonify({"error": f"Parsing failed: {str(e)}"}), 500

    user_id = get_jwt_identity()
    user_profile = UserProfile.query.filter_by(user_id=user_id).first()

    if not user_profile:
        user_profile = UserProfile(user_id=user_id)

    experience = parsed.get("experience", "")
    education = parsed.get("education", "")
    skills = parsed.get("skills", "")

    user_profile.experience = json.dumps(experience) if isinstance(experience, list) else experience
    user_profile.education = json.dumps(education) if isinstance(education, list) else education
    user_profile.skills = ", ".join(skills) if isinstance(skills, list) else skills

    db.session.add(user_profile)
    db.session.commit()

    return jsonify(parsed), 200

@profile_bp.route('/save', methods=['POST'])
@jwt_required()
def save_profile():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.get_json()

    user.first_name = data.get("first_name", user.first_name)
    user.last_name = data.get("last_name", user.last_name)

    summary = data.get("summary")
    experience = data.get("experience")
    skills = data.get("skills")
    education = data.get("education")

    user_profile = UserProfile.query.filter_by(user_id=user.id).first()
    if not user_profile:
        user_profile = UserProfile(user_id=user.id)

    user_profile.summary = summary
    user_profile.experience = json.dumps(experience) if isinstance(experience, list) else experience
    user_profile.education = json.dumps(education) if isinstance(education, list) else education
    user_profile.skills = ", ".join(skills) if isinstance(skills, list) else skills

    db.session.add(user)
    db.session.add(user_profile)
    db.session.commit()

    return jsonify({"message": "Profile saved successfully"}), 200

@profile_bp.route('/me', methods=['GET'])
@jwt_required()
def get_profile():
    user_id = get_jwt_identity()

    user = User.query.get(user_id)
    user_profile = UserProfile.query.filter_by(user_id=user_id).first()

    if not user or not user_profile:
        return jsonify({}), 200

    try:
        experience = json.loads(user_profile.experience) if user_profile.experience else []
    except JSONDecodeError:
        experience = []

    try:
        education = json.loads(user_profile.education) if user_profile.education else []
    except JSONDecodeError:
        education = []

    skills = [s.strip() for s in user_profile.skills.split(",")] if user_profile.skills else []

    return jsonify({
        "first_name": user.first_name,
        "last_name": user.last_name,
        "summary": user_profile.summary,
        "experience": experience,
        "skills": skills,
        "education": education
    }), 200

@profile_bp.route('/init', methods=['POST'])
@jwt_required()
def init_profile():
    user_id = get_jwt_identity()
    print(f"\U0001F680 /profile/init → user_id: {user_id}")

    existing = UserProfile.query.filter_by(user_id=user_id).first()
    if existing:
        print("ℹ️ Profile already exists")
        return jsonify({"message": "Profile already exists"}), 200

    new_profile = UserProfile(user_id=user_id)
    db.session.add(new_profile)
    db.session.commit()

    print("✅ New profile created")
    return jsonify({"message": "Profile initialized"}), 201

@profile_bp.route('/upload-job', methods=['POST'])
@jwt_required()
def upload_job():
    data = request.get_json()
    job_raw = data.get("job_base64")

    if not job_raw:
        return jsonify({"error": "Job description text is missing"}), 400

    try:
        job_text = decode_resume_base64(job_raw)
    except Exception as e:
        return jsonify({"error": f"Failed to decode job text: {str(e)}"}), 500

    job_title = extract_job_title_from_text(job_text)
    user_id = get_jwt_identity()

    job = JobDescription(    # type: ignore
        title=job_title,
        content=job_text,
        user_id=user_id
    )
    db.session.add(job)
    db.session.commit()

    return jsonify({"message": "Job description uploaded", "job_title": job_title}), 200
