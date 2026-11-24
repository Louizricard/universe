"""Engine registry and Fase 0 diagnostic handlers for Universe worker."""

from __future__ import annotations

import shutil
import sys
import time
from typing import Any

from .base import CancelledError, ToolContext, ToolHandler, ToolResult


_REGISTRY: dict[str, ToolHandler] = {}


def register_tool(tool_id: str, handler: ToolHandler) -> None:
    _REGISTRY[tool_id] = handler


def get_tool(tool_id: str) -> ToolHandler | None:
    return _REGISTRY.get(tool_id)


def list_registered_tools() -> list[str]:
    return sorted(_REGISTRY.keys())


def detect_available_binaries() -> dict[str, dict[str, Any]]:
    """Inspect host PATH for optional local engines used across Phases 1-3."""
    bins = ["ffmpeg", "yt-dlp", "gallery-dl", "soffice", "tesseract", "gs", "exiftool"]
    result: dict[str, dict[str, Any]] = {}
    for name in bins:
        path = shutil.which(name)
        result[name] = {
            "installed": path is not None,
            "path": path,
        }
    return result


def _diagnostic_cycle(ctx: ToolContext) -> ToolResult:
    """Deterministic multi-stage diagnostic tool for Fase 0 IPC & telemetry verification."""
    steps = max(1, min(int(ctx.params.get("steps", 5)), 20))
    delay_ms = max(0, min(int(ctx.params.get("stepDelayMs", 40)), 500))
    input_bytes = max(1024, int(ctx.params.get("inputBytes", 10_485_760)))
    target_ratio = float(ctx.params.get("targetRatio", 0.28))
    stages = ["loading", "aligning", "pressing", "sealing", "verifying"]

    for idx in range(1, steps + 1):
        if ctx.is_cancelled():
            raise CancelledError(f"Job {ctx.job_id} cancelled at step {idx}/{steps}")
        progress = round(idx / steps, 4)
        stage = stages[min(len(stages) - 1, int((idx - 1) * len(stages) / steps))]
        current_bytes = int(input_bytes * (1.0 - (1.0 - target_ratio) * progress))
        ctx.emit_progress(
            progress,
            stage,
            {
                "inputBytes": input_bytes,
                "currentBytes": current_bytes,
                "deltaPercent": round((1.0 - current_bytes / input_bytes) * 100.0, 1),
                "step": idx,
                "totalSteps": steps,
            },
        )
        if delay_ms > 0:
            time.sleep(delay_ms / 1000.0)

    final_bytes = int(input_bytes * target_ratio)
    return ToolResult(
        output_paths=[],
        summary=f"Ciclo diagnóstico concluído ({ctx.tool_id})",
        metrics={
            "inputBytes": input_bytes,
            "outputBytes": final_bytes,
            "deltaPercent": round((1.0 - final_bytes / input_bytes) * 100.0, 1),
            "pythonVersion": sys.version.split()[0],
        },
    )


register_tool("system.diagnostic_cycle", _diagnostic_cycle)
