from flask import Blueprint, request, send_file, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.utils.shared import get_session_path
import pdfkit
import os
import io
from concurrent.futures import ThreadPoolExecutor

download_bp = Blueprint('download', __name__, url_prefix='/')

executor = ThreadPoolExecutor(max_workers=4)

def thread_generate_pdf(html_str):
    return executor.submit(pdfkit.from_string, html_str, False)

@download_bp.route('/download-pdf', methods=['POST'])
@jwt_required()
def download_pdf():
    data = request.get_json()
    session_id = data.get("sessionId")

    if not session_id:
        return jsonify({"error": "Missing session ID"}), 400

    # Build session file path
    resume_path = get_session_path(session_id, "resume_decoded.txt")

    if not os.path.exists(resume_path):
        return jsonify({"error": "Session resume not found"}), 404

    with open(resume_path, "r", encoding="utf-8") as f:
        resume_text = f.read()

        try:
            future = thread_generate_pdf(resume_text)
            result = future.result(timeout=30)

            if not isinstance(result, (bytes, bytearray)):
                raise ValueError("Invalid PDF data returned.")

            pdf_data = result  # type: bytes

            return send_file(
                io.BytesIO(pdf_data),
                mimetype='application/pdf',
                as_attachment=True,
                download_name='tailored_resume.pdf'
            )
        except Exception as e:
            print(f"PDF generation failed: {e}")
            return jsonify({"error": "Failed to generate PDF"}), 500
