import json

def generate_hybrid_resume(parsed):
    job_text = parsed.get("job_text", "")


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

def format_resume_html(parsed):
    """
    Turns parsed resume data into simple HTML for testing or PDF generation.
    """
    return f"""
    <html>
      <head><style>body {{ font-family: Arial, sans-serif; }}</style></head>
      <body>
        <h2>Formatted Resume (Mock)</h2>
        <pre>{json.dumps(parsed, indent=2)}</pre>
      </body>
    </html>
    """