import React from "react";
import { Star, Clock, Search, Filter } from "lucide-react";
import { CATEGORIES, CATEGORY_MAP } from "@/registry/categories";
import { TOOLS, TOOL_MAP } from "@/registry/tools";
import type { CategoryId } from "@/registry/types";
import { useUniverseStore } from "@/lib/store";
import { SmartDropzone } from "./SmartDropzone";
import { CartridgeCard } from "./CartridgeCard";

export function HomeView({
  lockedCategory,
  favoritesOnly = false,
}: {
  lockedCategory?: CategoryId;
  favoritesOnly?: boolean;
}) {
  const favorites = useUniverseStore((s) => s.favorites);
  const recents = useUniverseStore((s) => s.recents);
  const openTool = useUniverseStore((s) => s.openTool);
  const toggleFavorite = useUniverseStore((s) => s.toggleFavorite);

  const [selectedCategory, setSelectedCategory] = React.useState<CategoryId | "all">(
    lockedCategory ?? "all"
  );
  const [query, setQuery] = React.useState("");
  const [batchOnly, setBatchOnly] = React.useState(false);

  React.useEffect(() => {
    setSelectedCategory(lockedCategory ?? "all");
  }, [lockedCategory]);

  const filteredTools = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return TOOLS.filter((tool) => {
      if (favoritesOnly && !favorites.includes(tool.id)) return false;
      if (selectedCategory !== "all" && tool.category !== selectedCategory) return false;
      if (batchOnly && !tool.supportsBatch) return false;
      if (!q) return true;
      return (
        tool.name.toLowerCase().includes(q) ||
        tool.shortDescription.toLowerCase().includes(q) ||
        tool.machineName.toLowerCase().includes(q) ||
        tool.keywords.some((kw) => kw.toLowerCase().includes(q)) ||
        String(tool.number) === q
      );
    });
  }, [favoritesOnly, favorites, selectedCategory, batchOnly, query]);

  const favoriteTools = favorites.map((id) => TOOL_MAP[id]).filter(Boolean);
  const recentTools = recents.map((id) => TOOL_MAP[id]).filter(Boolean);

  const headerTitle = favoritesOnly
    ? "Favoritos Fixados"
    : lockedCategory
    ? CATEGORY_MAP[lockedCategory].name
    : "Bancada Universal";

  const headerSubtitle = favoritesOnly
    ? "Suas ferramentas mais usadas com acesso em um clique."
    : lockedCategory
    ? CATEGORY_MAP[lockedCategory].description
    : "70 ferramentas locais organizadas em 7 módulos industriais — sem paywalls e sem anúncios.";

  return (
    <div className="space-y-6 pb-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[24px] font-bold tracking-[-0.025em] text-[var(--text-primary)] leading-tight">
            {headerTitle}
          </h1>
          <p className="text-[13px] text-[var(--text-secondary)] mt-1">{headerSubtitle}</p>
        </div>
        <div className="font-mono-tech text-[11px] text-[var(--text-muted)]">
          EXIBINDO <strong className="text-[var(--text-primary)]">{filteredTools.length}</strong> / 70 MÁQUINAS
        </div>
      </header>

      {!lockedCategory && !favoritesOnly && <SmartDropzone />}

      {/* Favorites & Recents quick access on Home */}
      {!lockedCategory && !favoritesOnly && (favoriteTools.length > 0 || recentTools.length > 0) && (
        <div
          className={
            favoriteTools.length > 0 && recentTools.length > 0
              ? "grid grid-cols-1 xl:grid-cols-2 gap-4"
              : "grid grid-cols-1 gap-4"
          }
        >
          {favoriteTools.length > 0 && (
            <section className="rounded-[12px] border border-[var(--border-subtle)] bg-[var(--bg-workbench)] p-4">
              <div className="flex items-center gap-2 mb-3">
                <Star className="w-3.5 h-3.5 text-[var(--accent-signal)]" fill="currentColor" />
                <h2 className="font-mono-tech text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--text-secondary)]">
                  Favoritos Fixados
                </h2>
              </div>
              <div
                className={
                  recentTools.length === 0
                    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5"
                    : "grid grid-cols-1 sm:grid-cols-2 gap-2.5"
                }
              >
                {favoriteTools.slice(0, 6).map((tool) => (
                  <CartridgeCard
                    key={tool.id}
                    tool={tool}
                    isFavorite
                    onOpen={openTool}
                    onToggleFavorite={toggleFavorite}
                    compact
                  />
                ))}
              </div>
            </section>
          )}

          {recentTools.length > 0 && (
            <section className="rounded-[12px] border border-[var(--border-subtle)] bg-[var(--bg-workbench)] p-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                <h2 className="font-mono-tech text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--text-secondary)]">
                  Usadas Recentemente
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {recentTools.slice(0, 4).map((tool) => (
                  <CartridgeCard
                    key={tool.id}
                    tool={tool}
                    isFavorite={favorites.includes(tool.id)}
                    onOpen={openTool}
                    onToggleFavorite={toggleFavorite}
                    compact
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {!lockedCategory && (
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedCategory("all")}
              className="h-7 px-2.5 rounded-[6px] text-[12px] font-medium cursor-pointer border transition-colors duration-100"
              style={{
                backgroundColor:
                  selectedCategory === "all" ? "var(--text-primary)" : "var(--bg-module)",
                color:
                  selectedCategory === "all" ? "var(--bg-module)" : "var(--text-secondary)",
                borderColor: "var(--border-subtle)",
              }}
            >
              Todas (70)
            </button>
            {CATEGORIES.map((cat) => {
              const active = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-[6px] text-[12px] font-medium cursor-pointer border transition-colors duration-100"
                  style={{
                    backgroundColor: active ? "var(--bg-module)" : "transparent",
                    color: active ? "var(--text-primary)" : "var(--text-secondary)",
                    borderColor: active ? "var(--border-strong)" : "var(--border-subtle)",
                  }}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: cat.cssVar }}
                  />
                  {cat.shortName}
                </button>
              );
            })}
          </div>
        )}

        <div className="flex items-center gap-2 ml-auto">
          <button
            type="button"
            onClick={() => setBatchOnly((v) => !v)}
            className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-[6px] text-[12px] font-medium border cursor-pointer transition-colors duration-100"
            style={{
              backgroundColor: batchOnly ? "var(--accent-signal-soft)" : "var(--bg-module)",
              borderColor: batchOnly ? "var(--accent-signal)" : "var(--border-subtle)",
              color: batchOnly ? "var(--accent-signal)" : "var(--text-secondary)",
            }}
          >
            <Filter className="w-3.5 h-3.5" />
            Somente Lote
          </button>

          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-2.5 pointer-events-none" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filtrar ferramentas..."
              aria-label="Filtrar catálogo de ferramentas"
              className="h-8 w-[200px] rounded-[6px] border border-[var(--border-strong)] bg-[var(--bg-module)] pl-8 pr-2.5 text-[12px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
            />
          </div>
        </div>
      </div>

      {/* 70-Tool Cartridge Grid */}
      {filteredTools.length === 0 ? (
        <div className="rounded-[12px] border border-dashed border-[var(--border-strong)] bg-[var(--bg-workbench)] p-10 text-center">
          <p className="text-[14px] font-medium text-[var(--text-primary)]">
            Nenhuma ferramenta encontrada para este filtro.
          </p>
          <p className="text-[12px] text-[var(--text-secondary)] mt-1">
            Limpe a busca ou pressione Ctrl+K para pesquisar em todas as 70 máquinas.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filteredTools.map((tool) => (
            <CartridgeCard
              key={tool.id}
              tool={tool}
              isFavorite={favorites.includes(tool.id)}
              onOpen={openTool}
              onToggleFavorite={toggleFavorite}
            />
          ))}
        </div>
      )}
    </div>
  );
}
