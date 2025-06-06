import os
import uuid
import json
import hashlib
import logging
from rapidfuzz import fuzz  # type: ignore
from concurrent.futures import ThreadPoolExecutor

executor = ThreadPoolExecutor(max_workers=4)

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

SESSION_BASE_PATH = "sessions"  # or wherever you're saving session files

def thread_match_resume_to_job(resume_text, job_text):
    return executor.submit(match_resume_to_job, resume_text, job_text)

def get_session_path(session_id: str, filename: str) -> str:
    return os.path.join(SESSION_BASE_PATH, session_id, filename)

def generate_session_id():
    return str(uuid.uuid4())

def save_to_session(session_id, filename, content):
    base_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "sessions")
    session_folder = os.path.join(base_dir, session_id)
    os.makedirs(session_folder, exist_ok=True)
    full_path = os.path.join(session_folder, filename)
    with open(full_path, "w", encoding="utf-8") as f:
        f.write(content)
    return full_path

def get_cache_key(text):
    return hashlib.md5(text.encode("utf-8")).hexdigest()

def load_cached_skills(job_text):
    cache_dir = "cache"
    os.makedirs(cache_dir, exist_ok=True)
    path = os.path.join(cache_dir, f"{get_cache_key(job_text)}.json")
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    return None

def save_cached_skills(job_text, data):
    cache_dir = "cache"
    os.makedirs(cache_dir, exist_ok=True)
    path = os.path.join(cache_dir, f"{get_cache_key(job_text)}.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

def match_skills(skills_required, resume_text, scorer=fuzz.token_set_ratio, threshold=85):
    matched = []
    missing = []
    scores = {}
    for skill in skills_required:
        score = scorer(skill.lower(), resume_text.lower())
        scores[skill] = score
        if score >= threshold:
            matched.append(skill)
        else:
            missing.append(skill)
    return matched, missing, scores, scores

def match_resume_to_job(resume_text, job_text):
    """
    Placeholder for your model or LLM API call.
    Replace this with a real call to OpenAI, Anthropic, or your custom model.
    """
    logging.info("Mock call_your_model_api invoked.")

    # Example mock response
    return {
        "score": 85,
        "highlights": ["Matched skill: Python", "Matched keyword: Project Manager"],
        "recommendations": ["Add leadership experience", "Mention Agile certification"],
        "output_text": "Mock tailored resume content based on the job ad."
    }

import re

def extract_job_title_from_text(job_text):
    """
    Extracts a likely job title from the top portion of a job description using regex patterns.
    Looks for lines near the top that contain 'Position', 'Title', or match job title patterns.
    """
    lines = job_text.strip().split('\n')
    candidates = lines[:10]  # Just look at the top 10 lines

    # Common patterns
    patterns = [
        r"(Position|Job\s*Title)[:\-–]\s*(.+)",     # Position: Project Manager
        r"^\s*(.+?)\s*[-–]\s*(Full[- ]?Time|Part[- ]?Time|Contract)",  # Project Manager – Full Time
        r"^\s*(Senior|Junior)?\s*(\w+\s?){1,4}(Manager|Engineer|Analyst|Consultant|Developer)",  # Role-like phrases
    ]

    for line in candidates:
        for pattern in patterns:
            match = re.search(pattern, line, flags=re.IGNORECASE)
            if match:
                title = match.group(2) if len(match.groups()) > 1 else match.group(0)
                return title.strip()

    # Fallback: return the first non-empty line if no match
    for line in candidates:
        if line.strip():
            return line.strip()

    return "Unknown Title"
