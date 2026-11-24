import React from "react";
import { motion } from "motion/react";
import {
  Home,
  Workflow,
  Layers,
  Star,
  Cpu,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { clsx } from "clsx";
import { CATEGORIES } from "@/registry/categories";
import { useUniverseStore } from "@/lib/store";
import { MOTION } from "@/design-system/motion";

export function Sidebar() {
  const collapsed = useUniverseStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUniverseStore((s) => s.toggleSidebar);
  const activeView = useUniverseStore((s) => s.activeView);
  const activeCategoryId = useUniverseStore((s) => s.activeCategoryId);
  const navigateHome = useUniverseStore((s) => s.navigateHome);
  const navigateCategory = useUniverseStore((s) => s.navigateCategory);
  const navigateView = useUniverseStore((s) => s.navigateView);
  const favoritesCount = useUniverseStore((s) => s.favorites.length);
  const activeJobsCount = useUniverseStore(
    (s) => s.jobs.filter((j) => j.status === "running" || j.status === "queued").length
  );

  const [hoveredId, setHoveredId] = React.useState<string | null>(null);

  const primaryItems = [
    { id: "nav-home", label: "Bancada", icon: Home, active: activeView === "home", onClick: navigateHome },
    { id: "nav-pipelines", label: "Pipelines", icon: Workflow, active: activeView === "pipelines", onClick: () => navigateView("pipelines") },
    {
      id: "nav-batch",
      label: "Fila de Lote",
      icon: Layers,
      active: activeView === "batch",
      badge: activeJobsCount > 0 ? String(activeJobsCount) : undefined,
      onClick: () => navigateView("batch"),
    },
    {
      id: "nav-favorites",
      label: "Favoritos",
      icon: Star,
      active: activeView === "favorites",
      badge: favoritesCount > 0 ? String(favoritesCount) : undefined,
      onClick: () => navigateView("favorites"),
    },
    { id: "nav-settings", label: "Motores & Chaves", icon: Cpu, active: activeView === "settings", onClick: () => navigateView("settings") },
  ];

  return (
    <aside
      aria-label="Navegação Principal"
      className="relative z-10 shrink-0 border-r border-[var(--border-subtle)] bg-[var(--bg-chassis)] overflow-hidden transition-[width] duration-200"
      style={{ width: collapsed ? 64 : 240 }}
    >
      {/* Fixed inner width prevents text reflow while collapsing */}
      <div className="h-full flex flex-col justify-between p-2.5" style={{ width: collapsed ? 64 : 240 }}>
        <div
          className="space-y-4 overflow-y-auto overflow-x-hidden pr-0.5"
          onMouseLeave={() => setHoveredId(null)}
        >
          {/* Primary Navigation */}
          <nav className="space-y-0.5">
            {primaryItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  title={collapsed ? item.label : undefined}
                  aria-label={item.label}
                  onMouseEnter={() => setHoveredId(item.id)}
                  onClick={item.onClick}
                  className={clsx(
                    "relative w-full flex items-center gap-2.5 h-8 rounded-[7px] px-2.5 text-[13px] cursor-pointer transition-colors duration-100",
                    item.active
                      ? "text-[var(--text-primary)] font-semibold"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  )}
                >
                  {hoveredId === item.id && (
                    <motion.span
                      layoutId="sidebar-fluid-hover"
                      transition={MOTION.springSnappy}
                      className="absolute inset-0 rounded-[7px] bg-[var(--bg-hover)] -z-10"
                    />
                  )}
                  {item.active && (
                    <span
                      className="absolute inset-0 rounded-[7px] bg-[var(--bg-module)] border border-[var(--border-subtle)] -z-20"
                      style={{ boxShadow: "var(--shadow-module)" }}
                    />
                  )}
                  <Icon
                    className={clsx(
                      "w-4 h-4 shrink-0",
                      item.active ? "text-[var(--accent-signal)]" : "text-[var(--text-secondary)]"
                    )}
                  />
                  {!collapsed && (
                    <>
                      <span className="truncate flex-1 text-left">{item.label}</span>
                      {item.badge && (
                        <span className="font-mono-tech text-[10px] rounded-full bg-[var(--bg-recessed)] px-1.5 py-0.5 text-[var(--text-secondary)]">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </button>
              );
            })}
          </nav>

          {/* 7 Categories */}
          <div className="space-y-1">
            {!collapsed && (
              <div className="px-2.5 font-mono-tech text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)]">
                Módulos (70)
              </div>
            )}
            <nav className="space-y-0.5">
              {CATEGORIES.map((cat) => {
                const isActive = activeView === "category" && activeCategoryId === cat.id;
                const keyId = `cat-${cat.id}`;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    title={collapsed ? cat.name : undefined}
                    aria-label={cat.name}
                    onMouseEnter={() => setHoveredId(keyId)}
                    onClick={() => navigateCategory(cat.id)}
                    className={clsx(
                      "relative w-full flex items-center gap-2.5 h-8 rounded-[7px] px-2.5 text-[13px] cursor-pointer transition-colors duration-100",
                      isActive
                        ? "text-[var(--text-primary)] font-semibold"
                        : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    )}
                  >
                    {hoveredId === keyId && (
                      <motion.span
                        layoutId="sidebar-fluid-hover"
                        transition={MOTION.springSnappy}
                        className="absolute inset-0 rounded-[7px] bg-[var(--bg-hover)] -z-10"
                      />
                    )}
                    {isActive && (
                      <span
                        className="absolute inset-0 rounded-[7px] bg-[var(--bg-module)] border border-[var(--border-subtle)] -z-20"
                        style={{ boxShadow: "var(--shadow-module)" }}
                      />
                    )}
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 ml-0.5"
                      style={{ backgroundColor: cat.cssVar }}
                    />
                    {!collapsed && (
                      <>
                        <span className="truncate flex-1 text-left">{cat.shortName}</span>
                        <span className="font-mono-tech text-[10px] text-[var(--text-muted)]">10</span>
                      </>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Collapse Sidebar Control */}
        <div className="pt-2 border-t border-[var(--border-subtle)]">
          <button
            type="button"
            onClick={toggleSidebar}
            aria-label={collapsed ? "Expandir barra lateral" : "Recolher barra lateral"}
            className="w-full flex items-center justify-center gap-2 h-8 rounded-[7px] px-2 text-[12px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] cursor-pointer"
          >
            {collapsed ? (
              <PanelLeftOpen className="w-4 h-4" />
            ) : (
              <>
                <PanelLeftClose className="w-4 h-4" />
                <span className="flex-1 text-left">Recolher painel</span>
              </>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}
