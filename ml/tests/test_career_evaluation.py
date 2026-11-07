"""Exercise actual serving vectors against public cross-domain regression probes."""
from ml.career_evaluation import evaluate


def test_public_cross_domain_relevance_and_private_cache_boundaries():
    report = evaluate()
    # Regression budgets reflect this curated sample's measured scope. They are
    # not claims of independent educational validation or hiring suitability.
    assert len(report["results"]) == 55
    assert report["topic_recall_at_1"] >= .8
    assert report["topic_recall_at_5"] >= .9
    assert report["unsupported_abstentions"] == report["unsupported_count"] == 10
    assert report["private_queries_not_cached"]
