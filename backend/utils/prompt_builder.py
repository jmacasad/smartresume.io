def generate_hybrid_resume_prompt(parsed, matched_skills, missing_skills):
    resume_text = parsed.get("resume_raw", "").strip()
    job_text = parsed.get("job_text", "").strip()
    extra_answers = parsed.get("extra_answers", [])

    return f"""
You are an expert resume optimization assistant. Your job is to take the ORIGINAL resume below and rewrite it in a way that is optimized for the following job description and aligned to ATS systems.

# DO NOT:
- Do NOT change job titles, company names, or dates.
- Do NOT invent any experience that doesn’t already exist.
- Do NOT add unrelated content just to increase keyword usage.

# MUST DO:
- Use only the user's original experience and content.
- Keep the formatting clean and professional.
- Integrate missing skills from the job description into the resume **only if they logically align** with the candidate’s real experience.
- Add a “Project Achievements” section if you can logically fit the missing skills through actual accomplishments.
- Emphasize accomplishments, impact, and relevance to the job role.

# Job Description
{job_text}

# Original Resume
{resume_text}

# Matched Skills to Emphasize
{', '.join(matched_skills)}

# Missing Skills to Integrate Logically
{', '.join(missing_skills)}

# Optional Answers to Additional Questions
{extra_answers}

Now rewrite the resume following all instructions.
"""
