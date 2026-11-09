import io
import time
import pytest
from fastapi import HTTPException
from docx import Document
from PIL import Image, ImageDraw, ImageFont
from ml.guest import GuestStore, SKILLS
from ml.resume import extract_document, parse_resume


def pdf_text_fixture(lines):
    stream = "BT /F1 14 Tf 50 780 Td " + " ".join("(" + line.replace("(", r"\(").replace(")", r"\)") + ") Tj 0 -24 Td" for line in lines) + " ET"
    objects = ["<< /Type /Catalog /Pages 2 0 R >>", "<< /Type /Pages /Kids [3 0 R] /Count 1 >>", "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>", "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>", f"<< /Length {len(stream)} >>\nstream\n{stream}\nendstream"]
    result = "%PDF-1.4\n"; offsets = [0]
    for i, obj in enumerate(objects, 1):
        offsets.append(len(result)); result += f"{i} 0 obj\n{obj}\nendobj\n"
    xref = len(result)
    result += "xref\n0 6\n0000000000 65535 f \n" + "".join(f"{offset:010d} 00000 n \n" for offset in offsets[1:]) + f"trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF"
    return result.encode("ascii")


def test_hosted_performance_fixture_is_a_readable_text_pdf():
    """Validate the Node probe's actual bytes using the independent PDF parser."""
    import subprocess
    from pathlib import Path
    result = subprocess.run(
        ["node", "--input-type=module", "-e", "import {syntheticResumePdf} from './lib/performanceFixtures.mjs'; process.stdout.write(syntheticResumePdf('independent-fixture-check'));"],
        cwd=Path(__file__).resolve().parents[2], capture_output=True, check=True, timeout=10,
    )
    text, pages, methods, warnings = extract_document(result.stdout, "synthetic-probe.pdf")
    assert pages == 1 and methods == ["pdf-text"] and warnings == []
    assert "Python and SQL" in text
    assert "Synthetic performance case independent-fixture-check" in text
    assert "Fictional" in text and "Education" in text


def test_session_isolation_and_explicit_deletion():
    store = GuestStore(); a, b = store.create(), store.create()
    store.query(a["token"], {"table": "user_skill_scores", "operation": "insert", "values": {"user_id": b["user"]["id"], "skill_id": SKILLS[0]["id"], "score": 90}})
    rows = store.query(a["token"], {"table": "user_skill_scores"})["data"]
    assert rows[0]["user_id"] == a["user"]["id"]
    assert store.query(b["token"], {"table": "user_skill_scores"})["data"] == []
    store.end(a["token"])
    with pytest.raises(HTTPException): store.get(a["token"])
    assert store.get(b["token"])


def test_resource_order_keeps_zero_numeric_and_orders_multiple_skills():
    store = GuestStore()
    token = store.create()["token"]
    store.query(token, {"table": "roadmap_courses", "operation": "insert", "values": [
        {"title": "Second", "skill_id": SKILLS[0]["id"], "sort_order": 1},
        {"title": "First", "skill_id": SKILLS[0]["id"], "sort_order": 0},
        {"title": "Another first", "skill_id": SKILLS[1]["id"], "sort_order": 0},
        {"title": "Third", "skill_id": SKILLS[0]["id"], "sort_order": 2},
    ]})
    rows = store.query(token, {"table": "roadmap_courses", "orders": [{"column": "sort_order", "ascending": True}]})["data"]
    assert [row["title"] for row in rows] == ["First", "Another first", "Second", "Third"]
    rows = store.query(token, {"table": "roadmap_courses", "orders": [{"column": "sort_order", "ascending": False}]})["data"]
    assert [row["sort_order"] for row in rows] == [2, 1, 0, 0]


def test_tab_grace_crash_expiry_and_multiple_tabs():
    now = [1000]
    store = GuestStore(clock=lambda: now[0]); token = store.create()["token"]
    store.lease(token, "tab-a"); store.lease(token, "tab-b")
    store.lease(token, "tab-a", release=True)
    now[0] += 14; store.purge()
    assert store.get(token)  # Other tab still alive.
    store.lease(token, "tab-b", release=True)
    now[0] += 10
    store.lease(token, "reload")  # A reload claims a new lease in the grace period.
    now[0] += 61; store.purge()
    assert not store.sessions


