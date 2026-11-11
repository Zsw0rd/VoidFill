"""Fictional documents for bounded parser/encoder acceptance and timing.

These fixtures contain no user input. The near-upload-limit PDF deliberately
uses an unreferenced stream: it measures the byte envelope, not complex rendering.
The twelve-page and scan fixtures exercise actual native parsing and offline OCR.
"""
from __future__ import annotations

import argparse
from dataclasses import dataclass
import hashlib
import io
import json
from pathlib import Path
import re
import zipfile

from ml.resume import MAX_BYTES, MAX_PAGES

ROOT = Path(__file__).resolve().parents[1]
RUNTIME = ROOT / "ml/runtime"
EXPANDED_DOCX_LIMIT = 30 * 1024 * 1024
TEXT_LIMIT = 60_000


def _pdf_string(text):
    return text.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


def text_pdf(pages=1, *, dense_lines=0, exact_bytes=None):
    """Build real page objects/xrefs; no binary PDF package is required."""
    if not isinstance(pages, int) or not 1 <= pages <= MAX_PAGES + 1:
        raise ValueError("Fixture page count is outside the reviewed matrix.")
    if not isinstance(dense_lines, int) or not 0 <= dense_lines <= 80:
        raise ValueError("Fixture line count is outside the reviewed matrix.")
    if exact_bytes is not None and exact_bytes not in (MAX_BYTES, MAX_BYTES + 1):
        raise ValueError("Only the exact reviewed upload boundaries are supported.")
    objects = ["<< /Type /Catalog /Pages 2 0 R >>", "", "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"]
    page_ids = []
    for page in range(1, pages + 1):
        page_id, stream_id = len(objects) + 1, len(objects) + 2
        page_ids.append(page_id)
        objects.append(f"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents {stream_id} 0 R >>")
        lines = ["Fictional Matrix Learner", "fixture@example.invalid", "Summary",
                 f"Fictional matrix page {page:02d} of {pages:02d}.",
                 "Used Python and SQL to compare fictional inventory totals.",
                 "Skills", "Python SQL Git", "Education", "Fictional learning programme."]
        if dense_lines:
            lines.extend(f"Fictional row {row:03d}: Python SQL sample keys; verify totals and record uncertainty." for row in range(dense_lines))
        size, step = (7, 8) if dense_lines else (12, 22)
        stream = f"BT /F1 {size} Tf 35 805 Td " + " ".join(f"({_pdf_string(line)}) Tj 0 -{step} Td" for line in lines) + " ET"
        objects.append(f"<< /Length {len(stream.encode('ascii'))} >>\nstream\n{stream}\nendstream")
    objects[1] = f"<< /Type /Pages /Kids [{' '.join(f'{number} 0 R' for number in page_ids)}] /Count {pages} >>"

    def render(padding=None):
        rows = list(objects)
        if padding is not None:
            rows.append(f"<< /Length {padding} >>\nstream\n" + "x" * padding + "\nendstream")
        result = "%PDF-1.4\n"
        offsets = []
        for index, obj in enumerate(rows, 1):
            offsets.append(len(result.encode("ascii")))
            result += f"{index} 0 obj\n{obj}\nendobj\n"
        xref = len(result.encode("ascii"))
        result += f"xref\n0 {len(rows) + 1}\n0000000000 65535 f \n"
        result += "".join(f"{offset:010d} 00000 n \n" for offset in offsets)
        result += f"trailer\n<< /Size {len(rows) + 1} /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF\n"
        return result.encode("ascii")

    if exact_bytes is None:
        return render()
    padding = exact_bytes - len(render(0))
    for _ in range(5):
        result = render(padding)
        if len(result) == exact_bytes:
            return result
        padding += exact_bytes - len(result)
    raise AssertionError("Could not construct the exact fixture boundary.")


def scanned_pdf():
    from PIL import Image, ImageDraw, ImageFont
    image = Image.new("RGB", (1400, 1600), "white")
    lines = ["FICTIONAL MATRIX LEARNER", "fixture@example.invalid", "SUMMARY",
             "Python and SQL inventory reports", "SKILLS", "Python SQL Git", "EDUCATION",
             "Fictional learning programme", "This document is only a test fixture."]
    draw = ImageDraw.Draw(image)
    font = ImageFont.load_default(size=44)
    for index, line in enumerate(lines):
        draw.text((60, 60 + index * 105), line, fill="black", font=font)
    output = io.BytesIO()
    image.save(output, format="PDF")
    return output.getvalue()


