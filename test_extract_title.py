from backend.utils.parser import extract_job_title_from_text

sample_text = """
About the job
Equix is a fintech innovator providing next-gen trading and investment solutions.
Position: Business Analyst Expert
"""

title = extract_job_title_from_text(sample_text)
print("Extracted Title:", title)
