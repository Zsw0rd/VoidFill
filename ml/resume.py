"""Local PDF/DOCX extraction, offline OCR, evidence-based resume fields."""
from __future__ import annotations
import io
import re
import threading
import zipfile
from pathlib import Path
import numpy as np
from fastapi import HTTPException

MAX_BYTES = 4 * 1024 * 1024
MAX_PAGES = 12
_ocr = None
_ocr_lock = threading.Lock()
SKILL_ALIASES = {
    "Python": ["python"], "SQL": ["sql", "mysql", "postgresql", "sqlite", "t-sql"],
    "JavaScript": ["javascript", "ecmascript"], "TypeScript": ["typescript"],
    "HTML": ["html", "html5"], "CSS": ["css", "css3", "tailwind"],
    "React": ["react", "reactjs", "next.js", "nextjs"], "Git": ["git", "github", "gitlab"],
    "Data Visualization": ["data visualization", "data visualisation", "matplotlib", "seaborn", "tableau", "power bi", "plotly"],
    "Data Structures & Algorithms": ["data structures", "algorithms", "dsa"],
    "Pandas": ["pandas"], "NumPy": ["numpy"], "Machine Learning": ["machine learning", "scikit-learn", "sklearn"],
    "Deep Learning": ["deep learning", "pytorch", "tensorflow", "keras"],
    "Java": ["java"], "C++": ["c++"], "C#": ["c#", ".net"], "Node.js": ["node.js", "nodejs"],
    "Docker": ["docker"], "AWS": ["aws", "amazon web services"], "Linux": ["linux"],
    "Excel": ["excel"], "MongoDB": ["mongodb"], "REST APIs": ["rest api", "restful"],
    "Communication": ["communication"], "Leadership": ["leadership"], "Figma": ["figma"],
}
APP_SKILLS = {"Python Basics": ["Python", "Pandas", "NumPy"], "SQL Fundamentals": ["SQL"], "Data Visualization": ["Data Visualization"], "Web Fundamentals": ["HTML", "CSS", "JavaScript", "TypeScript", "React"], "Git & Version Control": ["Git"], "DSA Basics": ["Data Structures & Algorithms"]}
HEADINGS = {"summary": r"(?:professional |career )?(?:summary|profile|objective|about me)", "skills": r"(?:(?:technical|core|key|professional) )?(?:skills|competencies|technologies)", "experience": r"(?:(?:work|professional|employment) )?(?:experience|history)|internships?", "education": r"(?:education|academic(?: qualifications| background)?|qualifications)", "projects": r"(?:(?:academic|personal|key) )?projects?", "certifications": r"certifications?|certificates?|courses"}


def ocr_image(image):
    global _ocr
    from rapidocr import RapidOCR
    with _ocr_lock:
        if _ocr is None:
            # The package ships these models. Explicit paths prevent network
            # access (and remote-code/model downloads) during resume ingestion.
            import rapidocr
            models = Path(rapidocr.__file__).parent / "models"
            _ocr = RapidOCR(params={"Det.model_path": str(models / "PP-OCRv6_det_small.onnx"), "Cls.model_path": str(models / "ch_ppocr_mobile_v2.0_cls_mobile.onnx"), "Rec.model_path": str(models / "PP-OCRv6_rec_small.onnx"), "EngineConfig.onnxruntime.intra_op_num_threads": 2})
        result = _ocr(image)
        return "\n".join(t for t, score in zip(result.txts or [], result.scores if result.scores is not None else []) if score >= .5)


