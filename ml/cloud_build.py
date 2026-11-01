"""Fetch checksummed model shards during build, never during a user request."""
import hashlib
import json
import shutil
import tempfile
import urllib.request
import zipfile
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parent


def main():
    release = json.loads((ROOT / "cloud-release.json").read_text(encoding="utf8"))
    target = ROOT / "artifacts/cloud"
    target.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="voidfill-model-") as temporary:
        work = Path(temporary)
        def download(part):
            destination = work / part["name"]
            with urllib.request.urlopen(release["base_url"] + "/" + part["name"], timeout=120) as source, destination.open("wb") as output:
                shutil.copyfileobj(source, output)
            if hashlib.sha256(destination.read_bytes()).hexdigest() != part["sha256"]:
                raise RuntimeError("Model shard checksum mismatch: " + part["name"])
            return destination
        with ThreadPoolExecutor(max_workers=4) as pool:
            files = list(pool.map(download, release["parts"]))
        archive = work / "model.zip"
        with archive.open("wb") as output:
            for file in files:
                with file.open("rb") as source:
                    shutil.copyfileobj(source, output)
        if hashlib.sha256(archive.read_bytes()).hexdigest() != release["sha256"]:
            raise RuntimeError("Model archive checksum mismatch")
        with zipfile.ZipFile(archive) as bundle:
            for item in bundle.infolist():
                path = (target / item.filename).resolve()
                if not path.is_relative_to(target.resolve()) or item.is_dir():
                    raise RuntimeError("Invalid model bundle path")
                path.parent.mkdir(parents=True, exist_ok=True)
                with bundle.open(item) as source, path.open("wb") as output:
                    shutil.copyfileobj(source, output)
    print("Verified model artifacts prepared: " + release["backend"], flush=True)


if __name__ == "__main__":
    main()
