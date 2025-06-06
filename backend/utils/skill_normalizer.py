from backend.services.llm import call_your_model_api
import re


def normalize_skills(text: str) -> list[str]:
    """Normalizes skill text using an AI agent (LLM)."""
    parts = re.split(r'[\n,;•]+', text)
    cleaned = set()
    for p in parts:
        p = re.sub(r'^\d+\.?\s*', '', p)
        p = re.sub(r'(?:key |hard |soft )?skills?:?', '', p, flags=re.I)
        p = re.sub(r'additional qualifications:?', '', p, flags=re.I)
        p = re.sub(r'e\.\?g\.\?:?', '', p, flags=re.I)
        p = re.sub(r'required skills:?', '', p, flags=re.I)
        p = re.sub(r'preferred qualifications:?', '', p, flags=re.I)
        p = re.sub(r'\s\(.*\)', '', p)
        p = re.sub(r'[^a-zA-Z0-9\s\-]', '', p).strip().lower()

        if p and len(p) > 1:
            # Call LLM to normalize the skill
            prompt = [
                {"role": "system", "content": "You are an expert in resume parsing and skill normalization."},
                {"role": "user", "content": f"""
            Normalize the following skill to its base form.  Provide only the normalized skill.
            
            Examples:
            Input:  PowerBI
            Output: Power BI
            
            Input:  Javascript
            Output: JavaScript
            
            Input:  writing skills
            Output: writing
            
            Input: Data Analysis
            Output: Data Analysis
            
            Input:  communication skills
            Output: communication
            
            Input:  managing databases
            Output: database management
            
            Input:  Azure AD
            Output: Azure AD
            
            Input:  Python Programming
            Output: Python
            
            Input: User Acceptance Testing
            Output: UAT
            
            Input: Change Enablement
            Output: Change Management
            
            Input: ERP Implementations
            Output: ERP Implementation
            
            Input:  reporting frameworks
            Output:  reporting framework
            
            Input:  data warehouse design
            Output:  data warehouse design
            
            Input:  business process redesign
            Output:  business process redesign
            
            Input:  stakeholder workshops
            Output:  stakeholder workshop
            
            Input:  test planning
            Output:  test planning
            
            Input:  defect tracking
            Output:  defect tracking
            
            Input:  documentation quality assurance
            Output:  documentation quality assurance
            
            Input:  solution design
            Output:  solution design
            
            Input:  user training
            Output:  user training
            
            Input:  system transformations
            Output:  system transformation
            
            Input:  operational reporting
            Output:  operational reporting
            
            Input:  functional requirements
            Output:  functional requirement
            
            Input:  system integration
            Output:  system integration
            
            Input:  post-implementation support
            Output:  post-implementation support
            
            Input:  dashboard transition
            Output:  dashboard transition
            
            Input:  business process reviews
            Output:  business process review
            
            Input:  reporting enhancements
            Output:  reporting enhancement
            
            Input:  change impact analysis
            Output:  change impact analysis
            
            Input:  training sessions
            Output:  training session
            
            Input:  knowledge sharing initiatives
            Output:  knowledge sharing initiative
            
            Input:  reporting tool upgrades
            Output:  reporting tool upgrade
            
            Input:  automation initiatives
            Output:  automation initiative
            
            Input:  operating model redesign
            Output:  operating model redesign
            
            Input:  call centre transformation
            Output:  call centre transformation
            
            Input:  real-time performance dashboards
            Output:  real-time performance dashboard
            
            Input:  agent productivity
            Output:  agent productivity
            
            Input:  training rollout strategies
            Output:  training rollout strategy
            
            Input:  process standards
            Output:  process standard
            
            Input:  security networking
            Output:  security networking
            
            Input:  marketing
            Output:  marketing
            
            Input:  lean six sigma
            Output:  lean six sigma
            
            Input:  change practitioner
            Output:  change practitioner
            
            Input:  conditional access policies
            Output:  conditional access policy
            
            Input:  Power BI Reporting
            Output:  Power BI Reporting
            
            Input:  agile business analysis
            Output:  agile business analysis
            
            Input:  cybersecurity
            Output:  cybersecurity
            
            Input:  acsc essential 8
            Output:  acsc essential 8
            
            Input:  itil v4 practices
            Output:  itil v4 practice
            
            Input:  data warehouse
            Output: data warehouse
            
            Input:  performance dashboard
            Output: performance dashboard
            
            Input:  access control processes
            Output: access control process
            
            Input:  access responsibilities
            Output: access responsibility
            
            Input:  access management processes
            Output: access management process
            
            Input:  access models
            Output: access model
            
            Input:  access rights
            Output: access right
            
            Input:  access management functionality
            Output: access management functionality
            
            Input:  problem-solving
            Output: problem solving
            
            Input:  analytical skills
            Output: analytical skill
            
            Input:  communication skills
            Output: communication skill
            
            Input:  access control models
            Output: access control model
            
            Input:  access management tools
            Output: access management tool
            
            Input:  software such as Okta
            Output: software such as Okta
            
            Input:  relevant certifications
            Output: relevant certification
            
            Input:  CISSP
            Output: CISSP
            
            Input:  CIAM
            Output: CIAM
            
            Input:  CAMS
            Output: CAMS
            
            Input:  CIMP
            Output: CIMP
            
            Input:  CIGE
            Output: CIGE
            
            Input:  requirements gathering
            Output: requirements gathering
            
            Input:  feasibility studies
            Output: feasibility study
            
            Input:  software design documentation
            Output: software design documentation
            
            Input:  business processes
            Output: business process
            
            Input:  system specifications
            Output: system specification
            
            Input:  technical impacts
            Output: technical impact
            
            Input:  system enhancements
            Output: system enhancement
            
            Input:  functional specifications
            Output: functional specification
            
            Input:  delivery teams
            Output: delivery team
            
            Input:  testing activities
            Output: testing activity
            
            Input:  test planning
            Output: test planning
            
            Input:  execution
            Output: execution
            
            Input:  defect tracking
            Output: defect tracking
            
            Input:  documentation quality assurance processes
            Output: documentation quality assurance process
            
            Input:  project stakeholders
            Output: project stakeholder
            
            Input:  solution design outcomes
            Output: solution design outcome
            
            Input:  user training
            Output: user training
            
            Input:  erp and system transformations
            Output: erp and system transformation
            
            Input:  finance
            Output: finance
            
            Input:  hr
            Output: hr
            
            Input:  procurement reporting
            Output: procurement reporting
            
            Input:  business smes
            Output: business sme
            
            Input:  operational reporting needs
            Output: operational reporting need
            
            Input:  business and functional requirements
            Output: business and functional requirement
            
            Input:  system integration points
            Output: system integration point
            
            Input:  end-to-end testing phases
            Output: end-to-end testing phase
            
            Input:  uat cycles
            Output: uat cycle
            
            Input:  resolution tracking
            Output: resolution tracking
            
            Input:  stakeholder briefings
            Output: stakeholder briefing
            
            Input:  post-implementation support documentation
            Output: post-implementation support documentation
            
            Input:  hands-on support
            Output: hands-on support
            
            Input:  dashboard transition
            Output: dashboard transition
            
            Input:  legacy systems
            Output: legacy system
            
            Input:  power bi
            Output: power bi
            
            Input:  business process reviews
            Output: business process review
            
            Input:  reporting enhancements
            Output: reporting enhancement
            
            Input:  shared services functions
            Output: shared service function
            
            Input:  future-state operating models
            Output: future-state operating model
            
            Input:  reporting teams
            Output: reporting team
            
            Input:  change impact analysis
            Output: change impact analysis
            
            Input:  program lifecycle
            Output: program lifecycle
            
            Input:  reporting-related training sessions
            Output: reporting-related training session
            
            Input:  knowledge sharing initiatives
            Output: knowledge sharing initiative
            
            Input:  reporting tool upgrades
            Output: reporting tool upgrade
            
            Input:  automation initiatives
            Output: automation initiative
            
            Input:  operating model redesign objectives
            Output: operating model redesign objective
            
            Input:  call centre transformation
            Output: call centre transformation
            
            Input:  lean six sigma
            Output: lean six sigma
            
            Input:  customer satisfaction scores
            Output: customer satisfaction score
            
            Input:  real-time performance dashboards
            Output: real-time performance dashboard
            
            Input:  agent productivity
            Output: agent productivity
            
            Input:  training rollout strategies
            Output: training rollout strategy
            
            Input:  updated process standards
            Output: updated process standard
            
            Input:  security networking
            Output: security networking
            
            Input:  marketing
            Output: marketing
            
            Input:  lean six sigma
            Output: lean six sigma
            
            Input:  change practitioner
            Output: change practitioner
            
            Input:  conditional access policies
            Output: conditional access policy
            
            Input:  Power BI Reporting
            Output:  Power BI Reporting
            
            Input:  agile business analysis
            Output:  agile business analysis
            
            Input:  cybersecurity
            Output:  cybersecurity
            
            Input:  acsc essential 8
            Output:  acsc essential 8
            
            Input:  itil v4 practices
            Output:  itil v4 practice
            
            Input:  data warehouse
            Output: data warehouse
            
            Input:  performance dashboard
            Output: performance dashboard
            
            Input:  access control processes
            Output: access control process
            
            Input:  access responsibilities
            Output: access responsibility
            
            Input:  access management processes
            Output: access management process
            
            Input:  access models
            Output: access model
            
            Input:  access rights
            Output: access right
            
            Input:  access management functionality
            Output: access management functionality
            
            Input:  problem-solving
            Output: problem solving
            
            Input:  analytical skills
            Output: analytical skill
            
            Input:  communication skills
            Output: communication skill
            
            Input:  access control models
            Output: access control model
            
            Input:  access management tools
            Output: access management tool
            
            Input:  software such as Okta
            Output: software such as Okta
            
            Input:  relevant certifications
            Output: relevant certification
            
            Input:  CISSP
            Output: CISSP
            
            Input:  CIAM
            Output: CIAM
            
            Input:  CAMS
            Output: CAMS
            
            Input:  CIMP
            Output: CIMP
            
            Input:  CIGE
            Output: CIGE
            
            Input: {p}
            Output:
            """}
            ]
        try:
            response_data = call_your_model_api(prompt)  # Use the unified API call
            normalized_skill = response_data['content'].strip()  # Get the normalized skill
            cleaned.add(normalized_skill)
        except Exception as e:
            print(f"--- WARNING: LLM call failed during skill normalization: {e}.  Using original skill. ---")
            cleaned.add(p)  # Keep the original skill if LLM call fails

    generic_terms = {"communication", "teamwork", "problem solving",
                      "detail oriented", "etc", "and", "or", "including",
                      "strong", "excellent", "good", "ability", "proficient"}
    cleaned = {s for s in cleaned if s not in generic_terms and not s.isdigit()}
    return sorted(list(cleaned))

def extract_normalized_resume_skills(resume_text):
    """
    Extracts normalized skills from resume using LLM API.
    """
    prompt = [
        {"role": "system", "content": "You are an expert resume analyst."},
        {"role": "user", "content": f"""
Extract all relevant skills from the resume below. A skill can be a technical skill, soft skill, tool, or qualification.

Resume Text:
{resume_text}

Return the skills as a comma-separated list.
"""}
    ]
    try:
        response = call_your_model_api(prompt)
        skills = response["content"]
        return [s.strip() for s in skills.split(",") if s.strip()]
    except Exception as e:
        print(f"!!! ERROR: Failed to extract normalized resume skills: {e}")
        return []

