"""Check public resource links without a signed-in browser or private cookies."""
from concurrent.futures import ThreadPoolExecutor
import argparse
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import urllib.error
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
PACK = ROOT / "ml/data/careers"


def check(resource, system_tls=False):
    result = {"id": resource["id"], "url": resource["url"], "title": resource["title"]}
    try:
        if system_tls:
            # Windows' native curl uses its OS certificate store. This is useful
            # when a local Python environment lacks the relevant issuer CA; do
            # not disable certificate checks to make a content audit pass.
            curl = shutil.which("curl.exe" if os.name == "nt" else "curl")
            if not curl:
                raise RuntimeError("System curl is unavailable")
            process = subprocess.run([
                curl, "--head", "--location", "--silent", "--show-error",
                "--max-time", "25", "--proto", "=https", "--proto-redir", "=https",
                "--output", os.devnull, "--write-out", "%{http_code}\\n%{url_effective}",
                "--url", resource["url"],
            ], capture_output=True, text=True, timeout=30,
                creationflags=subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0)
            status, separator, final_url = process.stdout.strip().partition("\n")
            if process.returncode or not separator or not status.isdigit() or not int(status):
                raise RuntimeError("System HTTPS validation failed: " + process.stderr[:160])
            result.update(status=int(status), final_url=final_url, page_title=None, transport="system-curl-head-verified-tls")
            if int(status) >= 400:
                result["error"] = "HTTP error; automated-request blocking is possible"
            return result
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


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--retry-failed", action="store_true", help="Recheck failed entries from a complete audit of the current resources.")
    parser.add_argument("--include-base", action="store_true", help="Also check the 158 inherited resources served alongside the extension; writes a separate full-catalogue report.")
    parser.add_argument("--system-tls", action="store_true", help="Use system curl HEAD requests with normal certificate validation and HTTPS-only redirects; never disables TLS checks.")
    args = parser.parse_args()
    resources = json.loads((PACK / "resources.json").read_text(encoding="utf8"))
    output = PACK / "resource-check.json"
    if args.include_base:
        resources = json.loads((ROOT / "ml/data/resources.json").read_text(encoding="utf8")) + resources
        output = ROOT / "ml/evaluation-career-resources.json"
    previous = {}
    if args.retry_failed:
        previous = {row["id"]: row for row in json.loads(output.read_text(encoding="utf8"))["results"]}
        assert set(previous) == {row["id"] for row in resources}, "Run a full audit after adding resources."
        assert all(previous[row["id"]]["url"] == row["url"] for row in resources), "Resource URLs changed; run a full audit."
    pending = [row for row in resources if not args.retry_failed or previous[row["id"]].get("status") != 200]
    with ThreadPoolExecutor(max_workers=6) as pool:
        checked = list(pool.map(lambda resource: check(resource,args.system_tls), pending))
    current = {**previous, **{row["id"]: row for row in checked}}
    results = [current[row["id"]] for row in resources]
    report = {"checked_at": datetime.now(timezone.utc).isoformat(), "includes_inherited_base": args.include_base, "scope": "Public unauthenticated HTTP reachability; does not establish pedagogical quality or availability of every linked course activity. HTTP 403/429 can reflect automated-request blocking, not a missing resource.", "results": results}
    output.write_text(json.dumps(report, indent=2) + "\n", encoding="utf8")
    for result in checked:
        print(result["status"], result["title"], "->", result.get("page_title") or result.get("error"))
    print(f"Verified {sum(row.get('status') == 200 for row in results)}/{len(results)} resource links.")
    if any(row.get("status") != 200 for row in results):
        raise SystemExit(1)


if __name__ == "__main__":
    main()
