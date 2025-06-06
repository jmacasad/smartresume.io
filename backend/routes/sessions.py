from flask import Blueprint, request, jsonify
from backend.utils.shared import save_to_session, generate_session_id
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.models import User  # adjust if your User model is elsewhere
from backend import db  # or wherever your SQLAlchemy db is declared

sessions_bp = Blueprint('sessions', __name__, url_prefix='/profile')

@sessions_bp.route('/upload-resume', methods=['POST'])
@jwt_required()
def debug_upload_resume():
    print("📄 HIT /profile/upload-resume")  # <-- this MUST print if request hits

    print("📩 request.files keys:", list(request.files.keys()))
    file = request.files.get('file')
    if not file:
        print("❌ No file received!")
        return jsonify({'error': 'No file uploaded'}), 400

    print(f"📎 Received file: {file.filename}")
    return jsonify({'message': 'File received', 'filename': file.filename}), 200


@sessions_bp.route("/save-session", methods=["POST"])
def save_session():
    try:
        data = request.json
        filename = data.get("filename")
        content = data.get("content")
        session_id = data.get("session_id") or generate_session_id()

        save_to_session(session_id, filename, content)
        return jsonify({"message": "Saved", "session_id": session_id})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@sessions_bp.route('/me', methods=['GET'])
@jwt_required()
def get_profile():
    user_id = get_jwt_identity()
    print("🔍 JWT identity (raw):", user_id)

    try:
        user = User.query.get(int(user_id))
        print("📦 User from DB:", user)
    except Exception as e:
        print("❌ DB lookup failed:", e)
        return jsonify({'error': str(e)}), 500

    if not user:
        return jsonify({'error': 'Profile not found'}), 404

    # Try to fetch UserProfile if it exists
    profile = user.profile
    return jsonify({
        'summary': profile.summary if profile else '',
        'experience': profile.experience if profile else '',
        'skills': profile.skills if profile else '',
        'education': profile.education if profile else ''
    }), 200

