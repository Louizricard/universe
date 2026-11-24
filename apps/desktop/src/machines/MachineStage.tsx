import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Upload, CheckCircle2, AlertTriangle, RotateCcw } from "lucide-react";
import type { MachinePhase, MachineTelemetry, ToolSpec } from "@/registry/types";
import { CATEGORY_MAP } from "@/registry/categories";
import { StatusLed } from "@/design-system/components";
import { MOTION } from "@/design-system/motion";
import { formatBytes } from "@/lib/detector";
import { renderMachinePrimitive } from "./primitives";

export interface MachineStageProps {
  tool: ToolSpec;
  phase: MachinePhase;
  progress: number;
  stageLabel?: string;
  fileLabel?: string;
  telemetry?: MachineTelemetry;
  errorMessage?: string | null;
  onFilesPicked?: (files: FileList) => void;
  onReset?: () => void;
}

const PHASE_META: Record<
  MachinePhase,
  { label: string; led: "idle" | "signal" | "ok" | "err" | "warn" }
> = {
  idle: { label: "EM REPOUSO", led: "idle" },
  hover: { label: "TRAVA ARMADA", led: "signal" },
  armed: { label: "CARGA PRONTA", led: "warn" },
  running: { label: "EM OPERAÇÃO", led: "signal" },
  success: { label: "CONCLUÍDO", led: "ok" },
  error: { label: "FALHA DETECTADA", led: "err" },
  cancelled: { label: "CANCELADO", led: "warn" },
};

