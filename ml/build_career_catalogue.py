"""Build the client-safe, versioned career catalogue and additive SQL seed.

O*NET references describe related occupations, not validation of VoidFill quizzes.
Question keys are deliberately kept out of this public metadata file.
"""
from __future__ import annotations

import hashlib
import json
import re
import uuid
from pathlib import Path
from ml.career_pack_phase2 import TOPIC_DESCRIPTIONS, PILOT_NAMES, ACTIVITIES as PHASE2_ACTIVITIES
from ml.career_pack_phase3 import TOPIC_DESCRIPTIONS as PHASE3_TOPICS, PILOT_NAMES as PHASE3_PILOTS, ACTIVITIES as PHASE3_ACTIVITIES
from ml.career_curriculum import curriculum_for, PATHS

ROOT = Path(__file__).resolve().parent
DEST = ROOT / "data/careers"
VERSION = "2026.11-applied-paths-1"


def identifier(name):
    # Preserve legacy demo UUIDs. Production SQL looks up existing names first.
    return str(uuid.uuid5(uuid.NAMESPACE_URL, "voidfill-demo:" + name))


TOPICS = {
    "python": ("Python Basics", "Programming", "Python programming syntax functions dictionaries lists pandas"),
    "sql": ("SQL Fundamentals", "Data", "SQL relational databases queries SELECT joins GROUP BY"),
    "visualization": ("Data Visualization", "Data", "Data visualization charts matplotlib seaborn graphs dashboards"),
    "web": ("Web Fundamentals", "Web", "Web development HTML CSS JavaScript browser DOM frontend"),
    "git": ("Git & Version Control", "Tools", "Git version control commits branches repositories merge"),
    "algorithms": ("DSA Basics", "CS", "Data structures algorithms complexity stacks queues sorting binary search"),
    "machine-learning": ("Machine Learning Foundations", "Data", "Machine learning artificial intelligence models regression classification neural networks"),
    "data-science": ("Statistics & Data Practice", "Data", "Data science statistics probability data cleaning analysis"),
    "api": ("Backend APIs", "Software", "HTTP methods status codes API authentication validation pagination idempotency"),
    "testing": ("Software Testing", "Software", "Software testing unit integration regression test cases boundaries reproducible defects"),
    "linux": ("Linux Fundamentals", "IT", "Linux shell files permissions processes logs command line operating systems"),
    "networking": ("Network Fundamentals", "IT", "Networking IP DNS DHCP TCP routing subnets connectivity troubleshooting"),
    "cloud": ("Cloud Fundamentals", "IT", "Cloud computing shared responsibility availability backups scalability monitoring costs"),
    "security": ("Security Foundations", "IT", "Cybersecurity least privilege authentication phishing encryption incident response risk"),
    "marketing": ("Digital Marketing", "Marketing", "Digital marketing audiences positioning campaigns channels search conversion measurement experiments"),
    "recruiting": ("Recruitment Foundations", "People", "Recruitment role requirements structured interviews selection sourcing candidate communication"),
    "sales": ("Sales Foundations", "Sales", "Sales discovery qualification customer needs pipeline objections follow up ethical selling"),
    "success": ("Customer Success", "Service", "Customer success onboarding service support escalation adoption retention customer outcomes"),
    "projects": ("Project Coordination", "Business", "Project management scope requirements milestones dependencies risk stakeholders change control"),
    "accounting": ("Accounting Foundations", "Finance", "Financial accounting assets liabilities equity double entry cash accrual reconciliation financial statements"),
    "spreadsheets": ("Spreadsheet Analysis", "Business", "Spreadsheets formulas references filters data validation summaries percentages pivot tables"),
    "communication": ("Workplace Communication", "Shared", "Workplace communication clear writing audience active listening feedback meeting notes collaboration"),
    "analysis": ("Business Analysis", "Business", "Business analysis requirements stakeholders process mapping root causes acceptance criteria evidence"),
}

