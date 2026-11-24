import React from "react";
import { Upload, Link2, X, ArrowRight, FileStack } from "lucide-react";
import { detectFromFiles, detectFromUrl, formatBytes } from "@/lib/detector";
import { useUniverseStore } from "@/lib/store";
import { TactileButton, StatusLed } from "@/design-system/components";
import { CATEGORY_MAP } from "@/registry/categories";

export function SmartDropzone() {
  const detectedInput = useUniverseStore((s) => s.detectedInput);
  const setDetectedInput = useUniverseStore((s) => s.setDetectedInput);
  const openTool = useUniverseStore((s) => s.openTool);

  const [urlInput, setUrlInput] = React.useState("");
  const [urlError, setUrlError] = React.useState<string | null>(null);
  const [isHover, setIsHover] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList).map((f) => ({
      name: f.name,
      type: f.type,
      size: f.size,
    }));
    setUrlError(null);
    setDetectedInput(detectFromFiles(files));
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const detected = detectFromUrl(urlInput);
    if (!detected) {
      setUrlError("Cole uma URL válida (ex: https://youtube.com/watch?v=...)");
      return;
    }
    setUrlError(null);
    setDetectedInput(detected);
  };

  return (
    <section
      aria-label="Smart Dropzone Universal"
      onDragOver={(e) => {
        e.preventDefault();
        setIsHover(true);
      }}
      onDragLeave={() => setIsHover(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsHover(false);
        handleFiles(e.dataTransfer.files);
      }}
      className="rounded-[14px] border bg-[var(--bg-module)] overflow-hidden transition-colors duration-100"
      style={{
        borderColor: isHover ? "var(--accent-signal)" : "var(--border-subtle)",
        boxShadow: "var(--shadow-module)",
      }}
    >
      <div className="workbench-grid-bg p-5 flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5 min-w-0">
          <div
            className="h-11 w-11 shrink-0 rounded-[10px] border flex items-center justify-center bg-[var(--bg-module)]"
            style={{
              borderColor: isHover ? "var(--accent-signal)" : "var(--border-strong)",
            }}
          >
            <Upload className="w-5 h-5 text-[var(--accent-signal)]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <StatusLed tone={isHover || detectedInput ? "signal" : "ok"} />
              <span className="font-mono-tech text-[11px] uppercase tracking-[0.05em] text-[var(--text-secondary)]">
                Smart Dropzone Universal
              </span>
            </div>
            <h2 className="font-display text-[17px] font-semibold text-[var(--text-primary)] mt-0.5">
              Arraste qualquer arquivo ou cole um link para montar a máquina certa
            </h2>
            <p className="text-[12px] text-[var(--text-secondary)] mt-0.5">
              Detecção automática por MIME/extensão e plataforma (PDF, imagens, vídeo, áudio, YouTube, Reels, TikTok, X, Reddit).
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <TactileButton
            variant="signal"
            icon={<FileStack className="w-4 h-4" />}
            onClick={() => fileInputRef.current?.click()}
          >
            Selecionar Arquivos
          </TactileButton>

          <form onSubmit={handleUrlSubmit} className="flex items-center gap-1.5">
            <div className="relative flex items-center">
              <Link2 className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-2.5 pointer-events-none" />
              <input
                type="text"
                value={urlInput}
                onChange={(e) => {
                  setUrlInput(e.target.value);
                  if (urlError) setUrlError(null);
                }}
                placeholder="Colar link (YouTube, Reels, URL...)"
                aria-label="Colar URL para detecção automática"
                className="h-9 w-[230px] sm:w-[250px] rounded-[6px] border border-[var(--border-strong)] bg-[var(--bg-module)] pl-8 pr-2.5 text-[12px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
              />
            </div>
            <TactileButton type="submit" variant="module" size="md">
              Detectar
            </TactileButton>
          </form>
        </div>
      </div>

      {urlError && (
        <div className="px-5 py-2 border-t border-[var(--border-subtle)] bg-[var(--bg-workbench)] text-[12px] text-[var(--status-err)]">
          {urlError}
        </div>
      )}

      {detectedInput && (
        <div
          data-testid="smart-dropzone-results"
          className="px-5 py-3.5 border-t border-[var(--border-subtle)] bg-[var(--bg-workbench)] space-y-2.5"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <StatusLed tone="ok" />
              <span className="font-mono-tech text-[12px] font-semibold text-[var(--text-primary)] truncate">
                {detectedInput.label}
              </span>
              {detectedInput.totalBytes > 0 && (
                <span className="font-mono-tech text-[11px] text-[var(--text-muted)]">
                  ({formatBytes(detectedInput.totalBytes)})
                </span>
              )}
              <span className="font-mono-tech text-[11px] text-[var(--text-secondary)]">
                — {detectedInput.suggestedTools.length} ferramentas compatíveis
              </span>
            </div>
            <button
              type="button"
              onClick={() => setDetectedInput(null)}
              aria-label="Limpar entrada detectada"
              className="p-1 rounded-[6px] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {detectedInput.suggestedTools.map((tool) => {
              const cat = CATEGORY_MAP[tool.category];
              return (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => openTool(tool.id)}
                  className="inline-flex items-center gap-2 rounded-[8px] border border-[var(--border-strong)] bg-[var(--bg-module)] px-3 py-1.5 text-[12px] font-medium text-[var(--text-primary)] hover:border-[var(--accent-signal)] cursor-pointer transition-colors duration-100"
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: cat.cssVar }}
                  />
                  <span>{tool.name}</span>
                  <ArrowRight className="w-3 h-3 text-[var(--text-muted)]" />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
