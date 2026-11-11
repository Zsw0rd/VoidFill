"""Independent native-parser checks for the measured document matrix."""
import io
import zipfile

from fastapi import HTTPException
import pytest

from ml.document_probe_fixtures import fixtures, text_pdf, write_fixtures
from ml.resume import MAX_BYTES, MAX_PAGES, _pdfium_lock, extract_document


@pytest.fixture(scope="module")
def documents():
    return fixtures()


@pytest.mark.parametrize("case_id", ["text-single", "text-page-limit", "text-upload-limit", "scan-single", "docx-structured", "docx-upload-limit", "docx-dense-within-limit", "text-dense-within-limit"])
def test_positive_matrix_documents_use_the_real_parser(documents, case_id):
    row = next(item for item in documents if item.id == case_id)
    text, pages, methods, warnings = extract_document(row.data, row.filename)
    assert pages == row.pages
    assert methods == list(row.methods)
    assert all(marker.casefold() in text.casefold() for marker in row.required_text)
    assert len(text) <= 60_000
    if case_id in ("text-dense-within-limit", "docx-dense-within-limit"):
        assert 50_000 < len(text) <= 60_000
    if case_id == "scan-single":
        assert warnings and "local-ocr" in methods
        # The actual file contains an image, without a hidden PDF text layer.
        import pypdfium2 as pdfium
        with _pdfium_lock, pdfium.PdfDocument(row.data) as document:
            page = document[0]
            textpage = page.get_textpage()
            try:
                assert textpage.count_chars() == 0
            finally:
                textpage.close()
                page.close()
    else:
        assert not warnings


@pytest.mark.parametrize("case_id", ["reject-page-limit", "reject-upload-limit", "reject-text-limit", "reject-docx-text-limit", "reject-expanded-docx", "reject-invalid-pdf"])
def test_negative_matrix_documents_reach_the_intended_guard(documents, case_id):
    row = next(item for item in documents if item.id == case_id)
    with pytest.raises(HTTPException) as error:
        extract_document(row.data, row.filename)
    assert error.value.status_code == row.native_status
    expected = {"reject-page-limit": "12 pages", "reject-upload-limit": "4 MB", "reject-text-limit": "60,000", "reject-docx-text-limit": "60,000", "reject-expanded-docx": "30 MB", "reject-invalid-pdf": "valid PDF and DOCX"}
    assert expected[case_id] in error.value.detail


def test_boundary_fixture_bytes_are_exact_and_inert_padding_is_disclosed(documents):
    by_id = {item.id: item for item in documents}
    assert len(by_id["text-upload-limit"].data) == MAX_BYTES
    assert len(by_id["docx-upload-limit"].data) == MAX_BYTES
    assert len(by_id["reject-upload-limit"].data) == MAX_BYTES + 1
    assert by_id["text-page-limit"].pages == MAX_PAGES
    assert "inert" in by_id["text-upload-limit"].scope
    expanded = by_id["reject-expanded-docx"]
    assert len(expanded.data) < MAX_BYTES
    with zipfile.ZipFile(io.BytesIO(expanded.data)) as archive:
        assert sum(item.file_size for item in archive.infolist()) > 30 * 1024 * 1024
    for kwargs in [{"pages": 14}, {"dense_lines": 81}, {"exact_bytes": 10_000_000}]:
        with pytest.raises(ValueError):
            text_pdf(**kwargs)


def test_resume_metadata_distinguishes_actual_pdf_pages_from_unknown_docx_pagination(documents):
    import numpy as np
    from types import SimpleNamespace
    from ml.career_catalogue import CATALOGUE
    from ml.resume import parse_resume
    engine = SimpleNamespace(report={"model": "synthetic-metadata-test"},
                             career_role_vectors=np.zeros((len(CATALOGUE["roles"]), 2), dtype=np.float32),
                             encode=lambda values, **_: np.zeros((len(values), 2), dtype=np.float32))
    for case_id, count, known in [("text-page-limit", 12, True), ("docx-dense-within-limit", None, False)]:
        row = next(item for item in documents if item.id == case_id)
        result = parse_resume(row.data, row.filename, engine)
        assert result["pages"] == count
        assert result["page_count_known"] is known


def test_fixture_output_cannot_overwrite_or_escape_runtime(tmp_path, monkeypatch):
    import ml.document_probe_fixtures as module
    monkeypatch.setattr(module, "ROOT", tmp_path)
    monkeypatch.setattr(module, "RUNTIME", tmp_path / "ml/runtime")
    with pytest.raises(ValueError, match="inside ignored"):
        write_fixtures(tmp_path / "elsewhere")
    output = tmp_path / "ml/runtime/matrix"
    output.mkdir(parents=True)
    (output / "preserved.txt").write_text("User-owned output is not replaced.")
    with pytest.raises(FileExistsError):
        write_fixtures(output)
    assert (output / "preserved.txt").read_text() == "User-owned output is not replaced."
