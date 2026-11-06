"""Reproducible original assessment pack and link-only learning catalogue."""
from __future__ import annotations
import hashlib
import json
import random
from collections import Counter
from pathlib import Path
from ml.career_question_bank import BANK

ROOT = Path(__file__).resolve().parent
DEST = ROOT / "data/careers"

# Descriptions are original summaries. No third-party course bodies or exams are
# copied into the pack. Some providers require their own free learner account.
REFERENCES = {
"git": [
("About version control", "https://git-scm.com/book/en/v2/Getting-Started-About-Version-Control", "Pro Git", "Understand version history, collaboration and repository concepts."),
("Recording changes to a repository", "https://git-scm.com/book/en/v2/Git-Basics-Recording-Changes-to-the-Repository", "Pro Git", "Inspect changes, stage a focused change and record a commit."),
("Basic branching and merging", "https://git-scm.com/book/en/v2/Git-Branching-Basic-Branching-and-Merging", "Pro Git", "Work with branches and deliberate conflict resolution."),
],
"algorithms": [
("Python data structures", "https://docs.python.org/3/tutorial/datastructures.html", "Python documentation", "Explore lists, stacks, queues and structured data operations."),
("Binary search with bisect", "https://docs.python.org/3/library/bisect.html", "Python documentation", "Understand searching sorted sequences and insertion trade-offs."),
("Heap queues", "https://docs.python.org/3/library/heapq.html", "Python documentation", "Explore heap order, priority queues and efficient access to an extreme value."),
],
"api": [
("Overview of HTTP", "https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Overview", "MDN Web Docs", "Understand requests, responses and the HTTP client-server model."),
("HTTP request methods", "https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Methods", "MDN Web Docs", "Compare retrieval, creation, replacement and other method semantics."),
("HTTP response status codes", "https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status", "MDN Web Docs", "Interpret response classes and common application status codes."),
],
"testing": [
("Get started with pytest", "https://docs.pytest.org/en/stable/getting-started.html", "pytest", "Practice arranging tests, executing behavior and checking expectations."),
("End-to-end testing best practices", "https://playwright.dev/docs/best-practices", "Playwright", "Learn isolation, reliable locators and tests of observable behavior."),
("Writing assertions", "https://playwright.dev/docs/test-assertions", "Playwright", "Use meaningful assertions and appropriate waiting for browser behavior."),
],
"linux": [
("The Linux command line for beginners", "https://ubuntu.com/tutorials/command-line-for-beginners", "Ubuntu", "Navigate directories, manage files and compose simple commands."),
("File permissions", "https://www.gnu.org/software/coreutils/manual/html_node/File-permissions.html", "GNU", "Understand read, write and execute permissions and their scope."),
("Bash pipelines", "https://www.gnu.org/software/bash/manual/html_node/Pipelines.html", "GNU", "Connect commands and understand pipeline execution."),
],
"networking": [
("Networking Basics", "https://www.netacad.com/courses/networking-basics", "Cisco Networking Academy", "Study network components, connectivity and basic troubleshooting. Provider account may be required."),
("Fundamentals of computer networking", "https://learn.microsoft.com/en-us/training/modules/network-fundamentals/", "Microsoft Learn", "Study TCP/IP, DNS, ports and the principles of network communication."),
("Virtual network fundamentals", "https://learn.microsoft.com/en-us/azure/virtual-network/virtual-networks-overview", "Microsoft Learn", "Explore networks, subnets and routing using an Azure example."),
],
"cloud": [
("Describe cloud computing", "https://learn.microsoft.com/en-us/training/modules/describe-cloud-compute/", "Microsoft Learn", "Explore service models, shared responsibility and cloud operating concepts."),
("Shared responsibility model", "https://aws.amazon.com/compliance/shared-responsibility-model/", "AWS", "Distinguish provider responsibilities from application and customer responsibilities."),
("Benefits of cloud services", "https://learn.microsoft.com/en-us/training/modules/describe-benefits-use-cloud-services/", "Microsoft Learn", "Review availability, scalability, reliability and cloud operating trade-offs."),
],
"security": [
("Authorization guidance", "https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html", "OWASP", "Study least privilege and permission checks for protected actions and records."),
("Authentication guidance", "https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html", "OWASP", "Understand identity checks, authentication controls and session protection."),
("Introduction to Cybersecurity", "https://www.netacad.com/courses/introduction-to-cybersecurity", "Cisco Networking Academy", "Learn security concepts and common threats. Provider account may be required."),
],
"marketing": [
("Digital Marketing", "https://academy.hubspot.com/courses/digital-marketing", "HubSpot Academy", "Plan audience-focused campaigns and their measurement. Free provider account may be required."),
("Search Engine Optimization Starter Guide", "https://developers.google.com/search/docs/fundamentals/seo-starter-guide", "Google Search Central", "Understand discoverable, useful web content and search fundamentals."),
("Email Marketing", "https://academy.hubspot.com/courses/email-marketing", "HubSpot Academy", "Explore audience relevance, useful email campaigns and measurement. Free provider account may be required."),
],
"recruiting": [
("Selection methods", "https://www.cipd.org/uk/knowledge/factsheets/selection-factsheet/", "CIPD", "Compare structured interviews, work samples and evidence-based candidate assessment. Some linked material is member-only; local rules vary."),
("Recruitment resources", "https://www.cipd.org/uk/topics/recruitment/", "CIPD", "Explore role definition, sourcing and selection. Some linked material is member-only; this is not country-specific legal training."),
("Human Resources Specialists: occupation overview", "https://www.onetonline.org/link/summary/13-1071.00", "O*NET OnLine", "Review related work activities and occupational context. This is a career reference, not an assessment course."),
],
"sales": [
("Inbound Sales", "https://academy.hubspot.com/courses/inbound-sales", "HubSpot Academy", "Practice customer discovery, qualification and relevant conversations. Free provider account may be required."),
("Sales Enablement", "https://academy.hubspot.com/courses/Sales-Enablement", "HubSpot Academy", "Connect sales processes, customer needs and useful handoffs. Free provider account may be required."),
("Sales representatives: occupation overview", "https://www.onetonline.org/link/summary/41-3091.00", "O*NET OnLine", "Explore tasks and skills in the related occupation. This is a career reference."),
],
"success": [
("Delivering exceptional customer support", "https://academy.hubspot.com/courses/delivering-exceptional-customer-support", "HubSpot Academy", "Explore customer understanding, support processes and communication. Free provider account may be required."),
("Service Hub software", "https://academy.hubspot.com/courses/hubspot-service-software", "HubSpot Academy", "Explore organizing service work, reporting and customer context. Provider software access may be needed for some exercises."),
("Customer service representatives: occupation overview", "https://www.onetonline.org/link/summary/43-4051.00", "O*NET OnLine", "Review related service activities and capabilities. This is a career reference."),
],
"projects": [
("Project risk management", "https://www.atlassian.com/work-management/project-management/project-risk-management", "Atlassian", "Identify risks, assess impacts and plan owned responses."),
("Project scope", "https://www.atlassian.com/work-management/project-management/project-scope", "Atlassian", "Define project boundaries, deliverables and change expectations."),
("Project Management Specialists: occupation overview", "https://www.onetonline.org/link/summary/13-1082.00", "O*NET OnLine", "Review project coordination activities and skills. This is a career reference."),
],
"accounting": [
("Financial accounting foundations", "https://openstax.org/books/principles-financial-accounting/pages/1-why-it-matters", "OpenStax", "Study introductory accounting concepts using the linked open textbook. Practice questions in VoidFill are original, not its exam items."),
("Elements of financial statements", "https://openstax.org/books/principles-financial-accounting/pages/2-2-define-explain-and-provide-examples-of-current-and-noncurrent-assets-current-and-noncurrent-liabilities-equity-revenues-and-expenses", "OpenStax", "Review assets, liabilities, equity, revenues and expenses."),
("Accounting adjustments and period-end foundations", "https://openstax.org/books/principles-financial-accounting/pages/4-why-it-matters", "OpenStax", "Explore why accounting adjustments matter. Country-specific tax, payroll and professional qualification rules are outside this pack."),
],
"spreadsheets": [
("Create and use pivot tables", "https://support.google.com/docs/answer/1272900?hl=en", "Google Docs Editors Help", "Summarize structured data with categories, values and filters."),
("Google Sheets function list", "https://support.google.com/docs/table/25273?hl=en", "Google Docs Editors Help", "Look up arithmetic, conditional, counting and lookup functions."),
("Overview of formulas in Excel", "https://support.microsoft.com/en-us/office/overview-of-formulas-in-excel-ecfdc708-9162-49e8-b993-c311f47ca173", "Microsoft Support", "Understand formulas, operators and cell references."),
],
"communication": [
("Active listening", "https://www.skillsbuilder.org/global/universal-framework-steps/listening-step-7-active-listening", "Skills Builder Partnership", "Reflect on listening, checking understanding and responding to another person's message."),
("Working agreements", "https://www.atlassian.com/team-playbook/plays/working-agreements", "Atlassian Team Playbook", "Agree how a team communicates and works together."),
("Roles and responsibilities", "https://www.atlassian.com/team-playbook/plays/roles-and-responsibilities", "Atlassian Team Playbook", "Make team responsibilities and handoffs explicit."),
],
"analysis": [
("The Business Analysis Standard", "https://www.iiba.org/knowledgehub/the-business-analysis-standard/", "IIBA", "Explore the purpose and concepts of business analysis. Some downloads may require a provider account."),
("Requirements gathering", "https://www.atlassian.com/work-management/project-management/requirements-gathering", "Atlassian", "Connect stakeholder needs, requirements and verifiable outcomes."),
("Management Analysts: occupation overview", "https://www.onetonline.org/link/summary/13-1111.00", "O*NET OnLine", "Review related analysis and improvement activities. This is a career reference."),
],
}