# Specialist skills are visible as learning goals, never silently assigned a
# vaguely similar question bank. These need additional content/review packs.
SPECIALISTS = {
    "react": ("React Development", "Software"),
    "containers": ("Containerization & CI/CD", "IT"),
    "mobile": ("Mobile Application Development", "Software"),
    "architecture": ("Software Architecture", "Software"),
    "data-engineering": ("Data Engineering Pipelines", "Data"),
    "ml-operations": ("ML Operations", "Data"),
    "research": ("Research Methods", "Shared"),
    "ux": ("UX Research & Interaction Design", "Design"),
    "visual-design": ("Visual Design", "Design"),
    "product": ("Product Strategy", "Product"),
    "accessibility": ("Accessibility Evaluation", "Design"),
    "seo": ("Search Engine Optimization", "Marketing"),
    "content": ("Editorial & Content Strategy", "Marketing"),
    "brand": ("Brand Strategy", "Marketing"),
    "hr-operations": ("People Operations", "People"),
    "learning-design": ("Learning Design", "People"),
    "payroll": ("Payroll Operations", "Finance"),
    "financial-analysis": ("Financial Analysis", "Finance"),
    "audit": ("Audit & Assurance", "Finance"),
    "procurement": ("Procurement", "Operations"),
    "supply-chain": ("Supply Chain Planning", "Operations"),
    "inventory": ("Inventory & Logistics", "Operations"),
    "cad": ("Computer-Aided Design", "Engineering"),
    "quality": ("Industrial Quality Systems", "Engineering"),
    "automation": ("Industrial Automation", "Engineering"),
    "electronics": ("Electronics Fundamentals", "Engineering"),
    "manufacturing": ("Manufacturing Processes", "Engineering"),
    "technical-writing": ("Technical Writing", "Creative"),
    "customer-research": ("Customer Research", "Business"),
    "events": ("Event Operations", "Service"),
    "hospitality": ("Hospitality Operations", "Service"),
    "account-management": ("Account Management", "Sales"),
}

# Promote existing identities; do not introduce a second skill for the same area.
for topic, description in {**TOPIC_DESCRIPTIONS, **PHASE3_TOPICS}.items():
    name, category = SPECIALISTS.pop(topic)
    TOPICS[topic] = (name, category, description)

FAMILIES = [
    ("software", "Software & web", "technical"),
    ("data", "Data & AI", "technical"),
    ("infrastructure", "Cloud, IT & security", "technical"),
    ("engineering", "Engineering & manufacturing", "technical"),
    ("product", "Product & design", "hybrid"),
    ("business", "Business & projects", "business"),
    ("marketing", "Marketing & creative", "business"),
    ("finance", "Finance & accounting", "business"),
    ("people", "People & HR", "business"),
    ("commercial", "Sales, service & operations", "business"),
]

