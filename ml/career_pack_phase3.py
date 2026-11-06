"""Final catalogue foundation cohort: original activities and external references.

Coverage is introductory knowledge, never occupational licensing or proof of
practical competence. Engineering exercises are written or simulated only.
"""

TOPIC_DESCRIPTIONS = {
    "react": "React components props state hooks rendering lists keys forms effects immutable updates accessible UI",
    "mobile": "Mobile application lifecycle navigation permissions offline storage network errors responsive touch accessibility testing",
    "ml-operations": "MLOps model data versioning reproducibility training serving skew evaluation drift monitoring deployment rollback",
    "brand": "Brand strategy audience positioning identity promise differentiation consistency evidence guidelines brand equity",
    "payroll": "Payroll operations gross net pay timesheets deductions approvals reconciliation confidentiality corrections payroll controls",
    "audit": "Audit assurance evidence risk assertions sampling documentation internal controls independence professional skepticism",
    "procurement": "Procurement requirements supplier evaluation quotations total cost purchase orders receipt matching ethics supplier risk",
    "automation": "Industrial automation sensors actuators PLC inputs outputs scan cycles interlocks feedback alarms diagnostics simulation",
    "electronics": "Electronics fundamentals voltage current resistance Ohm law power series parallel components polarity measurements circuit diagrams",
    "technical-writing": "Technical writing audience task prerequisites procedures examples reference documentation accuracy versioning accessibility review",
    "events": "Event operations objectives venue scheduling run sheet capacity accessibility suppliers contingencies communication debrief",
    "hospitality": "Hospitality operations reservations arrivals room status housekeeping handovers service recovery guest privacy occupancy coordination",
    "account-management": "Account management customer outcomes stakeholders account plans relationship health renewals risks commitments value reviews CRM",
}

