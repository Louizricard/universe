import { motion, AnimatePresence } from "motion/react";
import { Search, Sun, Moon, Layers, Settings } from "lucide-react";
import { useUniverseStore } from "@/lib/store";
import { KeyCap, StatusLed } from "@/design-system/components";
import { MOTION } from "@/design-system/motion";

export function Topbar() {
  const theme = useUniverseStore((s) => s.theme);
  const toggleTheme = useUniverseStore((s) => s.toggleTheme);
  const setCommandPaletteOpen = useUniverseStore((s) => s.setCommandPaletteOpen);
  const batchDrawerOpen = useUniverseStore((s) => s.batchDrawerOpen);
  const setBatchDrawerOpen = useUniverseStore((s) => s.setBatchDrawerOpen);
  const navigateHome = useUniverseStore((s) => s.navigateHome);
  const navigateView = useUniverseStore((s) => s.navigateView);
  const jobs = useUniverseStore((s) => s.jobs);

  const runningCount = jobs.filter((j) => j.status === "running" || j.status === "queued").length;

  return (
    <header className="h-[44px] shrink-0 z-10 flex items-center justify-between gap-3 px-3.5 border-b border-[var(--border-subtle)] bg-[var(--bg-chassis)] select-none">
      {/* Brand Emblem */}
      <button
        type="button"
        onClick={navigateHome}
        className="flex items-center gap-2.5 cursor-pointer rounded-[6px] px-1 py-0.5 hover:bg-[var(--bg-hover)]"
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
          <rect x="2" y="2" width="20" height="20" rx="5" fill="var(--text-primary)" />
          <circle cx="12" cy="12" r="5.5" fill="none" stroke="var(--accent-signal)" strokeWidth="2.2" />
          <circle cx="12" cy="12" r="2" fill="var(--bg-workbench)" />
        </svg>
        <span className="font-display text-[14px] font-bold tracking-[-0.02em] text-[var(--text-primary)]">
          UNIVERSE
        </span>
        <span className="hidden sm:inline font-mono-tech text-[10px] rounded-[4px] bg-[var(--bg-recessed)] px-1.5 py-0.5 text-[var(--text-muted)]">
          OFICINA v0.1
        </span>
      </button>

      {/* Center Command Palette Trigger */}
      <button
        type="button"
        onClick={() => setCommandPaletteOpen(true)}
        data-testid="topbar-search-btn"
        aria-label="Abrir Command Palette (Ctrl+K)"
        className="flex items-center justify-between gap-3 h-8 w-full max-w-[380px] rounded-[8px] border border-[var(--border-strong)] bg-[var(--bg-module)] px-3 text-[12px] text-[var(--text-muted)] hover:border-[var(--accent-signal)] cursor-pointer transition-colors duration-100"
      >
        <span className="flex items-center gap-2 truncate">
          <Search className="w-3.5 h-3.5 text-[var(--text-secondary)] shrink-0" />
          <span className="truncate">Buscar 70 ferramentas ou comandos...</span>
        </span>
        <KeyCap keys={["Ctrl", "K"]} />
      </button>

      {/* Right Utility Controls */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={() => setBatchDrawerOpen(!batchDrawerOpen)}
          aria-label="Alternar bandeja de jobs em lote"
          className="inline-flex items-center gap-2 h-8 rounded-[7px] border border-[var(--border-subtle)] bg-[var(--bg-module)] px-2.5 text-[12px] font-medium text-[var(--text-primary)] hover:bg-[var(--bg-hover)] cursor-pointer"
        >
          <StatusLed tone={runningCount > 0 ? "signal" : "ok"} />
          <Layers className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
          <span className="font-mono-tech text-[11px]">{runningCount > 0 ? `${runningCount} ativos` : "Fila"}</span>
        </button>

        {/* Crossfade Icon Swap Theme Toggle (light <-> dark) */}
        <button
          type="button"
          onClick={toggleTheme}
          data-testid="theme-toggle-btn"
          aria-label={theme === "light" ? "Ativar Modo Escuro" : "Ativar Modo Claro"}
          title={theme === "light" ? "Modo Escuro (Grafite)" : "Modo Claro (Alumínio)"}
          className="relative grid place-items-center h-8 w-8 rounded-[7px] border border-[var(--border-subtle)] bg-[var(--bg-module)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] cursor-pointer"
        >
          <AnimatePresence mode="wait" initial={false}>
            {theme === "light" ? (
              <motion.span
                key="sun"
                initial={{ opacity: 0, scale: 0.4, filter: "blur(3px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, scale: 0.4, filter: "blur(3px)" }}
                transition={MOTION.fadeFast}
                className="col-start-1 row-start-1"
              >
                <Sun className="w-4 h-4 text-[var(--accent-signal)]" />
              </motion.span>
            ) : (
              <motion.span
                key="moon"
                initial={{ opacity: 0, scale: 0.4, filter: "blur(3px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, scale: 0.4, filter: "blur(3px)" }}
                transition={MOTION.fadeFast}
                className="col-start-1 row-start-1"
              >
                <Moon className="w-4 h-4 text-[var(--accent-signal)]" />
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        <button
          type="button"
          onClick={() => navigateView("settings")}
          aria-label="Abrir configurações de motores e chaves"
          title="Motores & Chaves"
          className="grid place-items-center h-8 w-8 rounded-[7px] border border-[var(--border-subtle)] bg-[var(--bg-module)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] cursor-pointer"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
