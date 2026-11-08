"""Private process metadata. No inputs, URLs, identities or tokens enter events."""
import json
import os
import sys
import threading
import time
import uuid

_started = time.perf_counter()
_runtime_id = str(uuid.uuid4())
_request_lock = threading.Lock()
_requests = 0


def begin_request():
    global _requests
    with _request_lock:
        first = _requests == 0
        _requests += 1
    return time.perf_counter(), time.process_time_ns(), first


def process_memory():
    current = None
    try:
        if sys.platform.startswith("linux"):
            with open("/proc/self/statm", encoding="ascii") as source:
                current = int(source.read().split()[1]) * os.sysconf("SC_PAGE_SIZE")
    except (OSError, ValueError, IndexError):
        pass
    peak = None
    try:
        import resource
        peak = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss
        if sys.platform != "darwin":
            peak *= 1024
    except (ImportError, OSError, ValueError):
        pass
    return {"rss_bytes": current, "peak_rss_bytes": peak}


def safe_operation(path):
    return {"/health": "health", "/assessment": "assessment", "/recommend": "recommendation",
            "/analyze": "insight", "/resume/parse": "resume"}.get(path, "guest" if path.startswith("/guest/") else "other")


def finish_request(start, operation, status):
    wall, cpu, first = start
    event = {
        "event": "ml_request", "operation": operation, "status": status,
        "duration_ms": round((time.perf_counter() - wall) * 1000, 1),
        "runtime": {"runtime_id": _runtime_id, "first_request_in_process": first,
                    "runtime_age_ms": round((time.perf_counter() - _started) * 1000),
                    "process_cpu_delta_us": max(0, (time.process_time_ns() - cpu) // 1000),
                    **process_memory()},
    }
    print(json.dumps(event, separators=(",", ":")), flush=True)


def begin_initialization():
    return time.perf_counter()


def finish_initialization(component, started, succeeded):
    if component not in {"learning_engine", "onnx_session"}:
        component = "other"
    print(json.dumps({"event": "ml_initialization", "component": component,
                      "succeeded": bool(succeeded), "runtime_id": _runtime_id,
                      "duration_ms": round((time.perf_counter() - started) * 1000, 1),
                      **process_memory()}, separators=(",", ":")), flush=True)
