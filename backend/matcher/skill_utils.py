import spacy
import re
from rapidfuzz import process, fuzz
import logging

# Add logging to debug skill extraction
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')

# Load spaCy model
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    import spacy.cli
    spacy.cli.download("en_core_web_sm")
    nlp = spacy.load("en_core_web_sm")

# Skill keyword set
SKILL_KEYWORDS = {
    "python", "java", "c++", "c#", "javascript", "typescript", "html", "css",
    "react", "angular", "vue", "node.js", "django", "flask", "spring",
    "sql", "nosql", "mongodb", "postgresql", "mysql",
    "rest", "api", "rest api", "graphql", "restful api",
    "docker", "kubernetes", "aws", "azure", "gcp", "cloud",
    "git", "svn",
    "agile", "scrum", "kanban", "agile methodology",
    "communication", "teamwork", "collaboration", "problem solving", "leadership",
    "data analysis", "machine learning", "artificial intelligence",
    "project management", "team communication",
    "software development", "developer"
}

# Debug print statements added back for troubleshooting
print("Starting skill extraction")

def extract_skills(text, skill_keywords=SKILL_KEYWORDS):
    print("Input text for skill extraction:", text)
    print("Skill keywords:", skill_keywords)
    doc = nlp(text.lower())
    found_skills = set()
    sorted_keywords = sorted(skill_keywords, key=len, reverse=True)

    for keyword in sorted_keywords:
        pattern = r"\\b" + re.escape(keyword) + r"\\b"
        if re.search(pattern, text.lower()):
            print(f"Keyword matched: {keyword}")
            found_skills.add(keyword)

    for token in doc:
        if not token.is_stop and not token.is_punct:
            if token.lemma_ in skill_keywords:
                print(f"Token lemma matched: {token.lemma_}")
                found_skills.add(token.lemma_)
            elif token.lower_ in skill_keywords:
                print(f"Token lower matched: {token.lower_}")
                found_skills.add(token.lower_)

    for chunk in doc.noun_chunks:
        chunk_text = chunk.text.strip().lower()
        if chunk_text in skill_keywords:
            print(f"Noun chunk matched: {chunk_text}")
            found_skills.add(chunk_text)

    if "node" in found_skills and "js" in found_skills:
        found_skills.discard("node")
        found_skills.discard("js")
        found_skills.add("node.js")
    if "c" in found_skills and "++" in text.lower():
        found_skills.add("c++")
    if "c" in found_skills and "#" in text.lower():
        found_skills.add("c#")

    print("Extracted skills:", found_skills)
    return sorted(list(found_skills))

def normalize_extracted_skills(skills_list):
    return sorted(list(set(s.strip().lower() for s in skills_list if s.strip())))

def match_skills_list(skills_required, skills_possessed, threshold=75):
    matched = []
    missing = []
    scores = {}

    for req_skill in skills_required:
        best_match_info = process.extractOne(req_skill, skills_possessed, scorer=fuzz.token_set_ratio)
        if best_match_info and best_match_info[1] >= threshold:
            matched.append(req_skill)
            scores[req_skill] = best_match_info[1]
        else:
            missing.append(req_skill)
            scores[req_skill] = best_match_info[1] if best_match_info else 0

    matched = sorted(set(matched))
    missing = sorted([s for s in skills_required if s not in matched])

    match_score = round((len(matched) / len(skills_required)) * 100, 2) if skills_required else 0
    return match_score, matched, missing, scores
