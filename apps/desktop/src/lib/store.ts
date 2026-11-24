import { create } from "zustand";
import type { CategoryId } from "@/registry/types";
import type { DetectedInput } from "./detector";
import {
  cancelBackendJob,
  checkSidecar,
  deleteApiKey,
  getSystemInfo,
  isTauriRuntime,
  listApiProviders,
  listEngines,
  saveApiKey,
  submitBackendJob,
  type ApiProviderStatus,
  type EngineStatus,
  type JobRecord,
  type SubmitJobInput,
  type SystemInfo,
  type WorkerHealth,
} from "./ipc";

export type AppView =
  | "home"
  | "category"
  | "tool"
  | "pipelines"
  | "batch"
  | "favorites"
  | "settings";

export interface SavedPipeline {
  id: string;
  name: string;
  description: string;
  stepToolIds: string[];
  builtin?: boolean;
}

const DEFAULT_PIPELINES: SavedPipeline[] = [
  {
    id: "preset-yt-transcribe",
    name: "YouTube → Áudio Limpo → Transcrição",
    description: "Baixa o vídeo, separa o áudio, remove ruído de fundo e gera texto com timestamps.",
    stepToolIds: ["dl-youtube", "media-extract-audio", "media-denoise-audio", "media-transcribe"],
    builtin: true,
  },
  {
    id: "preset-photo-pack",
    name: "Fotos iPhone → JPG Limpo → Comprimir → ZIP",
    description: "Converte HEIC para JPG, apaga GPS/EXIF, otimiza o peso e empacota tudo em ZIP.",
    stepToolIds: ["img-heic-to-jpg", "extra-strip-exif", "img-compress", "util-zip-create"],
    builtin: true,
  },
  {
    id: "preset-pdf-ocr-press",
    name: "PDF Escaneado → OCR → Comprimir PDF",
    description: "Torna o documento pesquisável via OCR e reduz o tamanho final na prensa hidráulica.",
    stepToolIds: ["pdf-ocr", "pdf-compress"],
    builtin: true,
  },
];

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeStorage(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore storage quota errors
  }
}

const previewTimers = new Map<string, number>();

export interface UniverseState {
  theme: "light" | "dark";
  sidebarCollapsed: boolean;
  activeView: AppView;
  activeCategoryId: CategoryId;
  activeToolId: string | null;
  commandPaletteOpen: boolean;
  batchDrawerOpen: boolean;
  favorites: string[];
  recents: string[];
  detectedInput: DetectedInput | null;
  jobs: JobRecord[];
  savedPipelines: SavedPipeline[];
  systemInfo: SystemInfo | null;
  engines: EngineStatus[];
  apiProviders: ApiProviderStatus[];
  sidecarHealth: WorkerHealth | null;
  bootstrapped: boolean;

  init: () => Promise<void>;
  toggleTheme: () => void;
  setTheme: (theme: "light" | "dark") => void;
  toggleSidebar: () => void;
  navigateHome: () => void;
  navigateCategory: (category: CategoryId) => void;
  openTool: (toolId: string) => void;
  navigateView: (view: Exclude<AppView, "category" | "tool">) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setBatchDrawerOpen: (open: boolean) => void;
  toggleFavorite: (toolId: string) => void;
  setDetectedInput: (input: DetectedInput | null) => void;
  upsertJob: (job: JobRecord) => void;
  submitJob: (input: SubmitJobInput) => Promise<JobRecord>;
  submitBatch: (inputs: SubmitJobInput[]) => Promise<string>;
  cancelJob: (jobId: string) => Promise<void>;
  retryFailedJobs: () => Promise<void>;
  clearFinishedJobs: () => void;
  savePipelineRecipe: (name: string, description: string, stepToolIds: string[]) => void;
  deletePipelineRecipe: (id: string) => void;
  refreshRuntime: () => Promise<void>;
  saveProviderKey: (provider: string, key: string) => Promise<string>;
  deleteProviderKey: (provider: string) => Promise<void>;
}

function applyThemeToDom(theme: "light" | "dark") {
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("data-theme", theme);
  }
}

