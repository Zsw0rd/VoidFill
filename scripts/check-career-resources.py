"""Check public resource links without a signed-in browser or private cookies."""
from concurrent.futures import ThreadPoolExecutor
import argparse
from datetime import datetime, timezone
import json
from pathlib import Path
import re
import urllib.error
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
PACK = ROOT / "ml/data/careers"


def check(resource):
    result = {"id": resource["id"], "url": resource["url"], "title": resource["title"]}
    try:
        request = urllib.request.Request(resource["url"], headers={"User-Agent": "VoidFill-resource-check/1.0 (+educational-link-validation)"})
        with urllib.request.urlopen(request, timeout=25) as response:
            html = response.read(250000).decode("utf8", errors="replace")
            title = re.search(r"<title[^>]*>(.*?)</title>", html, re.I | re.S)
            result.update(status=response.status, final_url=response.url, page_title=re.sub(r"\s+", " ", title.group(1)).strip()[:240] if title else None)
    except urllib.error.HTTPError as error:
        result.update(status=error.code, error="HTTP error; a 403 can indicate automated-request blocking")
    except Exception as error:
        result.update(status=None, error=type(error).__name__ + ": " + str(error)[:160])
    return result


parser = argparse.ArgumentParser()
parser.add_argument("--retry-failed", action="store_true", help="Recheck failed entries from a complete audit of the current resources.")
args = parser.parse_args()
resources = json.loads((PACK / "resources.json").read_text(encoding="utf8"))
previous = {}
if args.retry_failed:
    previous = {row["id"]: row for row in json.loads((PACK / "resource-check.json").read_text(encoding="utf8"))["results"]}
    assert set(previous) == {row["id"] for row in resources}, "Run a full audit after adding resources."
    assert all(previous[row["id"]]["url"] == row["url"] for row in resources), "Resource URLs changed; run a full audit."
pending = [row for row in resources if not args.retry_failed or previous[row["id"]].get("status") != 200]
with ThreadPoolExecutor(max_workers=6) as pool:
    checked = list(pool.map(check, pending))
current = {**previous, **{row["id"]: row for row in checked}}
results = [current[row["id"]] for row in resources]
report = {"checked_at": datetime.now(timezone.utc).isoformat(), "scope": "Public unauthenticated HTTP reachability; does not establish pedagogical quality or availability of every linked course activity.", "results": results}
(PACK / "resource-check.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf8")
for result in checked:
    print(result["status"], result["title"], "->", result.get("page_title") or result.get("error"))
print(f"Verified {sum(row.get('status') == 200 for row in results)}/{len(results)} resource links.")
if any(row.get("status") != 200 for row in results):
    raise SystemExit(1)
