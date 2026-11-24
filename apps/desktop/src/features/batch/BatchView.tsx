import { RotateCcw, Trash2, Play, Square, Layers } from "lucide-react";
import { useUniverseStore } from "@/lib/store";
import { StatusLed, TactileButton } from "@/design-system/components";
import { formatBytes } from "@/lib/detector";

export function BatchView() {
  const jobs = useUniverseStore((s) => s.jobs);
  const submitBatch = useUniverseStore((s) => s.submitBatch);
  const cancelJob = useUniverseStore((s) => s.cancelJob);
  const retryFailedJobs = useUniverseStore((s) => s.retryFailedJobs);
  const clearFinishedJobs = useUniverseStore((s) => s.clearFinishedJobs);

  const doneJobs = jobs.filter((j) => j.status === "done");
  const failedJobs = jobs.filter((j) => j.status === "error");
  const totalIn = doneJobs.reduce((acc, j) => acc + (j.metrics.inputBytes ?? 0), 0);
  const totalOut = doneJobs.reduce((acc, j) => acc + (j.metrics.outputBytes ?? j.metrics.currentBytes ?? 0), 0);
  const totalSaved = Math.max(0, totalIn - totalOut);

  const runDemoBatchWithFault = async () => {
    await submitBatch([
      {
        toolId: "img-compress",
        label: "Comprimir imagem · foto_01.jpg",
        weight: "light",
        params: { inputBytes: 8_400_000, targetRatio: 0.28 },
      },
      {
        toolId: "img-compress",
        label: "Comprimir imagem · arquivo_corrompido.jpg",
        weight: "light",
        params: { inputBytes: 4_100_000, simulateError: true },
      },
      {
        toolId: "pdf-compress",
        label: "Comprimir PDF · manual_tecnico.pdf",
        weight: "light",
        params: { inputBytes: 18_200_000, targetRatio: 0.22 },
      },
    ]);
  };

  return (
    <div className="space-y-6 pb-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[24px] font-bold tracking-[-0.025em] text-[var(--text-primary)]">
            Fila de Lote (Batch)
          </h1>
          <p className="text-[13px] text-[var(--text-secondary)] mt-1">
            Controle centralizado de jobs paralelos com isolamento de falhas e telemetria de economia.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <TactileButton
            variant="signal"
            size="sm"
            icon={<Play className="w-3.5 h-3.5" />}
            onClick={() => void runDemoBatchWithFault()}
          >
            Simular Lote (com falha isolada)
          </TactileButton>
          {failedJobs.length > 0 && (
            <TactileButton
              variant="module"
              size="sm"
              icon={<RotateCcw className="w-3.5 h-3.5" />}
              onClick={() => void retryFailedJobs()}
            >
              Tentar novamente falhos ({failedJobs.length})
            </TactileButton>
          )}
          <TactileButton
            variant="ghost"
            size="sm"
            icon={<Trash2 className="w-3.5 h-3.5" />}
            onClick={clearFinishedJobs}
          >
            Limpar concluídos
          </TactileButton>
        </div>
      </header>

      {/* Aggregate Telemetry Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "TOTAL NA FILA", value: String(jobs.length) },
          { label: "CONCLUÍDOS", value: String(doneJobs.length) },
          { label: "FALHAS ISOLADAS", value: String(failedJobs.length) },
          { label: "ECONOMIA TOTAL", value: formatBytes(totalSaved) },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-[10px] border border-[var(--border-subtle)] bg-[var(--bg-module)] p-3.5"
          >
            <div className="font-mono-tech text-[10px] uppercase tracking-[0.05em] text-[var(--text-muted)]">
              {stat.label}
            </div>
            <div className="font-mono-tech text-[20px] font-semibold text-[var(--text-primary)] mt-1">
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Job Table */}
      <div className="rounded-[12px] border border-[var(--border-subtle)] bg-[var(--bg-module)] overflow-hidden">
        {jobs.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Layers className="w-7 h-7 mx-auto text-[var(--text-muted)]" />
            <p className="text-[14px] font-medium text-[var(--text-primary)]">
              Nenhum job processado nesta sessão
            </p>
            <p className="text-[12px] text-[var(--text-secondary)]">
              Arraste múltiplos arquivos em qualquer ferramenta com selo Lote ou clique em “Simular Lote” acima.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-subtle)]">
            {jobs.map((job) => {
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
                <div key={job.id} className="flex items-center gap-4 px-4 py-3">
                  <StatusLed tone={led} size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[13px] font-medium text-[var(--text-primary)] truncate">
                        {job.label}
                      </span>
                      <span className="font-mono-tech text-[11px] text-[var(--text-secondary)]">
                        {job.status.toUpperCase()} · {pct}%
                      </span>
                    </div>
                    {job.error && (
                      <p className="text-[11px] text-[var(--status-err)] mt-0.5">{job.error}</p>
                    )}
                    <div className="mt-1.5 h-1.5 rounded-full bg-[var(--bg-recessed)] overflow-hidden">
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
                    <TactileButton
                      variant="ghost"
                      size="sm"
                      icon={<Square className="w-3.5 h-3.5 text-[var(--status-err)]" />}
                      onClick={() => void cancelJob(job.id)}
                    >
                      Cancelar
                    </TactileButton>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
