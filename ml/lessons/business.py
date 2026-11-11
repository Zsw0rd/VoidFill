"""Original bounded checks for business, service and operations learning sources.

Reviewed public instruction on 2026-11-10. Course/occupation directories remain
ungraded guides. Fictional quantities are not tax, legal or professional advice.
The short checks assess stated knowledge, not workplace certification.
"""
import hashlib

REVIEWED_AT = "2026-11-10"
BANKS = []
NEW_RESOURCES = []
ORIENTATIONS = []


def _new(url, topic, title, provider, description):
    resource_id = "lesson-resource-" + hashlib.sha256((url + "|" + topic).encode()).hexdigest()[:20]
    NEW_RESOURCES.append({"id": resource_id, "title": title, "url": url,
                          "provider": provider, "description": description, "text": description,
                          "topics": [topic], "type": "tutorial", "difficulty": "beginner",
                          "estimated_hours": None, "source": "VoidFill public instructional source review 2026-11-10",
                          "license": "Original metadata; linked material retains publisher license"})
    return resource_id


def _bank(ids, url, topics, scope, questions, section="", source_sections=()):
    # These document-level anchors were checked in the public HTML on the review
    # date. Named sections below preserve the narrower reading scope. Do not
    # invent fragments from heading text when a publisher exposes no anchor.
    if not section:
        if url.startswith("https://openstax.org/books/"):
            section = "#main-content"
        elif url.startswith("https://www.atlassian.com/work-management/"):
            section = "#content"
        elif url == "https://www.iiba.org/knowledgehub/the-business-analysis-standard/":
            section = "#main"
        elif url.startswith("https://methodology.eca.europa.eu/aware/GAP/Pages/CA-FA/Examination/"):
            section = "#contentBox"
    BANKS.append({"resource_ids": ids, "url": url, "topics": topics,
                  "reviewed_at": REVIEWED_AT, "scope": scope, "source_sections": list(source_sections),
                  "source_anchor_note": "Verified public HTML anchor; named sections bound the reading scope." if section else
                                        "No stable instructional heading anchor was exposed in the reviewed page; use the URL and named sections.",
                  "questions": [(*q, section) if len(q) == 7 else q for q in questions]})


_bank(["career-resource-00bfd85f2741a83f7291"],
      "https://support.google.com/docs/answer/1272900?hl=en", ["spreadsheets"],
      "Google Sheets pivot headers, grouping, summarisation, source changes and detail inspection.", [
    ("headers", "pivot-source", 1, "What must each source column have before creating a pivot table?", "A header", ["A numeric value in every cell", "A subtotal at its bottom", "A fixed column width"], "Headers identify the source fields."),
    ("grouping", "pivot-layout", 2, "To display one row of totals per department, where would Department normally go?", "Rows", ["Values as a count", "Filters without a grouping field", "Only the source-range selector"], "Rows create category groups."),
    ("aggregation", "pivot-summary", 1, "To total the Amount field in a pivot, which summary is appropriate?", "SUM", ["COUNT of records", "AVERAGE", "MAX"], "SUM adds the numeric amounts."),
    ("source-range", "pivot-source", 3, "A pivot reads A1:C20. New records are added in rows 21–24 outside that range. What should you check?", "Expand the pivot's source range", ["Refresh the existing pivot", "Set the Amount field to SUM instead of COUNT", "Remove the pivot's value filter and leave A1:C20 as the source"], "Records outside the configured range need to be included."),
    ("refresh", "pivot-summary", 3, "An Amount cell inside the pivot source changes. What does Sheets do with the pivot?", "It refreshes the pivot automatically", ["Rebuild the pivot manually", "It copies the revised amount into a separate detail sheet", "It keeps the old value until the source range is reselected"], "Edits within the source update the pivot."),
    ("drill", "pivot-detail", 3, "A pivot total looks surprising. How can you inspect its underlying source rows?", "Double-click the value for its source rows", ["Sort the totals column", "Sort the aggregated value column and inspect the new order", "Open the field filter and inspect its allowed values"], "The detail sheet exposes the rows behind that value."),
], "#7101596", ("Add or edit pivot tables", "Change or remove data"))

_bank(["career-resource-7c2b49e6b750a2454cb9"],
      "https://support.google.com/docs/table/25273?hl=en", ["spreadsheets"],
      "Selected function-list entries: SUM, COUNT, COUNTA, IF, SUMIF and ROUND; not the complete function catalogue.", [
    ("sum", "function-sum", 1, "Which function adds numeric values in B2:B8?", "SUM(B2:B8)", ["COUNT(B2:B8)", "COUNTA(B2:B8)", "LOWER(B2:B8)"], "SUM adds a numeric range."),
    ("numeric-count", "function-count", 2, "A range contains 7, text 'hold', and 9. Which function counts only its numeric values?", "COUNT", ["COUNTA", "SUM", "CONCATENATE"], "COUNT counts numbers; COUNTA includes nonempty text."),
    ("conditional", "function-if", 2, "Which function chooses between two results according to a logical test?", "IF", ["SUM", "COUNT", "ROUND"], "IF branches on a condition."),
    ("sumif", "function-conditional-sum", 3, "A2:A8 contains categories and B2:B8 contains costs. Which totals costs only for category Tools?", "SUMIF(A2:A8,\"Tools\",B2:B8)", ["SUM(A2:A8,B2:B8)", "COUNT(A2:A8)", "SUMIF(B2:B8,\"Tools\",A2:A8)"], "SUMIF checks the category range and sums the corresponding costs."),
    ("round", "function-round", 3, "A display needs 18.746 rounded to two decimal places. Which function call fits?", "ROUND(18.746,2)", ["ROUND(18.746,0)", "COUNT(18.746,2)", "SUM(18.746,2)"], "The second argument specifies decimal places."),
    ("nonempty", "function-count", 3, "B2:B5 contains a number, a name, a blank cell and another name. Which counts all three nonempty cells?", "COUNTA(B2:B5)", ["COUNT(B2:B5)", "SUM(B2:B5)", "ROUND(B2:B5,3)"], "COUNTA counts nonempty values, including text."),
], "", ("Function list: SUM, COUNT, COUNTA, IF, SUMIF, ROUND",))

_bank(["career-resource-d02dfc9bb7add035c0d4"],
      "https://support.microsoft.com/en-us/office/overview-of-formulas-in-excel-ecfdc708-9162-49e8-b993-c311f47ca173", ["spreadsheets"],
      "Excel formula structure and relative, absolute, mixed and worksheet references.", [
    ("equals", "excel-formula", 1, "Which character starts an Excel formula?", "=", ["#", "?", "&"], "An equals sign introduces a formula."),
    ("range", "excel-reference", 1, "What does A2:A6 denote?", "The cells A2 through A6", ["Only A2 and A6", "Rows 2 through 6 in every column", "Six separate worksheets"], "The colon defines an inclusive cell range."),
    ("absolute", "excel-copy", 2, "Which reference fixes both its row and column when copied?", "$D$2", ["D2", "$D2", "D$2"], "Both dollar signs make both coordinates absolute."),
    ("copy-relative", "excel-copy", 3, "C2 contains =A2+B2. Copy it down one row. What formula is in C3?", "=A3+B3", ["=A2+B2", "=B2+C2", "=$A$2+$B$2"], "Relative rows move with the copied formula."),
    ("mixed", "excel-copy", 3, "A formula must always use column B while its row changes on copying down. Which reference fits?", "$B2", ["B$2", "$B$2", "B2 with no column lock"], "The column is fixed while the row remains relative."),
    ("sheet", "excel-reference", 3, "Which formula refers to A1 on a worksheet named North Sales?", "='North Sales'!A1", ["=North Sales:A1", "='North Sales'A1", "=A1!North Sales"], "A spaced worksheet name is quoted and followed by an exclamation mark."),
], "#using-references-in-excel-formulas", ("Using references in Excel formulas",))

_bank(["career-resource-d80406fdc9e304415990"],
      "https://www.skillsbuilder.org/global/universal-framework-steps/listening-step-7-active-listening", ["communication"],
      "Attentive listening, responsive cues and checking understanding. Eye contact is optional, not a proficiency condition.", [
    ("attention", "active-attention", 1, "What distinguishes active listening from simply hearing speech?", "Responding to the speaker's meaning", ["Memorising exact words", "Recalling exact words without checking their meaning", "Waiting for a pause to offer your own account"], "Listening requires attention and understanding."),
    ("cue", "active-attention", 2, "Which can show attention without requiring eye contact?", "A brief verbal acknowledgment", ["Finishing the speaker's sentence before hearing it", "Starting a parallel conversation about your own issue", "Switching to a different subject at the first pause"], "Attention can be communicated in different accessible ways."),
    ("purpose", "listening-understanding", 1, "Why check that you understood an instruction?", "To reduce misunderstandings", ["To guarantee agreement", "To avoid all questions", "To replace the instruction with your preference"], "Checking meaning helps catch mistakes."),
    ("clarify", "listening-understanding", 3, "A colleague says 'send it later' but you need a deadline. What best supports understanding?", "Ask which time they mean", ["Assume next week", "Repeat the phrase louder", "Send a different document"], "A focused question resolves the ambiguity."),
    ("support", "active-attention", 3, "A teammate describes a difficult meeting. What best shows you are following?", "Acknowledge their point and ask a follow-up", ["Suggest a fix before they finish", "Assume a familiar situation had the same cause", "Describe a similar meeting without checking whether it matches their experience"], "Relevant responses keep attention on their meaning."),
    ("inclusive", "listening-accessible-cues", 3, "A listener finds eye contact uncomfortable but follows and asks relevant questions. What is the sound assessment?", "Their relevant responses can show active listening", ["Score listening by gaze", "Require a prescribed posture before considering their responses", "Count attention only if they repeat the speaker's wording verbatim"], "Eye contact is not the only way to communicate attention."),
], "", ("What is this step?", "Why is this important?", "What does this skill step look like?"))

_bank(["career-resource-2f90b267348f46d4017e"],
      "https://www.atlassian.com/team-playbook/plays/working-agreements", ["communication"],
      "Team agreements about communication, participation and decisions; testing and revisiting shared norms.", [
    ("shared", "working-norms", 1, "A working agreement primarily records what?", "Agreed team working practices", ["A risk register", "A role chart showing formal reporting lines", "A log of decisions made in a single planning meeting"], "The agreement makes team norms explicit."),
    ("channels", "working-channels", 2, "Why agree which communication channels serve which purposes?", "Clarify where different updates belong", ["Move all updates to chat", "Set the same response deadline for every kind of message", "Create separate copies of each update for every audience"], "Channel purposes reduce conflicting expectations."),
    ("participation", "working-participation", 2, "Whose input should shape team working agreements?", "The people who work under the agreement", ["The department heads alone", "A facilitator who writes the agreement before meeting the team", "Representatives of the tools used for internal communication"], "The team jointly develops workable expectations."),
    ("timezones", "working-channels", 3, "Two time zones rarely overlap. Which agreement best accommodates routine updates?", "Use an async channel with agreed response times", ["Leave timing to each sender", "Allow updates only in the narrow overlap between offices", "Leave update channels and response expectations to each sender"], "Async expectations can accommodate different working hours."),
    ("experiment", "working-norms", 3, "The team disagrees on a channel. What is a useful next step?", "Try a workable compromise and review its results", ["Treat disagreement as permanent failure", "Let the loudest person decide without discussion", "Create conflicting private rules"], "An explicit experiment can resolve uncertainty about a norm."),
    ("review", "working-norms", 3, "A team changes membership and its agreement no longer fits. What should happen?", "Revisit the agreement with the team", ["Keep every rule unchanged indefinitely", "Delete it without discussion", "Assume newcomers know unwritten exceptions"], "Working agreements should evolve with the team's needs."),
], "#working-agreements1", ("Establish communication channels", "Follow-up: Revisit regularly"))

