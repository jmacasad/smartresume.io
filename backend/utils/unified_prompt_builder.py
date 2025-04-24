def build_resume_optimization_prompt(parsed, matched_skills=None, missing_skills=None):
    resume_text = parsed.get("resume_text", "").strip()
    job_text = parsed.get("job_text", "").strip()
    extra_answers = parsed.get("extra_answers", [])
    experience = parsed.get("experience", "")
    skills = parsed.get("skills", [])
    
    # Build skill CSV
    skills_csv = ", ".join(skills)

    # Extract verified skills from clarification answers
    verified_skills = []
    for skill in skills:
        for ans in extra_answers:
            if skill.lower() in ans.lower():
                verified_skills.append(skill)
                break

    # Enrich experience block with answers + verified skills
    enriched_experience = experience
    if extra_answers:
        enriched_experience += "\n\nAdditional Detail Provided by Candidate:\n"
        for i, answer in enumerate(extra_answers):
            if answer.strip():
                enriched_experience += f"- {answer.strip()}\n"

    if verified_skills:
        enriched_experience += "\n\n[Verified Skills Integration]\n"
        for skill in verified_skills:
            enriched_experience += f"- Demonstrated expertise in {skill} through project contributions.\n"

    # Extract role locking rules
    import re
    employer_lines = re.findall(
        r'(?i)(?:(?:at|with)\s)?([A-Z][A-Za-z0-9&\-/\s]+)\s\|\s(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s\d{4}',
        resume_text)
    locked_roles = "\n".join(f"- {e.strip()}" for e in set(employer_lines))

    system_rules = (
        "You are an expert resume optimization assistant.\n"
        "You MUST follow these strict instructions:\n"
        "- DO NOT remove or omit any jobs, titles, companies, or date ranges from the original resume.\n"
        "- Preserve the original role order and company names as-is.\n"
        "- If a role seems less relevant, still retain it — just condense it if needed, but never delete.\n"
        "- Do not reorder roles based on importance. Preserve original timeline.\n"
        "- Only add new content to enhance clarity, skills, or formatting.\n"
        "- The following roles **must be preserved**:\n"
        f"{locked_roles}\n"
    )

    content = (
        "You are helping a job seeker improve their resume to match this job description:\n\n"
        "### Job Description:\n"
        f"{job_text[:1500]}\n\n"
        "---\n\n"
        "### Candidate's Original Resume:\n"
        f"{resume_text[:3000]}\n\n"
        "---\n\n"
        "### Clarifying Info Provided by Candidate:\n"
        f"{chr(10).join(extra_answers)}\n\n"
        "---\n\n"
        "### Required Skills to Match:\n"
        f"{skills_csv}\n\n"
        "---\n\n"
        "### Additional Experience Context:\n"
        f"{enriched_experience[:1500]}\n\n"
        "### Matched Skills to Emphasize:\n"
        f"{', '.join(matched_skills or [])}\n\n"
        "### Missing Skills to Weave In Logically:\n"
        f"{', '.join(missing_skills or [])}\n\n"
        "Your job:\n"
        "- Return a rewritten, ATS-friendly version of the resume that keeps all original roles and companies.\n"
        "- Expand under-detailed roles to meet ATS requirements (e.g., at least 6 bullets if possible).\n"
        "- Insert verified skills from clarifying answers into the relevant sections.\n"
        "- Weave in missing skills only if they align with the experience provided.\n"
        "- Do NOT hallucinate jobs or certifications not explicitly provided.\n"
        "- Maintain markdown structure if helpful for clarity.\n"
    )

    return [
        { "role": "system", "content": system_rules },
        { "role": "user", "content": content }
    ]