# title, aliases, O*NET related occupation, skill keys. Exact job requirements
# vary by employer/region; these are intentionally labelled foundation profiles.
ROLES = {
    "software": [
        ("Frontend Developer", "front end developer|front-end engineer|react developer|web developer", "15-1254.00", "web git algorithms"),
        ("Backend Developer", "back end developer|back-end engineer|api developer|server developer", "15-1252.00", "python sql api git testing"),
        ("Full-Stack Developer", "full stack developer|fullstack engineer", "15-1252.00", "web api sql git architecture"),
        ("QA Engineer", "software tester|quality assurance engineer|test analyst", "15-1253.00", "testing api web git"),
        ("Mobile Developer", "android developer|ios developer|flutter developer", "15-1252.00", "mobile api git testing"),
        ("Software Engineer", "software developer|application developer", "15-1252.00", "python algorithms git testing architecture"),
    ],
    "data": [
        ("Data Analyst", "data analytics analyst|reporting analyst", "15-2051.01", "python sql visualization git"),
        ("AI Applications Developer", "ai developer|applied ai developer|ai application engineer", "15-1252.00", "python sql visualization git algorithms"),
        ("BI Analyst", "business intelligence analyst|power bi analyst|tableau analyst", "15-2051.01", "sql visualization spreadsheets analysis"),
        ("Data Engineer", "etl developer|analytics engineer", "15-1252.00", "python sql data-engineering cloud git"),
        ("Machine Learning Engineer", "ml engineer|machine learning developer", "15-2051.00", "python machine-learning data-science ml-operations"),
        ("Data Scientist", "applied data scientist", "15-2051.00", "python sql data-science machine-learning visualization research"),
    ],
    "infrastructure": [
        ("Cloud Support Associate", "cloud support engineer|cloud support specialist", "15-1232.00", "cloud linux networking security communication"),
        ("Cybersecurity Analyst", "cyber security analyst|soc analyst|information security analyst", "15-1212.00", "security networking linux communication"),
        ("IT Support Specialist", "help desk analyst|service desk analyst|desktop support", "15-1232.00", "networking linux security success"),
        ("Systems Administrator", "sysadmin|system administrator|linux administrator", "15-1244.00", "linux networking security cloud"),
        ("DevOps Engineer", "platform engineer|site reliability engineer|sre", "15-1244.00", "linux cloud git networking containers"),
        ("Network Administrator", "network engineer|network support", "15-1244.00", "networking linux security cloud"),
    ],
    "engineering": [
        ("CAD Technician", "cad designer|mechanical drafter", "17-3013.00", "cad manufacturing communication"),
        ("Automation Technician", "plc technician|industrial automation technician", "17-3024.00", "automation electronics quality"),
        ("Quality Engineer", "quality assurance manufacturing|quality control engineer", "17-2112.00", "quality spreadsheets analysis"),
        ("Manufacturing Engineer", "production engineer|process engineer manufacturing", "17-2112.03", "manufacturing quality projects"),
        ("Electronics Technician", "electronic engineering technician", "17-3023.00", "electronics automation communication"),
        ("Industrial Engineering Associate", "industrial engineer|industrial engineering technician", "17-2112.00", "manufacturing quality analysis spreadsheets"),
    ],
    "product": [
        ("Product Manager", "associate product manager|apm", "11-2021.00", "product customer-research analysis projects communication"),
        ("UX Designer", "user experience designer|interaction designer", "15-1255.00", "ux customer-research accessibility visual-design"),
        ("UI Designer", "user interface designer|digital interface designer", "15-1255.00", "visual-design ux accessibility"),
        ("UX Researcher", "user researcher|design researcher", "15-1255.00", "research customer-research ux communication"),
        ("Product Designer", "digital product designer", "15-1255.00", "ux visual-design product accessibility"),
        ("Technical Writer", "documentation writer|documentation specialist", "27-3042.00", "technical-writing communication research git"),
    ],
    "business": [
        ("Project Coordinator", "project administrator|junior project manager", "13-1082.00", "projects communication spreadsheets analysis"),
        ("Business Analyst", "business systems analyst|requirements analyst", "13-1111.00", "analysis spreadsheets communication projects"),
        ("Operations Analyst", "business operations analyst", "13-1111.00", "analysis spreadsheets projects communication"),
        ("Project Manager", "delivery manager|programme coordinator", "13-1082.00", "projects analysis communication account-management"),
        ("Management Analyst", "business consultant|management consultant", "13-1111.00", "analysis research spreadsheets communication"),
        ("Administrative Coordinator", "administrative assistant|office coordinator", "43-6014.00", "communication spreadsheets projects hr-operations"),
    ],
    "marketing": [
        ("Digital Marketing Associate", "digital marketer|digital marketing specialist|growth marketing associate", "13-1161.00", "marketing communication spreadsheets analysis"),
        ("SEO Specialist", "search engine optimization specialist|search marketer", "13-1161.01", "seo marketing web analysis"),
        ("Content Writer", "copywriter|content specialist", "27-3043.00", "content communication research marketing"),
        ("Social Media Coordinator", "social media specialist|community marketing", "27-3031.00", "marketing content brand communication"),
        ("Graphic Designer", "visual graphic designer|creative designer", "27-1024.00", "visual-design brand communication"),
        ("Marketing Analyst", "market research analyst|campaign analyst", "13-1161.00", "marketing analysis spreadsheets visualization research"),
    ],
    "finance": [
        ("Accounting Associate", "accounts assistant|junior accountant|bookkeeper", "43-3031.00", "accounting spreadsheets communication analysis"),
        ("Financial Analyst", "finance analyst|financial planning analyst", "13-2051.00", "financial-analysis accounting spreadsheets analysis"),
        ("Payroll Specialist", "payroll associate|payroll clerk", "43-3051.00", "payroll accounting spreadsheets hr-operations"),
        ("Accounts Payable Associate", "accounts payable clerk|ap associate", "43-3031.00", "accounting spreadsheets procurement communication"),
        ("Audit Associate", "junior auditor|audit assistant", "13-2011.00", "audit accounting spreadsheets analysis"),
        ("Credit Analyst", "credit risk analyst", "13-2041.00", "financial-analysis accounting analysis communication"),
    ],
    "people": [
        ("Recruitment Associate", "recruiter|talent acquisition associate|recruitment coordinator", "13-1071.00", "recruiting communication spreadsheets analysis"),
        ("HR Operations Associate", "hr associate|human resources coordinator|hr generalist", "13-1071.00", "hr-operations communication spreadsheets recruiting"),
        ("Learning & Development Coordinator", "l and d coordinator|training coordinator", "13-1151.00", "learning-design projects communication"),
        ("People Analyst", "hr analyst|workforce analyst", "13-1071.00", "hr-operations spreadsheets analysis visualization"),
        ("Talent Development Associate", "talent development specialist", "13-1151.00", "learning-design hr-operations communication"),
        ("Employee Experience Coordinator", "people experience coordinator", "13-1071.00", "hr-operations success projects communication"),
    ],
    "commercial": [
        ("Sales Representative", "sales executive|sales development representative|sdr|business development representative|bdr", "41-3091.00", "sales communication spreadsheets analysis"),
        ("Customer Success Associate", "customer success specialist|customer success manager|csm", "43-4051.00", "success communication projects spreadsheets"),
        ("Customer Support Specialist", "customer service representative|support associate", "43-4051.00", "success communication analysis security"),
        ("Procurement Analyst", "purchasing analyst|procurement associate", "13-1023.00", "procurement analysis spreadsheets communication"),
        ("Logistics Coordinator", "supply chain coordinator|logistics analyst", "13-1081.00", "inventory supply-chain spreadsheets projects"),
        ("Hospitality Operations Associate", "hotel operations associate|guest service associate", "11-9081.00", "hospitality success events communication"),
    ],
}