_bank(["career-resource-418999b6d2292fca5eb7"],
      "https://www.atlassian.com/team-playbook/plays/roles-and-responsibilities", ["communication"],
      "Compare role expectations, resolve ownership overlaps and follow up on unassigned responsibilities.", [
    ("role", "role-clarity", 1, "Why compare people's understanding of a role?", "Find gaps and conflicting expectations", ["Estimate staff availability", "Agree a formal reporting structure before delivery", "Set individual performance ratings based on titles"], "Different expectations become visible when compared."),
    ("owner", "role-ownership", 2, "A responsibility has contributors and a primary owner. What does naming that owner clarify?", "Who is accountable for the responsibility", ["Who first proposed the work", "Which contributor supplied the first draft of the work", "Which manager controls the budget for the full project"], "Ownership and contribution can coexist."),
    ("unassigned", "role-gaps", 1, "What should the group do with a responsibility nobody currently owns?", "Record it as unassigned and resolve it", ["Reassign it without discussion", "Assign it to the last person who performed a similar task", "Merge it with a different duty because that duty has an owner"], "Visible gaps can be deliberately resolved."),
    ("overlap", "role-ownership", 3, "Two people both believe they approve a release. What should the workshop establish?", "Agree who leads approval and who contributes", ["Leave final approval implicit", "Decide later without sharing the result with both people", "Treat both people as reviewers and leave final approval undefined"], "Discussing overlap produces a shared ownership decision."),
    ("gap-followup", "role-gaps", 3, "A new reporting task remains unclaimed at the workshop's end. Which follow-up is useful?", "Name who will resolve it and by when", ["Leave it in private notes with no next step", "Mark it done because it was discussed", "Assume a future hire owns it already"], "Unresolved responsibilities need explicit next steps."),
    ("comparison", "role-clarity", 3, "The role holder's task list differs from colleagues' expectations. What should happen next?", "Discuss the differences and agree responsibilities", ["Discard the role holder's view automatically", "Preserve both incompatible lists without discussion", "Choose whichever list is longest"], "The comparison starts clarification rather than deciding by list length."),
], "#instructions", ("Clarify role responsibilities", "Review unassigned responsibilities"))

_bank(["career-resource-09205585873f8f296ebe"],
      "https://www.iiba.org/knowledgehub/the-business-analysis-standard/", ["analysis"],
      "Public Business Analysis Core Concept Model definitions: needs, change, solutions, value, stakeholders and context; not the gated handbook.", [
    ("need", "baccm-need", 1, "In business analysis, a problem or opportunity to address is a what?", "Need", ["Solution already selected", "Completed benefit", "Job title"], "A need motivates analysis and change."),
    ("stakeholder", "baccm-stakeholder", 1, "Who is a stakeholder in a proposed service change?", "A person or group related to the need, change or solution", ["Only the software vendor", "Only the highest-paid employee", "Only people who support the proposal"], "Stakeholders can have different relationships and interests."),
    ("context", "baccm-context", 2, "Which describes context rather than the proposed solution?", "Conditions and circumstances surrounding the change", ["The chosen scheduling tool itself", "The delivered benefit alone", "The final feature list alone"], "Context frames how the other concepts are understood."),
    ("solution-jump", "baccm-need", 3, "A team requests a chatbot before explaining its service problem. What should analysis clarify first?", "The need and the value sought by stakeholders", ["The chatbot implementation plan before investigating the problem", "A vendor contract before any need is explored", "Whether a competitor already uses chatbots"], "A proposed solution should be examined against the underlying need."),
    ("value", "baccm-value", 3, "A redesign saves staff time but adds effort for customers. What should value analysis consider?", "The different stakeholders' perceived benefits and costs", ["Only the number of screens removed", "Only the developer's preference", "That a change is valuable to everyone equally"], "Value depends on stakeholders and context."),
    ("context-change", "baccm-context", 3, "A branch loses reliable internet access. What does the core model suggest about an online-only solution?", "Reassess its fit in the changed context", ["Its fit is guaranteed by its original approval", "Stakeholders no longer matter", "The original need must have disappeared"], "A contextual change can alter a solution's value and suitability."),
], "", ("Business Analysis Core Concept Model", "Business analysis"))

_bank(["career-resource-87499d1e1ec60bea0324"],
      "https://www.atlassian.com/work-management/project-management/requirements-gathering", ["analysis"],
      "Collect, clarify, document and validate goals, needs, constraints and success criteria before execution.", [
    ("purpose", "requirements-purpose", 1, "What is requirements gathering intended to clarify?", "What the project needs to achieve and under which constraints", ["Only the implementation tool before needs are explored", "Only progress against an already agreed plan", "Only acceptance after all delivery work ends"], "Requirements connect needs with deliverables and constraints."),
    ("sources", "requirements-input", 2, "Who can provide project requirements?", "Customers, operators, technical teams and other affected groups", ["Only the project sponsor", "Only the developers selected to implement the proposed solution", "Only the supplier's sales and product teams"], "Relevant requirements can come from several perspectives."),
    ("record", "requirements-document", 1, "Why keep a shared requirements document?", "Keep a shared record of needs and decisions", ["Treat every suggestion as approved", "Give each team a separate record that can diverge from the rest", "Treat every suggestion as a commitment before it is evaluated"], "A shared record supports alignment and change tracking."),
    ("vague", "requirements-clarify", 3, "A request says 'make delivery better'. What is the most useful next question?", "What delivery outcome would show improvement?", ["Which delivery tool should we buy?", "What launch date can we announce before defining the change?", "Which of the requested features should we schedule immediately?"], "Clarifying outcomes makes a broad request actionable."),
    ("conflict", "requirements-input", 3, "Support wants longer case histories while storage is limited. What should happen before execution?", "Agree and document a feasible constraint", ["Drop the case-history request", "Document both expectations as final despite the incompatibility", "Keep the storage limit and drop the history request without discussion"], "Early clarification reduces conflicting expectations and rework."),
    ("validate", "requirements-validate", 3, "A team writes requirements from one interview. What best reduces building the wrong deliverable?", "Review the interpreted needs with affected stakeholders", ["Re-read the interviewer's notes alone", "Choose a solution design before testing the interview assumptions", "Ask the implementation team to review the wording without checking it with affected users"], "Validation checks that the recorded requirements reflect intended needs."),
], "", ("What is requirements gathering?", "Why requirements gathering matters during project initiation"))

_bank(["career-resource-4a5e1f70f6f28e160f76"],
      "https://www.atlassian.com/work-management/project-management/project-risk-management", ["projects"],
      "Identify and assess uncertain project events, assign responses and monitor changes; no guarantee of risk elimination.", [
    ("uncertainty", "risk-identify", 1, "Which is a project risk?", "A possible supplier delay that could affect the schedule", ["A deliverable already accepted", "A completed status report", "A fixed project name"], "Risk concerns uncertainty and its effect on objectives."),
    ("impact", "risk-assess", 2, "What should risk assessment consider together?", "Likelihood and potential impact", ["Only the worst possible impact, regardless of likelihood", "Only likelihood, regardless of consequences", "Only how much the team has already spent"], "Likelihood and impact help prioritise attention."),
    ("ongoing", "risk-monitor", 1, "When should a project revisit risks?", "Throughout the project", ["Only after final delivery", "Only before hiring anyone", "Never after the first workshop"], "Risks evolve as work and context change."),
    ("mitigate", "risk-response", 3, "One specialist is the only person able to run a critical process. Which action reduces the disruption risk?", "Train a backup and document the process", ["Hide the dependency", "Remove the risk from the register", "Promise the specialist will never be unavailable"], "Reducing the single-person dependency is a concrete response."),
    ("owner", "risk-response", 3, "A risk response is agreed but nobody is responsible for following it. What is missing?", "An owner accountable for the response", ["Another impact estimate without an assignee", "A response description with no assigned follow-up", "A final status of closed before action occurs"], "A response needs ownership to be carried out and tracked."),
    ("new-evidence", "risk-monitor", 3, "A supplier's warning makes a previously unlikely delay more probable. What should the team do?", "Update the assessment and review the response", ["Keep the original score regardless", "Wait until delivery fails before discussing it", "Delete the warning to preserve the plan"], "New evidence should inform ongoing risk management."),
], "", ("What are project risks?", "Assess risks", "Monitor and review"))

_bank(["career-resource-fdff649e8ef4a980c759"],
      "https://www.atlassian.com/work-management/project-management/project-scope", ["projects"],
      "Scope boundaries, exclusions, deliverables, constraints and agreement on changes.", [
    ("boundary", "scope-boundaries", 1, "What does a project scope define?", "What work is included and excluded", ["The detailed project schedule", "The sequence and dates of every individual project task", "The customer outcomes that could be pursued in future projects"], "Scope states the boundaries of the agreed work."),
    ("constraint", "scope-constraints", 2, "Which is a project constraint?", "A fixed delivery budget", ["A desired user benefit", "A completed deliverable", "A customer's email address"], "A budget limits how the work can be delivered."),
    ("signoff", "scope-agreement", 1, "Why review scope with key stakeholders before execution?", "Align expectations and obtain approval", ["Freeze the schedule before discussing scope", "Authorise implementation before resolving disagreements over the boundary", "Replace later change decisions with the initial approval"], "An agreed scope gives participants a shared reference."),
    ("extra-feature", "scope-change", 3, "An approved booking project excludes payments. A stakeholder requests payments without changing the deadline. What is the useful response?", "Assess the change and agree its tradeoffs", ["Accept it under the existing plan", "Commit to the original cost and deadline before estimating the work", "Swap out an existing deliverable without discussing the effect on scope"], "Changing scope requires an explicit decision about its effects."),
    ("exclusion", "scope-boundaries", 3, "A reporting project includes monthly totals but excludes historical migration. Which statement prevents ambiguity?", "Include monthly reports and exclude migration", ["List the included report only", "Approve monthly reporting and leave migration to each team's interpretation", "List data migration as an assumed requirement without discussing it"], "Explicit exclusions clarify what delivery does not include."),
    ("deliverable", "scope-deliverables", 3, "Which scope entry describes a concrete deliverable for a training project?", "An approved onboarding handbook", ["Increase training completion", "Increase training completion by ten percentage points", "Keep spending within the existing training budget"], "A tangible output is clearer than an unbounded aspiration."),
], "", ("What is project scope?", "5 steps to define and write your project scope"))

