import argparse
import re
import json
from nltk.stem import PorterStemmer
from rapidfuzz import fuzz

stemmer = PorterStemmer()

def normalize_skills(text):
    parts = re.split(r'[\n,;•]+', text)
    cleaned = set()
    for p in parts:
        p = re.sub(r'^\d+\.?\s*', '', p)
        p = re.sub(r'(key (hard|soft) skills:|additional qualifications:|eg|required skills:)', '', p, flags=re.I)
        p = re.sub(r'[^a-zA-Z0-9\s\-]', '', p).strip().lower()
        if p:
            if '-' in p:
                cleaned.add(p)
            else:
                words = p.split()
                stemmed_words = [stemmer.stem(word) for word in words]
                cleaned.add(" ".join(stemmed_words))
    return sorted(cleaned)

def match_skills(skills_required, resume_text, scorer=fuzz.token_set_ratio, threshold=75):
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

    match_score = round((len(matched) / len(skills_required)) * 100, 2) if skills_required else 0
    return match_score, matched, missing, scores

def main():
    parser = argparse.ArgumentParser(description="Offline Resume Matcher")
    parser.add_argument("--jd", required=True, help="Path to job description text file")
    parser.add_argument("--resume", required=True, help="Path to resume text file")

    args = parser.parse_args()

    with open(args.jd, "r", encoding="utf-8") as f:
        jd_text = f.read()

    with open(args.resume, "r", encoding="utf-8") as f:
        resume_text = f.read()

    skills = normalize_skills(jd_text)
    resume_clean = " ".join(normalize_skills(resume_text))

    score, matched, missing, _ = match_skills(skills, resume_clean)

    output = {
        "match_score": score,
        "matched": matched,
        "missing": missing
    }

    print(json.dumps(output, indent=2))

if __name__ == "__main__":
    main()
