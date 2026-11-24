import React from "react";
import { Search, Star, Sun, Moon, Cpu, Layers, Workflow, ArrowRight } from "lucide-react";
import { TOOLS } from "@/registry/tools";
import { CATEGORY_MAP } from "@/registry/categories";
import { useUniverseStore } from "@/lib/store";
import { KeyCap } from "@/design-system/components";

interface PaletteItem {
  id: string;
  title: string;
  subtitle: string;
  badge?: string;
  accentColor?: string;
  toolId?: string;
  onSelect: () => void;
}

export function CommandPalette() {
  const open = useUniverseStore((s) => s.commandPaletteOpen);
  const setOpen = useUniverseStore((s) => s.setCommandPaletteOpen);
  const openTool = useUniverseStore((s) => s.openTool);
  const navigateView = useUniverseStore((s) => s.navigateView);
  const toggleTheme = useUniverseStore((s) => s.toggleTheme);
  const toggleFavorite = useUniverseStore((s) => s.toggleFavorite);
  const favorites = useUniverseStore((s) => s.favorites);
  const theme = useUniverseStore((s) => s.theme);

  const [query, setQuery] = React.useState("");
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const items = React.useMemo<PaletteItem[]>(() => {
    const q = query.trim().toLowerCase();

    const actions: PaletteItem[] = [
      {
        id: "cmd-theme",
        title: theme === "light" ? "Alternar para Modo Escuro (Grafite)" : "Alternar para Modo Claro (Alumínio)",
        subtitle: "Tema da interface",
        badge: "AÇÃO",
        onSelect: () => {
          toggleTheme();
          setOpen(false);
        },
      },
      {
        id: "cmd-pipelines",
        title: "Abrir Editor de Pipelines",
        subtitle: "Encadear ferramentas em série",
        badge: "VIEW",
        onSelect: () => {
          navigateView("pipelines");
          setOpen(false);
        },
      },
      {
        id: "cmd-batch",
        title: "Abrir Fila de Lote (Batch)",
        subtitle: "Ver progresso e retentar falhos",
        badge: "VIEW",
        onSelect: () => {
          navigateView("batch");
          setOpen(false);
        },
      },
      {
        id: "cmd-settings",
        title: "Abrir Motores Locais & Cofre de API Keys",
        subtitle: "Gerenciar binários, modelos ONNX e chaves",
        badge: "CONFIG",
        onSelect: () => {
          navigateView("settings");
          setOpen(false);
        },
      },
    ];

    const matchedTools: PaletteItem[] = TOOLS.filter((tool) => {
      if (!q) return true;
      return (
        tool.name.toLowerCase().includes(q) ||
        tool.shortDescription.toLowerCase().includes(q) ||
        tool.machineName.toLowerCase().includes(q) ||
        tool.keywords.some((kw) => kw.toLowerCase().includes(q)) ||
        String(tool.number) === q
      );
    }).map((tool) => ({
      id: tool.id,
      title: tool.name,
      subtitle: `${tool.machineName} · ${tool.localEngine}`,
      badge: `#${String(tool.number).padStart(2, "0")}`,
      accentColor: CATEGORY_MAP[tool.category].cssVar,
      toolId: tool.id,
      onSelect: () => {
        openTool(tool.id);
        setOpen(false);
      },
    }));

    const matchedActions = q
      ? actions.filter(
          (a) => a.title.toLowerCase().includes(q) || a.subtitle.toLowerCase().includes(q)
        )
      : actions;

    return [...matchedTools.slice(0, 12), ...matchedActions];
  }, [query, theme, toggleTheme, navigateView, openTool, setOpen]);

  React.useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  if (!open) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(items.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter" && items[selectedIndex]) {
      e.preventDefault();
      items[selectedIndex].onSelect();
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "d") {
      const current = items[selectedIndex];
      if (current?.toolId) {
        e.preventDefault();
        toggleFavorite(current.toolId);
      }
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette"
      data-testid="command-palette"
      className="fixed inset-0 z-40 flex items-start justify-center pt-[12vh] px-4 bg-black/40"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
      onKeyDown={handleKeyDown}
    >
      <div
        className="w-full max-w-[600px] rounded-[14px] border border-[var(--border-strong)] bg-[var(--bg-module)] overflow-hidden"
        style={{ boxShadow: "var(--shadow-elevated)" }}
      >
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-workbench)]">
          <Search className="w-4 h-4 text-[var(--accent-signal)] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar nas 70 ferramentas (ex: prensar, pdf, fundo, qr, youtube)..."
            aria-label="Buscar ferramentas e comandos"
            className="flex-1 bg-transparent text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
          />
          <KeyCap keys={["Esc"]} />
        </div>

        <div className="max-h-[360px] overflow-y-auto p-2 space-y-0.5">
          {items.length === 0 ? (
            <div className="py-10 text-center text-[13px] text-[var(--text-secondary)]">
              Nenhum resultado para “{query}”.
            </div>
          ) : (
            items.map((item, idx) => {
              const active = idx === selectedIndex;
              const isFav = item.toolId ? favorites.includes(item.toolId) : false;
              return (
                <button
                  key={item.id}
                  type="button"
                  onMouseEnter={() => setSelectedIndex(idx)}
                  onClick={item.onSelect}
                  className="w-full flex items-center justify-between gap-3 rounded-[8px] px-3 py-2 text-left cursor-pointer"
                  style={{
                    backgroundColor: active ? "var(--bg-hover)" : "transparent",
                  }}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {item.accentColor ? (
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: item.accentColor }}
                      />
                    ) : item.id === "cmd-theme" ? (
                      theme === "light" ? (
                        <Moon className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                      ) : (
                        <Sun className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                      )
                    ) : item.id === "cmd-settings" ? (
                      <Cpu className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                    ) : item.id === "cmd-batch" ? (
                      <Layers className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                    ) : (
                      <Workflow className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                    )}
                    <div className="min-w-0">
                      <div className="text-[13px] font-medium text-[var(--text-primary)] truncate">
                        {item.title}
                      </div>
                      <div className="font-mono-tech text-[10px] text-[var(--text-muted)] truncate">
                        {item.subtitle}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isFav && (
                      <Star
                        className="w-3 h-3 text-[var(--accent-signal)]"
                        fill="currentColor"
                      />
                    )}
                    {item.badge && (
                      <span className="font-mono-tech text-[10px] rounded-[4px] bg-[var(--bg-recessed)] px-1.5 py-0.5 text-[var(--text-secondary)]">
                        {item.badge}
                      </span>
                    )}
                    {active && <ArrowRight className="w-3.5 h-3.5 text-[var(--accent-signal)]" />}
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div className="flex items-center justify-between px-4 py-2 border-t border-[var(--border-subtle)] bg-[var(--bg-workbench)] text-[11px] text-[var(--text-muted)]">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <KeyCap keys={["↑", "↓"]} /> navegar
            </span>
            <span className="inline-flex items-center gap-1">
              <KeyCap keys={["↵"]} /> abrir
            </span>
            <span className="inline-flex items-center gap-1">
              <KeyCap keys={["Ctrl", "D"]} /> favoritar
            </span>
          </div>
          <span className="font-mono-tech text-[10px]">70 FERRAMENTAS</span>
        </div>
      </div>
    </div>
  );
}
