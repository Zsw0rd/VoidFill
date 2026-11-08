import copy
from decimal import Decimal as D
import json

import pytest

from ml.audit_foundation_editorial import ROOT, audit
from ml.career_foundation_editorial import revise_banks
from ml.career_question_bank import BANK
from ml.career_question_bank_phase2 import BANK as BANK2
from ml.career_question_bank_phase3 import BANK as BANK3
from ml.career_case_packs import PACKS, VERSION, case_pack
from ml.career_curriculum import PATHS


def test_editorial_covers_every_published_foundation_identity_without_replacing_history():
    report = audit()
    assert report["errors"] == []
    assert report["item_count"] == 960 and report["topic_count"] == 49
    assert report["before"]["unique_longest_correct"] == 767
    assert report["after"]["unique_longest_correct"] / 960 < .45
    assert report["after"]["unique_shortest_correct"] / 960 < .45
    artifact = json.loads((ROOT / "evaluation-foundation-editorial.json").read_text(encoding="utf8"))
    assert artifact == report, "Source-bound editorial record is stale"
    assert len({row["question_id"] for row in report["items"]}) == 960


def test_reordered_or_edited_foundation_sources_require_a_fresh_explicit_review():
    original = {**BANK, **BANK2, **BANK3}
    snapshot = copy.deepcopy(original)
    revise_banks(original)
    assert original == snapshot
    for mutation in ["remove", "reorder", "prompt", "answer"]:
        changed = copy.deepcopy(original)
        if mutation == "remove":
            changed.pop("git")
        elif mutation == "reorder":
            changed["git"][0], changed["git"][1] = changed["git"][1], changed["git"][0]
        else:
            row = list(changed["git"][0])
            row[0 if mutation == "prompt" else 1] += " changed"
            changed["git"][0] = tuple(row)
        with pytest.raises(ValueError, match="Foundation source changed"):
            revise_banks(changed)


def test_revised_numeric_answers_still_follow_the_stated_foundation_formulas():
    # Independently calculate representative boundaries across domains. Neither
    # the option order nor the new prose chooses the expected numerical answer.
    cases = {
        ("spreadsheets", 1): str((2+4+6)//3),
        ("spreadsheets", 6): str((10+20)//2),
        ("spreadsheets", 7): str((10+0+20)//3),
        ("spreadsheets", 18): f"{(120-100)/100:.0%}",
        ("analysis", 12): f"{(10-8)/10:.0%}",
        ("success", 5): f"{80/100:.0%}",
        ("success", 6): f"{10/200:.0%}",
        ("success", 7): f"{(200-10)/200:.0%}",
        ("marketing", 2): f"{100/5000:.0%}",
        ("marketing", 3): f"{40/800:.0%}",
        ("marketing", 12): f"{(700-500)/500:.0%}",
        ("accounting", 1): f"{90000-35000:,}",
        ("accounting", 7): str(1200//12),
        ("accounting", 12): f"{5000+700-300:,}",
        ("accounting", 13): f"{(10000-1000)//3:,}",
        ("accounting", 16): f"{D(3000)/D(8000):.1%}",
        ("financial-analysis", 5): str(150/100),
        ("financial-analysis", 6): str(150-100),
        ("electronics", 3): f"{D(5)/D(100)} A",
        ("electronics", 4): f"{int(D(200)*D('.02'))} V",
        ("electronics", 5): f"{int(D(6)*D('.5'))} W",
        ("electronics", 7): f"{100*100//(100+100)} ohms",
        ("inventory", 1): f"{100+30-20} units",
        ("inventory", 6): f"{10*4} units",
        ("inventory", 7): f"{40+15} units",
        ("events", 5): str(120-90),
        ("events", 17): str(5000-4300),
        ("hospitality", 8): f"{40/50:.0%}",
        ("payroll", 2): str(1000-180),
        ("payroll", 3): str(int(D(800)*D('.1'))),
        ("payroll", 10): f"{500+700+800:,}",
    }
    revised = revise_banks({**BANK, **BANK2, **BANK3})
    for (topic, index), expected in cases.items():
        assert revised[topic][index][1] == expected, (topic, index, expected)


def test_every_career_has_distinct_level_specific_case_inputs_and_checks():
    catalogue = json.loads((ROOT / "data/careers/catalogue.json").read_text(encoding="utf8"))
    assert len(PACKS) == 60 and set(PACKS) == set(PATHS)
    unique_inputs = set()
    for role in catalogue["roles"]:
        name = role["name"]
        curriculum = role["curriculum"]
        assert curriculum["case_pack_version"] == VERSION
        foundation = case_pack(name, "foundation")
        intermediate = case_pack(name, "intermediate")
        assert len(foundation["case_inputs"]) == 2
        assert len(intermediate["case_inputs"]) == 3
        assert intermediate["case_inputs"][:2] == foundation["case_inputs"]
        assert intermediate["verification"] != foundation["verification"]
        for level in ["foundation", "intermediate"]:
            details = case_pack(name, level)
            assert curriculum[level]["case_inputs"] == details["case_inputs"]
            assert curriculum[level]["case_verification"] == details["verification"]
            assert len(details["verification"]) >= 65
        unique_inputs.add(tuple(foundation["case_inputs"]))
    assert len(unique_inputs) == 60
    before = case_pack("Data Analyst", "foundation")
    before["case_inputs"][0] = "caller edit"
    assert case_pack("Data Analyst", "foundation")["case_inputs"][0] != "caller edit"


def test_case_pack_arithmetic_preserves_units_denominators_and_constraints():
    checks = [
        ("Data Analyst", "foundation", f"{100/1000:.0%} versus {96/1200:.0%}"),
        ("BI Analyst", "foundation", str(100+60)),
        ("Data Engineer", "foundation", str(100+55)),
        ("CAD Technician", "intermediate", f"{(D('10.20')-D('.05'))-(D('10.00')+D('.05')):.2f} mm"),
        ("Manufacturing Engineer", "foundation", str(min(12,8,10)*7)),
        ("Manufacturing Engineer", "intermediate", str(float(D(10)*D('.75')*7))),
        ("Electronics Technician", "intermediate", f"{D(10)*(D(1000)/2)/(D(1000)+D(1000)/2):.2f} V"),
        ("Industrial Engineering Associate", "foundation", str(420//max(2,4,3))),
        ("Business Analyst", "foundation", "48-hour/24-hour"),
        ("Operations Analyst", "foundation", str(50+100-90)),
        ("Payroll Specialist", "foundation", str(int(30*20*(1-D('.1'))))),
        ("Payroll Specialist", "intermediate", str(int(32*20*(1-D('.1'))))),
        ("People Analyst", "foundation", f"{2/5:.0%}"),
        ("Procurement Analyst", "foundation", f"A={100+20}"),
        ("Logistics Coordinator", "foundation", str(10*4+15)),
        ("Logistics Coordinator", "intermediate", str(12*6+15)),
        ("Hospitality Operations Associate", "foundation", f"{40/50:.0%}"),
    ]
    for name, level, expected in checks:
        assert expected in case_pack(name, level)["verification"], (name, level, expected)
