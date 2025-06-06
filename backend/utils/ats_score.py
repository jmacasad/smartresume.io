import re

def calculate_keyword_density(resume_text, jd_keywords):
    resume_text_lower = resume_text.lower()
    total_words = len(re.findall(r'\b\w+\b', resume_text_lower))
    keyword_hits = sum(resume_text_lower.count(k.lower()) for k in jd_keywords)
    return round((keyword_hits / total_words) * 100, 2) if total_words else 0

def check_formatting(resume_text):
    headers = len(re.findall(r'\b(experience|education|skills|projects|certifications)\b', resume_text, re.IGNORECASE))
    bullet_points = resume_text.count("•") + resume_text.count("- ")
    return min(headers, 5) * 2 + min(bullet_points, 10)  # Max score: 20

def check_file_type_score(file_extension):
    return 10 if file_extension.lower() in ['pdf', 'doc', 'docx'] else 0

def calculate_ats_score(resume_text, jd_keywords, file_extension='pdf'):
    density_score = calculate_keyword_density(resume_text, jd_keywords)
    formatting_score = check_formatting(resume_text)
    file_score = check_file_type_score(file_extension)

    total_score = round(density_score * 0.5 + formatting_score * 0.3 + file_score * 0.2, 2)
    return {
        'keyword_density_score': density_score,
        'formatting_score': formatting_score,
        'file_score': file_score,
        'ats_score_total': total_score
    }
