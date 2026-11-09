"""PDFium is not thread safe: prove serial native lifetimes, not just good output."""
import sys
import threading
from concurrent.futures import ThreadPoolExecutor
from types import SimpleNamespace

import pytest
from fastapi import HTTPException
from ml.resume import extract_document


def test_separate_documents_never_overlap_native_lifetimes(monkeypatch):
    first_inside = threading.Event()
    release_first = threading.Event()
    second_attempted = threading.Event()
    second_inside = threading.Event()
    state = {"active": 0, "peak": 0, "opens": 0, "closed": 0}

    class TextPage:
        def get_text_range(self):
            return "Fictional Python and SQL practice experience with a sufficiently long readable text layer."
        def close(self):
            assert state["active"] == 1

    class Page:
        def get_textpage(self):
            assert state["active"] == 1
            return TextPage()
        def close(self):
            assert state["active"] == 1

    class Document:
        def __init__(self, _data):
            state["active"] += 1
            state["peak"] = max(state["peak"], state["active"])
            state["opens"] += 1
            if state["opens"] == 1:
                first_inside.set()
                assert release_first.wait(3)
            else:
                second_inside.set()
        def __enter__(self):
            return self
        def __len__(self):
            return 1
        def __iter__(self):
            yield Page()
        def __exit__(self, *_args):
            assert state["active"] == 1
            state["closed"] += 1
            state["active"] -= 1

    monkeypatch.setitem(sys.modules, "pypdfium2", SimpleNamespace(PdfDocument=Document))
    def second():
        second_attempted.set()
        return extract_document(b"%PDF-synthetic", "second.pdf")
    with ThreadPoolExecutor(max_workers=2) as pool:
        a = pool.submit(extract_document, b"%PDF-synthetic", "first.pdf")
        try:
            assert first_inside.wait(3)
            b = pool.submit(second)
            assert second_attempted.wait(3)
            assert not second_inside.wait(.1), "a second document entered native PDFium while the first remained open"
        finally:
            release_first.set()
        assert a.result(timeout=3)[1:3] == (1, ["pdf-text"])
        assert b.result(timeout=3)[1:3] == (1, ["pdf-text"])
    assert state == {"active": 0, "peak": 1, "opens": 2, "closed": 2}


def test_pdf_lock_is_released_after_parser_failure(monkeypatch):
    state = {"opens": 0}
    class BrokenDocument:
        def __init__(self, _data):
            state["opens"] += 1
            raise ValueError("fictional parser failure")
    monkeypatch.setitem(sys.modules, "pypdfium2", SimpleNamespace(PdfDocument=BrokenDocument))
    with ThreadPoolExecutor(max_workers=1) as pool:
        for _ in range(2):
            with pytest.raises(HTTPException) as failure:
                pool.submit(extract_document, b"%PDF-broken", "broken.pdf").result(timeout=2)
            assert failure.value.status_code == 422
    assert state["opens"] == 2


def test_real_pdf_documents_keep_their_own_text_under_parallel_callers():
    from ml.tests.test_guest_resume import pdf_text_fixture
    def read(index):
        marker = f"Fictional independent document number {index}"
        content = pdf_text_fixture([marker, "Python and SQL projects with clearly documented duplicate record checks."])
        text, pages, methods, warnings = extract_document(content, "fictional.pdf")
        assert marker in text
        assert pages == 1 and methods == ["pdf-text"] and warnings == []
        return text
    with ThreadPoolExecutor(max_workers=4) as pool:
        results = list(pool.map(read, range(16)))
    assert len(set(results)) == 16


def test_rendered_bitmap_is_closed_before_leaving_pdf_lock_when_ocr_fails(monkeypatch):
    from PIL import Image
    import ml.resume as resume
    state = {"document_open": False, "bitmap_closed": False, "page_closed": False}
    class Bitmap:
        def to_pil(self):
            return Image.new("RGB", (2, 2), "white")
        def close(self):
            assert state["document_open"]
            state["bitmap_closed"] = True
    class TextPage:
        def get_text_range(self):
            return ""
        def close(self):
            assert state["document_open"]
    class Page:
        def get_textpage(self):
            return TextPage()
        def get_size(self):
            return 100, 100
        def render(self, **_options):
            return Bitmap()
        def close(self):
            assert state["document_open"]
            state["page_closed"] = True
    class Document:
        def __init__(self, _data):
            state["document_open"] = True
        def __enter__(self):
            return self
        def __len__(self):
            return 1
        def __iter__(self):
            yield Page()
        def __exit__(self, *_args):
            assert state["bitmap_closed"] and state["page_closed"]
            state["document_open"] = False
    def failed_ocr(_image):
        raise RuntimeError("fictional OCR failure")
    monkeypatch.setitem(sys.modules, "pypdfium2", SimpleNamespace(PdfDocument=Document))
    monkeypatch.setattr(resume, "ocr_image", failed_ocr)
    with pytest.raises(HTTPException) as failure:
        extract_document(b"%PDF-synthetic", "scanned.pdf")
    assert failure.value.status_code == 422
    assert state == {"document_open": False, "bitmap_closed": True, "page_closed": True}
