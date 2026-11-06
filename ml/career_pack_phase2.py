"""Second foundation cohort: original activities and link-only references.

Specialist names/identities stay unchanged when knowledge coverage is added.
These are introductory learning objectives, not professional qualifications.
"""

TOPIC_DESCRIPTIONS = {
    "architecture": "Software architecture components interfaces cohesion coupling requirements trade-offs reliability caching queues",
    "containers": "Containers Docker images volumes ports CI CD reproducible builds deployment health checks rollback secrets",
    "data-engineering": "Data engineering pipelines ETL ELT schemas idempotency incremental loads orchestration lineage data quality",
    "cad": "Computer aided design CAD coordinates units layers dimensions constraints orthographic views scale revisions",
    "manufacturing": "Manufacturing processes materials machining casting forming additive production tolerances capacity flow waste",
    "quality": "Industrial quality systems inspection variation control charts root cause corrective action measurement traceability",
    "product": "Product strategy user problems outcomes prioritization hypotheses roadmaps discovery experiments metrics trade-offs",
    "customer-research": "Customer research research questions recruitment interviews observation consent synthesis sampling bias evidence",
    "ux": "User experience interaction design task flows prototypes usability feedback information architecture errors research",
    "accessibility": "Accessibility evaluation keyboard focus labels headings alternative text contrast captions manual testing assistive technology",
    "visual-design": "Visual design hierarchy typography spacing alignment layout color contrast grids consistency responsive interfaces",
    "content": "Editorial content strategy audience user needs briefs structure plain language editing evidence governance maintenance",
    "seo": "Search engine optimization crawl indexing search intent titles descriptions internal links canonical URLs structured data measurement",
    "research": "Research methods hypotheses variables sampling surveys qualitative quantitative evidence bias correlation causation replication",
    "financial-analysis": "Financial analysis financial statements ratios margins liquidity cash flow common size variance budgets scenarios",
    "hr-operations": "People operations onboarding employee records confidentiality service requests offboarding policies data quality escalation",
    "learning-design": "Learning design measurable objectives assessment alignment practice feedback accessibility transfer evaluation",
    "inventory": "Inventory logistics stock records receipts dispatch cycle counts reorder points lead time safety stock traceability",
    "supply-chain": "Supply chain planning demand capacity supply lead time forecasting bottlenecks service risk coordination bullwhip",
}

PILOT_NAMES = {
    "Full-Stack Developer", "QA Engineer", "BI Analyst", "Data Engineer", "DevOps Engineer",
    "CAD Technician", "Quality Engineer", "Product Manager", "UX Designer", "Business Analyst",
    "Operations Analyst", "Content Writer", "SEO Specialist", "Financial Analyst",
    "HR Operations Associate", "Learning & Development Coordinator", "Customer Support Specialist", "Logistics Coordinator",
}