_bank(["career-resource-885b19429d4477e02bed"],
      "https://openstax.org/books/principles-financial-accounting/pages/2-2-define-explain-and-provide-examples-of-current-and-noncurrent-assets-current-and-noncurrent-liabilities-equity-revenues-and-expenses", ["accounting"],
      "Asset/liability classification and the accounting equation, using a stated one-year operating cycle and fictional units.", [
    ("asset", "accounting-assets", 1, "Which is an asset of a repair business?", "Equipment the business owns", ["An unpaid supplier bill", "A loan owed to a bank", "Wages owed to staff"], "An owned economic resource is an asset."),
    ("liability", "accounting-liabilities", 1, "An unpaid bill for materials already received is normally what?", "Accounts payable", ["Accounts receivable", "An owner distribution", "Sales revenue"], "The business owes its supplier."),
    ("intangible", "accounting-assets", 2, "Which kind of asset lacks physical substance?", "An intangible asset", ["A delivery vehicle", "A tangible asset", "Raw materials"], "Intangible assets have no physical form."),
    ("current", "accounting-timing", 3, "Assume a one-year operating cycle. A customer debt is due in three months. How is the receivable classified?", "Current asset", ["Noncurrent liability", "Current liability", "Owner distribution"], "The receivable is an asset expected to convert within the year."),
    ("noncurrent", "accounting-timing", 3, "Assume a one-year operating cycle. A machine will serve the business for five years. Which category fits?", "Noncurrent asset", ["Current expense payable", "Current liability", "Customer receivable"], "Its expected use extends beyond one year."),
    ("equity", "accounting-equation", 3, "A fictional firm has assets of 86 units and liabilities of 31 units. What is its equity?", "55 units", ["117 units", "31 units", "86 units"], "Equity equals assets minus liabilities: 86 − 31."),
], "", ("Current and noncurrent assets and liabilities", "The Accounting Equation"))

_bank(["career-resource-11036a28b178c32f5b2c"],
      "https://openstax.org/books/principles-financial-accounting/pages/a-financial-statement-analysis", ["financial-analysis"],
      "Horizontal versus vertical analysis, percentage change and the limits of isolated ratios; fictional business units.", [
    ("horizontal", "statement-comparison", 1, "Which analysis compares financial results across periods?", "Horizontal analysis", ["Vertical analysis of one period only", "Alphabetical account sorting", "Document formatting"], "Horizontal analysis examines changes over time."),
    ("vertical", "statement-common-base", 2, "Expressing each income-statement item as a percentage of sales is which approach?", "Vertical analysis", ["Only absolute change analysis", "A cash count", "A supplier audit"], "Vertical analysis uses a common statement base."),
    ("context", "statement-interpretation", 1, "What helps interpret a ratio meaningfully?", "Relevant trends and comparable industry context", ["Its decimal precision alone", "The largest available company regardless of industry", "A universal good value for every industry"], "Ratios require context rather than an isolated number."),
    ("growth", "statement-change", 3, "Revenue rises from 160 to 200 fictional units. What is the percentage increase from the base period?", "25%", ["20%", "40%", "125%"], "The increase is 40; 40 ÷ 160 × 100 = 25%."),
    ("decline", "statement-change", 3, "An expense falls from 90 to 72 fictional units. What is the percentage change from the base period?", "−20%", ["−25%", "+20%", "+18%"], "(72 − 90) ÷ 90 × 100 = −20%."),
    ("base", "statement-change", 3, "A line rises from zero to 18 units. Why can't ordinary percentage change use the prior zero as denominator?", "Division by zero is undefined", ["All increases from zero equal 18%", "The result must be 100%", "Zero is replaced by the current value automatically"], "Report the absolute change and explain the zero base."),
], "", ("Horizontal Analysis", "Vertical Analysis", "Ratio Analysis"))

_bank(["career-resource-9194a5394b1d7b30d2da"],
      "https://openstax.org/books/principles-finance/pages/5-7-common-size-statements", ["financial-analysis"],
      "Common-size income and balance-sheet denominators, percentages and comparisons across different business sizes.", [
    ("income-base", "common-size-base", 1, "What is the usual base for a common-size income statement?", "Net sales", ["Total assets", "Only cash", "Number of employees"], "Income-statement items are expressed relative to net sales."),
    ("balance-base", "common-size-base", 1, "What base is used for a common-size balance sheet?", "Total assets", ["Net sales", "Only inventory", "Gross profit"], "Balance-sheet amounts are expressed relative to total assets."),
    ("comparison", "common-size-compare", 2, "Why use percentages when comparing firms of different sizes?", "To compare their statement proportions", ["To make their absolute profits equal", "To remove all industry differences", "To prove identical risk"], "Relative amounts reveal composition despite different scales."),
    ("margin", "common-size-calculate", 3, "Operating costs are 42 units and net sales are 140 units. What is their common-size percentage?", "30%", ["42%", "70%", "3.33%"], "42 ÷ 140 × 100 = 30%."),
    ("inventory-share", "common-size-calculate", 3, "Inventory is 36 units and total assets are 240 units. What share of assets is inventory?", "15%", ["36%", "6.67%", "85%"], "36 ÷ 240 × 100 = 15%."),
    ("scale-trap", "common-size-compare", 3, "Two firms each have costs equal to 60% of sales, but different sales totals. What follows?", "Their cost proportions match; absolute costs may differ", ["Their absolute costs must match", "Their total assets must match", "Their cash balances must match"], "Equal proportions do not imply equal amounts."),
], "", ("Common-Size Income Statement", "Common-Size Balance Sheet"))

_bank(["career-resource-8a73a991e180d0e7dda7"],
      "https://openstax.org/books/principles-finance/pages/6-2-operating-efficiency-ratios", ["financial-analysis"],
      "Average balances and receivables, inventory and total-asset turnover; no universal investment conclusion or inventory-days convention.", [
    ("ar-numerator", "turnover-receivables", 1, "Which sales measure is preferred in receivables turnover when available?", "Net credit sales", ["Cash sales only", "Cost of goods sold", "Total liabilities"], "Credit sales create the receivables being measured."),
    ("inventory-numerator", "turnover-inventory", 2, "Inventory turnover divides which amount by average inventory?", "Cost of goods sold", ["Net profit", "Accounts payable", "Total assets"], "The cost-based numerator matches inventory's cost basis."),
    ("asset-purpose", "turnover-assets", 1, "Total asset turnover relates sales to what?", "Average total assets", ["Only employee count", "Only retained earnings", "Only unpaid invoices"], "It measures sales generated relative to the asset base."),
    ("ar-math", "turnover-receivables", 3, "Beginning receivables are 18, ending receivables 30 and net credit sales 144 units. What is receivables turnover?", "6 times", ["4.8 times", "8 times", "3 times"], "Average receivables are 24; 144 ÷ 24 = 6."),
    ("stock-math", "turnover-inventory", 3, "Beginning inventory is 16, ending inventory 24 and cost of goods sold 100 units. What is inventory turnover?", "5 times", ["4.17 times", "6.25 times", "2.5 times"], "Average inventory is 20; 100 ÷ 20 = 5."),
    ("credit-tradeoff", "turnover-interpretation", 3, "Receivables turnover rises after much tighter credit terms. What should an analyst also investigate?", "Whether qualified customers and sales were lost", ["Assume every increase is unconditionally better", "Ignore industry context", "Conclude all inventory has sold"], "Faster collection can involve a sales-versus-credit tradeoff."),
], "", ("Accounts Receivable Turnover", "Total Asset Turnover", "Inventory Turnover"))

_bank(["career-resource-157bd9b0ae7b45cd7bf9"],
      "https://openstax.org/books/principles-financial-accounting/pages/12-5-record-transactions-incurred-in-preparing-payroll", ["payroll"],
      "Gross pay, stated fictional deductions, net pay and withholding liabilities. Historical tax tables, rates and legal rules are excluded.", [
    ("gross", "payroll-gross-net", 1, "Pay before any deductions is called what?", "Gross pay", ["Net pay", "Supplier revenue", "Retained earnings"], "Gross pay is compensation before reductions."),
    ("net", "payroll-gross-net", 1, "What does net pay represent?", "Gross pay less employee deductions", ["Gross pay plus every deduction", "Only employer contributions", "The company's total payroll expense"], "Net pay is the employee's remaining pay."),
    ("withholding", "payroll-liability", 2, "An employee deduction has been withheld but not yet remitted. What does the employer generally hold?", "A payable liability to the recipient", ["Additional sales revenue", "A permanent owner contribution", "A reduction in hours worked"], "The withheld amount remains owed until remitted."),
    ("hours", "payroll-hourly-earnings", 3, "In a fictional payroll, 24 hours earn 15 units per hour with no overtime. What is gross pay?", "360 units", ["240 units", "390 units", "15 units"], "24 × 15 = 360 before deductions."),
    ("deduct", "payroll-gross-net", 3, "Fictional gross pay is 740 units. Stated employee deductions total 95 units. What is net pay?", "645 units", ["835 units", "740 units", "95 units"], "740 − 95 = 645."),
    ("remit", "payroll-liability", 3, "A fictional benefit deduction of 28 units is withheld today and paid to its recipient next week. What happens on remittance?", "The withholding payable is settled", ["The employee earns 28 more gross units", "Sales revenue increases by 28", "The deduction becomes an unpaid customer invoice"], "Paying the recipient clears the amount owed."),
], "", ("Employee Compensation and Deductions", "Voluntary Deductions"))

_bank(["career-resource-8bdc4071aed46ed9c4de"],
      "https://openstax.org/books/principles-financial-accounting/pages/12-1-identify-and-describe-current-liabilities", ["payroll"],
      "Current obligations, earned versus unearned revenue and current portions of debt; a one-year operating cycle is stated in cases.", [
    ("obligation", "current-liability", 1, "What does a liability represent?", "An obligation the business owes", ["Every resource the business owns", "Only collected sales", "Only owner investments"], "Liabilities are obligations to others."),
    ("payable", "current-liability", 2, "Wages already earned by staff but not yet paid are normally what?", "Wages payable", ["An owner distribution", "Prepaid rent", "Sales receivable"], "Earned unpaid wages are an obligation."),
    ("unearned", "unearned-revenue", 1, "Cash collected before the promised service is provided initially creates what?", "Unearned revenue, a liability", ["An expense paid to staff", "An inventory loss", "A customer receivable"], "The business still owes the customer performance."),
    ("debt-portion", "current-debt-portion", 3, "With a one-year operating cycle, 12 of a 60-unit loan is due within the next year. What is the current portion?", "12 units", ["60 units", "48 units", "0 units because the loan is long-term"], "The portion due within the stated period is current."),
    ("advance", "unearned-revenue", 3, "A studio collects 300 units for future sessions and later delivers 100 units of them. How much remains unearned?", "200 units", ["300 units", "100 units", "400 units"], "The undelivered 200 units remain an obligation."),
    ("settlement", "current-liability", 3, "With a one-year operating cycle, an ordinary supplier bill is due in six weeks. How is it classified?", "Current liability", ["Noncurrent asset", "Owner equity contribution", "Prepaid expense"], "It is an obligation due within the stated current period."),
], "", ("Current Liabilities", "Unearned Revenue", "Current Portion of a Noncurrent Note Payable"))

