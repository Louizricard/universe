"""NDJSON-RPC over stdin/stdout server for Universe Python sidecar."""

from __future__ import annotations

import json
import sys
import threading
import traceback
from typing import Any, TextIO

from . import __version__
from .engines.base import CancelledError, ToolContext
from .engines.registry import (
    detect_available_binaries,
    get_tool,
    list_registered_tools,
)


class WorkerServer:
    """Line-delimited JSON-RPC worker supporting streaming progress and live cancellation."""

    def __init__(self, inp: TextIO | None = None, out: TextIO | None = None) -> None:
        self._in = inp or sys.stdin
        self._out = out or sys.stdout
        self._write_lock = threading.Lock()
        self._jobs_lock = threading.Lock()
        self._cancel_events: dict[str, threading.Event] = {}
        self._threads: list[threading.Thread] = []

    def _send(self, payload: dict[str, Any]) -> None:
        line = json.dumps(payload, ensure_ascii=False)
        with self._write_lock:
            self._out.write(line + "\n")
            self._out.flush()

    def _send_result(self, req_id: str | int | None, result: Any) -> None:
        self._send({"jsonrpc": "2.0", "id": req_id, "result": result})

    def _send_error(
        self, req_id: str | int | None, code: int, message: str, data: Any = None
    ) -> None:
        err: dict[str, Any] = {"code": code, "message": message}
        if data is not None:
            err["data"] = data
        self._send({"jsonrpc": "2.0", "id": req_id, "error": err})

    def _send_progress(
        self,
        job_id: str,
        progress: float,
        stage: str,
        metrics: dict[str, Any] | None = None,
    ) -> None:
        self._send(
            {
                "jsonrpc": "2.0",
                "method": "job.progress",
                "params": {
                    "jobId": job_id,
                    "progress": max(0.0, min(1.0, float(progress))),
                    "stage": stage,
                    "metrics": metrics or {},
                },
            }
        )

    def _handle_run_tool(
        self, req_id: str | int | None, params: dict[str, Any]
    ) -> None:
        job_id = str(params.get("jobId") or req_id or "anonymous")
        tool_id = str(params.get("toolId") or "")
        tool_params = params.get("params")
        if not isinstance(tool_params, dict):
            tool_params = {}

        handler = get_tool(tool_id)
        if handler is None:
            self._send_error(
                req_id,
                -32601,
                f"Tool '{tool_id}' is not registered in the Python worker",
                {"availableTools": list_registered_tools()},
            )
            return

        cancel_event = threading.Event()
        with self._jobs_lock:
            self._cancel_events[job_id] = cancel_event

        def _worker() -> None:
            try:
                ctx = ToolContext(
                    job_id=job_id,
                    tool_id=tool_id,
                    params=tool_params,
                    emit_progress=lambda p, s, m=None: self._send_progress(
                        job_id, p, s, m
                    ),
                    is_cancelled=cancel_event.is_set,
                )
                result = handler(ctx)
                if cancel_event.is_set():
                    self._send_error(
                        req_id, -32001, f"Job '{job_id}' cancelled", {"cancelled": True}
                    )
                else:
                    self._send_result(req_id, result.to_dict())
            except CancelledError as exc:
                self._send_error(req_id, -32001, str(exc), {"cancelled": True})
            except Exception as exc:  # noqa: BLE001
                self._send_error(
                    req_id,
                    -32000,
                    str(exc),
                    {"traceback": traceback.format_exc(limit=5)},
                )
            finally:
                with self._jobs_lock:
                    self._cancel_events.pop(job_id, None)

        thread = threading.Thread(target=_worker, name=f"job-{job_id}", daemon=True)
        self._threads.append(thread)
        thread.start()

    def handle_line(self, raw_line: str) -> bool:
        """Process a single NDJSON request line. Returns False when shutdown is requested."""
        line = raw_line.strip()
        if not line:
            return True

        try:
            msg = json.loads(line)
        except json.JSONDecodeError as exc:
            self._send_error(None, -32700, f"Invalid JSON: {exc}")
            return True

        if not isinstance(msg, dict):
            self._send_error(None, -32600, "Request must be a JSON object")
            return True

        req_id = msg.get("id")
        method = msg.get("method")
        params = msg.get("params")
        if not isinstance(params, dict):
            params = {}

        if method == "ping":
            self._send_result(req_id, {"pong": True, "version": __version__})
        elif method == "health":
            self._send_result(
                req_id,
                {
                    "status": "ok",
                    "version": __version__,
                    "python": sys.version.split()[0],
                    "tools": list_registered_tools(),
                    "binaries": detect_available_binaries(),
                },
            )
        elif method == "run_tool":
            self._handle_run_tool(req_id, params)
        elif method == "cancel":
            job_id = str(params.get("jobId") or "")
            with self._jobs_lock:
                ev = self._cancel_events.get(job_id)
                if ev is not None:
                    ev.set()
                    self._send_result(req_id, {"cancelled": True, "jobId": job_id})
                else:
                    self._send_result(req_id, {"cancelled": False, "jobId": job_id})
        elif method == "shutdown":
            self._send_result(req_id, {"shuttingDown": True})
            return False
        else:
            self._send_error(req_id, -32601, f"Unknown method: {method}")

        return True

    def serve_forever(self) -> None:
        for line in self._in:
            if not self.handle_line(line):
                break
        for thread in self._threads:
            thread.join(timeout=2.0)
