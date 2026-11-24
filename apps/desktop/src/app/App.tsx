import React from "react";
import { MotionConfig, AnimatePresence, motion } from "motion/react";
import { Upload } from "lucide-react";
import { useUniverseStore } from "@/lib/store";
import { subscribeJobEvents } from "@/lib/ipc";
import { detectFromFiles, detectFromUrl } from "@/lib/detector";
import { MOTION } from "@/design-system/motion";
import { Topbar } from "./Topbar";
import { Sidebar } from "./Sidebar";
import { CommandPalette } from "./CommandPalette";
import { HomeView } from "@/features/home/HomeView";
import { ToolWorkbench } from "@/features/workspace/ToolWorkbench";
import { PipelinesView } from "@/features/pipelines/PipelinesView";
import { BatchView } from "@/features/batch/BatchView";
import { BatchDrawer } from "@/features/batch/BatchDrawer";
import { SettingsView } from "@/features/settings/SettingsView";

export function App() {
  const init = useUniverseStore((s) => s.init);
  const upsertJob = useUniverseStore((s) => s.upsertJob);
  const activeView = useUniverseStore((s) => s.activeView);
  const activeCategoryId = useUniverseStore((s) => s.activeCategoryId);
  const activeToolId = useUniverseStore((s) => s.activeToolId);
  const commandPaletteOpen = useUniverseStore((s) => s.commandPaletteOpen);
  const setCommandPaletteOpen = useUniverseStore((s) => s.setCommandPaletteOpen);
  const setDetectedInput = useUniverseStore((s) => s.setDetectedInput);
  const navigateHome = useUniverseStore((s) => s.navigateHome);

  const [globalDragActive, setGlobalDragActive] = React.useState(false);

  React.useEffect(() => {
    void init();
    let unlisten: (() => void) | undefined;
    void subscribeJobEvents((record) => upsertJob(record)).then((fn) => {
      unlisten = fn;
    });
    return () => {
      unlisten?.();
    };
  }, [init, upsertJob]);

  // Global keyboard shortcuts: Ctrl+K (Command Palette) & global Ctrl+V URL detection
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      }
    };
    const onPaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
        return;
      }
      const text = e.clipboardData?.getData("text")?.trim();
      if (text && (text.startsWith("http://") || text.startsWith("https://"))) {
        const detected = detectFromUrl(text);
        if (detected) {
          setDetectedInput(detected);
          navigateHome();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("paste", onPaste);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("paste", onPaste);
    };
  }, [commandPaletteOpen, setCommandPaletteOpen, setDetectedInput, navigateHome]);

  const handleGlobalDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setGlobalDragActive(false);
    if (e.dataTransfer.files?.length) {
      const files = Array.from(e.dataTransfer.files).map((f) => ({
        name: f.name,
        type: f.type,
        size: f.size,
      }));
      setDetectedInput(detectFromFiles(files));
      if (activeView !== "tool") {
        navigateHome();
      }
    }
  };

  const viewKey = `${activeView}-${activeCategoryId}-${activeToolId ?? ""}`;

  return (
    <MotionConfig reducedMotion="user">
      <div
        className="h-full flex flex-col bg-[var(--bg-chassis)] text-[var(--text-primary)]"
        onDragOver={(e) => {
          if (e.dataTransfer.types.includes("Files")) {
            e.preventDefault();
            setGlobalDragActive(true);
          }
        }}
        onDragLeave={(e) => {
          if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
          setGlobalDragActive(false);
        }}
        onDrop={handleGlobalDrop}
      >
        <Topbar />

        <div className="flex-1 flex min-h-0 overflow-hidden">
          <Sidebar />

          <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
            <main className="flex-1 min-w-0 overflow-y-auto bg-[var(--bg-workbench)] px-6 py-5">
              <div className="max-w-[1280px] mx-auto">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={viewKey}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={MOTION.fadeFast}
                  >
                    {activeView === "home" && <HomeView />}
                    {activeView === "category" && <HomeView lockedCategory={activeCategoryId} />}
                    {activeView === "favorites" && <HomeView favoritesOnly />}
                    {activeView === "tool" && activeToolId && <ToolWorkbench toolId={activeToolId} />}
                    {activeView === "pipelines" && <PipelinesView />}
                    {activeView === "batch" && <BatchView />}
                    {activeView === "settings" && <SettingsView />}
                  </motion.div>
                </AnimatePresence>
              </div>
            </main>

            <BatchDrawer />
          </div>
        </div>

        {/* Global Magnetic Drop Overlay (z-30) */}
        <AnimatePresence>
          {globalDragActive && (
            <motion.div
              key="global-drop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={MOTION.fadeFast}
              className="fixed inset-0 z-30 flex items-center justify-center bg-black/45 p-8 pointer-events-none"
            >
              <div className="rounded-[16px] border-2 border-dashed border-[var(--accent-signal)] bg-[var(--bg-module)] px-10 py-8 text-center shadow-2xl">
                <Upload className="w-10 h-10 mx-auto text-[var(--accent-signal)]" />
                <p className="font-display text-[18px] font-bold text-[var(--text-primary)] mt-3">
                  Solte os arquivos na Oficina Universe
                </p>
                <p className="text-[13px] text-[var(--text-secondary)] mt-1">
                  As máquinas compatíveis serão sugeridas instantaneamente.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <CommandPalette />
      </div>
    </MotionConfig>
  );
}