def test_cleanup_runs_without_another_request():
    now = [1000]
    store = GuestStore(clock=lambda: now[0])
    store.create()
    store.start_cleanup()
    try:
        now[0] += 61
        time.sleep(2.3)
        assert store.sessions == {}
    finally:
        store.stop.set()


def test_delayed_heartbeat_cannot_reopen_a_released_lease():
    now = [1000]
    store = GuestStore(clock=lambda: now[0]); token = store.create()["token"]
    store.lease(token, "tab", sequence=1)
    store.lease(token, "tab", release=True, sequence=3)
    store.lease(token, "tab", sequence=2)
    now[0] += 13; store.purge()
    assert not store.sessions


def test_catalogue_and_foreign_relations_are_protected():
    store = GuestStore(); token = store.create()["token"]
    for query in [{"table": "roles", "operation": "delete"}, {"table": "not_a_table"}, {"table": "chat_messages", "operation": "insert", "values": {"conversation_id": "foreign", "content": "test"}}]:
        with pytest.raises(HTTPException): store.query(token, query)
    assert store.query(token, {"table": "admin_users"})["data"] == []


def test_nested_projection_and_ledger():
    store = GuestStore(); token = store.create()["token"]
    profile = store.query(token, {"table": "profiles", "selection": "*, roles(name)", "single": "required"})["data"]
    assert profile["roles"]["name"] == "Data Analyst"
    key = "00000000-0000-4000-8000-000000000001"
    assert store.ledger(token, {"id": key, "action": "claim"})["status"] == "claimed"
    assert store.ledger(token, {"id": key, "action": "claim"})["status"] == "pending"
    store.ledger(token, {"id": key, "action": "completed", "result": {"xp": 50}})
    assert store.ledger(token, {"id": key, "action": "claim"})["result"]["xp"] == 50
    store.end(token); assert not store.sessions


def test_ats_pdf_and_styled_docx():
    data = pdf_text_fixture(["Alok Sharma", "alok@example.test", "SKILLS", "Python, SQL, Git, Tableau", "EDUCATION", "Bachelor of Computer Applications"])
    text, pages, methods, _ = extract_document(data, "ats.pdf")
    assert "Python" in text and pages == 1 and methods == ["pdf-text"]
    document = Document(); document.add_heading("Alok Sharma", 0)
    table = document.add_table(rows=1, cols=2)
    table.cell(0, 0).text = "SKILLS\nPython SQL Git"
    table.cell(0, 1).text = "EDUCATION\nBachelor of Computer Applications"
    stream = io.BytesIO(); document.save(stream)
    extracted, _, methods, _ = extract_document(stream.getvalue(), "designed.docx")
    assert "Python SQL Git" in extracted and "Bachelor" in extracted
    assert methods == ["docx-paragraphs-tables-textboxes"]


def test_designed_docx_textbox_extraction():
    from docx.oxml import parse_xml
    from docx.oxml.ns import nsdecls
    document = Document(); document.add_paragraph("Test Learner\nEDUCATION\nBachelor of Computer Applications")
    document.element.body.append(parse_xml(f'<w:p {nsdecls("w")}><w:r><w:pict><w:txbxContent><w:p><w:r><w:t>Python SQL Git</w:t></w:r></w:p></w:txbxContent></w:pict></w:r></w:p>'))
    output = io.BytesIO(); document.save(output)
    text, _, _, _ = extract_document(output.getvalue(), "textbox.docx")
    assert "Python SQL Git" in text


def test_scanned_pdf_uses_local_pretrained_ocr():
    image = Image.new("RGB", (1400, 700), "white")
    # Pillow bundles this scalable font, so the scanned-image fixture is the same
    # on Windows and Linux without depending on an operating-system font path.
    ImageDraw.Draw(image).text((50, 50), "ALOK SHARMA\nPython SQL Git\nEDUCATION\nBachelor of Computer Applications", fill="black", font=ImageFont.load_default(size=36))
    output = io.BytesIO(); image.save(output, format="PDF")
    text, _, methods, warnings = extract_document(output.getvalue(), "scan.pdf")
    assert "Python" in text and "SQL" in text and "local-ocr" in methods and warnings


def test_rejects_invalid_and_oversized_documents():
    for data, filename in [(b"not a resume", "resume.pdf"), (b"x" * (5 * 1024 * 1024 + 1), "resume.docx"), (b"plain text", "resume.txt")]:
        with pytest.raises(HTTPException): extract_document(data, filename)