def structured_docx(*, dense_paragraphs=0):
    from docx import Document
    from docx.oxml import parse_xml
    from docx.oxml.ns import nsdecls
    document = Document()
    document.add_heading("Fictional Matrix Learner", 0)
    document.add_paragraph("fixture@example.invalid")
    document.add_heading("Summary", 1)
    document.add_paragraph("Used Python and SQL to check fictional inventory totals.")
    table = document.add_table(rows=2, cols=2)
    table.cell(0, 0).text = "SKILLS"
    table.cell(0, 1).text = "Python SQL Git"
    table.cell(1, 0).text = "EDUCATION"
    table.cell(1, 1).text = "Fictional learning programme"
    document.element.body.append(parse_xml(f'<w:p {nsdecls("w")}><w:r><w:pict><w:txbxContent><w:p><w:r><w:t>Fictional textbox: checked sample keys.</w:t></w:r></w:p></w:txbxContent></w:pict></w:r></w:p>'))
    document.sections[0].header.paragraphs[0].text = "Fictional matrix header"
    document.sections[0].footer.paragraphs[0].text = "Fictional matrix footer"
    if not isinstance(dense_paragraphs, int) or not 0 <= dense_paragraphs <= 80:
        raise ValueError("Fixture paragraph count is outside the reviewed matrix.")
    for index in range(dense_paragraphs):
        document.add_paragraph(f"Fictional paragraph {index:02d}: " + "Python SQL sample keys, totals and uncertainty; check the fictional records. " * 12)
    output = io.BytesIO()
    document.save(output)
    return output.getvalue()


def upload_limit_docx():
    original = structured_docx()
    def render(padding):
        output = io.BytesIO()
        with zipfile.ZipFile(io.BytesIO(original)) as source, zipfile.ZipFile(output, "w") as target:
            for entry in source.infolist():
                target.writestr(entry, source.read(entry.filename))
            target.writestr("fixture-padding.bin", b"x" * padding, compress_type=zipfile.ZIP_STORED)
        return output.getvalue()
    result = render(MAX_BYTES - len(render(0)))
    assert len(result) == MAX_BYTES
    return result


def expanded_docx_above_limit():
    original = structured_docx()
    output = io.BytesIO()
    with zipfile.ZipFile(io.BytesIO(original)) as source, zipfile.ZipFile(output, "w", compression=zipfile.ZIP_DEFLATED) as target:
        for entry in source.infolist():
            target.writestr(entry.filename, source.read(entry.filename))
        # The parser rejects central-directory sizes before inflating any part.
        target.writestr("fixture-padding.bin", b"x" * (EXPANDED_DOCX_LIMIT + 1))
    return output.getvalue()


@dataclass(frozen=True)
class Fixture:
    id: str
    filename: str
    data: bytes
    native_status: int
    app_status: int
    pages: int | None = None
    methods: tuple[str, ...] = ()
    required_text: tuple[str, ...] = ()
    scope: str = ""

    def manifest(self):
        return {"id": self.id, "filename": self.filename, "bytes": len(self.data),
                "sha256": hashlib.sha256(self.data).hexdigest(),
                "native_status": self.native_status, "app_status": self.app_status,
                "pages": self.pages, "methods": list(self.methods), "required_text": list(self.required_text),
                "scope": self.scope}


