import { motion, AnimatePresence } from "motion/react";
import { X, RotateCcw, Trash2, Square, Layers } from "lucide-react";
import { useUniverseStore } from "@/lib/store";
import { StatusLed, TactileButton } from "@/design-system/components";
import { MOTION } from "@/design-system/motion";
import { formatBytes } from "@/lib/detector";

export function BatchDrawer() {
  const open = useUniverseStore((s) => s.batchDrawerOpen);
  const setOpen = useUniverseStore((s) => s.setBatchDrawerOpen);
  const jobs = useUniverseStore((s) => s.jobs);
  const cancelJob = useUniverseStore((s) => s.cancelJob);
  const retryFailedJobs = useUniverseStore((s) => s.retryFailedJobs);
  const clearFinishedJobs = useUniverseStore((s) => s.clearFinishedJobs);

  const activeCount = jobs.filter((j) => j.status === "running" || j.status === "queued").length;
  const failedCount = jobs.filter((j) => j.status === "error").length;

  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.section
          key="batch-drawer"
          aria-label="Bandeja de Lote"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={MOTION.easeTechnical}
          className="shrink-0 z-10 border-t border-[var(--border-strong)] bg-[var(--bg-module)] overflow-hidden"
          style={{ boxShadow: "0 -6px 20px rgba(0, 0, 0, 0.08)" }}
        >
          <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-[var(--border-subtle)] bg-[var(--bg-workbench)]">
            <div className="flex items-center gap-2.5">
              <Layers className="w-4 h-4 text-[var(--accent-signal)]" />
              <span className="font-mono-tech text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--text-primary)]">
                Bandeja de Lote & Fila ({jobs.length})
              </span>
              {activeCount > 0 && (
                <span className="font-mono-tech text-[11px] text-[var(--accent-signal)]">
                  · {activeCount} em execução
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {failedCount > 0 && (
                <TactileButton
                  variant="module"
                  size="sm"
                  icon={<RotateCcw className="w-3.5 h-3.5" />}
                  onClick={() => void retryFailedJobs()}
                >
                  Tentar novamente falhos ({failedCount})
                </TactileButton>
              )}
              {jobs.length > 0 && (
                <TactileButton
                  variant="ghost"
                  size="sm"
                  icon={<Trash2 className="w-3.5 h-3.5" />}
                  onClick={clearFinishedJobs}
                >
                  Limpar concluídos
                </TactileButton>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fechar bandeja de lote"
                className="p-1 rounded-[6px] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="max-h-[220px] overflow-y-auto p-3 space-y-2">
            {jobs.length === 0 ? (
              <p className="text-center text-[12px] text-[var(--text-secondary)] py-6">
                Nenhum job na fila ainda. Acione uma máquina ou lote para acompanhar o progresso aqui.
              </p>
            ) : (
              jobs.slice(0, 12).map((job) => {
                const pct = Math.round(job.progress * 100);
                const led =
                  job.status === "done"
                    ? "ok"
                    : job.status === "error"
                    ? "err"
                    : job.status === "running"
                    ? "signal"
                    : "warn";

                return (
                  <div
                    key={job.id}
                    className="flex items-center gap-3 rounded-[8px] border border-[var(--border-subtle)] bg-[var(--bg-workbench)] px-3 py-2"
                  >
                    <StatusLed tone={led} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2 text-[12px]">
                        <span className="font-medium text-[var(--text-primary)] truncate">
                          {job.label}
                        </span>
                        <span className="font-mono-tech text-[11px] text-[var(--text-secondary)] shrink-0">
                          {job.status === "error"
                            ? job.error ?? "Erro"
                            : job.metrics.inputBytes && job.metrics.currentBytes
                            ? `${formatBytes(job.metrics.inputBytes)} → ${formatBytes(job.metrics.currentBytes)}`
                            : `${pct}%`}
                        </span>
                      </div>
                      <div className="mt-1.5 h-1 w-full rounded-full bg-[var(--bg-recessed)] overflow-hidden">
                        <div
                          className="h-full rounded-full transition-[width] duration-150"
                          style={{
                            width: `${pct}%`,
                            backgroundColor:
                              job.status === "error"
                                ? "var(--status-err)"
                                : job.status === "done"
                                ? "var(--status-ok)"
                                : "var(--accent-signal)",
                          }}
                        />
                      </div>
                    </div>
                    {(job.status === "running" || job.status === "queued") && (
                      <button
                        type="button"
                        onClick={() => void cancelJob(job.id)}
                        aria-label={`Cancelar ${job.label}`}
                        className="p-1.5 rounded-[6px] text-[var(--status-err)] hover:bg-[var(--bg-hover)] cursor-pointer"
                      >
                        <Square className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  );
}
