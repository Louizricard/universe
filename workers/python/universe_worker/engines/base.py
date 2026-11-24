"""Base contracts and telemetry helpers for Universe worker engines."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Callable, Protocol


ProgressCallback = Callable[[float, str, dict[str, Any] | None], None]


@dataclass(slots=True)
class ToolContext:
    """Execution context passed to every worker tool handler."""

    job_id: str
    tool_id: str
    params: dict[str, Any]
    emit_progress: ProgressCallback
    is_cancelled: Callable[[], bool]


@dataclass(slots=True)
class ToolResult:
    """Structured result emitted upon successful tool execution."""

    output_paths: list[str] = field(default_factory=list)
    summary: str = ""
    metrics: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return {
            "outputPaths": self.output_paths,
            "summary": self.summary,
            "metrics": self.metrics,
        }


class CancelledError(RuntimeError):
    """Raised when a running job observes a cancellation request."""


class ToolHandler(Protocol):
    """Protocol implemented by tool handlers in the Python worker."""

    def __call__(self, ctx: ToolContext) -> ToolResult: ...