_bank(["career-resource-bd45a349b1ac6a0648b5", "career-resource-8490f2d379dd547e27d1"],
      "https://openstax.org/books/principles-financial-accounting/pages/8-2-define-and-explain-internal-controls-and-their-purpose-within-an-organization", ["audit", "payroll"],
      "Control purposes, residual risk, separation of duties and comparison of records with actual operations; fictional payroll and equipment cases.", [
    ("purpose", "control-purpose", 1, "What is a central purpose of internal controls?", "Safeguard assets and support reliable records", ["Protect the annual budget alone", "Guarantee that errors cannot occur once a procedure is documented", "Use financial reporting as the sole way to detect operational problems"], "Controls manage risks to assets, operations and reporting."),
    ("residual", "control-risk", 2, "A control system is functioning well. What can still be true?", "Some risk of loss remains", ["All error is impossible", "No monitoring is useful", "Every transaction is automatically valid"], "Controls reduce risk; they do not eliminate it."),
    ("separation", "control-duties", 1, "What does separation of duties distribute?", "Split key responsibilities among people", ["Rotate staff locations", "Rotate staff locations while leaving transaction access unchanged", "Keep approval and custody together but use different filing systems"], "Independent roles reduce unchecked control of a process."),
    ("payroll-check", "control-duties", 3, "One clerk can add employees, approve their hours and release pay without review. What improves the control?", "Assign independent approval of employee changes and payments", ["Ask the same clerk to approve the same records twice", "Use a written approval policy without an independent approver", "Increase the clerk's payment limit without review"], "Independent checks reduce unchecked payroll authority."),
    ("reconcile", "control-records", 3, "Equipment records show 30 devices, but the physical count finds 27. What is the useful next step?", "Investigate and reconcile the difference", ["Post a write-off now", "Keep the recorded balance because the equipment list was previously approved", "Repeat the count and close the discrepancy without checking records"], "Controls compare records with actual operations and resolve exceptions."),
    ("backup", "control-assets", 3, "A single damaged server would destroy the only payroll records. Which control addresses that risk?", "Keep recoverable copies in another location", ["Mirror files on the same server", "Create a local archive on the server that holds the original files", "Keep a written list of file names without copies of the records"], "Separate recoverable copies reduce exposure to one-site loss."),
], "", ("Internal control purposes", "Segregation of duties", "Data protection"))

_bank(["career-resource-449b0394eec88cbbeefa"],
      "https://methodology.eca.europa.eu/aware/GAP/Pages/CA-FA/Examination/Tests-of-controls.aspx", ["audit"],
      "Operating effectiveness, control type, timing and changed controls in ECA guidance; knowledge checks do not constitute an audit opinion.", [
    ("objective", "audit-control-purpose", 1, "What do tests of controls primarily evaluate?", "Whether relevant controls operated effectively", ["Only whether a policy document exists", "Only whether the closing balance appears plausible", "Only whether the control was proposed at planning"], "Control tests seek evidence about operation."),
    ("automation", "audit-control-types", 2, "An automatic check rejects transactions with invalid codes. What kind of control is this?", "An automated application control", ["Only an external confirmation", "Only a physical stock count", "A marketing survey"], "The system applies the check to transactions."),
    ("monitoring", "audit-control-types", 1, "A regular management review of processing exceptions is what type of control?", "A monitoring control", ["A transaction-entry authorisation", "A physical access restriction", "An automated input-format check"], "Monitoring reviews control-system outputs."),
    ("period", "audit-control-timing", 3, "An auditor seeks reliance throughout a year. Why is observing an approval once insufficient by itself?", "It does not establish effective operation across the intended period", ["One observation always proves annual operation", "The year contains no separate transactions", "Approvals cannot be tested"], "The evidence must support the period of reliance."),
    ("changed", "audit-control-timing", 3, "A manual approval is replaced by a substantially different automated control midyear. What should testing consider?", "The two controls and their respective operating periods separately", ["Only the latest control for the whole year", "Only last year's manual control", "Neither control because a change occurred"], "Changed controls cannot be assumed equivalent across periods."),
    ("design-operation", "audit-control-purpose", 3, "A policy requires review, but the auditor finds no evidence reviews occurred. What remains unproven?", "The control's operating effectiveness", ["The policy's existence", "The existence of written words", "The need to consider relevant evidence"], "Documented design alone does not prove operation."),
], "", ("Placing reliance on controls", "Nature of tests of controls", "Timing of tests of controls"))

_bank(["career-resource-ba8315fdb90559dfefc4"],
      "https://methodology.eca.europa.eu/aware/GAP/Pages/CA-FA/Examination/Substantive-procedures.aspx", ["audit"],
      "Risk-responsive substantive procedures, tests of details versus analytical procedures and interim-period follow-up.", [
    ("responsive", "audit-substantive-risk", 1, "Substantive procedures should respond to what?", "The relevant assessed risks", ["Only the easiest records to obtain", "Only the procedures used last year", "Only the lowest-cost sample regardless of the assertion"], "Procedure design follows the risk being addressed."),
    ("categories", "audit-substantive-types", 2, "Which pair describes the main substantive procedure categories?", "Analytical procedures and tests of details", ["Walkthroughs and control tests", "Risk assessment procedures and staff independence checks", "Inspection of records and tests of control effectiveness"], "The categories provide different kinds of substantive evidence."),
    ("material", "audit-substantive-risk", 2, "Does reliance on controls automatically remove substantive work on every material item?", "No. Material items still require substantive work.", ["Yes, when controls are documented", "Yes, provided the control design is approved and documented", "Yes, when a walkthrough verifies that the control was implemented"], "Control reliance does not remove the stated material-item requirement."),
    ("detail", "audit-substantive-types", 3, "An auditor needs evidence for the existence of a specific recorded asset. Which category is ordinarily more suitable?", "A test of details focused on that asset", ["Review aggregate spending trends", "An overall trend analysis of depreciation expense", "A walkthrough that shows how purchases should be recorded"], "Specific assertions can require detailed evidence."),
    ("interim", "audit-substantive-timing", 3, "Substantive testing ends three months before year end. What must the auditor consider?", "Procedures that cover the remaining period", ["Re-use the interim sample alone", "Whether the audit report can use the interim balance as year-end evidence", "Whether findings from the interim tests can replace consideration of later events"], "Interim evidence must be extended appropriately to period end."),
    ("deviation", "audit-substantive-risk", 3, "Interim tests reveal unexpected deviations. What should be reconsidered?", "The risk assessment and remaining test plan", ["The report date alone", "The wording of the risk label without changing the planned work", "The approval of next year's timetable before this year's risks are reassessed"], "New exceptions can change the evidence needed."),
], "", ("Principles", "Nature of substantive procedures", "Timing of substantive procedures"))

_bank(["career-resource-a50b42e3a8904f9df25c"],
      "https://www.cipd.org/uk/knowledge/factsheets/analytics-factsheet/", ["hr-operations"],
      "Public people-analytics definitions, descriptive/predictive/prescriptive use and correlation limits; no individual employment decisions.", [
    ("purpose", "people-analytics-purpose", 1, "What is the purpose of people analytics?", "Investigate business problems using people data", ["Rank staff on one metric", "Replace employee discussions with one standard ranking", "Compare departments without connecting the measures to a business problem"], "The analysis should address a relevant problem."),
    ("descriptive", "people-analytics-types", 1, "A chart reports last quarter's staff turnover. Which kind of analysis is it?", "Descriptive", ["Predictive", "Prescriptive", "A controlled experiment by itself"], "It describes what happened."),
    ("predictive", "people-analytics-types", 2, "A model estimates next year's staffing needs. Which kind of analysis is it?", "Predictive", ["Only descriptive", "Only a historical headcount", "Proof of a causal mechanism"], "The estimate projects a future outcome."),
    ("correlation", "people-analytics-evidence", 3, "Teams with more training also have lower turnover. What can this association alone establish?", "The variables are associated", ["Training caused the drop", "The results rule out other differences between teams", "The same training will have the same effect on every employee"], "Correlation alone does not establish causation."),
    ("prescriptive", "people-analytics-types", 3, "Analysts compare possible retention actions and define how their results will be measured. Which use fits best?", "Prescriptive analytics", ["Only a descriptive summary of past resignations", "Only a prediction without choosing an intervention", "Only collecting raw data without analysis"], "Prescriptive work examines actions and their intended results."),
    ("proportionate", "people-analytics-purpose", 3, "A team can answer a turnover question using a clear descriptive summary. What follows?", "Advanced modelling is not automatically more valuable", ["A prediction model is always mandatory", "The simple summary must be discarded", "More surveillance always improves the answer"], "The method should suit the problem and evidence."),
], "#what-is-descriptive-predictive-and-prescriptive-analytics", ("What is people analytics?", "What is quantitative and qualitative data, correlation and causation?"))

_bank(["career-resource-7dc843950f5df38e2316"],
      "https://www.cipd.org/uk/knowledge/factsheets/selection-factsheet/", ["recruiting"],
      "Public selection guidance on structured questions, consistent scoring, candidate information and adjustments; not jurisdictional employment law.", [
    ("stages", "selection-process", 1, "Which two broad stages does candidate selection involve?", "Shortlisting and assessment", ["Payroll and invoicing", "Advertising and stocktaking", "Induction and dismissal only"], "Shortlisting precedes assessment for an offer."),
    ("structure", "selection-structure", 2, "What defines a structured interview?", "Predetermined questions and consistent scoring criteria", ["Equal interview lengths", "Let each panel member define a personal scoring method", "Agree the job profile while leaving every interview unplanned"], "Structure makes candidate evidence more comparable."),
    ("advance", "selection-candidate-experience", 1, "What should candidates receive before an assessment?", "Explain the format, timing and technology", ["A calendar invitation only", "Send the employer's brochure and confirm the date without access details", "Send the job description again without describing the assessment process"], "Advance information supports preparation and participation."),
    ("independent", "selection-scoring", 3, "A panel is about to compare candidates. What reduces influence from the most senior interviewer?", "Score separately before discussing responses", ["Agree one rating up front", "Ask the most senior interviewer to set an initial score for the panel", "Compare candidates as a group before any interviewer documents evidence"], "Independent scoring reduces premature influence."),
    ("adjustment", "selection-candidate-experience", 3, "A candidate needs an accessible assessment format. Which process is more inclusive?", "Invite requests and arrange suitable access", ["Keep one format for everyone", "Offer more preparation material without checking whether it addresses the barrier", "Record the request but keep the same format without discussing alternatives"], "Participation needs should be considered during recruitment."),
    ("criteria", "selection-scoring", 3, "Two candidates answer the same question. How should the panel compare their answers?", "Use the same pre-agreed role-relevant criteria", ["Prefer whoever shares the interviewer's hobbies", "Score by confidence alone", "Change the rubric after seeing each answer"], "Consistent relevant criteria support a fair comparison."),
], "#the-role-of-selection-interviewing", ("Selection process considerations", "Use structured interviews"))

