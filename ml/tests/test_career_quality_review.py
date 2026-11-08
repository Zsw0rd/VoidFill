import json
from pathlib import Path
import sqlite3
import subprocess
import sys

from ml.career_quality_review import ROOT, audit


def test_shipping_grain_guidance_survives_equal_charges_and_multiple_items():
    # A concrete counterexample independently establishes why DISTINCT on the
    # amount and rejoining an order-level aggregate are both incorrect repairs.
    connection = sqlite3.connect(":memory:")
    connection.executescript("""
        create table orders(id integer primary key, shipping integer);
        create table items(id integer primary key, order_id integer);
        insert into orders values(1,5),(2,5);
        insert into items values(1,1),(2,1),(3,2);
    """)
    query = lambda sql: connection.execute(sql).fetchone()[0]
    assert query("select sum(shipping) from orders join items on items.order_id=orders.id") == 15
    assert query("select sum(distinct shipping) from orders join items on items.order_id=orders.id") == 5
    assert query("select sum(shipping) from orders") == 10
    assert query("with item_counts as (select order_id,count(*) n from items group by order_id) select sum(shipping) from orders left join item_counts on item_counts.order_id=orders.id") == 10
    assert query("with order_totals as (select id,sum(shipping) shipping from orders group by id) select sum(shipping) from order_totals join items on items.order_id=order_totals.id") == 15
    questions = json.loads((ROOT / "data/careers/questions.json").read_text(encoding="utf8"))
    revised = next(row for row in questions if row["id"] == "career-595d1c837fe9ececcaf5")
    assert revised["options"][revised["correct_index"]] == "Sum from one row per order"
    assert "equal charges" in revised["explanation"]
    assert revised["source_url"].startswith("https://www.postgresql.org/docs/")
    connection.close()


def test_all_career_review_hashes_and_independent_arithmetic_stay_current():
    report = audit()
    assert report["career_count"] == 60
    assert report["skill_count"] == 55
    assert report["stored_question_count"] == 2121
    assert report["served_question_count"] == 2117
    assert report["excluded_question_count"] == 4
    assert len(report["selected_explanation_reviews"]) == 55
    assert all(row["review_current"] for row in report["selected_explanation_reviews"])
    assert len(report["arithmetic"]) == 27
    assert all(row["passed"] for row in report["arithmetic"])
    assert report["errors"] == []


def test_quality_check_mode_reports_without_rewriting_the_review_artifact():
    output = ROOT / "evaluation-career-quality.json"
    before = output.read_bytes()
    result = subprocess.run([sys.executable,"-m","ml.career_quality_review","--check"],cwd=ROOT.parent,capture_output=True,text=True)
    assert result.returncode == 0, result.stderr or result.stdout
    assert output.read_bytes() == before
