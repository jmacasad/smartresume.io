import re
import base64
import tempfile
from docx import Document

def extract_experience_block(resume_text):
    """
    Extracts the 'Experience' or 'Career Summary' section from resume text with bullet points and job details.
    """
    sections = split_into_sections(resume_text)
    experience_sections = []

    for key in sections:
        if 'experience' in key.lower() or 'career summary' in key.lower():
            content = sections[key]
            # Get bullet points or meaningful paragraphs
            detailed_lines = [line for line in content.split('\n') if '-' in line or len(line.strip()) > 50]
            experience_sections.extend(detailed_lines)

    return "\n".join(experience_sections).strip()


def split_into_sections(text):
    """Split resume text into sections using common headers."""
    headers = [
        "contact information", "contact", "profile", "summary", "about me", "objective",
        "experience", "work experience", "employment history", "professional experience",
        "education", "academic background", "skills", "technical skills",
        "certifications", "achievements", "projects", "languages"
    ]
    pattern = "|".join(rf"{re.escape(header)}" for header in headers)
    matches = list(re.finditer(pattern, text, flags=re.IGNORECASE))  # ✅ use flags, not inline
    sections = {}
    
    for i, match in enumerate(matches):
        start = match.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        section_title = match.group().lower()
        sections[section_title] = text[start:end].strip()

    return sections

def decode_resume_base64(resume_raw):
    """Helper to decode a base64-encoded .docx file or plain text."""
    if resume_raw.startswith('UEsDB'):
        try:
            docx_bytes = base64.b64decode(resume_raw)
            with tempfile.NamedTemporaryFile(suffix=".docx", delete=False) as f:
                f.write(docx_bytes)
                path = f.name
            doc = Document(path)
            return "\n".join([p.text for p in doc.paragraphs if p.text.strip()])
        except Exception as e:
            raise ValueError(f"Resume decode failed: {e}")
    else:
        return resume_raw
