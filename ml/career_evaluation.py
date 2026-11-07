"""Versioned public relevance probes, separate from training and index creation.

These curated probes are regression evidence, not independent user research or
validated measures of professional ability. Never add learner inputs here.
"""
TOPIC_PROBES = {
"python": "Process a large CSV in chunks and debug shared mutable function arguments",
"sql": "Avoid duplicated totals when joining order headers to order line items",
"visualization": "Choose readable charts with honest axes and show distribution tails",
"web": "Build a browser form with HTML CSS JavaScript and recoverable validation errors",
"git": "Undo a published commit without rewriting collaborators' shared repository history",
"algorithms": "Choose a heap for repeated minimum priority extraction and analyze complexity",
"machine-learning": "Evaluate a classifier with imbalanced labels and prevent target leakage",
"data-science": "Distinguish confounding from causal effects and report uncertainty from samples",
"api": "Design HTTP endpoints with authorization and idempotent retry behavior",
"testing": "Reproduce an intermittent software defect and isolate automated test data",
"linux": "Diagnose a daemon's effective file permissions and open log file handles",
"networking": "Investigate DNS failures routing and TCP port connectivity between subnets",
"cloud": "Plan hosted service recovery, shared dependencies and backup restoration",
"security": "Prevent one authenticated user reading another user's private object by changing its identifier",
"marketing": "Measure qualified campaign enquiries rather than clicks and overlapping attribution",
"recruiting": "Create job-related interview criteria and compare candidate work-sample evidence",
"sales": "Discover a business buyer's needs and qualify a mutually agreed next step",
"success": "Help a customer achieve onboarding outcomes and recover a blocked workflow",
"projects": "Coordinate dependencies milestones resource conflicts and authorized scope changes",
"accounting": "Reconcile cashbook records with bank timing differences and accrued expenses",
"spreadsheets": "Audit copied cell references, lookup keys and pivot table source ranges",
"communication": "Write a clear handover with decisions owners impact and a next update",
"analysis": "Elicit stakeholder requirements and define testable business acceptance criteria",
"architecture": "Choose module ownership transaction boundaries and failure semantics across services",
"containers": "Build reproducible Docker images and gate deployment on continuous integration checks",
"data-engineering": "Reprocess late events with stable keys in an incremental ETL pipeline",
"cad": "Prepare a dimensioned manufacturing drawing with datums and a tolerance stack",
"manufacturing": "Improve production-line throughput by studying bottlenecks and rework",
"quality": "Separate gauge variation from process variation and verify corrective action effectiveness",
"product": "Prioritize a product hypothesis using user outcomes guardrails and reversible experiments",
"customer-research": "Interview adopters and non-adopters neutrally about their actual customer needs",
"ux": "Test an interaction prototype for task completion and recovery after interruption",
"accessibility": "Check keyboard focus dialog semantics text reflow and screen reader status announcements",
"visual-design": "Create a coherent typography spacing hierarchy and responsive component system",
"content": "Edit an audience-focused article and verify claims under an editorial strategy",
"seo": "Diagnose crawl and indexing problems after a public URL migration",
"research": "Design a study with suitable sampling ethics methods and reproducible evidence",
"financial-analysis": "Connect profit working capital and cash in a scenario forecast model",
"hr-operations": "Control employee joiner mover leaver records and confidential access approvals",
"learning-design": "Align a training objective to practice assessment and transfer to workplace tasks",
"inventory": "Reconcile warehouse stock movements and calculate a reorder point with safety stock",
"supply-chain": "Balance demand and supplier capacity under uncertain lead times and service targets",
"react": "Fix a React effect's stale closure and stable list keys without duplicating derived state",
"mobile": "Design an offline Android or iOS app with lifecycle restoration and sync conflicts",
"ml-operations": "Version model artifacts and serving preprocessing while monitoring drift and release quality",
"brand": "Define a credible differentiated brand promise and consistent identity across channels",
"payroll": "Reconcile approved hours gross-to-net pay and authorized payroll corrections",
"audit": "Link an assurance workpaper's assertions to sample evidence and control exceptions",
"procurement": "Compare supplier offers by delivered cost quality requirements and purchase approval",
"automation": "Specify a simulated PLC state machine with interlocks fault reset and restart transitions",
"electronics": "Calculate resistor current power and voltage while considering instrument loading",
"technical-writing": "Write a versioned API task guide with prerequisites executable examples and troubleshooting",
"events": "Coordinate a venue run-of-show capacity and contingency owners for a public event",
"hospitality": "Coordinate room readiness guest service recovery and a hotel shift handover",
"account-management": "Review customer account value renewal stakeholders and authorized expansion commitments",
}

UNSUPPORTED_PROBES = ["Clinical surgery", "Underwater basket weaving", "Spacecraft propulsion engineering", "Veterinary anaesthesia", "Nuclear reactor licensing", "Maritime navigation certification", "Criminal litigation", "Dental implant surgery", "Air traffic control", "Pharmaceutical formulation"]


def evaluate(output=None):
    import json
    import os
    from pathlib import Path
    import numpy as np
    from ml.career_catalogue import CATALOGUE, TOPICS, topic_for_skill
    from ml.service import LearningEngine, RecommendationRequest
    previous = os.environ.get("ML_BACKEND")
    os.environ["ML_BACKEND"] = "onnx"
    try:
        engine = LearningEngine()
    finally:
        if previous is None:
            os.environ.pop("ML_BACKEND", None)
        else:
            os.environ["ML_BACKEND"] = previous
    cache_before = list(engine.embedding_cache)
    topics = list(TOPICS)
    queries = list(TOPIC_PROBES.values())
    vectors = engine.encode_queries(queries, public=False)
    scores = vectors @ engine.topic_vectors.T
    rows = []
    for i, expected in enumerate(TOPIC_PROBES):
        ranked = [topics[j] for j in np.argsort(-scores[i])]
        rank = ranked.index(expected) + 1
        rows.append({"query": queries[i], "expected_topic": expected, "top_5": ranked[:5], "rank": rank})
    unsupported = []
    for name in UNSUPPORTED_PROBES:
        result = engine.recommend(RecommendationRequest(skills=[{"id": "unsupported", "name": name}]))
        unsupported.append({"query": name, "abstained": topic_for_skill(name) is None and result["unsupported_skills"] == [name] and not result["recommendations"][0]["resources"]})
    payload = {
        "version": CATALOGUE["version"], "model": engine.report["model"],
        "scope": "55 curated public topic paraphrases across all ten career families; exact-topic vector ranking, not end-to-end answer quality. Regression probes were not used for training. No independent domain-expert or real-user validation is claimed.",
        "topic_recall_at_1": sum(row["rank"] == 1 for row in rows) / len(rows),
        "topic_recall_at_5": sum(row["rank"] <= 5 for row in rows) / len(rows),
        "topic_mrr": sum(1 / row["rank"] for row in rows) / len(rows),
        "unsupported_abstentions": sum(row["abstained"] for row in unsupported),
        "unsupported_count": len(unsupported),
        "private_queries_not_cached": list(engine.embedding_cache) == cache_before,
        "results": rows, "unsupported": unsupported,
    }
    if output:
        Path(output).write_text(json.dumps(payload, indent=2) + "\n", encoding="utf8")
    return payload


if __name__ == "__main__":
    report = evaluate("ml/evaluation-career-depth.json")
    print({key: value for key, value in report.items() if key not in {"results", "unsupported", "scope"}})
