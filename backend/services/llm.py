import os
import requests
import json
from concurrent.futures import ThreadPoolExecutor

executor = ThreadPoolExecutor(max_workers=4)

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

def thread_call_your_model_api(prompt):
    return executor.submit(call_your_model_api, prompt)

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

def llm_parse_resume(resume_text: str) -> dict:
    prompt = f"""
You are a resume parsing assistant. Read the following resume text and extract structured data.

Return a JSON object with the following fields:
- summary: string (max 3 sentences)
- experience: list of objects with title, company, period, responsibilities
- skills: list of strings
- education: list of objects with course, school, level, completed

Resume:
\"\"\"
{resume_text}
\"\"\"
"""

    response = call_your_model_api(prompt)
    content = response.get("content", "")

    try:
        return json.loads(content)
    except json.JSONDecodeError:
        return {"error": "Failed to parse JSON from model output", "raw": content}