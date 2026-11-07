"""Package only validated serving artifacts as sub-50MB Supabase objects."""
import hashlib
import json
import zipfile
from pathlib import Path
from ml.cloud_build import file_sha256, files_from_verified_archive

ROOT = Path(__file__).resolve().parent


def main():
    source = ROOT / "artifacts/cloud"
    output = ROOT / "runtime/cloud-release"
    output.mkdir(parents=True, exist_ok=True)
    archive = output / "model.zip"
    with zipfile.ZipFile(archive, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=1) as bundle:
        for path in sorted(source.iterdir()):
            if path.is_file():
                bundle.write(path, path.name)
        bundle.write(ROOT / "licenses/BGE-base-model-card.md", "licenses/BGE-base-model-card.md")
        bundle.write(ROOT / "licenses/BGE-MIT.txt", "licenses/BGE-MIT.txt")
    digest = file_sha256(archive)
    parts = []
    with archive.open("rb") as stream:
        index = 0
        while data := stream.read(32 * 1024 * 1024):
            filename = f"bge-{digest[:12]}-{index:02d}.part"
            (output / filename).write_bytes(data)
            parts.append({"name": filename, "sha256": hashlib.sha256(data).hexdigest(), "bytes": len(data)})
            index += 1
    release = {"backend": "onnx-fp32", "sha256": digest, "base_url": "https://duklscnzisneioiwgfao.supabase.co/storage/v1/object/public/model-artifacts", "parts": parts,
               "files_archive_sha256": digest, "files": files_from_verified_archive(archive, digest)}
    (ROOT / "cloud-release.json").write_text(json.dumps(release, indent=2) + "\n", encoding="utf8")
    print(json.dumps({"parts": len(parts), "archive_bytes": archive.stat().st_size, "sha256": digest}), flush=True)


if __name__ == "__main__":
    main()
