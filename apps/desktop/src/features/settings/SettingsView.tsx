import React from "react";
import { Cpu, KeyRound, RefreshCw, ShieldCheck, Trash2, Check, Download } from "lucide-react";
import { useUniverseStore } from "@/lib/store";
import { StatusLed, TactileButton } from "@/design-system/components";

export function SettingsView() {
  const engines = useUniverseStore((s) => s.engines);
  const apiProviders = useUniverseStore((s) => s.apiProviders);
  const sidecarHealth = useUniverseStore((s) => s.sidecarHealth);
  const systemInfo = useUniverseStore((s) => s.systemInfo);
  const refreshRuntime = useUniverseStore((s) => s.refreshRuntime);
  const saveProviderKey = useUniverseStore((s) => s.saveProviderKey);
  const deleteProviderKey = useUniverseStore((s) => s.deleteProviderKey);

  const [draftKeys, setDraftKeys] = React.useState<Record<string, string>>({});
  const [feedback, setFeedback] = React.useState<string | null>(null);
  const [refreshing, setRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshRuntime();
    setRefreshing(false);
  };

  const handleSaveKey = async (providerId: string) => {
    const val = draftKeys[providerId] ?? "";
    if (!val.trim()) return;
    try {
      const backend = await saveProviderKey(providerId, val);
      setDraftKeys((prev) => ({ ...prev, [providerId]: "" }));
      setFeedback(`Chave para ${providerId} salva com segurança (${backend}).`);
    } catch (err) {
      setFeedback(String(err));
    }
  };

  const binaries = engines.filter((e) => e.kind !== "model");
  const models = engines.filter((e) => e.kind === "model");

  return (
    <div className="space-y-6 pb-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[24px] font-bold tracking-[-0.025em] text-[var(--text-primary)]">
            Motores Locais, Modelos IA & Cofre de Chaves
          </h1>
          <p className="text-[13px] text-[var(--text-secondary)] mt-1">
            Tudo roda 100% local por padrão. API keys são opcionais e armazenadas exclusivamente no Keyring nativo do sistema.
          </p>
        </div>

        <TactileButton
          variant="module"
          size="sm"
          icon={<RefreshCw className="w-3.5 h-3.5" />}
          onClick={() => void handleRefresh()}
          disabled={refreshing}
        >
          {refreshing ? "Verificando..." : "Reescanear Sistema"}
        </TactileButton>
      </header>

      {/* Runtime & Sidecar Telemetry Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-[10px] border border-[var(--border-subtle)] bg-[var(--bg-module)] p-3.5">
          <div className="font-mono-tech text-[10px] uppercase text-[var(--text-muted)]">AMBIENTE</div>
          <div className="font-mono-tech text-[14px] font-semibold text-[var(--text-primary)] mt-1">
            {systemInfo ? `${systemInfo.os} / ${systemInfo.arch}` : "Verificando..."}
          </div>
        </div>
        <div className="rounded-[10px] border border-[var(--border-subtle)] bg-[var(--bg-module)] p-3.5">
          <div className="font-mono-tech text-[10px] uppercase text-[var(--text-muted)]">PYTHON SIDECAR</div>
          <div className="flex items-center gap-2 mt-1">
            <StatusLed tone={sidecarHealth?.status === "ok" ? "ok" : "warn"} />
            <span className="font-mono-tech text-[14px] font-semibold text-[var(--text-primary)]">
              {sidecarHealth ? `${sidecarHealth.status.toUpperCase()} (${sidecarHealth.python})` : "Desconectado"}
            </span>
          </div>
        </div>
        <div className="rounded-[10px] border border-[var(--border-subtle)] bg-[var(--bg-module)] p-3.5">
          <div className="font-mono-tech text-[10px] uppercase text-[var(--text-muted)]">POLÍTICA DE ÁUDIO</div>
          <div className="font-mono-tech text-[14px] font-semibold text-[var(--text-primary)] mt-1">
            100% Silencioso (Visual-Only)
          </div>
        </div>
      </div>

      {/* Host Binaries */}
      <section className="rounded-[12px] border border-[var(--border-subtle)] bg-[var(--bg-module)] overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-workbench)]">
          <Cpu className="w-4 h-4 text-[var(--accent-signal)]" />
          <h2 className="font-mono-tech text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--text-primary)]">
            Binários e Motores Locais ({binaries.filter((b) => b.installed).length}/{binaries.length} detectados)
          </h2>
        </div>

        <div className="divide-y divide-[var(--border-subtle)]">
          {binaries.map((eng) => (
            <div key={eng.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="mt-1.5">
                  <StatusLed tone={eng.installed ? "ok" : "warn"} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold text-[var(--text-primary)]">{eng.name}</span>
                    <span className="font-mono-tech text-[10px] rounded-[4px] bg-[var(--bg-recessed)] px-1.5 py-0.5 text-[var(--text-secondary)]">
                      ~{eng.estimatedSizeMb} MB
                    </span>
                  </div>
                  <p className="text-[12px] text-[var(--text-secondary)]">{eng.description}</p>
                  {eng.path && (
                    <p className="font-mono-tech text-[10px] text-[var(--text-muted)] mt-0.5 truncate">
                      {eng.path} {eng.version ? `· ${eng.version}` : ""}
                    </p>
                  )}
                </div>
              </div>

              <div className="font-mono-tech text-[11px] shrink-0">
                {eng.installed ? (
                  <span className="text-[var(--status-ok)] font-semibold">INSTALADO</span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-[6px] border border-[var(--border-strong)] bg-[var(--bg-workbench)] px-2.5 py-1 text-[var(--text-secondary)]">
                    <Download className="w-3 h-3" /> Sob demanda
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* AI Models */}
      <section className="rounded-[12px] border border-[var(--border-subtle)] bg-[var(--bg-module)] overflow-hidden">
        <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-workbench)]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[var(--accent-signal)]" />
            <h2 className="font-mono-tech text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--text-primary)]">
              Modelos de IA Locais (ONNX / CTranslate2 — Validação SHA-256)
            </h2>
          </div>
          <span className="font-mono-tech text-[10px] text-[var(--text-muted)]">
            ~/.local/share/universe/models/
          </span>
        </div>

        <div className="divide-y divide-[var(--border-subtle)]">
          {models.map((mod) => (
            <div key={mod.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div className="flex items-start gap-3">
                <div className="mt-1.5">
                  <StatusLed tone={mod.installed ? "ok" : "idle"} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold text-[var(--text-primary)]">{mod.name}</span>
                    <span className="font-mono-tech text-[10px] rounded-[4px] bg-[var(--bg-recessed)] px-1.5 py-0.5 text-[var(--text-secondary)]">
                      {mod.estimatedSizeMb} MB
                    </span>
                  </div>
                  <p className="text-[12px] text-[var(--text-secondary)]">{mod.description}</p>
                  <p className="font-mono-tech text-[10px] text-[var(--text-muted)] mt-0.5">
                    Usado por: {mod.usedBy.join(", ")}
                  </p>
                </div>
              </div>
              <span className="font-mono-tech text-[11px] text-[var(--text-secondary)]">
                {mod.installed ? "PRONTO LOCALMENTE" : "BAIXAR NA 1ª EXECUÇÃO"}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Optional API Key Vault */}
      <section className="rounded-[12px] border border-[var(--border-subtle)] bg-[var(--bg-module)] overflow-hidden">
        <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-workbench)]">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-[var(--accent-signal)]" />
            <h2 className="font-mono-tech text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--text-primary)]">
              Cofre de API Keys Opcionais (OS Keyring)
            </h2>
          </div>
          <span className="font-mono-tech text-[10px] text-[var(--text-muted)]">
            NUNCA SALVAS EM TEXTO PLANO
          </span>
        </div>

        {feedback && (
          <div className="px-4 py-2 border-b border-[var(--border-subtle)] bg-[var(--bg-workbench)] text-[12px] text-[var(--status-ok)]">
            {feedback}
          </div>
        )}

        <div className="divide-y divide-[var(--border-subtle)]">
          {apiProviders.map((prov) => (
            <div key={prov.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <StatusLed tone={prov.configured ? "ok" : "idle"} />
                  <span className="text-[13px] font-semibold text-[var(--text-primary)]">{prov.name}</span>
                  {prov.configured && (
                    <span className="font-mono-tech text-[10px] rounded-[4px] bg-[var(--bg-recessed)] px-1.5 py-0.5 text-[var(--status-ok)]">
                      CONFIGURADA ({prov.storageBackend})
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                  {prov.capabilities.join(" · ")}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="password"
                  value={draftKeys[prov.id] ?? ""}
                  onChange={(e) =>
                    setDraftKeys((prev) => ({ ...prev, [prov.id]: e.target.value }))
                  }
                  placeholder={prov.configured ? "••••••••••••" : "Inserir API Key..."}
                  aria-label={`API Key para ${prov.name}`}
                  className="h-8 w-[200px] rounded-[6px] border border-[var(--border-strong)] bg-[var(--bg-workbench)] px-2.5 font-mono-tech text-[12px] text-[var(--text-primary)]"
                />
                <TactileButton
                  variant="module"
                  size="sm"
                  icon={<Check className="w-3.5 h-3.5" />}
                  onClick={() => void handleSaveKey(prov.id)}
                >
                  Salvar
                </TactileButton>
                {prov.configured && (
                  <TactileButton
                    variant="ghost"
                    size="sm"
                    icon={<Trash2 className="w-3.5 h-3.5 text-[var(--status-err)]" />}
                    onClick={() => void deleteProviderKey(prov.id)}
                    aria-label={`Remover chave de ${prov.name}`}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