def main():
    questions, resources = [], []
    for topic, rows in BANK.items():
        assert len(rows) >= 10, (topic, len(rows))
        for i, (prompt, answer, distractors, explanation, difficulty) in enumerate(rows):
            options = [answer, *distractors.split("|")]
            assert len(set(options)) == 4, (topic, prompt)
            identity = hashlib.sha256((topic + ":" + prompt).encode()).hexdigest()[:20]
            random.Random(identity).shuffle(options)
            questions.append({"id": "career-" + identity, "prompt": prompt, "options": options, "correct_index": options.index(answer), "explanation": explanation, "difficulty": difficulty, "topics": [topic], "source": "VoidFill original foundation item; reference: " + REFERENCES[topic][0][2], "source_url": REFERENCES[topic][0][1], "group": "career-foundations-" + topic, "evidence_type": "knowledge", "objective_id": f"{topic}-{i+1:02d}"})
        for title, url, provider, description in REFERENCES[topic]:
            identity = hashlib.sha256((topic + ":" + url).encode()).hexdigest()[:20]
            resources.append({"id": "career-resource-" + identity, "title": title, "url": url, "provider": provider, "description": description, "text": title + ". " + description, "topics": [topic], "type": "tutorial", "difficulty": "beginner", "estimated_hours": None, "source": provider + " (external link; VoidFill original summary)", "license": "Link-only reference; third-party content is not redistributed"})
    DEST.mkdir(exist_ok=True, parents=True)
    (DEST / "questions.json").write_text(json.dumps(questions, indent=2, ensure_ascii=False) + "\n", encoding="utf8")
    (DEST / "resources.json").write_text(json.dumps(resources, indent=2, ensure_ascii=False) + "\n", encoding="utf8")
    catalogue = json.loads((DEST / "catalogue.json").read_text(encoding="utf8"))
    all_questions = json.loads((ROOT / "data/questions.json").read_text(encoding="utf8")) + questions
    all_resources = json.loads((ROOT / "data/resources.json").read_text(encoding="utf8")) + resources
    counts = Counter(topic for q in all_questions for topic in q["topics"])
    resource_counts = Counter(topic for r in all_resources for topic in r["topics"])
    for skill in catalogue["skills"]:
        topic = skill["topic"]
        skill["coverage"] = {"questions": counts[topic] if topic else 0, "resources": resource_counts[topic] if topic else 0, "levels": sorted({q["difficulty"] for q in all_questions if topic and topic in q["topics"]}), "scope": "foundation knowledge; practical ability requires separate evidence" if topic else "specialist content pending; use a practical rubric and mentor discussion"}
    (DEST / "catalogue.json").write_text(json.dumps(catalogue, indent=2, ensure_ascii=False) + "\n", encoding="utf8")
    print(f"Built {len(questions)} original questions and {len(resources)} link-only resources across {len(BANK)} topics.")


if __name__ == "__main__":
    main()