ACTIVITIES = {
"Mobile Developer": ("Plan an offline appointment app", "Sketch a mobile appointment flow with loading, offline, permission-denied and retry states. Describe local data, sync conflicts, navigation and accessibility. Write a test matrix for interruption and recovery without collecting real personal data.", ["Coherent mobile states and navigation", "Data, permission and sync boundaries", "Accessible controls and recovery tests"]),
"Software Engineer": ("Review a change with a clear contract", "Design a small task service using pseudocode or code. State input/output behavior, select a data structure and component boundary, and review empty, duplicate and unauthorized inputs. Explain tests and one maintainability trade-off.", ["Explicit behavior and data reasoning", "Useful boundaries and failure tests", "Readable implementation and review rationale"]),
"Machine Learning Engineer": ("Plan a reproducible model release", "Use a fictional classification task. Specify train/validation/test boundaries, a baseline, evaluation slices and a versioned model package. Describe training-serving checks, monitoring, rollout criteria and rollback. No paid cloud service is required.", ["Reproducible data and model provenance", "Leakage-aware evaluation and slice checks", "Observable release and rollback plan"]),
"Data Scientist": ("Investigate a claim with a baseline", "Use synthetic or public data to test a specific question. Document the sample, cleaning, train/test boundary where relevant, baseline, metric and uncertainty. Present a chart and distinguish association from causal evidence.", ["Sound question and data preparation", "Appropriate baseline and evaluation", "Clear interpretation, uncertainty and limitations"]),
"IT Support Specialist": ("Write a safe support triage", "For a fictional employee who cannot reach a work service, record symptoms, scope and ordered network/account/device checks. Draft a plain-language update and escalation, using no live credentials or changes to real systems.", ["Evidence-led diagnostic sequence", "Identity, access and data boundaries", "Useful explanation and owned escalation"]),
"Systems Administrator": ("Plan a service recovery rehearsal", "Write a desktop exercise for a fictional service outage. Identify dependencies, least-privilege access, logs, backups, restoration checks and communication owners. Distinguish a backup existing from a restore actually being verified.", ["Dependencies and safe diagnostic scope", "Recovery checks and access controls", "Traceable runbook and communication"]),
"Network Administrator": ("Document a small network fault", "Draw a fictional network with subnets, DNS and a service. Trace how you would distinguish name-resolution, reachability and application failures. Record expected evidence and an escalation boundary without scanning a real network.", ["Clear network and dependency model", "Checks that distinguish likely causes", "Safe scope and useful fault records"]),
"Automation Technician": ("Specify a simulated conveyor sequence", "Using a written state table or simulator only, describe a conveyor with a presence sensor, run request and fault state. Define inputs, outputs, permissives, alarm behavior and recovery tests. Safety functions and real machinery require qualified design and site procedures.", ["Explicit states and input/output meaning", "Defined interlocks and abnormal behavior", "Simulation tests and clear safety boundaries"]),
"Manufacturing Engineer": ("Compare two production approaches", "For a fictional desktop part, compare two manufacturing methods using volume, material, tolerance and setup assumptions. Sketch process flow, identify a constraint and propose a quality trial. Do not fabricate or operate equipment.", ["Reasoned process and cost assumptions", "Flow and capacity reasoning", "Quality trial with measurable acceptance"]),
"Electronics Technician": ("Explain a low-voltage circuit on paper", "Draw an ideal low-voltage resistor circuit or use a simulator. State component values, calculate current and power, and explain expected measurements and an open-circuit fault. Do not work on mains electricity or energized equipment.", ["Correct diagram, units and calculations", "Consistent expected measurements", "Fault reasoning and simulation-only scope"]),
"Industrial Engineering Associate": ("Improve a fictional work sequence", "Use invented task and waiting times to map a small assembly process. Identify the limiting step, calculate a simple capacity estimate and propose a change with quality and workload checks. State assumptions and use a desktop example.", ["Clear process and timing definitions", "Correct constraint and capacity reasoning", "Balanced improvement and verification plan"]),
"UI Designer": ("Specify an accessible interface system", "Design a small settings screen with a type hierarchy, spacing scale, color roles and reusable controls. Include focus, disabled, error and success states. Explain responsive behavior and how visual and semantic reading order agree.", ["Consistent hierarchy and reusable visual roles", "Accessible control states and labels", "Responsive behavior and precise handoff"]),
"UX Researcher": ("Investigate why a task fails", "Write a research plan for a fictional appointment service: questions, participants, consent, neutral tasks and observation notes. Create a synthetic findings table separating evidence, interpretation and recommendation, with sampling limits.", ["Questions, recruitment and consent alignment", "Neutral methods and traceable observations", "Synthesis with limits and actionable findings"]),
"Product Designer": ("Compare two ways to solve a user problem", "Frame a fictional task, sketch two interaction approaches and explain the trade-off. Develop one accessible prototype with edge states, then define an evaluation task and success/guardrail measures. State what evidence would change the choice.", ["Problem-led alternatives and rationale", "Coherent accessible interaction states", "Evidence-based evaluation and iteration"]),
"Technical Writer": ("Write and test a small API guide", "Using a fictional API, write a quickstart with audience, prerequisites, a safe request/response example and troubleshooting. Separate tutorial steps from reference fields. Ask a reader to follow the procedure and document a revision.", ["Accurate task and prerequisite structure", "Consistent, usable examples and reference", "Reader check, troubleshooting and revision trail"]),
"Project Manager": ("Manage a change to a launch plan", "Create a fictional launch brief with scope, dependencies, owners, milestones and risks. Introduce a stakeholder change, assess time/cost/outcome implications and write a decision record plus a revised status update without unsupported promises.", ["Feasible baseline and clear ownership", "Transparent change and trade-off reasoning", "Stakeholder alignment and useful status"]),
"Management Analyst": ("Compare process improvement options", "Use a fictional service process and synthetic evidence to define a problem, stakeholders and root-cause hypotheses. Compare two options on cost, benefit, feasibility and risk. Recommend a trial and explain what would disconfirm your conclusion.", ["Evidence-based problem and process model", "Comparable options and explicit assumptions", "Measurable trial and qualified recommendation"]),
"Administrative Coordinator": ("Coordinate an office onboarding handoff", "Build a fictional checklist joining HR, equipment, calendar and access requests. Define owners, due dates, dependencies and a status tracker. Draft a concise update for one delayed item, keeping unnecessary personal information out of the tracker.", ["Complete sequence and responsibilities", "Accurate tracker and data minimization", "Clear follow-up and exception handling"]),
"Social Media Coordinator": ("Plan a consistent social campaign", "For a fictional brand, write an audience brief, three channel-appropriate posts and a small editorial calendar. Define approval, accessibility, source checking and response boundaries. Pick a meaningful outcome and an experiment without guaranteeing engagement.", ["Audience and brand consistency", "Useful accessible content and review process", "Outcome-based measurement and response plan"]),
"Graphic Designer": ("Create a usable brand layout", "Produce a small poster or digital layout for a fictional service with a type hierarchy, spacing, color roles and a clear action. Show one small-screen adaptation and explain contrast, information priority and consistency with a short brand brief.", ["Clear hierarchy and readable composition", "Audience and brand alignment", "Accessible adaptation and justified choices"]),
"Marketing Analyst": ("Explain a campaign result", "Use synthetic impressions, clicks, costs and conversions from two channels. Define the metrics and attribution window, check comparability and chart the result. Explain uncertainty, a potential bias and a testable recommendation.", ["Correct metrics and comparable data", "Readable analysis with attribution limits", "Evidence-based next experiment"]),
"Payroll Specialist": ("Reconcile a fictional pay run", "Using invented employees and explicitly supplied fictional rates, calculate gross pay, deductions and net pay. Reconcile totals, flag an unapproved timesheet and document a correction. Explain restricted access and qualified local review; do not use real statutory rates.", ["Correct arithmetic under stated rules", "Approval, reconciliation and exception controls", "Confidential records and traceable corrections"]),
"Accounts Payable Associate": ("Check a supplier invoice exception", "Create a fictional purchase order, goods receipt and invoice with one mismatch. Explain the matching checks, authorization, duplicate prevention and resolution before payment. Record an audit trail using only synthetic supplier and bank details.", ["Accurate document and quantity matching", "Approval and duplicate-payment controls", "Owned exception and traceable records"]),
"Audit Associate": ("Prepare a traceable control test", "For a fictional purchase approval control, state the risk, control objective and test procedure. Review synthetic records, distinguish a missing document from a confirmed failure and write a scoped finding with evidence and limitations. Do not issue a professional audit opinion.", ["Risk, assertion and procedure alignment", "Relevant evidence and documented exceptions", "Qualified conclusion and review-ready workpaper"]),
"Credit Analyst": ("Explain a fictional credit-risk review", "Use invented financial statements to calculate liquidity and leverage measures with stated formulas. Identify cash-timing risks, missing information and sensitivity to one assumption. Write a balanced learning memo; do not decide credit eligibility for a real person.", ["Accurate, comparable financial measures", "Risk and sensitivity reasoning", "Evidence limits and clear communication"]),
"People Analyst": ("Define a trustworthy people metric", "Use synthetic staffing data to define headcount and a turnover measure, including period and denominator. Check duplicates and missing dates, chart a relevant segment and explain privacy, small-group limits and uncertainty without ranking real employees.", ["Explicit metric and data-quality checks", "Correct analysis and readable comparison", "Privacy-aware interpretation and limitations"]),
"Talent Development Associate": ("Plan a development activity with evidence", "For a fictional role, define a performance need, measurable learning objective and aligned practice task. Write feedback criteria and a manager follow-up to check application at work. Consider access needs and distinguish attendance from learning.", ["Role need and aligned objective", "Useful practice, feedback and accessibility", "Transfer support and meaningful evaluation"]),
"Employee Experience Coordinator": ("Improve a fictional employee journey", "Map a joining or internal-support journey using invented feedback. Identify one friction point, define an improvement with owners and a communication plan, and choose a measure plus a privacy guardrail. State the evidence needed before wider rollout.", ["Evidence-led journey and problem", "Owned, practical improvement", "Clear communication and privacy-aware measurement"]),
"Procurement Analyst": ("Evaluate a fictional supplier choice", "Write a small requirements brief and compare three synthetic supplier offers using declared criteria, total cost, delivery and risk. Record conflicts of interest, an approval route and acceptance checks. Use no real tenders, contracts or payments.", ["Clear requirements and consistent evaluation", "Total cost and supplier-risk reasoning", "Fair process, approvals and audit trail"]),
"Hospitality Operations Associate": ("Coordinate a fictional busy arrival shift", "Create a written shift plan for invented reservations, room-status updates and a group arrival. Include a handover, an unavailable-room response, guest-data boundaries, accessibility requests and escalation to qualified staff for safety or food concerns.", ["Accurate reservations and room-status coordination", "Respectful service recovery and privacy", "Clear handover and appropriate escalation"]),
}

