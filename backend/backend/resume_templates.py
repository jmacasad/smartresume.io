# This defines the hybrid resume layout with fixed sections.

def build_structured_resume_header(name, title, contact_info):
    return f"""
{name.upper()}
{title}
{contact_info}
"""

def build_executive_summary(summary_text):
    return f"""
## Executive Summary
{summary_text.strip()}
"""

def build_expertise_section(skills):
    return f"""
## Areas of Expertise
{', '.join(skills)}
"""

def build_professional_experience(jobs):
    experience_blocks = []
    for job in jobs:
        bullets = ''.join(f"- {b}\n" for b in job['responsibilities'])
        achievements = ''.join(f"* {a}\n" for a in job.get('achievements', []))
        block = f"""
### {job['role']} at {job['company']} ({job['dates']})
{bullets}
**Project Key Achievements:**
{achievements}
"""
        experience_blocks.append(block.strip())
    return "\n\n".join(experience_blocks)

def build_education_section(education):
    return f"""
## Education
{education}
"""

def build_certifications_section(certs):
    return f"""
## Certifications
{', '.join(certs)}
"""

def build_skills_section(skills):
    return f"""
## Key Skills
{', '.join(skills)}
"""

def generate_hybrid_resume(data):
    """
    This expects a dict with:
    - name, title, contact_info
    - summary_text
    - expertise_skills
    - jobs (with role, company, dates, responsibilities, achievements)
    - education
    - certifications
    - skills
    """
    return "\n\n".join([
        build_structured_resume_header(data['name'], data['title'], data['contact_info']),
        build_executive_summary(data['summary_text']),
        build_expertise_section(data['expertise_skills']),
        build_professional_experience(data['jobs']),
        build_education_section(data['education']),
        build_certifications_section(data['certifications']),
        build_skills_section(data['skills'])
    ])
