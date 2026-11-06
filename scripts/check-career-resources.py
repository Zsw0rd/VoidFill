"""Check public resource links without a signed-in browser or private cookies."""
from concurrent.futures import ThreadPoolExecutor
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


resources = json.loads((PACK / "resources.json").read_text(encoding="utf8"))
with ThreadPoolExecutor(max_workers=6) as pool:
    results = list(pool.map(check, resources))
report = {"checked_at": datetime.now(timezone.utc).isoformat(), "scope": "Public unauthenticated HTTP reachability; does not establish pedagogical quality or availability of every linked course activity.", "results": results}
(PACK / "resource-check.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf8")
for result in results:
    print(result["status"], result["title"], "->", result.get("page_title") or result.get("error"))