PILOT = {"Frontend Developer", "Backend Developer", "Data Analyst", "AI Applications Developer", "Cloud Support Associate", "Cybersecurity Analyst", "Digital Marketing Associate", "Recruitment Associate", "Sales Representative", "Customer Success Associate", "Project Coordinator", "Accounting Associate"}

ACTIVITIES = {
    "software": ("Review a small application change", "Explain its expected behavior, propose three edge-case tests, and write a concise review.", ["Correctness reasoning", "Test coverage", "Clear explanation"]),
    "data": ("Turn a small dataset into a decision", "Choose a question, document cleaning steps, and produce one chart with a justified conclusion and limitations.", ["Data checks", "Suitable method", "Evidence and limitations"]),
    "infrastructure": ("Write a troubleshooting runbook", "Describe how you would investigate an unavailable service, protect user data, and communicate an escalation.", ["Diagnostic sequence", "Security and recovery", "Useful escalation notes"]),
    "engineering": ("Review a process or design", "Document a simple process, its assumptions, likely failure points, and a proposed quality check. Use a safe desktop example.", ["Technical assumptions", "Quality checks", "Clear documentation"]),
    "product": ("Explain a product decision", "Describe a user problem, compare two approaches, and explain what evidence would change your decision.", ["Problem framing", "Evidence", "Trade-offs and accessibility"]),
    "business": ("Build a small project brief", "Define an outcome, scope, milestones, dependencies, owners, and two risks for an example project.", ["Clear scope", "Practical plan", "Risk and stakeholder communication"]),
    "marketing": ("Design a measurable campaign brief", "Choose an audience and objective, write a short message, select a channel, and define a meaningful success measure.", ["Audience fit", "Message and channel reasoning", "Measurement"]),
    "finance": ("Explain a reconciliation", "Use invented transactions to prepare a simple reconciliation and explain differences. State the accounting assumptions.", ["Numerical correctness", "Audit trail", "Clear assumptions"]),
    "people": ("Prepare a structured interview guide", "Choose role-related criteria, draft consistent questions, and describe an evidence-based scoring rubric.", ["Role relevance", "Consistent criteria", "Fair candidate communication"]),
    "commercial": ("Plan a customer conversation", "Describe the customer's situation, three discovery questions, a suitable next step, and what you would record afterward.", ["Understanding the need", "Appropriate next step", "Clear follow-up"]),
}