def extract_document(data: bytes, filename: str):
    if not data or len(data) > MAX_BYTES:
        raise HTTPException(413, "Choose a PDF or DOCX up to 4 MB.")
    suffix = Path(filename).suffix.lower()
    warnings, methods = [], []
    pages = 1
    if suffix == ".pdf" and data.startswith(b"%PDF-"):
        import pypdfium2 as pdfium
        try:
            with pdfium.PdfDocument(data) as document:
                pages = len(document)
                if pages > MAX_PAGES:
                    raise HTTPException(422, f"Resume exceeds {MAX_PAGES} pages.")
                texts = []
                for page in document:
                    textpage = page.get_textpage()
                    try:
                        text = textpage.get_text_range()
                        if len(re.sub(r"\s", "", text)) < 40:
                            width, height = page.get_size()
                            if min(width, height) <= 0:
                                raise HTTPException(422, "Invalid PDF page dimensions.")
                            # Limit each raster to about four megapixels.
                            bitmap = page.render(scale=min(1.7, 2000 / max(width, height)))
                            image = np.array(bitmap.to_pil().convert("RGB"))
                            text = ocr_image(image)
                            bitmap.close()
                            methods.append("local-ocr")
                        else:
                            methods.append("pdf-text")
                        texts.append(text)
                    finally:
                        textpage.close()
                        page.close()
                text = "\n\n".join(texts)
        except HTTPException:
            raise
        except Exception as error:
            raise HTTPException(422, "Could not read this PDF. Export an unlocked, valid PDF and retry.") from error
        if "local-ocr" in methods:
            warnings.append("Scanned pages used local OCR. Review names, numbers, reading order and skills for recognition errors.")
    elif suffix == ".docx" and zipfile.is_zipfile(io.BytesIO(data)):
        from docx import Document
        try:
            with zipfile.ZipFile(io.BytesIO(data)) as archive:
                if sum(i.file_size for i in archive.infolist()) > 30 * 1024 * 1024:
                    raise HTTPException(413, "Expanded document exceeds the 30 MB limit.")
            document = Document(io.BytesIO(data))
            from docx.text.paragraph import Paragraph
            from docx.table import Table
            lines = []
            for element in document.element.body.iterchildren():
                if element.tag.endswith("}p"):
                    lines.append(Paragraph(element, document).text)
                elif element.tag.endswith("}tbl"):
                    table = Table(element, document)
                    for row in table.rows:
                        lines.extend(dict.fromkeys(c.text for c in row.cells))
            # Textboxes in designed DOCX resumes are outside normal paragraphs.
            for box in document.element.xpath(".//w:txbxContent"):
                    lines.extend(element.text or "" for element in box.iter("{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t"))
            for section in document.sections:
                lines.extend(p.text for p in section.header.paragraphs)
                lines.extend(p.text for p in section.footer.paragraphs)
            text = "\n".join(lines)
            methods.append("docx-paragraphs-tables-textboxes")
        except HTTPException:
            raise
        except Exception as error:
            raise HTTPException(422, "Could not read this DOCX. Save a valid .docx and retry.") from error
    else:
        raise HTTPException(415, "Only valid PDF and DOCX resumes are supported.")
    text = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f]", "", text).strip()
    if len(text) < 40:
        raise HTTPException(422, "Too little readable text. Try a clearer scan or text-based PDF/DOCX.")
    if len(text) > 60000:
        raise HTTPException(422, "Resume contains too much text (maximum 60,000 characters).")
    return text, pages, sorted(set(methods)), warnings


def parse_resume(data, filename, engine):
    text, pages, methods, warnings = extract_document(data, filename)
    lines = [re.sub(r"\s+", " ", line).strip() for line in text.splitlines() if line.strip()]
    sections = {"header": []}
    current = "header"
    for line in lines:
        heading = next((key for key, pattern in HEADINGS.items() if re.fullmatch(pattern + r"\s*:?", line, re.I)), None)
        if heading:
            current = heading
            sections.setdefault(current, [])
        else:
            sections.setdefault(current, []).append(line)
    email = re.search(r"[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}", text)
    phone = re.search(r"(?<!\w)(?:\+\d{1,3}[\s.-]?)?(?:\(?\d{3,5}\)?[\s.-]?){2,3}\d{3,4}(?!\w)", text)
    name = next((line for line in lines[:6] if 2 <= len(line.split()) <= 5 and len(line) <= 70 and re.fullmatch(r"[A-Za-zÀ-ž .'-]+", line) and not any(re.search(p, line, re.I) for p in HEADINGS.values()) and not re.search(r"developer|engineer|analyst|resume|curriculum|vitae|portfolio", line, re.I)), "")
    skills = []
    for canonical, aliases in SKILL_ALIASES.items():
        matches = [line for line in lines if any(re.search(r"(?<![\w+#])" + re.escape(alias) + r"(?![\w+#])", line, re.I) for alias in aliases)]
        if matches:
            skills.append({"name": canonical, "evidence": matches[0][:240], "source": "explicit mention"})
    names = {s["name"] for s in skills}
    matched = [{"name": name, "evidence_skills": [s for s in aliases if s in names], "assessed": False} for name, aliases in APP_SKILLS.items() if any(s in names for s in aliases)]
    # Existing locally fine-tuned encoder ranks career contexts; similarity is
    # deliberately labelled as similarity, never mastery or extraction certainty.
    role_descriptions = ["Data Analyst SQL Python pandas data visualization statistics dashboards Excel", "Frontend Developer HTML CSS JavaScript TypeScript React Git web development", "AI Applications Developer Python machine learning SQL deep learning algorithms Git"]
    vector = engine.encode([", ".join(sorted(names)) + ". " + " ".join(sections.get("summary", []))[:800]])[0]
    similarities = vector @ engine.encode(role_descriptions).T
    suggestions = [{"name": role_descriptions[i].split(" SQL")[0] if i == 0 else "Frontend Developer" if i == 1 else "AI Applications Developer", "similarity": round(float(similarities[i]), 4)} for i in np.argsort(-similarities) if names]
    if not email:
        warnings.append("No email address was found.")
    if not sections.get("education"):
        warnings.append("Education section was not recognized; check the extracted text.")
    if not skills:
        warnings.append("No supported skill mentions were found. You can enter skills manually in your profile.")
    warnings.append("Designed layouts and scans are supported on a best-effort basis. Check the extracted text before applying fields.")
    return {"filename": Path(filename).name[:150], "name": name, "email": email.group() if email else "", "phone": phone.group().strip() if phone else "", "skills": skills, "matched_app_skills": matched, "sections": sections, "role_suggestions": suggestions, "text": text, "pages": pages, "methods": methods, "warnings": warnings, "model": engine.report["model"], "note": "Resume skills are self-reported claims, not assessed proficiency. Original file and extraction are not retained by the server."}