_bank(["career-resource-3fbe4ef41f2464a98b34"],
      "https://www.cmu.edu/teaching/designteach/design/learningobjectives.html", ["learning-design"],
      "Observable student-centred objectives, task decomposition and alignment with assessment and instruction.", [
    ("student", "objective-student", 1, "A learning objective should describe whose intended capability?", "The learner's", ["Only the instructor's speaking time", "Only the room's capacity", "Only the course's marketing reach"], "Objectives state what students should be able to do."),
    ("observable", "objective-observable", 2, "Which verb makes an objective easier to observe?", "Compare", ["Appreciate privately", "Become aware internally", "Understand without any specified action"], "An observable action can be assessed."),
    ("alignment", "objective-alignment", 1, "What should align with learning objectives?", "Instruction and assessment", ["Only contact hours, regardless of activities", "Only attendance requirements, regardless of performance", "Only topic names, regardless of the tasks assessed"], "Activities and evidence should target the intended learning."),
    ("rewrite", "objective-observable", 3, "A lesson's objective is 'understand cash flow'. Which revision is more assessable?", "Classify given transactions as cash inflows or outflows", ["Know cash flow very well", "Hear a talk about cash flow", "Spend twenty minutes on the slides"], "A classification task produces observable evidence."),
    ("components", "objective-decompose", 3, "Learners must eventually critique a proposal. What helps plan the prerequisite learning?", "Identify component skills such as locating evidence and applying criteria", ["Assume the complex skill needs no components", "Assess only recall of the proposal title", "Remove the objective to avoid complexity"], "Breaking down a complex task guides teaching and practice."),
    ("mismatch", "objective-alignment", 3, "The objective requires evaluating alternatives, but the test asks only term definitions. What should be changed?", "Include assessment that requires judgement against criteria", ["Rename the test as advanced without changing it", "Add more decorative slides", "Count attendance as proof of evaluation skill"], "Assessment must elicit the intended cognitive action."),
], "#content", ("Learning objectives should be student-centered", "Learning objectives should use action verbs", "Learning objectives should be measurable"))

_bank(["career-resource-589ecd51ea1a749c7072"],
      "https://www.cmu.edu/teaching/designteach/design/assessments.html", ["learning-design"],
      "Select assessment activities matching recall, application, evaluation and creation; use criteria and feedback, not quiz-only mastery claims.", [
    ("match", "assessment-alignment", 1, "What should determine an assessment activity?", "The targeted learning objective", ["Only which activity is shortest to mark", "Only a favourite question format", "Only which activity was used in a different course"], "The activity should expose evidence of the intended capability."),
    ("recall", "assessment-evidence", 2, "A question asking learners to recognise a term chiefly checks what?", "Recall or recognition", ["Complete practical mastery", "Independent project creation", "Workplace performance over time"], "Recognition is narrower than demonstrated complex performance."),
    ("criteria", "assessment-criteria", 1, "What helps judge different levels of performance consistently?", "An explicit scoring rubric", ["An unstated personal impression", "Only the total word count regardless of quality", "A new standard chosen after each submission"], "A rubric makes performance criteria explicit."),
    ("apply", "assessment-alignment", 3, "An objective requires using a procedure on a new case. Which assessment fits best?", "A problem requiring the procedure to be carried out", ["Only naming the procedure's author", "Only recognising its title", "Only recalling the slide number"], "Application requires using the procedure."),
    ("create", "assessment-alignment", 3, "Learners must design an evacuation communication plan. Which provides direct evidence?", "An original plan assessed against clear criteria", ["Only a definition-matching quiz", "Only attendance at a lecture", "Only a survey of confidence"], "Creation objectives need an authored output."),
    ("feedback", "assessment-feedback", 3, "Most learners omit a key step in a task. What can assessment evidence guide?", "Targeted feedback and changes to instruction", ["Only recording a grade without addressing the pattern", "Repeating the same task without feedback or clarification", "Changing the objective only to hide the observed gap"], "Results can improve both learners' practice and teaching."),
], "#content", ("Potential Assessments", "Type of Learning Objective / Examples of Types of Assessment / How to Measure"))

_bank(["career-resource-55bf5f2352d97557e5b6"],
      "https://www.cmu.edu/teaching/principles/learning.html", ["learning-design"],
      "Prior knowledge, knowledge organisation, component practice, targeted feedback and learners monitoring their own strategies.", [
    ("prior", "learning-prior", 1, "How can prior knowledge affect new learning?", "It can help or hinder it", ["It never affects learning", "It always guarantees correctness", "It only matters after an exam"], "Existing knowledge can support or conflict with new ideas."),
    ("organisation", "learning-organisation", 2, "Why do connections between concepts matter?", "Organisation affects retrieval and application", ["Grouping replaces practice", "Recall depends on the number of facts regardless of their relationships", "The way facts are organised changes presentation without affecting use"], "Useful relationships make knowledge easier to use."),
    ("practice", "learning-practice", 1, "Which pairing supports improvement?", "Goal-directed practice and targeted feedback", ["Repeat tasks without feedback", "Read new examples without attempting the target skill", "Practise a different skill and receive a general completion rating"], "Practice and feedback should address the intended skill."),
    ("misconception", "learning-prior", 3, "Learners repeatedly apply an incorrect earlier rule. What should instruction address?", "Correct the earlier rule and practise applying the new one", ["Repeat the same directions", "Treat each wrong answer as inattention and repeat the directions unchanged", "Cover unrelated material first and leave the error for the final test"], "Prior knowledge can interfere unless it is surfaced and corrected."),
    ("integration", "learning-mastery", 3, "Learners perform component steps separately but cannot complete a whole task. What practice is missing?", "Practise combining the steps in a complete task", ["Repeat each step in isolation", "Memorise an expanded glossary for the individual steps", "Replace component practice with an assessment of definitions"], "Mastery requires coordination and appropriate use, not isolated components alone."),
    ("monitor", "learning-self-regulation", 3, "A learner's study strategy produces poor results. What supports self-directed learning?", "Check the results and adjust the strategy", ["Repeat the same strategy without reflection", "Assume confidence alone proves progress", "Avoid any feedback"], "Self-directed learning includes monitoring and adjustment."),
], "#LP01", ("Prior knowledge", "Goal-directed practice", "Self-directed learners"))

_bank(["career-resource-bf5907b7fb6a33f6aee8"],
      "https://www.lean.org/lexicon-terms/inventory/", ["inventory"],
      "Inventory position versus purpose, and this Lean Lexicon page's distinction between demand buffers and protection against upstream capability problems.", [
    ("raw", "inventory-position", 1, "Materials not yet processed at a facility are classified by position as what?", "Raw materials", ["Finished goods", "Shipped sales", "Customer receivables"], "Raw materials precede processing."),
    ("wip", "inventory-position", 1, "Items between processing steps within a facility are what?", "Work-in-process", ["Only finished goods", "Only raw materials", "Only shipping documents"], "WIP is located between production steps."),
    ("two-dimensions", "inventory-purpose", 2, "Can the same items be both finished goods and safety stock?", "Yes: one describes position and the other purpose", ["No: every item has only one description", "Only if the item is already sold", "Only if it has no physical form"], "Position and purpose are separate classifications."),
    ("demand-buffer", "inventory-purpose", 3, "Using this lesson's terms, stock is held against abrupt short-term increases in downstream demand. What is its purpose?", "Buffer stock", ["Safety stock against upstream incapability", "An account payable", "A machine changeover"], "The lesson distinguishes demand protection from upstream capability protection."),
    ("upstream-safety", "inventory-purpose", 3, "Using this lesson's terms, stock protects a downstream step from unreliable upstream supply. What purpose does it serve?", "Safety stock", ["Only a demand buffer", "Only a shipped-sales record", "Only a product's physical position"], "This stock protects against upstream process or supplier capability problems."),
    ("reduce", "inventory-variability", 3, "A process cuts protective inventory while demand variability and supplier reliability stay unchanged. What risk increases?", "Failing to supply customers when needed", ["All variability disappears", "Upstream capability improves automatically", "Stockouts become impossible"], "Inventory reduction should follow work on variability and capability."),
], "", ("Inventory", "Buffer Stock", "Safety Stock", "Work-in-Process"))

_bank(["career-resource-3206b0a4499800dbed77"],
      "https://www.lean.org/lexicon-terms/kanban/", ["inventory"],
      "Production and withdrawal signals in a physical pull system, including container quantities and the consumption/replenishment loop.", [
    ("signal", "kanban-purpose", 1, "In a pull system, what does a kanban provide?", "Authorisation and instructions to make or move items", ["Permission to produce unlimited stock", "Only a decorative label", "Proof of customer payment"], "The signal controls production or conveyance."),
    ("production", "kanban-type", 2, "Which kanban instructs an upstream process what type and quantity to make?", "Production kanban", ["Withdrawal kanban only", "An unpaid invoice", "A visitor badge"], "A production signal authorises making the specified items."),
    ("withdrawal", "kanban-type", 1, "What does a withdrawal kanban authorise?", "Moving parts to a downstream process", ["Producing any product without limits", "Changing product design", "Hiring a new operator"], "Withdrawal is conveyance to the consuming process."),
    ("container", "kanban-quantity", 3, "A production card authorises one container of 12 parts. The operator has time for 36. What keeps the stated pull rule?", "Make the authorised container, not extra unrequested stock", ["Make 36 because capacity is available", "Make an unrelated part instead", "Ignore the card's quantity"], "Capacity alone is not authorisation for additional production."),
    ("replenish", "kanban-loop", 3, "A container leaves the upstream supermarket for downstream use. What does its returned production kanban signal?", "Replenish the withdrawn container", ["Stop recording consumption", "Move every remaining container immediately", "Increase all batch sizes permanently"], "Consumption triggers replacement in the described loop."),
    ("form", "kanban-purpose", 3, "A team replaces physical cards with reliable electronic signals carrying the same instructions. Can this still be kanban?", "Yes, the authorisation function matters, not only paper cards", ["No, only cardboard can be kanban", "Only if all quantity limits disappear", "Only if signals are never returned"], "The page describes electronic and other signal forms."),
], "", ("The Types", "Production Kanban", "Withdrawal Kanban", "Example of Production and Withdrawal Kanban"))

_bank(["career-resource-1a99e6f0c0ca5ce2fc1b"],
      "https://www.lean.org/lexicon-terms/just-in-time-production/", ["supply-chain"],
      "The short public JIT definition: needed quantity/timing, pull, takt, continuous flow and levelling as a foundation; not a full implementation course.", [
    ("needed", "jit-purpose", 1, "What does just-in-time production aim to make and deliver?", "What is needed, when needed, in the needed amount", ["Maximum output regardless of demand", "Only the cheapest available product", "Every forecast quantity immediately"], "JIT aligns delivery with actual need."),
    ("elements", "jit-elements", 2, "Which set contains the three operating elements named in this JIT definition?", "Pull, takt time and continuous flow", ["Overproduction, stockpiling and expediting", "Recruiting, payroll and promotion", "Only inspection, rework and storage"], "The definition names these three interdependent elements."),
    ("foundation", "jit-foundation", 1, "What foundation does the definition name for JIT?", "Heijunka, or production levelling", ["Unlimited finished-goods storage", "Always producing the largest batch", "Ignoring demand variation"], "Levelling provides the stated foundation."),
    ("quantity", "jit-purpose", 3, "A downstream process needs 40 units tomorrow. Which plan best matches the stated JIT principle?", "Arrange 40 needed units for the required time", ["Send 400 units now solely to keep machines busy", "Send any product with spare stock", "Deliver 40 only after the downstream process stops"], "Both required quantity and timing matter."),
    ("one-element", "jit-elements", 3, "A team installs pull signals but ignores takt time and flow. How complete is that implementation against this definition?", "It addresses one element, not the whole stated system", ["It guarantees complete JIT", "It eliminates the need for levelling", "It makes demand irrelevant"], "The definition combines several operating elements."),
    ("goal", "jit-purpose", 3, "A change lowers stock but creates more defects and longer delivery times. Is lower stock alone enough to show the JIT aim was achieved?", "No: quality, resource use and lead time also matter", ["Yes: inventory is the only consideration", "Yes: defects are a required outcome", "Yes: delivery timing does not matter"], "The stated aim includes quality, cost/resources and lead time."),
], "", ("Just-in-Time Production",))

