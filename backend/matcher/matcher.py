import re

def normalize_skills(text):
    parts = re.split(r'[\n,;•]+', text)
    normalized = []

    for p in parts:
        original = p.strip()
        if not original:
            continue

        clean = re.sub(r'^\d+\.?\s*', '', original)
        clean = re.sub(r'[^a-zA-Z0-9\s\-]', '', clean).strip().lower()

        if clean:
            normalized.append({
                "original": original,
                "normalized": clean
            })

    return normalized
