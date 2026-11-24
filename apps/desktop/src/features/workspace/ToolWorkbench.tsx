import React from "react";
import {
  ArrowLeft,
  Star,
  Play,
  Square,
  RotateCcw,
  Layers,
  Workflow,
  ShieldAlert,
  AlertTriangle,
} from "lucide-react";
import { TOOL_MAP } from "@/registry/tools";
import { CATEGORY_MAP } from "@/registry/categories";
import type { MachinePhase } from "@/registry/types";
import { useUniverseStore } from "@/lib/store";
import { MachineStage } from "@/machines/MachineStage";
import {
  TactileButton,
  PrecisionSlider,
  MechanicalSwitch,
  SegmentedDial,
  StatusLed,
  KeyCap,
} from "@/design-system/components";

export function ToolWorkbench({ toolId }: { toolId: string }) {
  const tool = TOOL_MAP[toolId];
  const favorites = useUniverseStore((s) => s.favorites);
  const jobs = useUniverseStore((s) => s.jobs);
  const detectedInput = useUniverseStore((s) => s.detectedInput);
  const apiProviders = useUniverseStore((s) => s.apiProviders);
  const navigateHome = useUniverseStore((s) => s.navigateHome);
  const navigateCategory = useUniverseStore((s) => s.navigateCategory);
  const navigateView = useUniverseStore((s) => s.navigateView);
  const toggleFavorite = useUniverseStore((s) => s.toggleFavorite);
  const submitJob = useUniverseStore((s) => s.submitJob);
  const submitBatch = useUniverseStore((s) => s.submitBatch);
  const cancelJob = useUniverseStore((s) => s.cancelJob);

  const [activeJobId, setActiveJobId] = React.useState<string | null>(null);
  const [selectedFileLabel, setSelectedFileLabel] = React.useState<string | undefined>(
    detectedInput?.fileNames[0]
  );
  const [selectedFileBytes, setSelectedFileBytes] = React.useState<number>(
    detectedInput?.totalBytes || 14_680_064
  );
  const [textOrUrl, setTextOrUrl] = React.useState(detectedInput?.url ?? "");
  const [intensity, setIntensity] = React.useState(75);
  const [engineMode, setEngineMode] = React.useState<"local" | "api">("local");
  const [preserveMetadata, setPreserveMetadata] = React.useState(false);
  const [autoOpenFolder, setAutoOpenFolder] = React.useState(true);

  React.useEffect(() => {
    setActiveJobId(null);
    setEngineMode("local");
  }, [toolId]);

  if (!tool) {
    return (
      <div className="p-8 text-center">
        <p className="text-[var(--text-primary)] font-medium">Ferramenta não encontrada.</p>
        <TactileButton className="mt-3" onClick={navigateHome}>
          Voltar para Bancada
        </TactileButton>
      </div>
    );
  }

  const category = CATEGORY_MAP[tool.category];
  const isFav = favorites.includes(tool.id);
  const activeJob = activeJobId ? jobs.find((j) => j.id === activeJobId) : undefined;

  const phase: MachinePhase = activeJob
    ? activeJob.status === "running" || activeJob.status === "queued"
      ? "running"
      : activeJob.status === "done"
      ? "success"
      : activeJob.status === "error"
      ? "error"
      : "cancelled"
    : selectedFileLabel || textOrUrl.trim().length > 0 || tool.inputKind === "none"
    ? "armed"
    : "idle";

  const isRunning = phase === "running";
  const linkedProvider = tool.optionalApiProvider
    ? apiProviders.find((p) => p.id === tool.optionalApiProvider)
    : undefined;

  const handleRun = async (simulateError = false) => {
    const targetRatio = Math.max(0.15, Math.min(0.85, 1 - intensity / 120));
    const job = await submitJob({
      toolId: tool.id,
      label: `${tool.name}${selectedFileLabel ? ` · ${selectedFileLabel}` : ""}`,
      weight: tool.weight,
      params: {
        inputBytes: selectedFileBytes,
        targetRatio,
        intensity,
        engineMode,
        preserveMetadata,
        simulateError,
        steps: 10,
        stepDelayMs: 90,
      },
    });
    setActiveJobId(job.id);
  };

  const handleRunSampleBatch = async () => {
    await submitBatch([
      {
        toolId: tool.id,
        label: `${tool.name} · lote_01`,
        weight: tool.weight,
        params: { inputBytes: 9_200_000, targetRatio: 0.32, steps: 8, stepDelayMs: 80 },
      },
      {
        toolId: tool.id,
        label: `${tool.name} · lote_02`,
        weight: tool.weight,
        params: { inputBytes: 15_400_000, targetRatio: 0.24, steps: 10, stepDelayMs: 95 },
      },
      {
        toolId: tool.id,
        label: `${tool.name} · lote_03`,
        weight: tool.weight,
        params: { inputBytes: 6_800_000, targetRatio: 0.35, steps: 7, stepDelayMs: 75 },
      },
    ]);
  };

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && !isRunning) {
        e.preventDefault();
        void handleRun(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  return (
    <div className="space-y-5 pb-8">
      {/* Breadcrumb & Tool Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <TactileButton
            variant="ghost"
            size="sm"
            icon={<ArrowLeft className="w-3.5 h-3.5" />}
            onClick={() => navigateCategory(tool.category)}
          >
            {category.shortName}
          </TactileButton>
          <span className="text-[var(--text-muted)]">/</span>
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: category.cssVar }}
          />
          <h1 className="font-display text-[20px] font-bold tracking-[-0.02em] text-[var(--text-primary)] truncate">
            {tool.name}
          </h1>
          <span className="font-mono-tech text-[11px] rounded-[4px] bg-[var(--bg-recessed)] px-1.5 py-0.5 text-[var(--text-secondary)]">
            #{String(tool.number).padStart(2, "0")}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono-tech text-[11px] rounded-[6px] border border-[var(--border-subtle)] bg-[var(--bg-module)] px-2.5 py-1 text-[var(--text-secondary)]">
            FASE {tool.phase} · CICLO DIAGNÓSTICO ATIVO
          </span>
          <TactileButton
            variant="module"
            size="sm"
            icon={
              <Star
                className="w-3.5 h-3.5"
                fill={isFav ? "var(--accent-signal)" : "none"}
                color={isFav ? "var(--accent-signal)" : "currentColor"}
              />
            }
            onClick={() => toggleFavorite(tool.id)}
          >
            {isFav ? "Favorito" : "Favoritar"}
          </TactileButton>
        </div>
      </div>

      {/* Copyright Disclaimer for Downloads (#31-#40) */}
      {tool.copyrightNotice && (
        <div className="flex items-center gap-2.5 rounded-[10px] border border-[var(--border-strong)] bg-[var(--bg-workbench)] px-3.5 py-2.5 text-[12px] text-[var(--text-secondary)]">
          <ShieldAlert className="w-4 h-4 shrink-0 text-[var(--status-warn)]" />
          <span>
            Downloads estão sujeitos às permissões, aos direitos autorais e aos termos de uso de cada plataforma.
          </span>
        </div>
      )}

      {/* 2-Column Adaptive Workbench (62% Stage / 38% Instrument Panel) */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-5 items-start">
        <div className="space-y-4">
          <MachineStage
            tool={tool}
            phase={phase}
            progress={activeJob?.progress ?? 0}
            stageLabel={activeJob?.stage}
            fileLabel={selectedFileLabel}
            telemetry={activeJob?.metrics}
            errorMessage={activeJob?.error}
            onFilesPicked={(files) => {
              const first = files[0];
              if (!first) return;
              const total = Array.from(files).reduce((a, f) => a + f.size, 0);
              setSelectedFileLabel(
                files.length > 1 ? `${files.length} arquivos (${first.name}...)` : first.name
              );
              setSelectedFileBytes(Math.max(1024, total));
              setActiveJobId(null);
            }}
            onReset={() => setActiveJobId(null)}
          />

          {/* URL or Text input bench when appropriate */}
          {(tool.inputKind === "url" || tool.inputKind === "text") && (
            <div className="rounded-[12px] border border-[var(--border-subtle)] bg-[var(--bg-module)] p-4 space-y-2">
              <label className="block font-mono-tech text-[11px] uppercase tracking-[0.04em] text-[var(--text-secondary)]">
                {tool.inputKind === "url" ? "Endereço de Entrada (URL)" : "Conteúdo de Entrada"}
              </label>
              {tool.inputKind === "url" ? (
                <input
                  type="url"
                  value={textOrUrl}
                  onChange={(e) => setTextOrUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full h-9 rounded-[6px] border border-[var(--border-strong)] bg-[var(--bg-workbench)] px-3 text-[13px] text-[var(--text-primary)]"
                />
              ) : (
                <textarea
                  rows={4}
                  value={textOrUrl}
                  onChange={(e) => setTextOrUrl(e.target.value)}
                  placeholder="Cole texto, JSON, link ou conteúdo para processar..."
                  className="w-full rounded-[6px] border border-[var(--border-strong)] bg-[var(--bg-workbench)] p-3 font-mono-tech text-[12px] text-[var(--text-primary)]"
                />
              )}
            </div>
          )}
        </div>

        {/* Right Column: Calibrated Instrument Panel */}
        <aside
          aria-label="Painel de Instrumentos"
          className="rounded-[14px] border border-[var(--border-subtle)] bg-[var(--bg-module)] p-4 space-y-4"
          style={{ boxShadow: "var(--shadow-module)" }}
        >
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
            <span className="font-mono-tech text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--text-secondary)]">
              Painel de Instrumentos
            </span>
            <StatusLed tone={isRunning ? "signal" : phase === "success" ? "ok" : "idle"} />
          </div>

          <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed">
            {tool.shortDescription}
          </p>

          {tool.optionalApiProvider && (
            <div className="space-y-2">
              <SegmentedDial
                id={`engine-${tool.id}`}
                label="Modo de Execução"
                value={engineMode}
                onChange={setEngineMode}
                options={[
                  { value: "local", label: "Local (Grátis)" },
                  { value: "api", label: "API Key Opcional" },
                ]}
              />
              {engineMode === "api" && !linkedProvider?.configured && (
                <div className="flex items-center justify-between gap-2 rounded-[8px] border border-[var(--status-warn)] bg-[var(--bg-workbench)] px-2.5 py-2 text-[11px] text-[var(--text-secondary)]">
                  <span>Chave ({tool.optionalApiProvider}) não configurada.</span>
                  <button
                    type="button"
                    onClick={() => navigateView("settings")}
                    className="font-semibold text-[var(--accent-signal)] underline cursor-pointer shrink-0"
                  >
                    Configurar
                  </button>
                </div>
              )}
            </div>
          )}

          <PrecisionSlider
            label="Intensidade / Precisão"
            value={intensity}
            min={10}
            max={100}
            step={5}
            unit="%"
            onChange={setIntensity}
            disabled={isRunning}
          />

          <div className="border-t border-[var(--border-subtle)] pt-2 space-y-1">
            <MechanicalSwitch
              checked={preserveMetadata}
              onChange={setPreserveMetadata}
              label="Preservar metadados"
              description="Mantém propriedades originais do arquivo"
              disabled={isRunning}
            />
            <MechanicalSwitch
              checked={autoOpenFolder}
              onChange={setAutoOpenFolder}
              label="Destacar saída ao concluir"
              description="Exibe atalho para pasta e encadeamento"
              disabled={isRunning}
            />
          </div>

          {/* Primary Action Stack */}
          <div className="pt-2 border-t border-[var(--border-subtle)] space-y-2">
            {!isRunning ? (
              <TactileButton
                variant="signal"
                size="lg"
                className="w-full justify-between"
                icon={<Play className="w-4 h-4" />}
                onClick={() => void handleRun(false)}
                data-testid="run-machine-btn"
              >
                <span>Acionar Máquina</span>
                <KeyCap keys={["Ctrl", "↵"]} />
              </TactileButton>
            ) : (
              <TactileButton
                variant="danger"
                size="lg"
                className="w-full"
                icon={<Square className="w-4 h-4" />}
                onClick={() => activeJobId && void cancelJob(activeJobId)}
                data-testid="cancel-machine-btn"
              >
                Cancelar Operação
              </TactileButton>
            )}

            <div className="flex flex-wrap items-center gap-2">
              {tool.supportsBatch && (
                <TactileButton
                  variant="module"
                  size="sm"
                  className="flex-1"
                  icon={<Layers className="w-3.5 h-3.5" />}
                  onClick={() => void handleRunSampleBatch()}
                  disabled={isRunning}
                >
                  Testar Lote (3×)
                </TactileButton>
              )}
              {tool.supportsPipeline && (
                <TactileButton
                  variant="module"
                  size="sm"
                  className="flex-1"
                  icon={<Workflow className="w-3.5 h-3.5" />}
                  onClick={() => navigateView("pipelines")}
                >
                  Encadear
                </TactileButton>
              )}
            </div>
            <div className="flex items-center justify-between gap-2 pt-1">
              <TactileButton
                variant="ghost"
                size="sm"
                icon={<AlertTriangle className="w-3.5 h-3.5" />}
                onClick={() => void handleRun(true)}
                disabled={isRunning}
                title="Testar recuperação de erro da máquina"
              >
                Simular Erro
              </TactileButton>
              {activeJob && !isRunning && (
                <TactileButton
                  variant="ghost"
                  size="sm"
                  icon={<RotateCcw className="w-3.5 h-3.5" />}
                  onClick={() => setActiveJobId(null)}
                >
                  Resetar
                </TactileButton>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
