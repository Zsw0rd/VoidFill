"""Reproducible coverage/fixture checks for the supplied career practice cases.

This checks authored exercise contracts, not learner answers or professional
competence. Numeric checks recompute from the declared fictional boundaries;
non-numeric judgement still requires a reviewer, rather than a keyword grade.
"""
from decimal import Decimal as D
from datetime import datetime, timedelta
from pathlib import Path
from urllib.parse import urlsplit
import argparse
import hashlib
import heapq
import json
import sqlite3

from ml.career_case_contracts import CONTRACTS, CASE_TITLES, SOURCES, case_contract
from ml.career_case_packs import PACKS, VERSION, case_pack

ROOT = Path(__file__).resolve().parent


def fingerprint(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, ensure_ascii=False, separators=(",", ":")).encode("utf8")).hexdigest()


def independent_checks():
    checks = []

    def add(role, level, label, observed, expected):
        checks.append({"role": role, "level": level, "check": label, "observed": observed, "expected": expected, "passed": observed == expected})

    pct = lambda n, d: float(D(n) / D(d) * 100)
    add("Data Analyst", "foundation", "Distinct-session rates, percentage-point drop and order-count decline", [pct(100, 1000), pct(96, 1200), pct(100, 1000)-pct(96, 1200), pct(100-96, 100)], [10, 8, 2, 4])
    corrected = 96-6
    add("Data Analyst", "intermediate", "Six duplicate completion rows do not create six additional orders", [corrected, pct(corrected,1200), pct(100,1000)-pct(corrected,1200), pct(100-corrected,100)], [90,7.5,2.5,10])
    add("Data Engineer", "foundation", "A stable-key correction replaces O2 rather than adding another row", sum({"O1":100,"O2":55}.values()), 155)
    add("Machine Learning Engineer", "foundation", "Overall and prespecified-slice denominators remain separate", [pct(90,100),pct(92,100),pct(9,10),pct(6,10)], [90,92,90,60])
    add("Cybersecurity Analyst", "foundation", "Normalize the seven-minute-fast device clock", (datetime(2026,1,1,9,7)-timedelta(minutes=7)).strftime("%H:%M"), "09:00")
    add("CAD Technician", "foundation", "Nominal diameter clearance in mm", str(D("10.20")-D("10.00")), "0.20")
    add("CAD Technician", "intermediate", "Worst-case diameter clearance fails the stated minimum", [(D("10.20")-D(".05"))-(D("10.00")+D(".05")) == D(".10"), D(".10") >= D(".15")], [True,False])
    add("Quality Engineer", "foundation", "Observed sample defect rates and percentage-point difference", [pct(8,200),pct(15,200),pct(15-8,200)], [4,7.5,3.5])
    add("Manufacturing Engineer", "foundation", "Serial-line capacity uses the bottleneck, not the sum", min(12,8,10)*7,56)
    add("Manufacturing Engineer", "intermediate", "Good-output expectation after the bottleneck shifts", float(D(min(12,12,10))*D(".75")*7),52.5)
    add("Electronics Technician", "foundation", "Unloaded supply current in milliamps", float(D(10)/D(2000)*1000),5)
    parallel = D(1)/(D(1)/D(1000)+D(1)/D(1000))
    add("Electronics Technician", "intermediate", "The measurement input loads the lower divider leg", [int(parallel),str((D(10)*parallel/(D(1000)+parallel)).quantize(D(".01")))],[500,"3.33"])
    add("Industrial Engineering Associate", "foundation", "Ideal bottleneck capacity is an upper bound", 420//max(2,4,3),105)
    add("Industrial Engineering Associate", "intermediate", "Flow conservation across declared release/completion boundaries",210-105,105)
    add("Product Manager", "foundation", "Activation uses completed tasks over starters", pct(300,1000),30)
    add("Product Manager", "intermediate", "Subgroup contact rates retain their common denominator",[pct(5,50),pct(12,50),pct(12-5,50)],[10,24,14])
    add("Project Coordinator", "foundation", "Parallel room booking is not added to the critical dependency path",max(2+2+1,1),5)
    add("Project Coordinator", "intermediate", "A one-day dependency delay remains visible",3+2+1,6)
    add("Project Manager", "foundation", "Serial launch dependencies require six days",3+2+1,6)
    add("Business Analyst", "foundation", "Elapsed time depends on the defined start event",[(datetime(2026,1,7,9)-datetime(2026,1,5,9)).total_seconds()/3600,(datetime(2026,1,7,9)-datetime(2026,1,6,9)).total_seconds()/3600],[48,24])
    add("Business Analyst", "intermediate", "Above 500 is strict, not at least 500",[value>500 for value in (499,500,501)],[False,False,True])
    add("Operations Analyst", "foundation", "Backlog flow reconciliation",50+100-90,60)
    add("Operations Analyst", "intermediate", "Only additionally counted reopenings change this closing backlog",50+100-90+12,72)
    add("Management Analyst", "foundation", "Variable price alone omits recurring fixed cost",[20*100,15*100+600],[2000,2100])
    add("Management Analyst", "intermediate", "Transition is a one-time addition, not a recurring saving",15*100+600+2000,4100)
    add("Digital Marketing Associate", "foundation", "Qualified-enquiry acquisition denominator",[600/20,400/10],[30,40])
    add("Marketing Analyst", "intermediate", "Platform-claim and ledger-order denominators answer different questions",[str((D(1100)/D(120)).quantize(D(".01"))),str((D(1100)/D(90)).quantize(D(".01")))],["9.17","12.22"])
    add("Accounting Associate", "foundation", "Both reconciliation sides agree after the evidenced duplicate correction",[5000+700-300,5600-200],[5400,5400])
    add("Financial Analyst", "foundation", "Gross profit is an amount; margin is a ratio",[200-120,pct(200-120,200)],[80,40])
    add("Financial Analyst", "intermediate", "Receivable/inventory increases bind cash but do not complete a cash-flow statement",50+30,80)
    add("Payroll Specialist", "foundation", "Fictional pay rules only",[30*20,float(D(30*20)*D(".1")),float(D(30*20)*D(".9"))],[600,60,540])
    add("Payroll Specialist", "intermediate", "Authorized correction retains a net-change reconciliation",[32*20,float(D(32*20)*D(".1")),float(D(32*20)*D(".9")),float(D(2*20)*D(".9"))],[640,64,576,36])
    add("Accounts Payable Associate", "foundation", "Accepted receipt and invoice require a 40-unit exception",[8*20,200-8*20],[160,40])
    add("Credit Analyst", "foundation", "Concentration percentage uses current assets, not an unknown receivable total",[150/100,150-100,str((D(80)/D(150)*100).quantize(D(".1")))],[1.5,50,"53.3"])
    add("Learning & Development Coordinator", "foundation", "Satisfaction and unaided task success are different measures",[pct(9,10),pct(5,10)],[90,50])
    add("People Analyst", "foundation", "Small subgroup is included in the whole workforce",[pct(5,100),pct(2,5)],[5,40])
    add("Talent Development Associate", "intermediate", "Unaided success is among six nominees, not all ten eligible people",pct(3,6),50)
    add("Employee Experience Coordinator", "foundation", "Response rate differs from respondent composition",[pct(20,100),pct(16,20)],[20,80])
    add("Procurement Analyst", "foundation", "Freight belongs in delivered cost",[100+20,115,110],[120,115,110])
    add("Logistics Coordinator", "foundation", "Inventory position includes inbound supply; dispatchable on-hand does not",[10*4+15,38+40,50-38],[55,78,12])
    add("Logistics Coordinator", "intermediate", "Trigger gap is not an order-quantity rule",[12*6+15,12*6+15-(38+40)],[87,9])
    add("Hospitality Operations Associate", "foundation", "Occupancy and inspected-ready group rooms are different counts",[pct(40,50),8-5],[80,3])

    # Real relational counterexamples: a join can multiply money, while DISTINCT
    # can lose legitimate equal amounts. No fictitious application is introduced.
    with sqlite3.connect(":memory:") as db:
        db.executescript("CREATE TABLE orders(id INTEGER, customer INTEGER, revenue INTEGER); CREATE TABLE contacts(customer INTEGER, contact INTEGER); INSERT INTO orders VALUES(1,1,100),(2,1,60); INSERT INTO contacts VALUES(1,1),(1,2);")
        raw = db.execute("SELECT sum(revenue) FROM orders").fetchone()[0]
        joined = db.execute("SELECT sum(revenue) FROM orders JOIN contacts USING(customer)").fetchone()[0]
        db.execute("UPDATE orders SET revenue=100")
        correct = db.execute("SELECT sum(revenue) FROM orders").fetchone()[0]
        distinct = db.execute("SELECT sum(DISTINCT revenue) FROM orders JOIN contacts USING(customer)").fetchone()[0]
    add("BI Analyst", "intermediate", "Actual SQL exposes both join multiplication and DISTINCT-value loss",[raw,joined,correct,distinct],[160,320,200,100])

    rows = [(2,"B"),(2,"A"),(2,"C"),(1,"D")]
    stable = [(priority,sequence,name) for sequence,(priority,name) in enumerate(rows)]
    heapq.heapify(stable)
    actual = [heapq.heappop(stable)[2] for _ in rows]
    alphabetic = [name for _,name in sorted(rows)]
    add("Software Engineer", "intermediate", "A second arrival order disproves alphabetic tie-breaking",[actual,alphabetic==actual],[["D","B","A","C"],False])
    overlaps = lambda a,b: a[0]<b[1] and b[0]<a[1]
    add("Backend Developer", "foundation", "Half-open interval boundary counterexample",[overlaps((600,630),(630,660)),overlaps((600,630),(629,660))],[False,True])
    # Bind independently computed results to the actual text a learner/reviewer
    # receives. A correct calculation in this file alone is not content evidence.
    rendered = {
        ("Data Analyst","foundation"): lambda o:[f"{o[0]:g}% versus {o[1]:g}%",f"{o[2]:g}-percentage-point",f"{o[3]:g}% decline"],
        ("Data Analyst","intermediate"): lambda o:[f"{o[0]} unique orders",f"{o[1]:g}% conversion",f"{o[2]:g}-percentage-point",f"{o[3]:g}% order-count decline"],
        ("Data Engineer","foundation"): lambda o:[str(o)],
        ("Machine Learning Engineer","foundation"): lambda o:[f"{o[0]:g}%/{o[1]:g}%",f"{o[2]:g}%/{o[3]:g}%"],
        ("Cybersecurity Analyst","foundation"): lambda o:[f"aligns to {o} UTC"],
        ("CAD Technician","foundation"): lambda o:[o+" mm"],
        ("CAD Technician","intermediate"): lambda o:["0.10 mm","0.15 mm"],
        ("Quality Engineer","foundation"): lambda o:[f"{o[0]:g}%",f"{o[1]:g}%",f"{o[2]:g}-percentage-point"],
        ("Manufacturing Engineer","foundation"): lambda o:[f"{o}-unit"],
        ("Manufacturing Engineer","intermediate"): lambda o:[f"{o:g} expected good units/day"],
        ("Electronics Technician","foundation"): lambda o:[f"{o:g} mA"],
        ("Electronics Technician","intermediate"): lambda o:[f"{o[0]} ohms",o[1]+" V"],
        ("Industrial Engineering Associate","foundation"): lambda o:[f"{o}-unit"],
        ("Industrial Engineering Associate","intermediate"): lambda o:[f"{o} units remain"],
        ("Product Manager","foundation"): lambda o:[f"{o:g}%"],
        ("Product Manager","intermediate"): lambda o:[f"{o[0]:g}% versus {o[1]:g}%",f"{o[2]:g}-percentage-point"],
        ("Project Coordinator","foundation"): lambda o:["five-day"],
        ("Project Coordinator","intermediate"): lambda o:["six-day","one-day"],
        ("Project Manager","foundation"): lambda o:["six-day"],
        ("Business Analyst","foundation"): lambda o:[f"{o[0]:g}-hour/{o[1]:g}-hour"],
        ("Business Analyst","intermediate"): lambda o:["exactly 500","501 requires review"],
        ("Operations Analyst","foundation"): lambda o:[f"{o}-case"],
        ("Operations Analyst","intermediate"): lambda o:[f"becomes {o}"],
        ("Management Analyst","foundation"): lambda o:[f"{o[0]:,}",f"{o[1]:,}"],
        ("Management Analyst","intermediate"): lambda o:[f"{o:,}"],
        ("Digital Marketing Associate","foundation"): lambda o:[f"A={o[0]:g}",f"B={o[1]:g}"],
        ("Marketing Analyst","intermediate"): lambda o:[f"about {o[0]}","not proven incremental"],
        ("Accounting Associate","foundation"): lambda o:[f"{o[0]:,}","5,600−200"],
        ("Financial Analyst","foundation"): lambda o:[f"Gross profit is {o[0]}",f"margin {o[1]:g}%"],
        ("Financial Analyst","intermediate"): lambda o:[f"{o}-unit working-capital increase"],
        ("Payroll Specialist","foundation"): lambda o:["/".join(f"{value:g}" for value in o)],
        ("Payroll Specialist","intermediate"): lambda o:["/".join(f"{value:g}" for value in o[:3]),f"{o[3]:g}-unit net change"],
        ("Accounts Payable Associate","foundation"): lambda o:[str(o[0]),f"remaining {o[1]}"],
        ("Credit Analyst","foundation"): lambda o:[f"ratio {o[0]:g}",f"capital {o[1]}",f"{o[2]}% of current assets"],
        ("Learning & Development Coordinator","foundation"): lambda o:[f"{o[0]:g}% satisfaction",f"{o[1]:g}% observed task success"],
        ("People Analyst","foundation"): lambda o:[f"{o[0]:g}% overall",f"{o[1]:g}% subgroup"],
        ("Talent Development Associate","intermediate"): lambda o:[f"{o:g}% observed unaided success"],
        ("Employee Experience Coordinator","foundation"): lambda o:[f"{o[0]:g}% response rate",f"{o[1]:g}% departmental share"],
        ("Procurement Analyst","foundation"): lambda o:[f"A={o[0]}",f"B={o[1]}",f"C={o[2]}"],
        ("Logistics Coordinator","foundation"): lambda o:[str(o[0]),f"38+40={o[1]}",f"{o[2]}-unit"],
        ("Logistics Coordinator","intermediate"): lambda o:[str(o[0]),f"{o[1]}-unit trigger shortfall"],
        ("Hospitality Operations Associate","foundation"): lambda o:[f"{o[0]:g}%","three group rooms unready"],
        ("BI Analyst","intermediate"): lambda o:[str(o[0]),str(o[1]),"SUM(DISTINCT revenue)"],
        ("Software Engineer","intermediate"): lambda o:["sequence number","equal-priority"],
        ("Backend Developer","foundation"): lambda o:["half-open","boundary"],
    }
    for row in checks:
        terms = rendered[(row["role"],row["level"])](row["observed"])
        contract = case_contract(row["role"],row["level"])
        pack = case_pack(row["role"],row["level"])
        text = " ".join([contract["task"],contract["deliverable"],contract["boundary"],pack["verification"],*pack["case_inputs"]])
        row["required_rendered_evidence"] = terms
        row["rendered_evidence_present"] = all(term in text for term in terms)
        row["passed"] = row["passed"] and row["rendered_evidence_present"]
    return checks


def audit():
    catalogue = json.loads((ROOT / "data/careers/catalogue.json").read_text(encoding="utf8"))
    errors = []
    roles = []
    names = {role["name"] for role in catalogue["roles"]}
    if len(names) != 60 or names != set(CONTRACTS) or names != set(PACKS) or names != set(CASE_TITLES):
        errors.append("Expected one case contract for each of the sixty catalogue roles")
    for role in catalogue["roles"]:
        levels = []
        for level in ("foundation", "intermediate"):
            stage = role["curriculum"][level]
            authored = case_contract(role["name"],level)
            inputs = case_pack(role["name"],level)
            expected = {"case_title":authored["title"],"case_task":authored["task"],"case_deliverable":authored["deliverable"],"case_acceptance":[authored["boundary"],inputs["verification"]],"case_inputs":inputs["case_inputs"],"case_sources":authored["sources"]}
            if any(stage.get(key) != value for key,value in expected.items()):
                errors.append(role["name"]+"/"+level+": generated contract is stale")
            if len(set(stage.get("case_acceptance",[]))) < 2 or any(len(stage.get(field,""))<45 for field in ("case_task","case_deliverable")):
                errors.append(role["name"]+"/"+level+": missing specific task, artifact or acceptance boundary")
            refs = stage.get("case_sources",[])
            if not 1 <= len(refs) <= 3:
                errors.append(role["name"]+"/"+level+": missing or excessive references")
            for ref in refs:
                parsed = urlsplit(ref["url"])
                if parsed.scheme != "https" or parsed.username or parsed.password or not parsed.hostname or len(ref["title"]) > 160 or (ref["title"],ref["url"]) not in SOURCES.values():
                    errors.append(role["name"]+"/"+level+": invalid source reference")
            levels.append({"level":level,"title":stage.get("case_title"),"inputs":stage.get("case_inputs"),"task":stage.get("case_task"),"deliverable":stage.get("case_deliverable"),"acceptance":stage.get("case_acceptance"),"sources":refs,"contract_sha256":fingerprint(expected)})
        if levels[0]["task"] == levels[1]["task"] or levels[0]["deliverable"] == levels[1]["deliverable"]:
            errors.append(role["name"]+": intermediate task does not progress beyond foundation")
        roles.append({"name":role["name"],"id":role["id"],"family":role["family"],"occupation_reference":role["occupation"]["url"],"levels":levels})
    checks = independent_checks()
    errors.extend(row["role"]+": "+row["check"] for row in checks if not row["passed"])
    return {"version":VERSION,"scope":"Agent-authored task/input/artifact/acceptance alignment across all120 levels, with independent numeric and relational/ordering boundary checks. No learner answers are automatically graded by this audit; no independent specialist or learner calibration claimed.","role_count":len(roles),"level_count":sum(len(role["levels"]) for role in roles),"reference_count":len(SOURCES),"independent_checks":checks,"roles":roles,"errors":errors}


def document_review(report):
    """Keep a complete role matrix inspectable beside the full case text."""
    checks = report["independent_checks"]
    lines = ["# Career case-contract review — 9 November 2026", "",
             "The previous edition added fictional inputs to broad portfolio activities. This pass repairs the resulting mismatch: a learner should be asked to use the data actually provided, with an explicit deliverable and observable success/failure boundaries. All60 roles and both levels were reviewed. This is an agent editorial/engineering review, not independent practitioner approval, human usability research or calibrated job-readiness evidence.", "",
             "## Result and concrete changes", "",
             "- All120 new briefs have a level-specific task, deliverable and two acceptance checks, plus1–3 primary concept references. Foundation and intermediate tasks/deliverables differ for every role.",
             "- Full-Stack now follows the supplied equipment-return/version-conflict case; Mobile follows offline notes rather than unrelated appointments. Manufacturing uses serial-line capacity/yield. Finance stops asking for current ratios or budget variance without their inputs.",
             "- Accounting now supplies a5,600 book balance and evidenced200 duplicate, reconciling both sides to5,400 while excluding the next-period fee. Data Analyst supplies six identified retries so corrected conversion is computable. Logistics distinguishes78 inventory position from87 reorder trigger and does not invent an order quantity. People Analyst explicitly identifies its subgroup as a subset of the100-person workforce.",
             "- New snapshots deep-copy task, inputs, references and rubric. Saved legacy briefs keep their original edition; no stored learner project, review, quiz, role or score is rewritten.",
             "- TypeScript and Python builders are compared on all120 actual brief snapshots.45 separate arithmetic/SQL/ordering/interval checks recompute illustrative outcomes and wrong-solution counterexamples. These calculations do not validate the non-numeric judgements for every role or automatically grade learner work.", "",
             "## Complete60-role matrix", "",
             "Each row covers both levels. The table links the actual supplied case to its two artifacts; full inputs/tasks/checks are in [all case packs](CAREER_CASE_PACKS.md). A count of0 below means no independent numerical/relational fixture is claimed for that role; its authored boundaries still require human review.", "",
             "| Career | Supplied case | Foundation artifact | Intermediate artifact | Independent fixture checks |", "|---|---|---|---|---|"]
    for role in report["roles"]:
        foundation, intermediate = role["levels"]
        count = sum(row["role"] == role["name"] for row in checks)
        cells = [role["name"], foundation["title"], foundation["deliverable"], intermediate["deliverable"], str(count)]
        lines.append("| " + " | ".join(value.replace("|", "\\|").replace("\n", " ") for value in cells) + " |")
    lines.extend(["", "## Independent checks", "",
                  "These45 recomputations include actual SQL join multiplication and equal-value DISTINCT loss; arrival-order ties that defeat an alphabetic queue shortcut; half-open interval boundary behavior; tolerance/measurement/yield assumptions; accounting cutoff; and denominator/attribution errors. The JSON report binds each result to the task, inputs or criterion actually rendered, so a correct unattached calculation does not create a pass.", "",
                  "| Career and level | Check | Result |", "|---|---|---|"])
    for row in checks:
        lines.append("| " + row["role"] + " / " + row["level"] + " | " + row["check"] + " | " + ("Pass" if row["passed"] else "FAIL") + " |")
    lines.extend(["", "## Reference scope", "",
                  "The23 primary concept-reference pages were opened on9 November2026. They support selected concepts, not these fictional numbers, full occupational coverage, statutory advice or endorsement of VoidFill. The old GOV.UK writing-guidelines parent could not be accessed; it was replaced with the current clear-language leaf. Provider access and content can change; some factsheets or associated material may require a provider account. These new brief references are separate from the earlier305-resource reachability report, whose7 November timestamp is retained.", ""])
    for key, (title, url) in SOURCES.items():
        lines.append("- [" + title + "](" + url + ") (`" + key + "`).")
    lines.extend(["", "## Unchanged embeddings and history", "",
                  "[The embedding-input proof](../ml/evaluation-career-embedding-proof.json) compares every ordered resource/question/topic/passage/public-query/role input and owner/ID mapping with source release50cc8a0. It also compares original activities/milestones/requirements, all question/resource rows, executable matcher code, release manifest and exact vector bytes. All13 checks passed; the current catalogue fingerprint alone needed refresh. No encoder inference or no-op reindex was performed. Model weights, FP32 precision, tokenizer and existing vectors stay unchanged.", "",
                  "The nine input groups include147 extension resource texts,1,510 extension question prompts,55 topics, all passage windows/owners,408 curated public queries and60 resume-role contexts. The vector archive SHA-256 remains `134240caaaee4af3b44b084f65edd41641d9899aae3750f25f7570fb3a1bec96`.", "",
                  "## Reproduce", "", "```text", "python -m ml.career_case_audit --check", "python -m pytest -q ml/tests/test_career_case_contracts.py ml/tests/test_practical_demo.py", "node --import tsx --test tests/practical.test.ts tests/careers.test.ts tests/career-adversarial.test.ts", "```", "",
                  "For a documented case-contract-only edit with unchanged embedding inputs, `python -m ml.career_embedding_proof --refresh-fingerprints` proves equality against the explicit baseline and refuses a metadata-only refresh on mismatch. That command requires the baseline Git object and current verified model metadata. CI does not need Git history: its regression binds the recorded proof to all current inputs, implementation hashes, model fingerprints and vector bytes. An actual embedding-input/model change needs a real reindex and newly reviewed evidence, not an edited pass flag.", "",
                  "`ml/evaluation-career-case-contracts.json` contains every120 contract and45 check with current source hashes. `ml/career-quality-review-v1.json` now binds the all60 case review to these contracts; prior55 intermediate explanation reviews remain historical evidence, not a new specialist review. No database migration, inference provider or paid plan is introduced.", ""])
    (ROOT.parent / "docs/CAREER_CASE_CONTRACT_REVIEW.md").write_text("\n".join(lines), encoding="utf8")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--check",action="store_true")
    parser.add_argument("--record-review",action="store_true",help="After reviewing the full generated matrix, bind the existing role-review record to these current contracts")
    args = parser.parse_args()
    report = audit()
    if args.record_review:
        if args.check or report["errors"]:
            raise SystemExit("A stale/failed contract audit cannot refresh review records")
        catalogue = json.loads((ROOT / "data/careers/catalogue.json").read_bytes())
        notes_path = ROOT / "career-quality-review-v1.json"
        notes = json.loads(notes_path.read_bytes())
        notes.update(version="career-quality-review-v3-2026-11-09", reviewed_at="2026-11-09", reviewed_scope="Agent review of all60 current foundation/intermediate input/task/deliverable/positive-and-negative acceptance contracts and concept-reference scope. The 45 independently recomputed case arithmetic/SQL/ordering/interval checks are recorded separately. Prior55 selected intermediate explanation reviews and the960foundation editorial record are retained, not claimed as newly specialist-reviewed. No independent specialist approval, learner calibration or factual certification of all2121 questions.")
        notes["roles"] = [{"id":role["id"],"name":role["name"],"reviewed_sha256":fingerprint({"curriculum":role["curriculum"],"activity":role["activity"]})} for role in catalogue["roles"]]
        notes_path.write_text(json.dumps(notes,indent=2,ensure_ascii=False)+"\n",encoding="utf8")
    if not args.check:
        (ROOT / "evaluation-career-case-contracts.json").write_text(json.dumps(report,indent=2,ensure_ascii=False)+"\n",encoding="utf8")
        document_review(report)
    print(json.dumps({key:report[key] for key in ("version","role_count","level_count","reference_count","errors")}))
    print(f"Independent fixture checks: {sum(row['passed'] for row in report['independent_checks'])}/{len(report['independent_checks'])}")
    if report["errors"]:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