PILOT_NAMES = set(ACTIVITIES)

REFERENCES = {
"react": [
("React quick start", "https://react.dev/learn", "React", "Review components, props, state, events and rendering fundamentals."),
("Managing state", "https://react.dev/learn/managing-state", "React", "Model shared state and predictable updates without unnecessary duplication."),
("When an effect is needed", "https://react.dev/learn/you-might-not-need-an-effect", "React", "Distinguish rendering and event logic from synchronization with external systems."),
],
"mobile": [
("Guide to app architecture", "https://developer.android.com/topic/architecture", "Android Developers", "Explore mobile UI state, data layers and lifecycle-aware design."),
("Offline-first applications", "https://docs.flutter.dev/app-architecture/design-patterns/offline-first", "Flutter", "Compare local data, network synchronization and offline behavior."),
("Request runtime permissions", "https://developer.android.com/training/permissions/requesting", "Android Developers", "Plan understandable permission requests and denied-permission behavior."),
],
"ml-operations": [
("MLOps pipeline concepts", "https://docs.cloud.google.com/architecture/mlops-continuous-delivery-and-automation-pipelines-in-machine-learning", "Google Cloud", "Explore reproducibility, validation, deployment and monitoring. Platform examples do not require using that provider in VoidFill."),
("Rules of machine learning", "https://developers.google.com/machine-learning/guides/rules-of-ml", "Google for Developers", "Review baselines, training-serving differences and useful evaluation practices."),
("MLflow model registry", "https://mlflow.org/docs/latest/ml/model-registry/", "MLflow", "Explore traceable model versions and lifecycle metadata using a registry example."),
],
"brand": [
("Branding and brand development", "https://openstax.org/books/principles-marketing/pages/9-5-branding-and-brand-development", "OpenStax", "Consider brand identity, perception, consistency and brand equity."),
("Entrepreneurial branding", "https://openstax.org/books/entrepreneurship/pages/8-4-entrepreneurial-branding", "OpenStax", "Connect a brand promise to audience value and supporting experience."),
("Market segmentation", "https://openstax.org/books/principles-marketing/pages/5-1-market-segmentation-and-consumer-markets", "OpenStax", "Define useful audience segments before choosing positioning and communication."),
],
"payroll": [
("Payroll accounting concepts", "https://openstax.org/books/principles-financial-accounting/pages/12-5-record-transactions-incurred-in-preparing-payroll", "OpenStax", "Review gross pay, deductions and liabilities. Examples use a US context; actual payroll rules require current qualified local guidance."),
("Current liabilities", "https://openstax.org/books/principles-financial-accounting/pages/12-1-identify-and-describe-current-liabilities", "OpenStax", "Understand amounts owed and the distinction between expenses and liabilities."),
("Internal controls", "https://openstax.org/books/principles-financial-accounting/pages/8-2-define-and-explain-internal-controls-and-their-purpose-within-an-organization", "OpenStax", "Review authorization, documentation and separation of duties in financial processes."),
],
"audit": [
("Tests of controls", "https://methodology.eca.europa.eu/aware/GAP/Pages/CA-FA/Examination/Tests-of-controls.aspx", "European Court of Auditors", "Explore why control tests need sufficient relevant evidence. Professional standards and local requirements remain outside this foundation pack."),
("Substantive audit procedures", "https://methodology.eca.europa.eu/aware/GAP/Pages/CA-FA/Examination/Substantive-procedures.aspx", "European Court of Auditors", "Distinguish direct examination of transactions or balances from testing controls."),
("Internal control principles", "https://openstax.org/books/principles-financial-accounting/pages/8-2-define-and-explain-internal-controls-and-their-purpose-within-an-organization", "OpenStax", "Study control purposes and documented responsibilities."),
],
"procurement": [
("Procurement and supply cycle", "https://www.cips.org/intelligence-hub/procurement/procurement-supply-cycle", "CIPS", "Explore requirements, sourcing, evaluation and supplier management. Some material requires provider membership; local procurement rules vary."),
("Supplier resource centre", "https://www.unops.org/business-opportunities/supplier-resource-centre", "UNOPS", "Review supplier participation and transparent procurement-process expectations."),
("Supplier evaluation", "https://www.cips.org/intelligence-hub/managing-suppliers/supplier-evaluation", "CIPS", "Consider evidence for supplier capability, cost, reliability and risk. Some material requires membership."),
],
"automation": [
("What is a PLC?", "https://library.automationdirect.com/what-is-a-plc/", "AutomationDirect", "Explore PLC input/output and controller concepts using written or simulated examples only."),
("PLC scan fundamentals", "https://library.automationdirect.com/plc-scan-fundamentals/", "AutomationDirect", "Study cyclic execution, timing and diagnostics. Actual hardware work needs qualified supervision and current site procedures."),
("Digital input example", "https://docs.arduino.cc/built-in-examples/basics/DigitalReadSerial/", "Arduino", "Review how a digital input is represented in a simple educational example. VoidFill activities use simulation only."),
],
"electronics": [
("Ohm's law", "https://openstax.org/books/university-physics-volume-2/pages/9-4-ohms-law", "OpenStax", "Use ideal circuit examples to relate voltage, current and resistance."),
("Electrical energy and power", "https://openstax.org/books/university-physics-volume-2/pages/9-5-electrical-energy-and-power", "OpenStax", "Calculate power and energy with clearly stated units and assumptions."),
("Series and parallel resistors", "https://openstax.org/books/university-physics-volume-2/pages/10-2-resistors-in-series-and-parallel", "OpenStax", "Explore ideal resistor networks on paper or in a simulator. This is not authorization or instruction to work on energized equipment."),
],
"technical-writing": [
("Technical Writing One", "https://developers.google.com/tech-writing/one", "Google for Developers", "Study audience, clear sentences, organization and task-focused documentation."),
("Technical Writing Two", "https://developers.google.com/tech-writing/two", "Google for Developers", "Review editing, examples, illustrations and larger document structure."),
("Developer documentation style", "https://developers.google.com/style/highlights", "Google for Developers", "Apply consistent conventions and readable technical explanations."),
],
"events": [
("Running an event safely", "https://www.hse.gov.uk/event-safety/running.htm", "UK HSE", "Explore planning, coordination and review responsibilities. UK guidance does not replace current local requirements or qualified safety advice."),
("Event planning topics", "https://www.hse.gov.uk/event-safety/health-safety-topics.htm", "UK HSE", "Consider communication, contingency ownership and emergency-planning interfaces. VoidFill exercises are written planning only."),
("Event operations context", "https://www.onetonline.org/link/summary/13-1121.00", "O*NET OnLine", "Review event-planning activities and coordination responsibilities. This is an occupation reference."),
],
"hospitality": [
("Hospitality and tourism foundations", "https://opentextbc.ca/introtourism2e/", "BCcampus Open Education", "Explore accommodation operations, customer service and hospitality context in an open textbook. Regional examples are not universal rules."),
("Accommodation operations", "https://opentextbc.ca/introtourism2e/chapter/operations/", "BCcampus Open Education", "Review coordination of accommodation services and operating responsibilities."),
("Customer service in hospitality", "https://opentextbc.ca/introtourism2e/chapter/communication-strategies/", "BCcampus Open Education", "Consider the guest experience, service interactions and organizational support."),
],
"account-management": [
("Accounts and contacts", "https://trailhead.salesforce.com/content/learn/modules/accounts_contacts_lightning_experience", "Salesforce Trailhead", "Explore account records, contact relationships and useful customer context. Some exercises require a free provider account."),
("Customer service and relationship records", "https://academy.hubspot.com/courses/hubspot-service-software", "HubSpot Academy", "Explore organized service, customer context and reporting. Provider account or software access may be required for exercises."),
("Stakeholder communication planning", "https://www.atlassian.com/team-playbook/plays/stakeholder-communications-plan", "Atlassian Team Playbook", "Map relevant stakeholders and plan appropriate communication and alignment."),
],
}