_bank(["career-resource-3e9dbe524b6c4cfaf995"],
      "https://www.lean.org/lexicon-terms/value-stream-mapping/", ["supply-chain"],
      "Current/future-state mapping, material and information flows, system perspective, cycle versus lead time and pitch arithmetic.", [
    ("flows", "vsm-scope", 1, "What flows should a value-stream map consider?", "Both material and information", ["Only departmental budgets", "Only finished goods after shipping", "Only staff attendance"], "Production instructions and material movement are linked."),
    ("current", "vsm-state", 1, "What should the current-state map capture?", "The actual condition of the value stream", ["Only the desired future arrangement", "Only the official organisation chart", "An ideal process with all delays hidden"], "Current-state mapping starts from actual flow."),
    ("future", "vsm-state", 2, "What is a future-state map?", "A target for how the material and information should flow", ["A historical financial statement", "Proof improvements are already implemented", "Only an equipment purchase list"], "The future state describes the intended improved flow."),
    ("whole", "vsm-system", 3, "One station produces faster but work piles up before the next station. What should VSM analysis examine?", "The effect on the whole value stream", ["Only the fast station's output count", "Only its local utilisation", "Ignore all downstream waiting"], "System flow matters more than isolated local optimisation."),
    ("time", "vsm-time", 3, "A part needs 30 seconds of repeated operator work but takes two days to traverse the stream. Which is the end-to-end measure?", "Lead time", ["Only operator cycle time", "Only machine changeover time", "Only uptime percentage"], "Lead time includes the journey through the stream."),
    ("pitch", "vsm-pitch", 3, "Takt time is 24 seconds per part and a container holds 15 parts. What is the pitch for one container?", "6 minutes", ["24 minutes", "15 seconds", "1.6 seconds"], "24 × 15 = 360 seconds, or 6 minutes."),
], "", ("Value-Stream Mapping", "Guideline #6", "Value-Stream Map Zones"))

_bank(["career-resource-194927714ef79e921ab4"],
      "https://developers.google.com/search/docs/fundamentals/seo-starter-guide", ["marketing"],
      "People-first content, readable URLs, descriptive links/alt text and duplicate-page handling; no ranking guarantee.", [
    ("people", "seo-content", 1, "What kind of content does the starter guide prioritise?", "Helpful, reliable content written for people", ["Repeated keywords without useful information", "Copied pages with a new logo", "Text hidden from visitors solely for ranking"], "Useful content serves the visitor's needs."),
    ("url", "seo-structure", 2, "Which product URL is more descriptive to a reader?", "/tools/hand-saw", ["/p/883902", "/x/7/991", "/item?id=93842"], "Descriptive words communicate the page's subject."),
    ("alt", "seo-images", 1, "What should image alt text describe?", "Relevant image content in its page context", ["Use the image filename", "Describe the page's sales pitch without explaining what the image conveys", "List every visible object without considering why the image is there"], "Useful descriptions help explain the image."),
    ("duplicate", "seo-canonical", 3, "Two URLs display the same article. Which action helps identify the preferred version?", "Use a suitable redirect or canonical indication", ["Match the page titles", "Create a third version so search engines can choose from more copies", "Remove the heading from one copy and rely on title length to signal preference"], "The guide describes redirects and canonical links for duplicates."),
    ("link-text", "seo-links", 3, "A guide links to delivery information. Which link text communicates its destination best?", "Delivery times and charges", ["Shipping policy", "Read the full customer information guide", "Policies for online orders and product support"], "Descriptive link text helps readers and search engines understand the target."),
    ("quality", "seo-content", 3, "An old guide is inaccurate but repeats target keywords many times. What change best follows the starter guide?", "Update the facts and organise the guide for readers", ["Repeat the target keywords", "Publish a second version using the same inaccurate material", "Put a prompt before the guide and defer corrections to a later update"], "Accuracy and usefulness matter more than keyword repetition."),
], "#make-your-site-interesting", ("Make your site interesting and useful", "Reduce duplicate content", "Write good link text", "Add descriptive alt text to the image"))

_bank(["career-resource-3dff723b260c0aa59184"],
      "https://www.cips.org/intelligence-hub/procurement/procurement-supply-cycle", ["procurement"],
      "Public procurement-cycle guidance on defining needs, market analysis, stakeholder input and agreed performance review.", [
    ("need", "procurement-needs", 1, "What should begin the procurement cycle?", "Define the business need and specification", ["Award a contract before clarifying the need", "Start paying a preferred supplier", "Select a brand before consulting users"], "The specification should follow the actual need."),
    ("cross-functional", "procurement-stakeholders", 2, "Why involve different business functions in specification development?", "To incorporate relevant expertise and requirements", ["To avoid recording constraints", "To guarantee every suggested feature is purchased", "To let one supplier define all requirements"], "Early input reveals needs and potential conflicts."),
    ("market", "procurement-market", 1, "What does market analysis help assess?", "Available supply options and competition", ["Only last month's invoice total", "Only one supplier's promotional claim", "Only the internal approval signature"], "Market analysis informs sourcing and make-or-buy decisions."),
    ("sole-source", "procurement-market", 3, "A service depends on one supplier. Which question is relevant before setting the sourcing strategy?", "Could alternative supply or an in-house option reduce the dependency?", ["Can the dependency be ignored because the supplier is familiar?", "Should the specification be hidden from users?", "Can performance measures be omitted?"], "Supply options and dependency risk should inform the plan."),
    ("kpi", "procurement-performance", 3, "A contract promises improvement but has no agreed performance measures. What should be established?", "Measurable KPIs agreed by both parties", ["A general promise to try harder only", "A score changed after each review", "A private buyer-only target never shared"], "Agreed KPIs provide a basis for review."),
    ("review", "procurement-performance", 3, "A review finds repeated delivery delays. What best follows the cycle's improvement guidance?", "Agree actions, timescales and a next review", ["Record the issue without any follow-up", "Wait until the contract ends without discussion", "Change the target silently to match poor delivery"], "Review should lead to explicit improvement actions."),
], "#procurementcycle-1", ("Define Business Needs and Develop Specification", "Market Analysis and Make or Buy Decision", "Contract Performance and Improvement"))

_bank(["career-resource-5e98cbac41cd423734d1"],
      "https://www.cips.org/intelligence-hub/managing-suppliers/supplier-evaluation", ["procurement"],
      "Desk, field and third-party appraisal; evidence-based criteria and continued supplier performance evaluation.", [
    ("desk", "supplier-methods", 1, "Reviewing product data sheets and published test reports is which evaluation method?", "Desk appraisal", ["A site audit", "An observed production trial", "A warehouse stock count"], "Desk appraisal uses existing information."),
    ("field", "supplier-methods", 2, "Visiting a supplier's premises for an audit is which method?", "Field research", ["Desk appraisal alone", "Only reading a catalogue", "Only receiving a quotation"], "A site visit gathers direct field evidence."),
    ("continuous", "supplier-monitoring", 1, "Does supplier evaluation end once a supplier is selected?", "No. Monitor performance after selection.", ["Yes, after contract signing", "Yes, if the initial evaluation used an independent assessor", "Yes, if the contract already lists delivery and quality requirements"], "Evaluation continues into the relationship."),
    ("risk-evidence", "supplier-methods", 3, "A high-value, high-risk supplier has only provided a sales catalogue. Which additional method best investigates its operations directly?", "A suitable field visit and audit", ["Reread the same catalogue only", "Treat its unverified sales claim as an independent appraisal", "Skip evaluation because the price is low"], "Direct field research can support higher-risk decisions."),
    ("criteria", "supplier-selection", 3, "Three suppliers make different marketing claims. What should be set before narrowing the options?", "Shared criteria and required evidence", ["A preferred bidder before reviewing evidence", "Separate criteria for each supplier after seeing their claims", "A shortlist based on presentation order before setting requirements"], "Consistent criteria make evidence comparable."),
    ("third-party", "supplier-methods", 3, "An independent agency certifies a supplier against an appropriate standard. What kind of input is this?", "Third-party appraisal", ["The buyer's own site visit", "An unverified supplier self-description", "Only an invoice approval"], "The appraisal comes from an external evaluating party."),
], "#item-block-1", ("Desk appraisal", "Field research", "Third-party appraisals", "Supplier evaluation best practices"))

_bank(["career-resource-91096a7c853f136ac291"],
      "https://www.unops.org/business-opportunities/supplier-resource-centre", ["procurement"],
      "Public supplier-centre instruction on fair competition, tender requirements and evaluation evidence. Numerical thresholds, contract-law claims and live procurement advice excluded.", [
    ("value", "unops-principles", 1, "Does best value for money mean selecting price alone regardless of quality?", "No, quality and suitability also matter", ["Yes, technical acceptability is irrelevant", "Yes, requirements are optional", "Yes, the smallest number always wins"], "The centre pairs value with quality and relevant requirements."),
    ("open", "unops-competition", 2, "What distinguishes open competition in the centre's description?", "It is open to all suppliers", ["Only one named supplier may participate", "Only an unpublished shortlist may respond", "No submissions are evaluated"], "Open competition permits broad supplier participation."),
    ("criteria", "unops-tender", 1, "Which tender information explains how an offer will be assessed?", "Evaluation criteria", ["Only the supplier's advertising", "Only the organisation's history", "Only the award announcement after selection"], "Published criteria describe assessment requirements."),
    ("complex", "unops-solicitation", 3, "A fictional tender requests technical and financial proposals for a complex solution. Which described format fits?", "Request for Proposal", ["A simple price quotation only", "A delivery receipt", "An invoice for completed work"], "An RFP considers technical and financial proposals."),
    ("compliance", "unops-tender", 3, "A low-priced offer does not meet a tender's stated technical requirements. What is wrong with choosing it solely for price?", "Price does not establish technical acceptability", ["Low price automatically overrides every requirement", "Requirements apply only to expensive bids", "Technical evidence is never part of procurement"], "An offer must be considered against the stated evaluation conditions."),
    ("submission", "unops-tender", 3, "Before submitting a bid, what should a supplier verify together?", "Deadline, requirements, evaluation criteria and submission format", ["Only its own preferred delivery date", "Only the first page's headline", "Only the lowest competitor price it has heard"], "These details determine whether the submission addresses the tender."),
], "", ("How we procure", "The procurement process", "Key information in UNOPS tender notices documents"))

