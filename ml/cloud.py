"""Vercel's private Python service entrypoint. No public routing is exposed."""
import os

os.environ.setdefault("ML_BACKEND", "onnx")
os.environ.setdefault("ML_CPU_THREADS", "1")

from ml.service import app
