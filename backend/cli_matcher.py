import argparse
import json
from matcher.skill_utils import extract_skills, normalize_extracted_skills, match_skills_list

def main():
    parser = argparse.ArgumentParser(description="Offline Resume Matcher")
    parser.add_argument("--jd", required=True, help="Path to job description text file")
    parser.add_argument("--resume", required=True, help="Path to resume text file")
    parser.add_argument("--threshold", type=int, default=80, help="Matching threshold (0-100)")

    args = parser.parse_args()

    with open(args.jd, "r", encoding="utf-8") as f:
        jd_text = f.read()

    with open(args.resume, "r", encoding="utf-8") as f:
        resume_text = f.read()

    print("\n🔍 Extracting JD Skills...")
    jd_skills = extract_skills(jd_text)
    jd_skills_normalized = normalize_extracted_skills(jd_skills)

    print(" - Found:", jd_skills_normalized)

    print("\n🧾 Extracting Resume Skills...")
    resume_skills = extract_skills(resume_text)
    resume_skills_normalized = normalize_extracted_skills(resume_skills)

    print(" - Found:", resume_skills_normalized)

    print("\n🧠 Matching Skills...")
    match_score, matched, missing, _ = match_skills_list(jd_skills_normalized, resume_skills_normalized, threshold=args.threshold)

    result = {
        "match_score": match_score,
        "matched_skills": matched,
        "missing_skills": missing
    }

    print("\n📊 Final Result:")
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()
