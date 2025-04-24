import difflib
import re
from collections import defaultdict

def compare_blocks(original: str, rewritten: str, context_lines: int = 2) -> str:
    """
    Compare original and rewritten resume blocks line-by-line and highlight differences.
    Returns a unified diff string.
    """
    original_lines = original.strip().splitlines()
    rewritten_lines = rewritten.strip().splitlines()
    diff = difflib.unified_diff(
        original_lines, rewritten_lines,
        fromfile='Original',
        tofile='Rewritten',
        lineterm='',
        n=context_lines
    )
    return '\n'.join(diff)

def check_bullet_count_per_role(resume_text: str, min_bullets: int = 6) -> dict:
    """
    Checks bullet count per role based on resume sections that appear job-like (e.g., lines starting with job titles).
    Returns a dict of {job_title: bullet_count} where bullet_count < min_bullets
    """
    lines = resume_text.strip().splitlines()
    role_bullets = defaultdict(int)
    current_role = None

    for line in lines:
        # Try to detect job title lines (e.g., "Change Lead", "IT Business Manager")
        if re.match(r'^\*?\*?[A-Z][a-zA-Z &/]+\*?\*?$', line.strip()):
            current_role = line.strip('*').strip()
        elif current_role and line.strip().startswith("- "):
            role_bullets[current_role] += 1

    return {role: count for role, count in role_bullets.items() if count < min_bullets}

def detect_skill_drops(original_text: str, rewritten_text: str, keywords: list[str]) -> list[str]:
    """
    Identify which important keywords (skills/tools) are missing in the rewritten version.
    """
    dropped = []
    original_lower = original_text.lower()
    rewritten_lower = rewritten_text.lower()
    for kw in keywords:
        if kw.lower() in original_lower and kw.lower() not in rewritten_lower:
            dropped.append(kw)
    return dropped

def compare_resumes(original: str, rewritten: str, min_bullets_per_job: int = 6) -> dict:
    """
    Compare the original and rewritten resumes and return:
    - Dropped important skills
    - Bullet gaps per role
    - Line-by-line text diff
    """
    from .section_confidence import assess_section_confidence

    keywords = re.findall(r'\b[a-zA-Z][a-zA-Z0-9\-]{2,}\b', original)
    dropped_skills = detect_skill_drops(original, rewritten, keywords)
    bullet_issues = check_bullet_count_per_role(rewritten, min_bullets=min_bullets_per_job)
    text_diffs = compare_blocks(original, rewritten)

    return {
        "missing_skills": dropped_skills,
        "bullet_issues": bullet_issues,
        "text_diffs": text_diffs
    }