PILOT_ACTIVITIES = {
    "Frontend Developer": ("Build an accessible sign-up form", "Sketch or implement a sign-up form with labels, validation, keyboard navigation and success/error states. Explain three edge-case tests.", ["Clear form states and labels", "Keyboard and small-screen access", "Useful validation and test reasoning"]),
    "Backend Developer": ("Design a small booking API", "Define endpoints and example requests for creating and cancelling a booking. Explain validation, authorization, duplicate requests and two failure cases.", ["Coherent request and response contract", "Validation and access boundaries", "Failure handling and tests"]),
    "Data Analyst": ("Turn a small dataset into a decision", "Use a small public or synthetic dataset. State a question, check missing and duplicate values, and present one chart with a justified conclusion and a limitation.", ["Inspect data before calculating", "Choose a suitable chart and calculation", "Explain evidence and limitations"]),
    "AI Applications Developer": ("Plan an AI-assisted document feature", "Describe a document-search prototype, its data preparation and retrieval steps. Define three evaluation cases, how you would handle unsupported answers, and what must stay private.", ["Clear input, retrieval and output flow", "Grounded evaluation and failure cases", "Data handling and uncertainty communication"]),
    "Cloud Support Associate": ("Investigate an unavailable website", "Write a runbook for a synthetic website outage. Check scope, DNS, network reachability, service health and permissions in order. Record evidence before escalation.", ["Prioritized diagnostic sequence", "Safe checks and recovery boundaries", "Useful escalation summary"]),
    "Cybersecurity Analyst": ("Triage a suspicious login alert", "Using a fictional alert, identify what evidence you need, assess likely impact, propose proportionate containment, and write a handover. Do not use live credentials or attack a real system.", ["Evidence-based triage", "Proportionate containment and escalation", "Clear uncertainty and handover notes"]),
    "Digital Marketing Associate": ("Design and measure a small campaign", "Write a brief for a fictional product: audience, objective, message, channel and budget. Given 5,000 impressions and 100 clicks, calculate CTR and explain what else you need before judging success.", ["Audience and channel fit", "Correct measurement and interpretation", "Testable next step and clear message"]),
    "Recruitment Associate": ("Build a structured interview kit", "For a fictional vacancy, define three job-related criteria, consistent interview questions and a scoring rubric. Explain candidate communication, information handling and when local HR guidance is needed.", ["Job-related and consistent criteria", "Evidence-based scoring rubric", "Respectful communication and data handling"]),
    "Sales Representative": ("Prepare a discovery conversation", "Choose a fictional business customer. Write questions to understand their problem, decision process and constraints. Draft a relevant follow-up with a mutually agreed next step and no invented promises.", ["Open discovery questions", "Value tied to stated needs", "Accurate follow-up and next step"]),
    "Customer Success Associate": ("Plan a customer's first 30 days", "Create an onboarding plan for a fictional customer with an agreed outcome, milestones and adoption measures. Add an example response to a blocker and an escalation point.", ["Customer outcome and milestones", "Meaningful adoption measures", "Empathetic response and ownership"]),
    "Project Coordinator": ("Coordinate a small launch", "Plan a fictional two-week launch with scope, milestones, owners and dependencies. Record two risks and write a short status update when a dependency slips.", ["Clear scope and ownership", "Feasible sequence and dependencies", "Risk response and status communication"]),
    "Accounting Associate": ("Reconcile a simple cash record", "Create a synthetic cashbook and bank statement with one timing difference and one recording error. Reconcile the balances and explain the correction and audit trail. Use general principles rather than country-specific tax advice.", ["Correct reconciliation arithmetic", "Distinguish timing differences from errors", "Clear correction and supporting trail"]),
}


