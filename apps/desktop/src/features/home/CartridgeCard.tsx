import { Star, Layers, Workflow, Sparkles } from "lucide-react";
import { clsx } from "clsx";
import type { ToolSpec } from "@/registry/types";
import { CATEGORY_MAP } from "@/registry/categories";

export interface CartridgeCardProps {
  tool: ToolSpec;
  isFavorite: boolean;
  onOpen: (toolId: string) => void;
  onToggleFavorite: (toolId: string) => void;
  compact?: boolean;
}

export function CartridgeCard({
  tool,
  isFavorite,
  onOpen,
  onToggleFavorite,
  compact = false,
}: CartridgeCardProps) {
  const cat = CATEGORY_MAP[tool.category];

  return (
    <div
      className={clsx(
        "group relative flex flex-col justify-between rounded-[10px] border border-[var(--border-subtle)] bg-[var(--bg-module)] overflow-hidden transition-[background-color,border-color] duration-100 hover:border-[var(--border-strong)] hover:bg-[var(--bg-workbench)]",
        compact ? "p-3" : "p-3.5"
      )}
      style={{ boxShadow: "var(--shadow-module)" }}
    >
      {/* 3px Category Indicator Strip */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px]"
        style={{ backgroundColor: cat.cssVar }}
        aria-hidden="true"
      />

      <div className="pl-2 flex items-start justify-between gap-2">
        <button
          type="button"
          onClick={() => onOpen(tool.id)}
          className="text-left flex-1 min-w-0 cursor-pointer focus-visible:outline-none"
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono-tech text-[10px] font-semibold text-[var(--text-muted)]">
              #{String(tool.number).padStart(2, "0")}
            </span>
            <span className="font-mono-tech text-[10px] text-[var(--text-muted)] truncate">
              {tool.machineName}
            </span>
          </div>
          <h3 className="font-display text-[14px] font-semibold text-[var(--text-primary)] leading-snug group-hover:text-[var(--accent-signal)] transition-colors duration-100">
            {tool.name}
          </h3>
          {!compact && (
            <p className="mt-1 text-[12px] text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
              {tool.shortDescription}
            </p>
          )}
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(tool.id);
          }}
          aria-label={
            isFavorite
              ? `Remover ${tool.name} dos favoritos`
              : `Adicionar ${tool.name} aos favoritos`
          }
          title={isFavorite ? "Remover dos favoritos" : "Fixar nos favoritos"}
          className={clsx(
            "shrink-0 p-1 rounded-[6px] cursor-pointer transition-colors duration-100 hover:bg-[var(--bg-hover)]",
            isFavorite ? "text-[var(--accent-signal)]" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          )}
        >
          <Star className="w-3.5 h-3.5" fill={isFavorite ? "currentColor" : "none"} />
        </button>
      </div>

      {!compact && (
        <div className="pl-2 mt-3 pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between gap-2">
          <span className="font-mono-tech text-[10px] text-[var(--text-muted)] truncate">
            {tool.localEngine}
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            {tool.optionalApiProvider && (
              <span
                title="Suporta IA local ou API Key opcional"
                className="inline-flex items-center gap-0.5 rounded-[4px] bg-[var(--bg-recessed)] px-1.5 py-0.5 font-mono-tech text-[10px] text-[var(--text-secondary)]"
              >
                <Sparkles className="w-2.5 h-2.5 text-[var(--accent-signal)]" /> IA
              </span>
            )}
            {tool.supportsBatch && (
              <span
                title="Suporta processamento em lote"
                className="inline-flex items-center gap-0.5 rounded-[4px] bg-[var(--bg-recessed)] px-1.5 py-0.5 font-mono-tech text-[10px] text-[var(--text-secondary)]"
              >
                <Layers className="w-2.5 h-2.5" /> Lote
              </span>
            )}
            {tool.supportsPipeline && (
              <span
                title="Compatível com encadeamento em Pipelines"
                className="inline-flex items-center gap-0.5 rounded-[4px] bg-[var(--bg-recessed)] px-1.5 py-0.5 font-mono-tech text-[10px] text-[var(--text-secondary)]"
              >
                <Workflow className="w-2.5 h-2.5" /> Pipe
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
