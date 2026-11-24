import React from "react";
import {
  Workflow,
  Play,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  AlertTriangle,
  Save,
} from "lucide-react";
import { TOOLS, TOOL_MAP } from "@/registry/tools";
import { CATEGORY_MAP } from "@/registry/categories";
import { validatePipelineCompatibility } from "@/lib/detector";
import { useUniverseStore } from "@/lib/store";
import { StatusLed, TactileButton } from "@/design-system/components";

const PIPELINE_TOOLS = TOOLS.filter((t) => t.supportsPipeline);

export function PipelinesView() {
  const savedPipelines = useUniverseStore((s) => s.savedPipelines);
  const savePipelineRecipe = useUniverseStore((s) => s.savePipelineRecipe);
  const deletePipelineRecipe = useUniverseStore((s) => s.deletePipelineRecipe);
  const submitBatch = useUniverseStore((s) => s.submitBatch);

  const [stepIds, setStepIds] = React.useState<string[]>(
    savedPipelines[1]?.stepToolIds ?? ["img-heic-to-jpg", "extra-strip-exif", "img-compress", "util-zip-create"]
  );
  const [selectedAddId, setSelectedAddId] = React.useState<string>(PIPELINE_TOOLS[0].id);
  const [recipeName, setRecipeName] = React.useState("");
  const [savedFeedback, setSavedFeedback] = React.useState(false);

  const steps = stepIds.map((id) => TOOL_MAP[id]).filter(Boolean);
  const validation = validatePipelineCompatibility(steps);

  const moveStep = (index: number, delta: -1 | 1) => {
    const target = index + delta;
    if (target < 0 || target >= stepIds.length) return;
    const next = [...stepIds];
    [next[index], next[target]] = [next[target], next[index]];
    setStepIds(next);
  };

  const removeStep = (index: number) => {
    setStepIds((prev) => prev.filter((_, i) => i !== index));
  };

  const addStep = () => {
    setStepIds((prev) => [...prev, selectedAddId]);
  };

  const handleSaveRecipe = () => {
    if (!validation.valid || steps.length === 0) return;
    savePipelineRecipe(
      recipeName || `Cadeia (${steps.length} etapas)`,
      steps.map((s) => s.name).join(" → "),
      stepIds
    );
    setRecipeName("");
    setSavedFeedback(true);
    window.setTimeout(() => setSavedFeedback(false), 1800);
  };

  const handleExecutePipeline = async () => {
    if (!validation.valid) return;
    await submitBatch(
      steps.map((step, idx) => ({
        toolId: step.id,
        label: `Pipeline [${idx + 1}/${steps.length}] · ${step.name}`,
        weight: step.weight,
        params: { inputBytes: 12_000_000, targetRatio: 0.45, steps: 6, stepDelayMs: 75 },
      }))
    );
  };

  return (
    <div className="space-y-6 pb-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[24px] font-bold tracking-[-0.025em] text-[var(--text-primary)]">
            Encadeamento de Ferramentas (Pipelines)
          </h1>
          <p className="text-[13px] text-[var(--text-secondary)] mt-1">
            Conecte máquinas em série com validação estática de compatibilidade de tipos MIME entre cada etapa.
          </p>
        </div>

        <TactileButton
          variant="signal"
          icon={<Play className="w-4 h-4" />}
          disabled={!validation.valid}
          onClick={() => void handleExecutePipeline()}
          data-testid="run-pipeline-btn"
        >
          Executar Pipeline ({steps.length} etapas)
        </TactileButton>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-[320px_minmax(0,1fr)] gap-5 items-start">
        {/* Saved Presets & Recipes */}
        <aside className="rounded-[12px] border border-[var(--border-subtle)] bg-[var(--bg-module)] p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Workflow className="w-4 h-4 text-[var(--accent-signal)]" />
            <h2 className="font-mono-tech text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--text-secondary)]">
              Receitas & Presets
            </h2>
          </div>

          <div className="space-y-2">
            {savedPipelines.map((preset) => (
              <div
                key={preset.id}
                className="rounded-[8px] border border-[var(--border-subtle)] bg-[var(--bg-workbench)] p-3 space-y-1.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setStepIds(preset.stepToolIds)}
                    className="text-left flex-1 cursor-pointer"
                  >
                    <div className="text-[13px] font-semibold text-[var(--text-primary)] hover:text-[var(--accent-signal)] transition-colors duration-100">
                      {preset.name}
                    </div>
                    <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 leading-snug">
                      {preset.description}
                    </p>
                  </button>
                  {!preset.builtin && (
                    <button
                      type="button"
                      onClick={() => deletePipelineRecipe(preset.id)}
                      aria-label={`Remover receita ${preset.name}`}
                      className="p-1 text-[var(--text-muted)] hover:text-[var(--status-err)] cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="font-mono-tech text-[10px] text-[var(--text-muted)]">
                  {preset.stepToolIds.length} ETAPAS {preset.builtin ? "· PRESET" : "· SALVA"}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Visual Chain Editor */}
        <section className="rounded-[14px] border border-[var(--border-subtle)] bg-[var(--bg-module)] p-5 space-y-4">
          {/* Validation Status Bar */}
          <div
            data-testid="pipeline-validation-status"
            className="flex items-center justify-between gap-3 rounded-[8px] border px-3.5 py-2.5 text-[12px]"
            style={{
              borderColor: validation.valid ? "var(--status-ok)" : "var(--status-err)",
              backgroundColor: "var(--bg-workbench)",
            }}
          >
            <div className="flex items-center gap-2">
              {validation.valid ? (
                <CheckCircle2 className="w-4 h-4 text-[var(--status-ok)] shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-[var(--status-err)] shrink-0" />
              )}
              <span className="font-medium text-[var(--text-primary)]">
                {validation.valid
                  ? "Cadeia válida — todos os acoplamentos de entrada/saída são compatíveis."
                  : validation.errors[0]}
              </span>
            </div>
            <StatusLed tone={validation.valid ? "ok" : "err"} />
          </div>

          {/* Steps List with Keyboard-Accessible Reorder Controls */}
          <div className="workbench-grid-bg rounded-[12px] border border-[var(--border-subtle)] p-4 space-y-2">
            {steps.map((step, index) => {
              const cat = CATEGORY_MAP[step.category];
              const couplerOk = validation.couplerValid[index];
              return (
                <div key={`${step.id}-${index}`}>
                  <div className="flex items-center justify-between gap-3 rounded-[10px] border border-[var(--border-strong)] bg-[var(--bg-module)] px-3.5 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-mono-tech text-[11px] font-bold h-6 w-6 rounded-[6px] bg-[var(--bg-recessed)] flex items-center justify-center text-[var(--text-primary)] shrink-0">
                        {index + 1}
                      </span>
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: cat.cssVar }}
                      />
                      <div className="min-w-0">
                        <div className="text-[13px] font-semibold text-[var(--text-primary)] truncate">
                          {step.name}
                        </div>
                        <div className="font-mono-tech text-[10px] text-[var(--text-muted)] truncate">
                          {step.machineName} · {step.inputMimes[0] ?? "*/*"} → {step.outputMimes[0] ?? "*/*"}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => moveStep(index, -1)}
                        aria-label={`Mover ${step.name} para cima`}
                        className="p-1.5 rounded-[6px] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] disabled:opacity-30 cursor-pointer"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={index === steps.length - 1}
                        onClick={() => moveStep(index, 1)}
                        aria-label={`Mover ${step.name} para baixo`}
                        className="p-1.5 rounded-[6px] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] disabled:opacity-30 cursor-pointer"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeStep(index)}
                        aria-label={`Remover ${step.name} do pipeline`}
                        className="p-1.5 rounded-[6px] text-[var(--text-secondary)] hover:text-[var(--status-err)] hover:bg-[var(--bg-hover)] cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {index < steps.length - 1 && (
                    <div className="flex items-center justify-center py-1.5">
                      <span
                        className="font-mono-tech text-[10px] px-2 py-0.5 rounded-full border"
                        style={{
                          borderColor: couplerOk ? "var(--status-ok)" : "var(--status-err)",
                          color: couplerOk ? "var(--status-ok)" : "var(--status-err)",
                          backgroundColor: "var(--bg-module)",
                        }}
                      >
                        {couplerOk ? "↓ ACOPLAMENTO COMPATÍVEL" : "✕ TIPO INCOMPATÍVEL"}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Add Step & Save Recipe Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[var(--border-subtle)]">
            <div className="flex items-center gap-2">
              <select
                value={selectedAddId}
                onChange={(e) => setSelectedAddId(e.target.value)}
                aria-label="Escolher ferramenta para adicionar ao pipeline"
                className="h-9 rounded-[6px] border border-[var(--border-strong)] bg-[var(--bg-workbench)] px-2.5 text-[12px] text-[var(--text-primary)] max-w-[260px]"
              >
                {PIPELINE_TOOLS.map((t) => (
                  <option key={t.id} value={t.id}>
                    #{String(t.number).padStart(2, "0")} {t.name}
                  </option>
                ))}
              </select>
              <TactileButton
                variant="module"
                size="md"
                icon={<Plus className="w-4 h-4" />}
                onClick={addStep}
              >
                Adicionar Etapa
              </TactileButton>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={recipeName}
                onChange={(e) => setRecipeName(e.target.value)}
                placeholder="Nome da receita..."
                aria-label="Nome da receita personalizada"
                className="h-9 w-[180px] rounded-[6px] border border-[var(--border-strong)] bg-[var(--bg-workbench)] px-2.5 text-[12px] text-[var(--text-primary)]"
              />
              <TactileButton
                variant="module"
                size="md"
                icon={<Save className="w-3.5 h-3.5" />}
                disabled={!validation.valid}
                onClick={handleSaveRecipe}
              >
                {savedFeedback ? "Salva!" : "Salvar Receita"}
              </TactileButton>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
