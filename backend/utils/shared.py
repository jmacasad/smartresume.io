import os
import uuid
import json
import hashlib
import traceback
import requests
from rapidfuzz import fuzz

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

def call_your_model_api(prompt):
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost",
        "X-Title": "Resume Optimizer",
    }

    if isinstance(prompt, list):
        messages = prompt
    elif isinstance(prompt, str):
        messages = [{"role": "user", "content": prompt}]
    else:
        raise TypeError("Prompt must be a string or list of messages")

    payload = {
        "model": "openai/gpt-3.5-turbo",
        "messages": messages,
        "temperature": 0.2,
        "max_tokens": 3500
    }

    try:
        response = requests.post("https://openrouter.ai/api/v1/chat/completions", json=payload, headers=headers)
        response.raise_for_status()
        content = response.json()["choices"][0]["message"]["content"]
        return {"content": content.strip()}
    except Exception as e:
        print(f"!!! ERROR: LLM call failed: {e}")
        raise

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