PILOT.update(PILOT_NAMES)
PILOT_ACTIVITIES.update(PHASE2_ACTIVITIES)
PILOT.update(PHASE3_PILOTS)
PILOT_ACTIVITIES.update(PHASE3_ACTIVITIES)

# Additional functional labels are curated role-search vocabulary. They neither
# add scored requirements nor claim that an arbitrary personal goal fits a role.
SEARCH_ALIASES = {
    "QA Engineer": ["software testing", "test automation", "defect investigation"],
    "DevOps Engineer": ["release pipelines", "deployment pipelines"],
    "HR Operations Associate": ["people operations", "employee lifecycle"],
}

SKILL_SYNONYMS = {
    "spreadsheets": ["excel", "google sheets", "spreadsheets"],
    "recruiting": ["recruitment", "recruiting", "talent acquisition", "structured interviews"],
    "marketing": ["campaigns", "email marketing", "seo"],
    "communication": ["business writing", "active listening", "stakeholder communication"],
    "analysis": ["requirements gathering", "process mapping"],
    "projects": ["project management", "risk register", "milestones"],
    "accounting": ["bookkeeping", "bank reconciliation", "debits", "credits"],
    "sales": ["crm", "prospecting", "discovery", "lead qualification"],
    "success": ["customer service", "customer support", "customer onboarding"],
    "networking": ["dns", "tcp ip", "dhcp"],
    "security": ["cybersecurity", "access control", "incident response"],
    "api": ["rest api", "http", "backend"],
    "testing": ["test cases", "regression testing", "pytest", "playwright"],
    "cloud": ["aws", "azure", "google cloud"],
    "git": ["git", "github", "version control"],
    "web": ["html", "css", "javascript"],
    "visualization": ["tableau", "power bi", "charts"],
    "react": ["react", "reactjs", "next.js"],
    "containers": ["docker", "containers", "continuous integration"],
    "ux": ["ux", "user research", "interaction design", "figma"],
    "architecture": ["software architecture", "system design"],
    "data-engineering": ["data engineering", "etl", "elt", "data pipelines"],
    "cad": ["cad", "autocad", "computer aided design", "drafting"],
    "manufacturing": ["manufacturing processes", "design for manufacturing"],
    "quality": ["quality control", "statistical process control", "quality assurance manufacturing"],
    "product": ["product strategy", "product management", "product roadmap"],
    "customer-research": ["customer research", "customer interviews"],
    "accessibility": ["accessibility", "wcag", "a11y"],
    "visual-design": ["visual design", "typography", "design systems"],
    "content": ["content strategy", "content writing", "copywriting", "editorial"],
    "seo": ["seo", "search engine optimization"],
    "research": ["research methods", "qualitative research", "quantitative research"],
    "financial-analysis": ["financial analysis", "financial modeling", "financial modelling"],
    "hr-operations": ["hr operations", "people operations", "employee onboarding"],
    "learning-design": ["instructional design", "learning design", "training design"],
    "inventory": ["inventory management", "logistics", "stock control"],
    "supply-chain": ["supply chain", "demand planning", "supply planning"],
    "mobile": ["mobile development", "android", "ios", "flutter", "react native"],
    "ml-operations": ["mlops", "ml operations", "model monitoring", "model deployment"],
    "brand": ["brand strategy", "brand positioning", "brand identity"],
    "payroll": ["payroll", "payroll reconciliation"],
    "audit": ["auditing", "audit", "internal controls"],
    "procurement": ["procurement", "purchasing", "supplier evaluation"],
    "automation": ["plc", "industrial automation"],
    "electronics": ["electronics", "circuit analysis"],
    "technical-writing": ["technical writing", "api documentation", "technical documentation"],
    "events": ["event planning", "event operations"],
    "hospitality": ["hospitality operations", "hotel operations", "front office operations"],
    "account-management": ["account management", "account planning", "customer renewals"],
}