def fixtures():
    return [
        Fixture("text-single", "text-single.pdf", text_pdf(), 200, 200, 1, ("pdf-text",), ("Python", "SQL", "page 01 of 01"), "Small text-based baseline."),
        Fixture("text-page-limit", "text-page-limit.pdf", text_pdf(MAX_PAGES), 200, 200, MAX_PAGES, ("pdf-text",), ("page 01 of 12", "page 12 of 12"), "All twelve real page objects are parsed."),
        Fixture("text-upload-limit", "text-upload-limit.pdf", text_pdf(exact_bytes=MAX_BYTES), 200, 200, 1, ("pdf-text",), ("Python", "SQL"), "Exactly 4 MiB with inert unreferenced padding; measures upload envelope, not rendering complexity."),
        Fixture("scan-single", "scan-single.pdf", scanned_pdf(), 200, 200, 1, ("local-ocr",), ("Python", "SQL"), "One 2.24 MP fictional raster page; bundled local OCR, no hidden text layer."),
        Fixture("docx-structured", "docx-structured.docx", structured_docx(), 200, 200, None, ("docx-paragraphs-tables-textboxes",), ("Python SQL Git", "Fictional textbox", "matrix header", "matrix footer"), "Actual table, textbox, header and footer extraction; DOCX pagination remains unknown."),
        Fixture("docx-upload-limit", "docx-upload-limit.docx", upload_limit_docx(), 200, 200, None, ("docx-paragraphs-tables-textboxes",), ("Python SQL Git", "Fictional textbox"), "Exactly 4 MiB with an unreferenced stored ZIP part; upload envelope only. DOCX physical pagination is not computed."),
        Fixture("docx-dense-within-limit", "docx-dense-within-limit.docx", structured_docx(dense_paragraphs=60), 200, 200, None, ("docx-paragraphs-tables-textboxes",), ("Python SQL Git", "Fictional paragraph 59"), "Over 50,000 characters in actual DOCX paragraphs; physical pagination is not computed."),
        Fixture("text-dense-within-limit", "text-dense-within-limit.pdf", text_pdf(MAX_PAGES, dense_lines=52), 200, 200, MAX_PAGES, ("pdf-text",), ("Python", "SQL", "page 12 of 12"), "Twelve dense text pages below the 60,000-character limit."),
        Fixture("reject-page-limit", "reject-page-limit.pdf", text_pdf(MAX_PAGES + 1), 422, 422, scope="Thirteen pages: native page limit rejection before extraction."),
        Fixture("reject-upload-limit", "reject-upload-limit.pdf", text_pdf(exact_bytes=MAX_BYTES + 1), 413, 400, scope="Exactly one byte over 4 MiB: web file validation 400, direct native parser 413."),
        Fixture("reject-text-limit", "reject-text-limit.pdf", text_pdf(MAX_PAGES, dense_lines=80), 422, 422, scope="Twelve pages exceeding 60,000 extracted characters."),
        Fixture("reject-docx-text-limit", "reject-docx-text-limit.docx", structured_docx(dense_paragraphs=80), 422, 422, scope="DOCX paragraphs exceeding 60,000 extracted characters."),
        Fixture("reject-expanded-docx", "reject-expanded-docx.docx", expanded_docx_above_limit(), 413, 413, scope="Expanded ZIP size over 30 MiB; native guard rejects before inflation. Local acceptance only."),
        Fixture("reject-invalid-pdf", "reject-invalid-pdf.pdf", b"This is fictional test text, not a PDF document or a user resume.", 415, 415, scope="Wrong file signature with an allowed extension."),
    ]


def write_fixtures(output):
    directory = Path(output)
    if not directory.is_absolute():
        directory = ROOT / directory
    directory = directory.absolute()
    try:
        directory.relative_to(RUNTIME)
    except ValueError as error:
        raise ValueError("Fixture output must stay inside ignored ml/runtime.") from error
    current = ROOT
    for part in directory.relative_to(ROOT).parts:
        current = current / part
        if current.is_symlink() or getattr(current, "is_junction", lambda: False)():
            raise ValueError("Fixture output cannot traverse links.")
    if directory.resolve() != directory:
        raise ValueError("Fixture output must use a canonical local path.")
    directory.mkdir(parents=True, exist_ok=False)
    rows = []
    for fixture in fixtures():
        if not re.fullmatch(r"[a-z0-9-]+\.(?:pdf|docx)", fixture.filename):
            raise AssertionError("Unexpected fixture name.")
        (directory / fixture.filename).write_bytes(fixture.data)
        rows.append(fixture.manifest())
    report = {"version": 1, "scope": "Fictional fixed documents only; no original user documents or private input.",
              "limits": {"upload_bytes": MAX_BYTES, "pdf_pages": MAX_PAGES, "extracted_characters": TEXT_LIMIT, "docx_expanded_bytes": EXPANDED_DOCX_LIMIT}, "cases": rows}
    (directory / "manifest.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf8")
    return report


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate the fixed fictional document matrix inside ignored ml/runtime.")
    parser.add_argument("--output", required=True)
    options = parser.parse_args()
    report = write_fixtures(options.output)
    print(json.dumps({"version": report["version"], "cases": len(report["cases"]), "limits": report["limits"]}))
