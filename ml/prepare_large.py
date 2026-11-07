"""Pin and curate a larger technical question/answer retrieval corpus.

Only public dataset files are downloaded; none of their code is executed.
Raw text stays in ignored local research storage, never in the product MCQ bank.
"""
import gzip
import hashlib
import html
import json
import random
import re
from collections import Counter
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from huggingface_hub import hf_hub_download
from ml.train import ROOT
from ml.prepare_data import clean
from ml.retrieval import passages

DATASET = "flax-sentence-embeddings/stackexchange_title_best_voted_answer_jsonl"
REVISION = "88957a0e825f49aeb2a7bfd828cb46b79010b286"
SITES = {"dba": 14000, "stats": 14000, "cs": 12000, "datascience": 11000, "softwareengineering": 10000, "webmasters": 8000, "ai": 4000}


def normalized(text):
    return re.sub(r"\W+", " ", html.unescape(text).lower()).strip()


def build_task_examples(resources, pairs, groups):
    excluded = set(groups["validation"]) | set(groups["test"])
    examples = []
    for resource in resources:
        rid = resource["id"]
        if rid in excluded or not resource.get("source_path"):
            continue
        path = ROOT / "data/raw" / resource["source"] / resource["source_path"]
        if not path.exists():
            continue
        markdown = path.read_text(encoding="utf8")
        for heading, content in re.findall(r"(?m)^#{1,4}\s+([^\n]+)\n([\s\S]*?)(?=^#{1,4}\s|\Z)", markdown):
            heading, content = clean(heading), clean(content)
            if len(heading) < 8 or len(content) < 100 or re.search(r"quiz|challenge|assignment|review|self.study|contribut|license|sketchnote|^introduction$", heading, re.I):
                continue
            examples.append({"query": heading, "positive": resource["title"] + ". " + content[:1200], "group": rid, "kind": "source heading"})
        for window in passages(resource):
            text = window[len(resource["title"]) + 2:]
            if len(text) > 120:
                examples.append({"query": text[:300], "positive": resource["title"] + ". " + resource["description"], "group": rid, "kind": "source excerpt"})
    # Passage positives for the stronger quiz labels are chosen later with a
    # frozen teacher. No held-out question is supplied to that procedure.
    for pair in pairs:
        if pair["group"] in groups["train"]:
            examples.append({**pair, "kind": "author quiz link"})
    return examples


def main():
    raw_dir = ROOT / "data/raw/technical-qa"
    raw_dir.mkdir(parents=True, exist_ok=True)
    pairs = json.loads((ROOT / "data/training_pairs.json").read_text(encoding="utf8"))
    resources = json.loads((ROOT / "data/resources.json").read_text(encoding="utf8"))
    groups = json.loads((ROOT / "data/splits.json").read_text(encoding="utf8"))
    seen = {normalized(p["query"]) for p in pairs}
    answers_seen = set()
    rejected = Counter()
    splits = {"train": [], "validation": [], "test": []}
    source_files = []
    def download(site):
        filename = f"{site}.stackexchange.com.jsonl.gz"
        path = hf_hub_download(DATASET, filename, repo_type="dataset", revision=REVISION, local_dir=raw_dir)
        return site, path
    with ThreadPoolExecutor(max_workers=4) as pool:
        downloads = list(pool.map(download, SITES))
    for site, filename in downloads:
        rows = []
        with gzip.open(filename, "rt", encoding="utf8") as stream:
            for line_number, line in enumerate(stream, 1):
                row = json.loads(line)
                if isinstance(row, list) and len(row) == 2:
                    row = {"title": row[0], "upvoted_answer": row[1]}
                if not isinstance(row, dict):
                    rejected["invalid_schema"] += 1
                    continue
                query = clean(html.unescape(row.get("title", row.get("title_body", ""))))
                answer = clean(html.unescape(row.get("upvoted_answer", "")))
                qkey = normalized(query)
                akey = hashlib.sha256(normalized(answer).encode()).hexdigest()
                if not 15 <= len(query) <= 400 or not 100 <= len(answer) <= 12000:
                    rejected["length"] += 1
                    continue
                if qkey in seen or akey in answers_seen:
                    rejected["duplicate_or_curriculum_overlap"] += 1
                    continue
                if re.search(r"\b(?:password|credential|api key)\s*[:=]\s*\S{12,}", answer, re.I):
                    rejected["credential_like_text"] += 1
                    continue
                seen.add(qkey); answers_seen.add(akey)
                rows.append({"query": query, "positive": answer[:1800], "group": hashlib.sha256(qkey.encode()).hexdigest()[:24], "site": site, "source_line": line_number})
        random.Random(47).shuffle(rows)
        selected = rows[:SITES[site]]
        for row in selected:
            bucket = int(row["group"][:8], 16) % 100
            split = "validation" if bucket < 2 else "test" if bucket < 4 else "train"
            splits[split].append(row)
        source_files.append({"site": site, "filename": Path(filename).name, "sha256": hashlib.sha256(Path(filename).read_bytes()).hexdigest(), "eligible": len(rows), "selected": len(selected)})
        print(f"{site}: {len(selected)} selected from {len(rows)} eligible", flush=True)
    task = build_task_examples(resources, pairs, groups)
    for part, rows in splits.items():
        (raw_dir / f"{part}.json").write_text(json.dumps(rows, ensure_ascii=False), encoding="utf8")
    (raw_dir / "curriculum.json").write_text(json.dumps(task, ensure_ascii=False), encoding="utf8")
    card = hf_hub_download(DATASET, "README.md", repo_type="dataset", revision=REVISION, local_dir=raw_dir)
    (ROOT / "licenses/Technical-QA-dataset-card.md").write_text(Path(card).read_text(encoding="utf8"), encoding="utf8")
    manifest = {"dataset": DATASET, "revision": REVISION, "url": f"https://huggingface.co/datasets/{DATASET}", "dataset_card_license": "CC-BY-NC-SA-4.0", "usage": "Local noncommercial academic research. Export lacks per-post author/URL attribution. Resolve attribution and applicable rights before commercial use or redistribution of data/derived weights. No records enter product questions or resources.", "source_files": source_files, "splits": {k: len(v) for k, v in splits.items()}, "split_rule": "normalized titles and full answers deduplicated globally; SHA256 title hash buckets 96/2/2; all frozen curriculum query strings excluded; no external test rows used in fitting or selection", "curriculum_examples": len(task), "curriculum_training_lessons": len({p['group'] for p in task}), "curriculum_heldout_lessons": len(set(groups['test']) | set(groups['validation'])), "curriculum_supervision": dict(Counter(p['kind'] for p in task)), "rejected": dict(rejected), "seed": 47, "prepared_sha256": {name: hashlib.sha256((raw_dir / f"{name}.json").read_bytes()).hexdigest() for name in (*splits, "curriculum")}}
    (ROOT / "data/large_manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf8")
    print(json.dumps(manifest), flush=True)


if __name__ == "__main__": main()