const initialTheme = readStorage<"light" | "dark">("universe:theme", "light");
applyThemeToDom(initialTheme);

export const useUniverseStore = create<UniverseState>((set, get) => ({
  theme: initialTheme,
  sidebarCollapsed: false,
  activeView: "home",
  activeCategoryId: "pdf",
  activeToolId: null,
  commandPaletteOpen: false,
  batchDrawerOpen: false,
  favorites: readStorage<string[]>("universe:favorites", ["pdf-compress", "img-remove-bg", "util-qr-generate"]),
  recents: readStorage<string[]>("universe:recents", []),
  detectedInput: null,
  jobs: [],
  savedPipelines: readStorage<SavedPipeline[]>("universe:pipelines", DEFAULT_PIPELINES),
  systemInfo: null,
  engines: [],
  apiProviders: [],
  sidecarHealth: null,
  bootstrapped: false,

  init: async () => {
    if (get().bootstrapped) return;
    applyThemeToDom(get().theme);
    const [systemInfo, engines, apiProviders, sidecarHealth] = await Promise.all([
      getSystemInfo(),
      listEngines(),
      listApiProviders(),
      checkSidecar().catch(() => null),
    ]);
    set({
      systemInfo,
      engines,
      apiProviders,
      sidecarHealth,
      bootstrapped: true,
    });
  },

  toggleTheme: () => {
    const next = get().theme === "light" ? "dark" : "light";
    applyThemeToDom(next);
    writeStorage("universe:theme", next);
    set({ theme: next });
  },

  setTheme: (theme) => {
    applyThemeToDom(theme);
    writeStorage("universe:theme", theme);
    set({ theme });
  },

  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  navigateHome: () => set({ activeView: "home", activeToolId: null }),

  navigateCategory: (category) =>
    set({ activeView: "category", activeCategoryId: category, activeToolId: null }),

  openTool: (toolId) => {
    const nextRecents = [toolId, ...get().recents.filter((id) => id !== toolId)].slice(0, 6);
    writeStorage("universe:recents", nextRecents);
    set({ activeView: "tool", activeToolId: toolId, recents: nextRecents });
  },

  navigateView: (view) => set({ activeView: view, activeToolId: null }),

  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),

  setBatchDrawerOpen: (open) => set({ batchDrawerOpen: open }),

  toggleFavorite: (toolId) => {
    const exists = get().favorites.includes(toolId);
    const next = exists
      ? get().favorites.filter((id) => id !== toolId)
      : [toolId, ...get().favorites];
    writeStorage("universe:favorites", next);
    set({ favorites: next });
  },

  setDetectedInput: (input) => set({ detectedInput: input }),

  upsertJob: (job) =>
    set((s) => {
      const idx = s.jobs.findIndex((j) => j.id === job.id);
      if (idx === -1) {
        return { jobs: [job, ...s.jobs] };
      }
      const next = [...s.jobs];
      next[idx] = job;
      return { jobs: next };
    }),

  submitJob: async (input) => {
    if (isTauriRuntime()) {
      const record = await submitBackendJob(input);
      if (record) {
        get().upsertJob(record);
        return record;
      }
    }

    // Deterministic local preview scheduler (used when running in browser preview mode)
    const id = `job-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const inputBytes = Number(input.params?.inputBytes ?? 14_680_064);
    const targetRatio = Number(input.params?.targetRatio ?? 0.26);
    const forceError = Boolean(input.params?.simulateError);

    const initial: JobRecord = {
      id,
      toolId: input.toolId,
      label: input.label,
      weight: input.weight ?? "light",
      status: "running",
      progress: 0.04,
      stage: "loading",
      metrics: {
        inputBytes,
        currentBytes: inputBytes,
        deltaPercent: 0,
      },
      batchId: input.batchId ?? null,
      pipelineId: input.pipelineId ?? null,
    };
    get().upsertJob(initial);

    const stages = ["loading", "aligning", "pressing", "sealing", "verifying"];
    let tick = 0;
    const totalTicks = 18;

    const timerId = window.setInterval(() => {
      const current = get().jobs.find((j) => j.id === id);
      if (!current || current.status === "cancelled") {
        window.clearInterval(timerId);
        previewTimers.delete(id);
        return;
      }

      tick += 1;
      if (forceError && tick === 6) {
        window.clearInterval(timerId);
        previewTimers.delete(id);
        get().upsertJob({
          ...current,
          status: "error",
          stage: "error",
          error: "Arquivo corrompido ou formato não suportado neste item.",
        });
        return;
      }

      const progress = Math.min(1, tick / totalTicks);
      const stage = stages[Math.min(stages.length - 1, Math.floor(progress * stages.length))];
      const currentBytes = Math.round(inputBytes * (1 - (1 - targetRatio) * progress));
      const deltaPercent = Number(((1 - currentBytes / inputBytes) * 100).toFixed(1));

      if (progress >= 1) {
        window.clearInterval(timerId);
        previewTimers.delete(id);
        get().upsertJob({
          ...current,
          status: "done",
          progress: 1,
          stage: "done",
          metrics: {
            inputBytes,
            currentBytes,
            outputBytes: currentBytes,
            deltaPercent,
          },
        });
      } else {
        get().upsertJob({
          ...current,
          status: "running",
          progress,
          stage,
          metrics: {
            inputBytes,
            currentBytes,
            deltaPercent,
          },
        });
      }
    }, 95);

    previewTimers.set(id, timerId);
    return initial;
  },

  submitBatch: async (inputs) => {
    const batchId = `batch-${Date.now()}`;
    if (get().activeView !== "batch") {
      set({ batchDrawerOpen: true });
    }
    for (const item of inputs) {
      await get().submitJob({ ...item, batchId });
    }
    return batchId;
  },

  cancelJob: async (jobId) => {
    if (isTauriRuntime()) {
      await cancelBackendJob(jobId);
    }
    const timer = previewTimers.get(jobId);
    if (timer !== undefined) {
      window.clearInterval(timer);
      previewTimers.delete(jobId);
    }
    const existing = get().jobs.find((j) => j.id === jobId);
    if (existing && (existing.status === "running" || existing.status === "queued")) {
      get().upsertJob({
        ...existing,
        status: "cancelled",
        stage: "cancelled",
      });
    }
  },

  retryFailedJobs: async () => {
    const failed = get().jobs.filter((j) => j.status === "error");
    for (const item of failed) {
      await get().submitJob({
        toolId: item.toolId,
        label: item.label,
        weight: item.weight,
        batchId: item.batchId,
        params: { inputBytes: item.metrics.inputBytes ?? 8_400_000 },
      });
    }
  },

  clearFinishedJobs: () =>
    set((s) => ({
      jobs: s.jobs.filter((j) => j.status === "queued" || j.status === "running"),
    })),

  savePipelineRecipe: (name, description, stepToolIds) => {
    const recipe: SavedPipeline = {
      id: `pipe-${Date.now()}`,
      name: name.trim() || "Receita Personalizada",
      description: description.trim() || "Cadeia personalizada de ferramentas.",
      stepToolIds,
    };
    const next = [recipe, ...get().savedPipelines];
    writeStorage("universe:pipelines", next);
    set({ savedPipelines: next });
  },

  deletePipelineRecipe: (id) => {
    const next = get().savedPipelines.filter((p) => p.id !== id || p.builtin);
    writeStorage("universe:pipelines", next);
    set({ savedPipelines: next });
  },

  refreshRuntime: async () => {
    const [engines, apiProviders, sidecarHealth] = await Promise.all([
      listEngines(),
      listApiProviders(),
      checkSidecar().catch(() => null),
    ]);
    set({ engines, apiProviders, sidecarHealth });
  },

  saveProviderKey: async (provider, key) => {
    const backend = await saveApiKey(provider, key);
    const apiProviders = await listApiProviders();
    set({ apiProviders });
    return backend;
  },

  deleteProviderKey: async (provider) => {
    await deleteApiKey(provider);
    const apiProviders = await listApiProviders();
    set({ apiProviders });
  },
}));
