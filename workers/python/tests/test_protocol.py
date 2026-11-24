"""Tests for Universe Python sidecar NDJSON-RPC protocol."""

from __future__ import annotations

import io
import json
import subprocess
import sys
import time
from pathlib import Path

from universe_worker.protocol import WorkerServer


WORKER_ROOT = Path(__file__).resolve().parents[1]


def _parse_lines(buf: io.StringIO) -> list[dict]:
    return [json.loads(line) for line in buf.getvalue().splitlines() if line.strip()]


def test_ping_and_health() -> None:
    inp = io.StringIO(
        json.dumps({"id": 1, "method": "ping"})
        + "\n"
        + json.dumps({"id": 2, "method": "health"})
        + "\n"
        + json.dumps({"id": 3, "method": "shutdown"})
        + "\n"
    )
    out = io.StringIO()
    WorkerServer(inp=inp, out=out).serve_forever()
    msgs = _parse_lines(out)

    assert msgs[0]["id"] == 1
    assert msgs[0]["result"]["pong"] is True
    assert msgs[1]["id"] == 2
    assert msgs[1]["result"]["status"] == "ok"
    assert "system.diagnostic_cycle" in msgs[1]["result"]["tools"]
    assert "ffmpeg" in msgs[1]["result"]["binaries"]
    assert msgs[2]["result"]["shuttingDown"] is True


def test_diagnostic_cycle_streams_progress_and_completes() -> None:
    inp = io.StringIO(
        json.dumps(
            {
                "id": "job-1",
                "method": "run_tool",
                "params": {
                    "jobId": "job-1",
                    "toolId": "system.diagnostic_cycle",
                    "params": {"steps": 4, "stepDelayMs": 5, "inputBytes": 1000000},
                },
            }
        )
        + "\n"
    )
    out = io.StringIO()
    WorkerServer(inp=inp, out=out).serve_forever()
    msgs = _parse_lines(out)

    progress_msgs = [m for m in msgs if m.get("method") == "job.progress"]
    result_msgs = [m for m in msgs if m.get("id") == "job-1" and "result" in m]

    assert len(progress_msgs) == 4
    assert progress_msgs[-1]["params"]["progress"] == 1.0
    assert len(result_msgs) == 1
    assert result_msgs[0]["result"]["metrics"]["inputBytes"] == 1000000
    assert result_msgs[0]["result"]["metrics"]["outputBytes"] < 1000000


def test_live_cancellation_over_stdio_subprocess() -> None:
    proc = subprocess.Popen(
        [sys.executable, "-m", "universe_worker"],
        cwd=str(WORKER_ROOT),
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )
    assert proc.stdin is not None and proc.stdout is not None

    try:
        proc.stdin.write(
            json.dumps(
                {
                    "id": "slow-job",
                    "method": "run_tool",
                    "params": {
                        "jobId": "slow-job",
                        "toolId": "system.diagnostic_cycle",
                        "params": {"steps": 15, "stepDelayMs": 60},
                    },
                }
            )
            + "\n"
        )
        proc.stdin.flush()

        # Wait for first progress notification before cancelling
        first_line = proc.stdout.readline()
        first_msg = json.loads(first_line)
        assert first_msg.get("method") == "job.progress"

        proc.stdin.write(
            json.dumps(
                {"id": "cancel-req", "method": "cancel", "params": {"jobId": "slow-job"}}
            )
            + "\n"
        )
        proc.stdin.flush()

        cancelled_error = None
        deadline = time.time() + 5.0
        while time.time() < deadline:
            line = proc.stdout.readline()
            if not line:
                break
            msg = json.loads(line)
            if msg.get("id") == "slow-job" and "error" in msg:
                cancelled_error = msg["error"]
                break

        assert cancelled_error is not None
        assert cancelled_error["code"] == -32001
        assert cancelled_error["data"]["cancelled"] is True

        proc.stdin.write(json.dumps({"id": "bye", "method": "shutdown"}) + "\n")
        proc.stdin.flush()
        proc.wait(timeout=5)
        assert proc.returncode == 0
    finally:
        if proc.poll() is None:
            proc.kill()
