import re

def assess_section_confidence(section_text):
    """
    Heuristic-based confidence checker.
    Flags if a section is too short or lacks key tokens like companies or dates.
    """
    if not section_text or len(section_text.strip()) < 100:
        return False, "Section too short or possibly incomplete."

    # Heuristic patterns to check for common job structure
    date_pattern = r"(\b\d{4}\b)"
    company_keywords = ["Inc", "LLC", "Company", "Corp", "Technologies", "Systems"]

    has_dates = re.search(date_pattern, section_text)
    has_company = any(word in section_text for word in company_keywords)

    if not has_dates or not has_company:
        return False, "Missing dates or company identifiers."

    return True, "Confidence high."


def flag_low_confidence_sections(parsed_resume):
    """
    Takes parsed resume dict and flags low-confidence experience sections.
    Returns list of flagged entries with reasons.
    """
    flagged = []
    experiences = parsed_resume.get("experience", [])
    for i, block in enumerate(experiences):
        ok, reason = assess_section_confidence(block)
        if not ok:
            flagged.append({
                "index": i,
                "content": block,
                "reason": reason
            })
    return flagged