_bank(["career-resource-40c456285c52dc90ca48"],
      "https://www.atlassian.com/team-playbook/plays/stakeholder-communications-plan", ["account-management"],
      "Stakeholder-specific information, channel, frequency and ownership in a communication plan; not a complete account strategy course.", [
    ("audience", "stakeholder-needs", 1, "Should every stakeholder necessarily receive the same level of detail?", "No, information needs differ", ["Yes, all need every working note", "Yes, only one channel can ever be used", "Yes, everyone must receive every task notification"], "Contributors and beneficiaries can need different information."),
    ("table", "stakeholder-plan", 2, "Which combination belongs in a stakeholder communication plan?", "Audience, message, channel, timing and owner", ["Audience and contact list", "Budget, project risks, milestones, approvals and resource assignments", "Message templates, meeting rooms and availability with no named owner"], "A usable plan explains who receives what, how and when."),
    ("ownership", "stakeholder-plan", 1, "Why assign an owner to planned communication?", "Make someone accountable for sending it", ["Restrict who can read updates", "Allow each update to be sent at any time without an agreed schedule", "Assign every update to the most senior stakeholder, regardless of audience"], "Ownership turns a plan into accountable action."),
    ("beneficiary", "stakeholder-needs", 3, "A partner needs project milestones and important changes but does not perform daily tasks. Which update best fits?", "A short status with decisions and relevant links", ["A raw task export", "A daily feed of every internal comment and dependency change", "An unfiltered activity report that requires reading all the technical logs"], "Beneficiaries often need an accessible overview rather than every working detail."),
    ("contributor", "stakeholder-needs", 3, "A contributor must resolve dependencies daily. What communication is most useful?", "Current dependencies, decisions and task details", ["Quarterly executive summary", "A detailed recap after the project closes, without current blockers", "Milestone updates that omit changes to the contributor's dependencies"], "Daily contributors need information enabling their work."),
    ("expectations", "stakeholder-engagement", 3, "A project asks a customer for input without saying when or why. What should the communication clarify?", "What input is needed, by when and why", ["The project team's full schedule", "The whole backlog without identifying which decision needs the customer's input", "A reminder of general goals that leaves the response deadline open"], "Clear expectations help stakeholders participate usefully."),
], "#stakeholder-communications1", ("Fill out the stakeholder project communication table", "Start communication and set expectations"))

_bank(["career-resource-c9c9f1f734811b6816ea"],
      "https://opentextbc.ca/introtourism2e/chapter/operations/", ["hospitality"],
      "Hotel front-office, reservations and housekeeping coordination as described in the chapter; responsibilities can vary across properties.", [
    ("front-desk", "hotel-front-office", 1, "In the chapter's hotel model, who processes guest arrivals and departures?", "Front desk agents", ["Only the purchasing team", "Only off-site travel agents", "Only the catering chef"], "Arrivals, departures and room assignments are front-office functions."),
    ("room-attendant", "hotel-housekeeping", 1, "What is a room attendant's core task?", "Clean guest rooms using operating procedures", ["Negotiate every hotel sales contract", "Prepare all guest invoices for tax filing", "Design the hotel's marketing strategy"], "Room attendants perform day-to-day guest-room cleaning."),
    ("reservations", "hotel-reservations", 2, "What can a reservations agent help a guest book besides a room?", "Available amenities and activities", ["Only a completed housekeeping audit", "Only staff work shifts", "Only inventory purchases for the kitchen"], "Reservations can connect guests with other property services."),
    ("public-areas", "hotel-housekeeping", 3, "A property's lobby and public restrooms need routine cleaning. Which described housekeeping role covers these areas?", "House persons", ["Reservations agents", "Sales directors", "Front-office cashiers only"], "House persons clean public areas and support linen delivery."),
    ("standards", "hotel-housekeeping", 3, "Room-cleaning quality varies between shifts. Which described management activity checks standards?", "Regular room audits and inspections", ["Only increasing promotional posts", "Only changing reservation prices", "Only counting inbound calls"], "Housekeeping inspections assess compliance with room standards."),
    ("assignments", "hotel-front-office", 3, "A guest arrives and needs a room assignment plus a response to a request. Which function should coordinate the arrival?", "The front office", ["Housekeeping alone", "Reservations alone without front-office coordination", "Catering and conference services alone"], "The front office coordinates room assignments and guest requests."),
], "", ("Front Office", "Housekeeping", "Reservations"))

SUCCESS_COMMUNICATION = _new(
    "https://opentextbc.ca/introtourism2e/chapter/communication-strategies/", "success",
    "Listening and recovery after a service failure", "BCcampus Open Education",
    "Open introductory instruction on listening, understanding customer needs, service recovery and following up after complaints. Cases focus on service encounters rather than enterprise retention modelling.")
_bank(["career-resource-e30cda6088b0c7a99347", SUCCESS_COMMUNICATION],
      "https://opentextbc.ca/introtourism2e/chapter/communication-strategies/", ["hospitality", "success"],
      "Listening and clarifying customer needs, resolving service failures and following up; no universal NPS thresholds or claim of complete customer-success mastery.", [
    ("listen", "service-understanding", 1, "What should come before deciding how to help a customer?", "Listen and understand the customer's need", ["Assume everyone wants the same solution", "Offer compensation before hearing the concern", "End the conversation immediately"], "Listening and understanding guide a suitable response."),
    ("recovery", "service-recovery", 1, "What is service recovery?", "Action aimed at restoring satisfaction after a service failure", ["Only attracting customers before any service", "Only setting next year's prices", "Only counting website visits"], "Recovery responds to a failed service experience."),
    ("empower", "service-preference", 2, "Can good service include helping a customer act independently?", "Yes, if that suits the customer's preference", ["No, staff must always do everything", "Only if the customer stops asking questions", "No, self-directed options are always poor service"], "Some customers prefer tools or information to act themselves."),
    ("clarify", "service-understanding", 3, "A guest asks for a quiet place but gives no other details. What helps avoid the wrong recommendation?", "Ask relevant questions about what they need", ["Choose the most expensive option automatically", "Assume quiet means the largest room", "Ignore the request because it is incomplete"], "Clarification helps match the response to the actual need."),
    ("complaint", "service-recovery", 3, "A customer reports a missed service. Which response best supports recovery?", "Hear the concern, acknowledge it and work toward a suitable resolution", ["Argue before checking what happened", "Promise an unauthorised remedy you cannot deliver", "Treat a discount as a substitute for listening"], "Professional handling matters as well as the original failure."),
    ("followup", "service-recovery", 3, "A promised remedy has been arranged. What useful step completes the recovery effort?", "Follow up to check the problem was resolved", ["Assume the promise alone restored satisfaction", "Delete the complaint immediately", "Avoid all further contact regardless of the outcome"], "Follow-up checks whether the response actually helped."),
], "", ("Listening, Understanding, Delivering", "Recovery from Service Failures"))

ACCOUNTS_UNIT = _new(
    "https://trailhead.salesforce.com/content/learn/modules/accounts_contacts_lightning_experience/accounts-and-contacts-lightning", "account-management",
    "Store information about customers: accounts and contacts", "Salesforce Trailhead",
    "Public instructional unit explaining business accounts, related contacts, interaction records and naming conventions. The reading is open; an optional hands-on playground challenge requires a Salesforce account.")
_bank([ACCOUNTS_UNIT], NEW_RESOURCES[-1]["url"], ["account-management"],
      "The public reading's business-account/contact relationship, activity records and duplicate-aware naming; no Salesforce login or paid software needed for these knowledge checks.", [
    ("account", "crm-record-types", 1, "In the unit's business-to-business model, what does a business account record represent?", "A company the business works with", ["An individual contact", "A particular sales opportunity linked to a customer", "A record of a completed call with a person at a company"], "Business accounts hold company information."),
    ("contact", "crm-record-types", 1, "What does a contact linked to a business account represent?", "A person associated with the company", ["A sales opportunity", "A record of the company's wider account hierarchy", "An activity record describing a conversation with the company"], "Contacts store information about people."),
    ("activity", "crm-interactions", 2, "Why record customer interactions?", "Share prior discussions and next steps", ["Track purchases only", "Record every interaction under a new company so each call stands alone", "Replace the account history with a summary of the latest sale"], "Shared interaction history supports continuity."),
    ("two-people", "crm-relationships", 3, "Two people work for the same customer company. Which records fit the unit's model?", "One business account with two related contacts", ["Two unrelated company accounts with no contacts", "One contact representing the whole company and both people", "Only two unlinked phone-call records"], "The company is an account; each person has a contact record."),
    ("log-call", "crm-interactions", 3, "A customer call agrees a new follow-up date. What should the representative record?", "Log the call and follow-up date on the relevant record", ["Keep the date in private notes", "Create a new company record to represent the call without linking it to the account", "Change the account name to the follow-up date instead of logging the activity"], "Accurate activity history makes the interaction visible to colleagues."),
    ("naming", "crm-relationships", 3, "A company may already exist under the organisation's naming convention. What should be checked before adding it?", "Search existing records and check naming rules", ["Check that the form saves", "Create a record under a different spelling before searching for the existing company", "Search only for the caller's given name and assume the company is new"], "Naming conventions help identify existing records and avoid duplication."),
], "#th-unit-content", ("What are Accounts and Contacts?", "Track Your Customer Interactions", "Best Practices for Managing Accounts and Contacts"))

EVENT_MANAGEMENT = _new(
    "https://www.hse.gov.uk/event-safety/managing-an-event.htm", "events",
    "Managing an event: coordination, briefings and monitoring", "UK Health and Safety Executive",
    "Open event-management guidance on build-up and breakdown, coordinating contractors, site information, competence and checking risk controls. Introductory operational knowledge; not a legal compliance certificate.")
_bank([EVENT_MANAGEMENT], NEW_RESOURCES[-1]["url"], ["events"],
      "General event-operation coordination and monitoring in HSE guidance. No statutory interpretation, specialist safety instruction or safety certification.", [
    ("phases", "event-phases", 1, "Which event phases need safety management as well as the public period?", "Build-up, load-in, breakdown and load-out", ["Ticket sales and publicity", "Entry, seating, concessions and other parts of the public session only", "Advance booking and planning meetings without considering work on the site"], "Work before and after attendance can involve substantial risks."),
    ("briefing", "event-information", 1, "What belongs in a site induction?", "Site hazards, controls and emergency arrangements", ["Shift and break times alone", "Venue directions and role assignments without discussing site risks", "The public timetable and contractor work schedule without site safety information"], "People need practical information to work safely."),
    ("competence", "event-competence", 2, "What should guide the level of competent supervision?", "The risk, work and people involved", ["Only the number of tickets sold", "Only the event's budget category", "Only whether the public has already arrived"], "Supervision should be proportionate to the work and risks."),
    ("coordinate", "event-coordination", 3, "Two contractors plan conflicting work in the same area. What should event coordination establish?", "Phase the work using the contractors' risk assessments", ["Confirm the delivery times separately", "Leave each contractor to follow its own schedule without reviewing interactions", "Rely on the separate contracts to address work occurring in the same area"], "Coordinating activities addresses risks from overlapping work."),
    ("checks", "event-monitoring", 3, "A risk assessment names controls but gives no checking schedule. What should it specify?", "Who checks, how often and how", ["Who ordered the equipment", "The opening time and the expected number of visitors for every session", "The broad safety policy without a person, schedule or method for checks"], "Monitoring needs clear responsibility, frequency and method."),
    ("operations", "event-monitoring", 3, "Once site work starts, an organiser keeps updating paperwork but never checks operations. What is missing?", "Manage and monitor the work on site", ["Revise the written plan alone", "Record that the plan was distributed without checking what happens during the work", "Wait to review the contractor reports until all site work has finished"], "Written plans need to be implemented and checked in operation."),
], "#page-contents", ("Management", "Co-ordination", "Information", "Monitoring and review"))

