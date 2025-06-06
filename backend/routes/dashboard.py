from flask import Blueprint, jsonify, request
from backend import db
from backend.models import User, MatchResult, JobDescription
from flask_jwt_extended import jwt_required, get_jwt_identity

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def get_dashboard():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    # Get match history
    matches = MatchResult.query.filter_by(user_id=user.id).order_by(MatchResult.created_at.desc()).all()

    return jsonify({
        "matches": [
            {
                "id": m.id,
                "job_title": m.job_description.title if m.job_description else "Untitled",
                "match_score": m.match_score,
                "summary": m.summary,
                "analyzed_at": m.created_at
            }
            for m in matches
        ]
    })