from flask import Blueprint, request, jsonify
from backend.resume_builder import format_resume_html
import pdfkit
import os
import uuid
import json

generate_bp = Blueprint("generate", __name__)

@generate_bp.route("/generate-resume", methods=["POST"])
def generate_resume():
    try:
        data = request.json
        name = data.get("name")
        summary = data.get("summary")
        skills = data.get("skills", [])
        experience = data.get("experience", [])

        if not name or not summary:
            return jsonify({"error": "Missing name or summary"}), 400

        html = format_resume_html(name, summary, skills, experience)
        filename = f"{uuid.uuid4()}.pdf"
        output_path = os.path.join("sessions", filename)
        pdfkit.from_string(html, output_path)

        return jsonify({"message": "Resume generated", "file": filename})

    except Exception as e:
        return jsonify({"error": str(e)}), 500