SELLING_PROCESS = _new(
    "https://openstax.org/books/principles-marketing/pages/15-3-steps-in-the-personal-selling-process", "sales",
    "Personal selling: qualification, needs and follow-up", "OpenStax",
    "Open instructional section on prospect qualification, preparation, needs-based presentations, handling concerns and follow-up. Original short checks use new fictional situations and do not reproduce publisher assessments.")
_bank([SELLING_PROCESS], NEW_RESOURCES[-1]["url"], ["sales"],
      "General qualification, pre-approach research, needs-based presentation, listening to objections and post-sale follow-up; not a sales certification.", [
    ("qualification", "selling-qualify", 1, "Why qualify a lead rather than treat every name as equally suitable?", "Check the lead's fit, readiness and ability to buy", ["Estimate the order value only", "Treat every lead as equally suitable and reserve fit questions for after the sale", "Prioritise the oldest records regardless of the prospect's needs or buying ability"], "Not every prospect is a suitable potential customer."),
    ("preparation", "selling-prepare", 2, "What is the role of pre-approach research?", "Research the prospect to plan a relevant approach", ["Prepare a standard product pitch", "Send the same proposal to every prospect before learning how they make decisions", "Set the final offer using the seller's priorities without checking the prospect's situation"], "Preparation improves the fit of the later conversation."),
    ("follow-up", "selling-followup", 1, "Why follow up after an order?", "Support delivery and the ongoing relationship", ["Seek the next order immediately", "Treat placing the order as the end of support unless the prospect buys again", "Ask for a referral before checking whether the delivery met expectations"], "Post-sale contact helps ensure the sale progresses smoothly."),
    ("needs-demo", "selling-needs", 3, "A workshop wants fewer booking errors. Which presentation best uses a needs/satisfaction approach?", "Ask about bookings and show relevant fixes", ["Give a standard feature tour", "Present a pricing comparison before asking what errors staff encounter", "Demonstrate more expensive add-ons unrelated to the booking workflow"], "The presentation should connect the solution to the discovered need."),
    ("objection", "selling-concerns", 3, "A prospect says the proposal may not fit its process. What is the useful response?", "Restate the concern and ask what does not fit", ["Repeat the proposed price", "Offer a discount without finding out why the prospect sees a process mismatch", "Promise a customisation before checking whether it is needed or available"], "Clarification helps respond to the actual objection."),
    ("adapt", "selling-needs", 3, "Two prospects have different service needs. What does adaptive selling call for?", "Adjust the approach to each prospect's needs", ["Use an identical script regardless of the evidence", "Ignore new information once preparation ends", "Select a solution only from the seller's preference"], "An adaptive approach responds to the customer's situation."),
], "", ("Step 1: Prospecting and Qualifying", "Step 2: Pre-approach", "Step 4: Presentation", "Step 5: Handling Objections", "Step 7: Follow-Up"))


def _guide(ids, url, topics, reason, children=(), kind="orientation"):
    ORIENTATIONS.append({"resource_ids": ids, "url": url, "topics": topics,
                         "reviewed_at": REVIEWED_AT, "reason": reason,
                         "child_resource_ids": list(children), "kind": kind})


_guide(["career-resource-6235acea9fd6cd99437e"],
       "https://trailhead.salesforce.com/content/learn/modules/accounts_contacts_lightning_experience", ["account-management"],
       "The module landing page shows its description, points, skills and links to units rather than the instructional text. The public Store Information About Your Customers child unit was separately reviewed and receives the checks.", [ACCOUNTS_UNIT])
_guide(["career-resource-2bf2b9ef5c165605b608", "career-resource-6050421d8b173b9ccb90"],
       "https://academy.hubspot.com/courses/hubspot-service-software", ["account-management", "success"],
       "The public page shows a Service Hub course overview, objectives and lesson curriculum with Start course/sign-up controls. It also states certification practicals require a Pro or Enterprise subscription. No full software instruction or account access was used for a proficiency quiz.", [ACCOUNTS_UNIT, SUCCESS_COMMUNICATION])
_guide(["career-resource-a8434ccf2ed49ef540f9"],
       "https://openstax.org/books/principles-financial-accounting/pages/1-why-it-matters", ["accounting"],
       "The page introduces the chapter through a career vignette and lists the chapter outline. It does not teach journal-entry or statement-preparation procedures. The existing detailed section on statement elements has its own bounded checks.", ["career-resource-885b19429d4477e02bed"])
_guide(["career-resource-c43ed057dfdb5fac89fd"],
       "https://openstax.org/books/principles-financial-accounting/pages/4-why-it-matters", ["accounting"],
       "The page frames the adjusting-process chapter through examples of timing questions and an outline. The detailed answers and adjustment methods are in child sections, not this introduction. It is ungraded rather than testing unseen adjustment procedures.")
_guide(["career-resource-48d98aa540da4ee261c8"],
       "https://openstax.org/books/principles-management/pages/11-introduction", ["hr-operations"],
       "The public chapter introduction presents learning questions and a career vignette. It outlines HR responsibilities but does not teach the detailed selection, training or performance methods of the linked chapter sections.", ["career-resource-a50b42e3a8904f9df25c"])
_guide(["career-resource-4f32446aa47a509a4e17"],
       "https://www.cipd.org/uk/knowledge/factsheets/induction-factsheet/", ["hr-operations"],
       "The public introduction explains induction's purpose and lists intended sections, followed by an explicit To continue reading, log in or become a member boundary. The induction process/checklist is not publicly exposed in this review. No membership or gated content was accessed.")
_guide(["career-resource-4d7fdae98da8d4fd0a33"],
       "https://www.cipd.org/uk/topics/recruitment/", ["recruiting"],
       "This topic hub gives a short recruitment overview and lists factsheets, reports and insights, marking some as member content. The linked public Selection methods factsheet provides actual assessment instruction and receives its own checks.", ["career-resource-7dc843950f5df38e2316"], "reference-directory")
_guide(["career-resource-692fd21959e2286d6d1c"],
       "https://opentextbc.ca/introtourism2e/", ["hospitality"],
       "The book landing page exposes its description, downloads and table of contents. Hotel operations and communication strategies are taught in the separately reviewed chapter URLs, rather than assessed from a contents-page visit.", ["career-resource-c9c9f1f734811b6816ea", "career-resource-e30cda6088b0c7a99347"], "reference-directory")
_guide(["career-resource-8a99b09111eb85dfd02b"],
       "https://ocw.mit.edu/course-lists/transportation-logistics-and-supply-chains/", ["supply-chain"],
       "The public response exposes a Transportation: Logistics and Supply Chains collection heading and site information, without a readable lesson body. It is a course-discovery guide, not evidence of supply-chain instruction. Existing reviewed Lean instruction supplies the bounded checks.", ["career-resource-1a99e6f0c0ca5ce2fc1b", "career-resource-3e9dbe524b6c4cfaf995"], "reference-directory")
_guide(["career-resource-2ad2d6b09d9e6fc99bb7"],
       "https://www.hse.gov.uk/event-safety/running.htm", ["events"],
       "The page lists Getting started, Managing an event and Planning for incidents and emergencies. Actual coordination and monitoring instruction is on the reviewed Managing an event child page.", [EVENT_MANAGEMENT], "reference-directory")
_guide(["career-resource-13216d1a8f3646866dfe"],
       "https://www.hse.gov.uk/event-safety/health-safety-topics.htm", ["events"],
       "The page is a topic directory linking crowds, transport, structures, electrical and other safety guidance. It contains no specialist technique instruction itself. The general event-management child provides introductory operational checks, not certification in these specialist topics.", [EVENT_MANAGEMENT], "reference-directory")

for resource_id, url, topic, finding, children in [
    ("career-resource-fc830cebaa10205ed3f1", "https://academy.hubspot.com/courses/digital-marketing", "marketing",
     "The public page presents course objectives, curriculum and sign-up/start controls, not full lesson instruction or transcripts.", ["career-resource-194927714ef79e921ab4"]),
    ("career-resource-b7323e0bae5c7e69451b", "https://academy.hubspot.com/courses/email-marketing", "marketing",
     "The URL redirects to the email-marketing certification overview. The public response presents lesson summaries and enrolment controls; full email strategy instruction was not exposed.", []),
    ("career-resource-e8eedc80e0615420aedc", "https://academy.hubspot.com/courses/inbound-sales", "sales",
     "The public page lists inbound-sales curriculum, learning objectives and start/sign-up controls. These summaries do not supply the underlying methods for a source-specific proficiency test.", [SELLING_PROCESS]),
    ("career-resource-b40f1bf62bc60ee72b84", "https://academy.hubspot.com/courses/Sales-Enablement", "sales",
     "The public page presents the sales-enablement course and lesson objectives with enrolment controls, rather than full instruction on its frameworks or service-level agreements.", [SELLING_PROCESS]),
    ("career-resource-3af363d51f06e0efa77e", "https://academy.hubspot.com/courses/delivering-exceptional-customer-support", "success",
     "The public page shows customer-support lesson summaries and an introductory video preview link. The full lesson instruction/transcripts were not accessed; outcomes on this landing page are not assessed as learned methods.", [SUCCESS_COMMUNICATION]),
]:
    _guide([resource_id], url, [topic], finding, children)

for resource_id, code, topic, occupation, children in [
    ("career-resource-3333de15c00d5936d8fe", "13-1111.00", "analysis", "Management Analysts", ["career-resource-09205585873f8f296ebe", "career-resource-87499d1e1ec60bea0324"]),
    ("career-resource-c9e83f94ed6ab2b8292d", "13-1121.00", "events", "Meeting, Convention, and Event Planners", [EVENT_MANAGEMENT]),
    ("career-resource-3d8b99d3bfb64bc91fca", "13-1081.00", "inventory", "Logisticians", ["career-resource-bf5907b7fb6a33f6aee8", "career-resource-3206b0a4499800dbed77"]),
    ("career-resource-92c0b5216c6518077d8b", "13-1082.00", "projects", "Project Management Specialists", ["career-resource-4a5e1f70f6f28e160f76", "career-resource-fdff649e8ef4a980c759"]),
    ("career-resource-63095607c61d302f0758", "13-1071.00", "recruiting", "Human Resources Specialists", ["career-resource-7dc843950f5df38e2316"]),
    ("career-resource-af992b76f66568b241b9", "41-3091.00", "sales", "Sales Representatives of Services", [SELLING_PROCESS]),
    ("career-resource-10f59c55d3dee15b53c7", "43-4051.00", "success", "Customer Service Representatives", [SUCCESS_COMMUNICATION]),
]:
    _guide([resource_id], "https://www.onetonline.org/link/summary/" + code, [topic],
           "The public O*NET summary for " + occupation + " describes occupation tasks, skills, work activities and career information. It identifies what work involves; it does not teach how to perform those methods. Job-title/task recognition is not used as proficiency evidence.",
           children, "career-context")