ACTIVITIES = {
    "Full-Stack Developer": ("Trace a booking through the whole application", "Sketch a small booking UI, API and database. Trace success, duplicate submission and unauthorized access from screen to storage. Explain one architecture trade-off and how you would test each layer.", ["Consistent flow across UI, API and data", "Authorization and failure boundaries", "Justified architecture and test choices"]),
    "QA Engineer": ("Investigate a checkout defect", "For a fictional checkout, write a reproducible defect report and a risk-based test matrix covering valid input, boundaries, interrupted requests and keyboard use. Separate expected behavior from observations.", ["Reproducible steps and useful evidence", "Boundary and integration coverage", "Clear severity and regression reasoning"]),
    "BI Analyst": ("Build a trustworthy weekly performance view", "Use synthetic orders and a target table. Define revenue and date grain, check joins and duplicates, and sketch a dashboard with a target comparison. Explain one limitation and one decision it supports.", ["Explicit metric grain and data checks", "Correct aggregation and target comparison", "Readable dashboard and decision context"]),
    "Data Engineer": ("Design a repeatable order-data pipeline", "Plan an incremental pipeline for synthetic orders that can arrive late or be corrected. Describe keys, validation, scheduling, retries, lineage and a safe backfill. Explain how reruns avoid duplicates.", ["Stable grain and repeatable loading", "Quality checks and observable failures", "Late data, backfill and access handling"]),
    "DevOps Engineer": ("Plan a reversible container release", "Write a pipeline outline for a fictional web app: build once, test, scan, deploy, check health and roll back. Explain secret injection, persistent data and how a failed release is detected. Use a local or written example.", ["Reproducible artifact and meaningful checks", "Secrets and persistent-data boundaries", "Health checks, rollback and monitoring"]),
    "CAD Technician": ("Document a simple mounting plate", "Draw or sketch a desktop mounting plate with stated units, orthographic views, dimensions, hole positions and a revision note. Explain which dimensions control fit and how another person could check the drawing. Do not fabricate or operate machinery.", ["Units, views and unambiguous geometry", "Functional dimensions and stated assumptions", "Readable layers, notes and revision trail"]),
    "Quality Engineer": ("Investigate a recurring dimension defect", "Use invented inspection results to define a defect, check measurement consistency, summarize the pattern and propose a root-cause investigation. Separate containment from corrective action and describe a follow-up effectiveness check.", ["Clear requirement and trustworthy measurement", "Evidence-led investigation", "Containment, corrective action and follow-up"]),
    "Product Manager": ("Make an evidence-based product bet", "Choose a fictional user problem. Write a one-page opportunity brief with evidence, target outcome, two options, constraints, a small experiment and a stop/review decision. Include a guardrail against improving one metric at users' expense.", ["Specific user problem and evidence", "Prioritized options and explicit trade-offs", "Outcome, experiment and guardrail"]),
    "UX Designer": ("Prototype and review an appointment flow", "Sketch an appointment flow with choosing a time, confirmation, unavailable slots and error recovery. Write neutral usability tasks, state recruitment assumptions and review keyboard order, labels and feedback. Record findings separately from proposed changes.", ["Coherent tasks and recoverable states", "Accessible interaction and feedback", "Neutral evaluation and evidence-based iteration"]),
    "Business Analyst": ("Clarify a request before it becomes a feature", "For a fictional expense-approval problem, map the current process and stakeholders. Define the desired outcome, business rules, exceptions and acceptance examples. Record unresolved assumptions and explain how changes are agreed.", ["Problem, process and stakeholder context", "Testable requirements and exception cases", "Traceability and assumption management"]),
    "Operations Analyst": ("Find the constraint in a service process", "Use invented timestamps for a support queue. Distinguish waiting from active work, calculate a simple turnaround measure and identify a possible constraint. Propose one small change with a service-quality guardrail and follow-up measure.", ["Clear process boundaries and reliable measures", "Evidence behind the proposed constraint", "Practical experiment and quality guardrail"]),
    "Content Writer": ("Rewrite a confusing help page", "Create a brief and short help page for a fictional account-recovery task. State audience and purpose, organize steps, use descriptive headings and verify claims. Explain how you would test comprehension and keep the page current.", ["Audience need and usable structure", "Accurate, clear and accessible language", "Review, comprehension and maintenance plan"]),
    "SEO Specialist": ("Audit a fictional service page", "Write an audit for a sample service page covering search intent, title, headings, useful content, crawl/index constraints, internal links and canonical URL. Prioritize three changes and define how to monitor results without promising rankings.", ["Useful content and intent alignment", "Correct crawl and indexing reasoning", "Prioritized changes and measured uncertainty"]),
    "Financial Analyst": ("Explain performance and cash separately", "Create a synthetic income statement, balance sheet and cash summary. Calculate gross margin, current ratio and a budget variance, stating formulas and periods. Explain why profit can differ from cash and how one assumption changes your conclusion.", ["Correct formulas and comparable periods", "Interpretation of profit, liquidity and cash", "Transparent assumptions and sensitivity"]),
    "HR Operations Associate": ("Coordinate a fictional employee onboarding", "Create an onboarding checklist with owners, dependencies and a check-in. Design a minimal employee-record template with access boundaries and a correction process. Route policy or legal questions to qualified local staff; use no real employee data.", ["Clear ownership and complete handoffs", "Minimal, accurate and protected records", "Useful communication and escalation"]),
    "Learning & Development Coordinator": ("Design a short onboarding lesson", "Choose one workplace task. Write a measurable objective, a relevant practice task, an assessment and feedback. Include an accessible alternative and a follow-up check of transfer to work. Use synthetic examples and explain the alignment.", ["Observable objective and aligned assessment", "Useful practice, feedback and accessibility", "Practical delivery and transfer evaluation"]),
    "Customer Support Specialist": ("Resolve and hand over a support case", "For a fictional failed-payment report, write an empathetic response, safe diagnostic questions and a case note. Separate verified facts from assumptions, avoid requesting secrets and define escalation ownership and the next update.", ["Accurate understanding and clear response", "Safe investigation and useful case records", "Owned escalation and follow-up"]),
    "Logistics Coordinator": ("Reconcile stock and plan a shipment", "Use invented receipts, picks and dispatch records to reconcile a SKU balance. Calculate a reorder point from stated demand and lead time, then plan a shipment with checks, tracking and an exception handoff. State simplifying assumptions.", ["Correct stock balance and reorder arithmetic", "Traceable picking and dispatch checks", "Lead-time assumptions and exception communication"]),
}

