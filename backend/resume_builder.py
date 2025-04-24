def generate_hybrid_resume(parsed):
    resume_text = parsed.get("resume_text", "")
    experience = parsed.get("experience", "")
    job_text = parsed.get("job_text", "")
    extra_answers = parsed.get("extra_answers", [])
    
    clarifications = "\n".join(
        f"{idx+1}. {answer.strip()}" for idx, answer in enumerate(extra_answers) if answer.strip()
    ) or "None provided."

    # 💡 Structure prompt clearly with sections
    return [
        {
            "role": "system",
            "content": (
                "You are an expert ATS-optimized resume rewriting assistant.\n"
                "DO NOT fabricate content. DO NOT remove valid original bullets, companies, tools, or technologies.\n"
                "Your goal is to enrich the resume based on the job description while preserving the original experience content.\n"
                "You MUST:\n"
                "- Maintain all original bullet points. You may rewrite them for clarity, but preserve the meaning.\n"
                "- Keep company names, dates, industries, and known technologies (e.g., Azure, SQL, DevOps) intact.\n"
                "- Only inject new skills if they were mentioned in the job description or clarification questions.\n"
                "- Expand short sections to at least 6 bullets using project context, but never hallucinate or invent details.\n"
                "- Use markdown-friendly formatting with clear sections and bullet structure."
            )
        },
        {
            "role": "user",
            "content": f"""
You are helping rewrite a resume for better alignment with the following job description.

---

### 📄 Job Description
```markdown
{job_text.strip()}
"""
        }]
