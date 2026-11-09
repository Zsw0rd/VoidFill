# Verified model reuse across Vercel builds

The earlier build script reused `ml/artifacts/cloud` when it existed. This worked
with the explicit GitHub Actions cache and on local checkouts, but a Vercel build
could restore its ordinary build cache and still download every model shard:
the Python builder did not preserve that application directory.

## What changes

`ml.cloud_build` recognizes the active Vercel Python environment through
`VERCEL_PYTHON_VENV_PATH`, only when `VERCEL=1` and the path is one of the current
builder-owned venv layouts inside this checkout. It retains one compressed public
model archive under that venv's `voidfill-model-cache/model.zip`. It does not add
anything to executable Python package directories or modify dependencies.

The source release contains nine shards totaling **276,954,446 body bytes**. The
archive expands to **442,549,415 bytes** across eight model/license files. Retaining
the compressed archive costs less cache space than a second extracted tree. Each
venv retains only one archive, so model releases do not accumulate old weights.

The first clean build without a usable cache downloads and verifies the existing
shards, archive and extracted files, then stores the verified archive. A later
clean build can verify and extract the retained archive with **zero shard
downloads**. Existing valid runtime files still take precedence without fetching
anything; local/CI use does not create a Vercel venv or prime a remote cache.

`vercel.json` explicitly excludes `.vercel/**` from the learning function. The
archive is build-only; the existing runtime model location and lazy inference
behavior are unchanged. Weights, FP32 precision, tokenizer, pooling, truncation,
public embeddings and the model release manifest do not change.

## Trust and failure behavior

- The source-controlled full archive digest and exact file sizes/hashes remain
  authoritative. A cached marker or self-reported hash never establishes trust.
- Every archive reuse checks the exact cache file set, size and SHA-256, then
  checks archive entry names, types, sizes and every extracted file's SHA-256.
- A missing, altered, partial or extra-file cache falls back to a fresh verified
  download. It is replaced only after the downloaded archive and its extracted
  contents pass verification. A failed verification is not published.
- Symlinks/junctions and unsafe/colliding paths fail closed before any download or
  write. Cache operations are restricted to the owned cache directory.
- Missing/unknown builder environment layouts are not guessed. The ordinary
  verified download remains available; no arbitrary `VIRTUAL_ENV` is used.
- Cache eviction, a Python environment recreation, a forced uncached build or a
  future platform layout change can cause a new download. This does not remove
  existing Supabase egress usage or guarantee perpetual cache retention.

## Platform basis and limits

Checked 8 November 2026 against the installed Vercel CLI **65.12.1** and official
`@vercel/python` **31.0.0** implementation. Its `prepareCache` preserves:

```text
**/.vercel/python/{.venv,services/*/.venv,cache/uv}/**
```

The builder sets `VERCEL_PYTHON_VENV_PATH` to its active environment before running
the custom build command. The current named learning service uses
`.vercel/python/services/learning/.venv`; the standard unnamed layout is also
recognized. Vercel does not provide a general project setting to preserve
arbitrary files. This integration depends on the observed native Python cache
contract and must be rechecked when the builder changes.

Primary sources: [official Python builder](https://github.com/vercel/vercel/blob/main/packages/python/src/index.ts),
[runtime cache lifecycle](https://github.com/vercel/vercel/blob/main/DEVELOPING_A_RUNTIME.md#preparecache),
and [Vercel build-cache behavior and limits](https://vercel.com/docs/deployments/troubleshoot-a-build#caching).

Vercel documents a 1 GB build-cache limit. Dependency caches share available
capacity; this archive may be evicted if the complete cache exceeds platform
limits. The archive is public model material, not user data or credentials.

## Evidence and hosted release gate

The focused Python suite uses tiny synthetic archives and no real model downloads.
It covers a cold fixture download, restoring only the venv cache into a second
fresh worktree, zero-network warm reuse, corrupt-cache recovery, unchanged file
contents and all earlier path/hash protections. A separate check invoked the
installed official Python builder's `prepareCache` on a synthetic named venv and
confirmed that it included the model archive.

The sanitized build log has the form:

```json
{"source":"vercel_archive","shard_downloads":0,"download_bytes":0,"archive_bytes":276954446,"archive_cache_enabled":true,"archive_cache_saved":true}
```

Body byte counts exclude HTTP/TLS overhead and are not a billing report. A report
is printed only after successful preparation and current career fingerprints.

Before claiming hosted savings, record two consecutive successful preview builds
using the existing build cache:

1. Confirm the first build primes the archive cache (or already reuses it).
2. Confirm the second build reports `source=vercel_archive`, zero shard downloads
   and zero body bytes downloaded, with current content fingerprints validated.
3. Confirm the private learning function contains no build-cache copy and its
   bundle size has not grown by the retained archive's size.
4. Verify application/learning journeys against the candidate deployment before
   production publication. Record deployment IDs and actual logs in the release
   PR; synthetic tests alone do not prove platform cache retention.

Production's first build can still miss a preview-specific cache. Record that
actual outcome rather than assuming cross-branch reuse. No new provider, upload,
credential, inference dependency or paid plan is introduced.