def build():
    raw = ROOT / "data/raw/careers/occupation_data_31_0.json"
    if not raw.exists():
        raise SystemExit("Download the official O*NET occupation_data.json named in docs/CAREER_EXPANSION.md first.")
    occupations = {row["onetsoc_code"]: row for row in json.loads(raw.read_text(encoding="utf-8-sig"))["row"]}
    skills = [{"key": key, "id": identifier(name), "name": name, "category": category, "topic": key, "assessment_mode": "objective", "aliases": [name.lower()], "description": description} for key, (name, category, description) in TOPICS.items()]
    skills += [{"key": key, "id": identifier(name), "name": name, "category": category, "topic": None, "assessment_mode": "review", "aliases": [name.lower()], "description": f"Specialist learning and practical work in {name.lower()}. Additional assessment content is being developed."} for key, (name, category) in SPECIALISTS.items()]
    for skill in skills:
        skill["aliases"] = list(dict.fromkeys([skill["name"].lower(), *SKILL_SYNONYMS.get(skill["key"], [])]))
    lookup = {skill["key"]: skill for skill in skills}
    roles = []
    for family, _, _ in FAMILIES:
        for name, aliases, code, keys in ROLES[family]:
            source = occupations[code]  # Fail for stale or guessed taxonomy IDs.
            title, instructions, rubric = PILOT_ACTIVITIES.get(name, ACTIVITIES[family])
            requirements = [{"skill": key, "importance": 1 if i < 2 else .8, "target": 70 if i < 2 else 65, "essential": True} for i, key in enumerate(keys.split())]
            for requirement in requirements:
                assert requirement["skill"] in lookup
            roles.append({"id": identifier(name), "key": re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-"), "name": name, "family": family, "aliases": aliases.split("|"), "release_status": "pilot" if name in PILOT else "explore", "levels": ["foundation", "intermediate"], "description": "Build foundations in " + ", ".join(lookup[k]["name"].lower() for k in keys.split()[:3]) + ".", "scope": "General learning foundations. Employer, country and seniority requirements vary.", "requirements": requirements, "occupation": {"code": code, "title": source["title"], "url": "https://www.onetonline.org/link/summary/" + code, "relationship": "related occupation; VoidFill profile is a curated specialization"}, "activity": {"title": title, "instructions": instructions, "rubric": rubric, "evidence_type": "reflection", "note": "Use this rubric for self-reflection or discuss your work with a mentor. Saving a reflection does not award a measured skill score."}})
    assert len(roles) == 60 and len(PILOT) == 60
    assert set(PATHS) == {role["name"] for role in roles}
    for role in roles:
        role["aliases"] = list(dict.fromkeys([*role["aliases"], *SEARCH_ALIASES.get(role["name"], [])]))
        role["curriculum"] = curriculum_for(role["name"], [row["skill"] for row in role["requirements"]], role["activity"])
    assert PILOT <= {role["name"] for role in roles}
    assert PILOT <= PILOT_ACTIVITIES.keys()
    data = {"version": VERSION, "reviewed_at": "2026-11-06", "sources": [{"name": "O*NET 31.0 Database", "publisher": "U.S. Department of Labor, Employment and Training Administration", "url": "https://www.onetcenter.org/database.html", "license": "CC BY 4.0", "license_url": "https://creativecommons.org/licenses/by/4.0/", "sha256": hashlib.sha256(raw.read_bytes()).hexdigest(), "changes": "Selected related occupation IDs and titles; curated aliases, skill mappings, learning targets and activities are VoidFill additions. Not endorsed by USDOL/ETA."}], "families": [{"key": key, "name": name, "kind": kind} for key, name, kind in FAMILIES], "personal_goal_role": {"id": identifier("Personal Career Goal"), "name": "Personal Career Goal", "description": "An explicitly chosen personal goal with selected focus skills; no inferred occupation requirements."}, "topics": {key: description for key, (_, _, description) in TOPICS.items()}, "skills": skills, "roles": roles, "dependencies": [["git", "web"], ["python", "visualization"], ["sql", "visualization"], ["networking", "cloud"], ["networking", "security"], ["communication", "sales"], ["communication", "recruiting"], ["spreadsheets", "accounting"]]}
    DEST.mkdir(parents=True, exist_ok=True)
    (DEST / "catalogue.json").write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf8")
    print(f"Prepared {len(roles)} role profiles, {len(skills)} skills and {len(PILOT)} pilot paths.")


if __name__ == "__main__":
    build()