export function MachineStage({
  tool,
  phase,
  progress,
  stageLabel,
  fileLabel,
  telemetry,
  errorMessage,
  onFilesPicked,
  onReset,
}: MachineStageProps) {
  const [isDragOver, setIsDragOver] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const category = CATEGORY_MAP[tool.category];
  const effectivePhase: MachinePhase = isDragOver && phase !== "running" ? "hover" : phase;
  const meta = PHASE_META[effectivePhase];
  const pct = Math.round((effectivePhase === "success" ? 1 : progress) * 100);

  return (
    <div
      data-testid="machine-stage"
      data-phase={effectivePhase}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files?.length && onFilesPicked) {
          onFilesPicked(e.dataTransfer.files);
        }
      }}
      className="relative flex flex-col justify-between rounded-[14px] border bg-[var(--bg-module)] overflow-hidden min-h-[420px]"
      style={{
        borderColor: isDragOver ? "var(--accent-signal)" : "var(--border-subtle)",
        boxShadow: "var(--shadow-module)",
      }}
    >
      {/* Top Machine Telemetry Strip */}
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-[var(--border-subtle)] bg-[var(--bg-workbench)]">
        <div className="flex items-center gap-2.5 min-w-0">
          <StatusLed tone={meta.led} label={meta.label} />
          <span className="font-mono-tech text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--text-primary)] truncate">
            {tool.machineName}
          </span>
          <span className="font-mono-tech text-[11px] text-[var(--text-muted)]">
            #{String(tool.number).padStart(2, "0")}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="font-mono-tech text-[11px] text-[var(--text-secondary)]">
            {meta.label}
          </span>
          <span className="font-mono-tech text-[11px] font-semibold text-[var(--accent-signal)] min-w-[36px] text-right">
            {pct}%
          </span>
        </div>
      </div>

      {/* Central Recessed Mechanical Chamber */}
      <div className="workbench-grid-bg relative flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-[400px]">
          {renderMachinePrimitive(tool.machineArchetype, {
            phase: effectivePhase,
            progress,
            accentColor: category.cssVar,
            fileLabel,
            telemetry,
          })}
        </div>

        {/* Status / Interactive Prompt Bar inside chamber */}
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-center">
          <AnimatePresence mode="wait" initial={false}>
            {effectivePhase === "running" && (
              <motion.div
                key="running"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={MOTION.fadeFast}
                className="flex items-center gap-2 rounded-full border border-[var(--border-strong)] bg-[var(--bg-module)] px-3 py-1 text-[12px] text-[var(--text-primary)]"
              >
                <span className="font-medium">{tool.machineVerb}</span>
                {stageLabel && (
                  <span className="font-mono-tech text-[11px] text-[var(--text-muted)]">
                    [{stageLabel}]
                  </span>
                )}
              </motion.div>
            )}

            {effectivePhase === "success" && (
              <motion.div
                key="success"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={MOTION.fadeFast}
                className="flex items-center gap-2 rounded-full border border-[var(--status-ok)] bg-[var(--bg-module)] px-3.5 py-1 text-[12px] font-medium text-[var(--status-ok)]"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Operação concluída com sucesso</span>
                {telemetry?.deltaPercent !== undefined && telemetry.deltaPercent > 0 && (
                  <span className="font-mono-tech font-semibold">
                    −{telemetry.deltaPercent}%
                  </span>
                )}
              </motion.div>
            )}

            {effectivePhase === "error" && (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={MOTION.fadeFast}
                className="flex items-center gap-2 rounded-[8px] border border-[var(--status-err)] bg-[var(--bg-module)] px-3 py-1.5 text-[12px] text-[var(--status-err)]"
              >
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMessage ?? "Falha durante a execução."}</span>
                {onReset && (
                  <button
                    type="button"
                    onClick={onReset}
                    className="ml-1 inline-flex items-center gap-1 underline font-medium cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" /> Resetar
                  </button>
                )}
              </motion.div>
            )}

            {(effectivePhase === "idle" || effectivePhase === "hover" || effectivePhase === "armed" || effectivePhase === "cancelled") &&
              tool.inputKind !== "none" &&
              tool.inputKind !== "url" &&
              tool.inputKind !== "text" && (
                <motion.div
                  key="drop-trigger"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={MOTION.fadeFast}
                >
                  <input
                    ref={inputRef}
                    type="file"
                    multiple={tool.inputKind === "files"}
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.length && onFilesPicked) {
                        onFilesPicked(e.target.files);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="inline-flex items-center gap-2 rounded-[8px] border border-dashed border-[var(--border-strong)] bg-[var(--bg-module)] px-3.5 py-2 text-[12px] font-medium text-[var(--text-primary)] hover:border-[var(--accent-signal)] cursor-pointer transition-colors duration-100"
                  >
                    <Upload className="w-3.5 h-3.5 text-[var(--accent-signal)]" />
                    {fileLabel
                      ? `Trocar arquivo (${fileLabel})`
                      : "Arraste arquivos na câmara ou clique para selecionar"}
                  </button>
                </motion.div>
              )}
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom Calibrated Telemetry & Progress Bar */}
      <div className="px-4 py-3 border-t border-[var(--border-subtle)] bg-[var(--bg-workbench)] space-y-2">
        <div className="h-1.5 w-full rounded-full bg-[var(--bg-recessed)] overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{
              backgroundColor:
                effectivePhase === "error"
                  ? "var(--status-err)"
                  : effectivePhase === "success"
                  ? "var(--status-ok)"
                  : "var(--accent-signal)",
            }}
            animate={{ width: `${pct}%` }}
            transition={MOTION.easeTechnical}
          />
        </div>
        <div className="flex items-center justify-between gap-2 font-mono-tech text-[11px] text-[var(--text-secondary)]">
          <span>
            MOTOR: <strong className="text-[var(--text-primary)]">{tool.localEngine}</strong>
          </span>
          <span>
            {telemetry?.inputBytes ? (
              <>
                {formatBytes(telemetry.inputBytes)}
                {telemetry.currentBytes !== undefined && (
                  <>
                    {" → "}
                    <strong className="text-[var(--text-primary)]">
                      {formatBytes(telemetry.currentBytes)}
                    </strong>
                  </>
                )}
              </>
            ) : (
              `FASE ${tool.phase} · ${tool.supportsBatch ? "BATCH" : "UNITÁRIO"}`
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