# Own summaries; sources remain on their publishers' sites. Access restrictions
# and local rules belong to the linked provider, not to VoidFill's assessment.
REFERENCES = {
"architecture": [
("Architecture styles", "https://learn.microsoft.com/en-us/azure/architecture/guide/architecture-styles/", "Microsoft Learn", "Compare application structures and their operating trade-offs."),
("Cloud design patterns", "https://learn.microsoft.com/en-us/azure/architecture/patterns/", "Microsoft Learn", "Explore common approaches to distributed-system problems."),
("Architecture design principles", "https://learn.microsoft.com/en-us/azure/architecture/guide/design-principles/", "Microsoft Learn", "Consider failure, scalability and boundaries when designing software."),
],
"containers": [
("Docker overview", "https://docs.docker.com/get-started/docker-overview/", "Docker", "Understand images, containers, storage and the Docker execution model."),
("Understanding GitHub Actions", "https://docs.github.com/en/actions/about-github-actions/understanding-github-actions", "GitHub Docs", "Explore events, workflows, jobs and reproducible automation."),
("GitHub deployment environments", "https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments", "GitHub Docs", "Study environment configuration and deployment controls in an automation workflow."),
],
"data-engineering": [
("Getting started with data engineering", "https://learn.microsoft.com/en-us/training/paths/get-started-data-engineering/", "Microsoft Learn", "Review pipeline responsibilities and data integration concepts. The learning path assumes basic cloud-data knowledge."),
("ETL and ELT", "https://learn.microsoft.com/en-us/azure/architecture/data-guide/relational-data/etl", "Microsoft Learn", "Compare transformation placement and data movement patterns."),
("Airflow core concepts", "https://airflow.apache.org/docs/apache-airflow/stable/core-concepts/overview.html", "Apache Airflow", "Explore scheduled workflows, tasks and dependencies."),
],
"cad": [
("AutoCAD basics", "https://help.autodesk.com/view/ACD/2026/ENU/", "Autodesk", "Use the official help to explore drawing setup, geometry, layers and annotation."),
("Dimensioning in AutoCAD", "https://help.autodesk.com/cloudhelp/2022/ENU/AutoCAD-DidYouKnow/files/GUID-7B14AAA4-3208-4384-A444-8A29231C4A02.htm", "Autodesk", "Review dimensioning tools and readable drawing annotations."),
("CAD Technician: occupation context", "https://www.onetonline.org/link/summary/17-3013.00", "O*NET OnLine", "Review drafting tasks and documentation responsibilities. This is an occupation reference."),
],
"manufacturing": [
("Design and Manufacturing II", "https://ocw.mit.edu/courses/2-008-design-and-manufacturing-ii-spring-2025/", "MIT OpenCourseWare", "Explore manufacturing process selection, materials and system trade-offs. Some material is beyond foundation level."),
("Introduction to lean manufacturing", "https://pressbooks.palni.org/spcleanmanufacturing/chapter/chapter-1/", "PALNI Open Press", "Explore process flow, operating waste and improvement concepts."),
("Manufacturing Engineers: occupation context", "https://www.onetonline.org/link/summary/17-2112.03", "O*NET OnLine", "Review manufacturing activities and quality responsibilities. This is an occupation reference."),
],
"quality": [
("Introduction to quality", "https://pressbooks.palni.org/spcleanmanufacturing/chapter/chapter-7-2/", "PALNI Open Press", "Explore process quality, conformance and improvement responsibilities."),
("Basic quality tools", "https://pressbooks.palni.org/spcleanmanufacturing/chapter/chapter-8a/", "PALNI Open Press", "Compare tools for collecting and examining process evidence."),
("Introduction to statistical process control", "https://pressbooks.palni.org/spcleanmanufacturing/chapter/chapter-9-2/", "PALNI Open Press", "Distinguish process variation monitoring from product acceptance decisions."),
],
"product": [
("Product management", "https://www.atlassian.com/agile/product-management", "Atlassian", "Connect product problems, priorities, delivery and outcomes."),
("Product roadmaps", "https://www.atlassian.com/agile/product-management/product-roadmaps", "Atlassian", "Communicate direction, priorities and evolving plans."),
("The discovery phase", "https://www.gov.uk/service-manual/agile-delivery/how-the-discovery-phase-works", "GOV.UK Service Manual", "Investigate a problem and its constraints before committing to a solution."),
],
"customer-research": [
("Plan user research", "https://www.gov.uk/service-manual/user-research/plan-user-research-for-your-service", "GOV.UK Service Manual", "Define research questions, relevant participants and an approach."),
("Using in-depth interviews", "https://www.gov.uk/service-manual/user-research/using-in-depth-interviews", "GOV.UK Service Manual", "Prepare a discussion guide and investigate real experiences."),
("Analyse a research session", "https://www.gov.uk/service-manual/user-research/analyse-a-research-session", "GOV.UK Service Manual", "Separate observations from interpretations and share findings."),
],
"ux": [
("Using moderated usability testing", "https://www.gov.uk/service-manual/user-research/using-moderated-usability-testing", "GOV.UK Service Manual", "Plan neutral tasks and observe how people use a service."),
("Making prototypes", "https://www.gov.uk/service-manual/design/making-prototypes", "GOV.UK Service Manual", "Explore and test possible service approaches before committing to implementation."),
("User research in alpha", "https://www.gov.uk/service-manual/user-research/user-research-in-alpha", "GOV.UK Service Manual", "Use research to compare interactions and investigate service assumptions."),
],
"accessibility": [
("Evaluating web accessibility", "https://www.w3.org/WAI/test-evaluate/", "W3C WAI", "Combine tools, manual checks and user involvement when evaluating access."),
("Accessible forms", "https://www.w3.org/WAI/tutorials/forms/", "W3C WAI", "Study labels, instructions, grouping and form feedback."),
("Easy checks for accessibility", "https://www.w3.org/WAI/test-evaluate/easy-checks/", "W3C WAI", "Practice initial checks while understanding that they are not a complete conformance audit."),
],
"visual-design": [
("Carbon typography", "https://carbondesignsystem.com/elements/typography/overview/", "IBM Carbon Design System", "Explore readable type roles and consistent typographic hierarchy."),
("Carbon color", "https://carbondesignsystem.com/elements/color/overview/", "IBM Carbon Design System", "Study purposeful color roles and theme consistency."),
("Carbon 2x grid", "https://www.carbondesignsystem.com/building-blocks/foundations/2x-grid/guidelines", "IBM Carbon Design System", "Explore alignment, grouping and responsive layout relationships."),
],
"content": [
("Content design standards", "https://guidance.publishing.service.gov.uk/writing-to-gov-uk-standards/", "GOV.UK", "Plan useful content around audience tasks and maintain it over time."),
("Writing guidelines", "https://guidance.publishing.service.gov.uk/writing-to-gov-uk-standards/writing-guidelines/", "GOV.UK", "Review clear web writing and scan-friendly structure."),
("Technical writing style guide", "https://developers.google.com/style/highlights", "Google for Developers", "Review language, consistency and documentation conventions."),
],
"seo": [
("SEO starter guide", "https://developers.google.com/search/docs/fundamentals/seo-starter-guide", "Google Search Central", "Understand useful content, discovery and basic search presentation."),
("How Google Search works", "https://developers.google.com/search/docs/fundamentals/how-search-works", "Google Search Central", "Distinguish crawling, indexing and serving search results."),
("Creating helpful content", "https://developers.google.com/search/docs/fundamentals/creating-helpful-content", "Google Search Central", "Evaluate whether content serves readers and supports its claims."),
],
"research": [
("Why research matters", "https://openstax.org/books/psychology-2e/pages/2-1-why-is-research-important", "OpenStax", "Explore evidence, testable questions and the purpose of research."),
("Approaches to research", "https://openstax.org/books/psychology-2e/pages/2-2-approaches-to-research", "OpenStax", "Compare observational, survey and experimental approaches."),
("Analysing findings", "https://openstax.org/books/psychology-2e/pages/2-3-analyzing-findings", "OpenStax", "Consider relationships, causal claims and limits of evidence."),
],
"financial-analysis": [
("Financial statement analysis", "https://openstax.org/books/principles-financial-accounting/pages/a-financial-statement-analysis", "OpenStax", "Study common-size, trend and ratio analysis using educational examples."),
("Common-size statements", "https://openstax.org/books/principles-finance/pages/5-7-common-size-statements", "OpenStax", "Compare statement components using a consistent percentage base."),
("Operating efficiency ratios", "https://openstax.org/books/principles-finance/pages/6-2-operating-efficiency-ratios", "OpenStax", "Explore operating-efficiency measures and their interpretation. This is learning material, not investment advice."),
],
"hr-operations": [
("Employee induction", "https://www.cipd.org/uk/knowledge/factsheets/induction-factsheet/", "CIPD", "Plan useful onboarding with clear responsibilities. Local employment requirements vary."),
("People analytics", "https://www.cipd.org/uk/knowledge/factsheets/analytics-factsheet/", "CIPD", "Consider reliable people data, business questions and responsible interpretation. Some material requires membership."),
("Human resources management", "https://openstax.org/books/principles-management/pages/11-introduction", "OpenStax", "Explore general HR processes and organizational responsibilities; not country-specific legal guidance."),
],
"learning-design": [
("Articulate learning objectives", "https://www.cmu.edu/teaching/designteach/design/learningobjectives.html", "Carnegie Mellon Eberly Center", "Make intended learning observable and assessable."),
("Identify appropriate assessments", "https://www.cmu.edu/teaching/designteach/design/assessments.html", "Carnegie Mellon Eberly Center", "Align evidence of learning with the intended objective."),
("Principles of learning", "https://www.cmu.edu/teaching/principles/learning.html", "Carnegie Mellon Eberly Center", "Consider prior knowledge, practice, feedback and transfer when planning instruction."),
],
"inventory": [
("Inventory", "https://www.lean.org/lexicon-terms/inventory/", "Lean Enterprise Institute", "Distinguish inventory types and their role in material flow."),
("Kanban", "https://www.lean.org/lexicon-terms/kanban/", "Lean Enterprise Institute", "Explore replenishment signals and controlled material movement."),
("Logisticians: occupation context", "https://www.onetonline.org/link/summary/13-1081.00", "O*NET OnLine", "Review logistics coordination, records and shipment responsibilities. This is an occupation reference."),
],
"supply-chain": [
("Supply-chain learning materials", "https://ocw.mit.edu/course-lists/transportation-logistics-and-supply-chains/", "MIT OpenCourseWare", "Find open materials on supply, inventory, transport and planning. Some courses require quantitative prerequisites."),
("Just-in-time production", "https://www.lean.org/lexicon-terms/just-in-time-production/", "Lean Enterprise Institute", "Explore demand-linked flow and the conditions needed for dependable supply."),
("Value-stream mapping", "https://www.lean.org/lexicon-terms/value-stream-mapping/", "Lean Enterprise Institute", "Map material and information flow to identify delays and improvement opportunities."),
],
}
