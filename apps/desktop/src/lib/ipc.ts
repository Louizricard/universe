import type { MachineTelemetry } from "@/registry/types";

export interface SystemInfo {
  appName: string;
  version: string;
  os: string;
  arch: string;
}

export interface EngineStatus {
  id: string;
  name: string;
  kind: "binary" | "model" | "sidecar";
  description: string;
  installed: boolean;
  path: string | null;
  version: string | null;
  estimatedSizeMb: number;
  sha256Expected: string | null;
  usedBy: string[];
}

export interface ApiProviderStatus {
  id: string;
  name: string;
  capabilities: string[];
  configured: boolean;
  storageBackend: "os-keyring" | "session-memory" | "preview-memory";
}

export interface WorkerHealth {
  status: string;
  version: string;
  python: string;
  tools: string[];
  binaries: Record<string, { installed: boolean; path: string | null }>;
}

export type JobStatus = "queued" | "running" | "done" | "error" | "cancelled";

export interface JobRecord {
  id: string;
  toolId: string;
  label: string;
  weight: "light" | "heavy";
  status: JobStatus;
  progress: number;
  stage: string;
  metrics: MachineTelemetry;
  result?: unknown;
  error?: string | null;
  batchId?: string | null;
  pipelineId?: string | null;
}

export interface SubmitJobInput {
  toolId: string;
  label: string;
  weight?: "light" | "heavy";
  params?: Record<string, unknown>;
  batchId?: string | null;
  pipelineId?: string | null;
}

export function isTauriRuntime(): boolean {
  return (
    typeof window !== "undefined" &&
    ("__TAURI_INTERNALS__" in window || "__TAURI__" in window)
  );
}

const PREVIEW_ENGINES: EngineStatus[] = [
  {
    id: "python3",
    name: "Python Sidecar Runtime",
    kind: "sidecar",
    description: "Motor local para PDF, OCR, imagens e IA via NDJSON-RPC",
    installed: true,
    path: "/usr/bin/python3",
    version: "Python 3.12 (preview)",
    estimatedSizeMb: 45,
    sha256Expected: null,
    usedBy: ["PDF", "Imagens", "Documentos", "IA"],
  },
  {
    id: "ffmpeg",
    name: "FFmpeg",
    kind: "binary",
    description: "Transcodificação, compressão, corte e extração de vídeo e áudio",
    installed: false,
    path: null,
    version: null,
    estimatedSizeMb: 92,
    sha256Expected: null,
    usedBy: ["Vídeo & Áudio", "GIFs", "Downloads"],
  },
  {
    id: "yt-dlp",
    name: "yt-dlp",
    kind: "binary",
    description: "Motor local de captura para YouTube, Reels, TikTok, X, Reddit e Facebook",
    installed: false,
    path: null,
    version: null,
    estimatedSizeMb: 16,
    sha256Expected: null,
    usedBy: ["Downloads de Mídia"],
  },
  {
    id: "soffice",
    name: "LibreOffice Headless",
    kind: "binary",
    description: "Conversão local fiel de Word, Excel e PowerPoint para PDF",
    installed: false,
    path: null,
    version: null,
    estimatedSizeMb: 320,
    sha256Expected: null,
    usedBy: ["Documentos"],
  },
  {
    id: "tesseract",
    name: "Tesseract OCR",
    kind: "binary",
    description: "Reconhecimento óptico de caracteres em PDFs escaneados e fotos",
    installed: false,
    path: null,
    version: null,
    estimatedSizeMb: 48,
    sha256Expected: null,
    usedBy: ["OCR PDF", "OCR Imagem"],
  },
  {
    id: "gs",
    name: "Ghostscript",
    kind: "binary",
    description: "Prensa de compressão estrutural para arquivos PDF",
    installed: false,
    path: null,
    version: null,
    estimatedSizeMb: 38,
    sha256Expected: null,
    usedBy: ["Comprimir PDF"],
  },
  {
    id: "rembg-u2net",
    name: "U2-Net / BiRefNet (ONNX)",
    kind: "model",
    description: "Remoção local de fundo de imagens com recorte de bordas finas",
    installed: false,
    path: null,
    version: null,
    estimatedSizeMb: 176,
    sha256Expected: null,
    usedBy: ["Remover Fundo (#21)"],
  },
  {
    id: "realesrgan-x4",
    name: "Real-ESRGAN x4plus (ONNX)",
    kind: "model",
    description: "Super-resolução local 2×/4× com preservação de texturas",
    installed: false,
    path: null,
    version: null,
    estimatedSizeMb: 67,
    sha256Expected: null,
    usedBy: ["Upscale IA (#29)"],
  },
  {
    id: "lama-inpainting",
    name: "LaMa Inpainting (ONNX)",
    kind: "model",
    description: "Remoção de objetos e reconstrução contextual de fundo",
    installed: false,
    path: null,
    version: null,
    estimatedSizeMb: 198,
    sha256Expected: null,
    usedBy: ["Remover Objetos (#30)"],
  },
  {
    id: "faster-whisper-small",
    name: "Faster-Whisper Small (CTranslate2)",
    kind: "model",
    description: "Transcrição local de áudio e geração de legendas SRT/VTT",
    installed: false,
    path: null,
    version: null,
    estimatedSizeMb: 484,
    sha256Expected: null,
    usedBy: ["Transcrever Áudio (#50)", "Legendas (#67)"],
  },
];

const previewKeys = new Map<string, string>();

const PREVIEW_PROVIDERS: Omit<ApiProviderStatus, "configured" | "storageBackend">[] = [
  {
    id: "openai",
    name: "OpenAI (Whisper / Vision)",
    capabilities: ["Transcrever Áudio (#50)", "Legendas Automáticas (#67)", "OCR Avançado"],
  },
  {
    id: "replicate",
    name: "Replicate (Real-ESRGAN / LaMa)",
    capabilities: ["Upscale IA (#29)", "Remover Objetos (#30)"],
  },
  {
    id: "removebg",
    name: "Remove.bg",
    capabilities: ["Remover Fundo (#21)"],
  },
  {
    id: "elevenlabs",
    name: "ElevenLabs (Audio Isolation)",
    capabilities: ["Remover Ruído de Áudio (#49)"],
  },
];

async function invokeTauri<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  const { invoke } = await import("@tauri-apps/api/core");
  return invoke<T>(cmd, args);
}

export async function getSystemInfo(): Promise<SystemInfo> {
  if (isTauriRuntime()) {
    return invokeTauri<SystemInfo>("get_system_info");
  }
  return {
    appName: "Universe",
    version: "0.1.0",
    os: "web-preview",
    arch: "browser",
  };
}

export async function listEngines(): Promise<EngineStatus[]> {
  if (isTauriRuntime()) {
    return invokeTauri<EngineStatus[]>("list_engines");
  }
  return PREVIEW_ENGINES;
}

export async function checkSidecar(): Promise<WorkerHealth | null> {
  if (isTauriRuntime()) {
    return invokeTauri<WorkerHealth>("check_sidecar");
  }
  return {
    status: "preview",
    version: "0.1.0",
    python: "browser-sandbox",
    tools: ["system.diagnostic_cycle"],
    binaries: {},
  };
}

export async function listApiProviders(): Promise<ApiProviderStatus[]> {
  if (isTauriRuntime()) {
    return invokeTauri<ApiProviderStatus[]>("list_api_providers");
  }
  return PREVIEW_PROVIDERS.map((p) => ({
    ...p,
    configured: previewKeys.has(p.id),
    storageBackend: "preview-memory",
  }));
}

export async function saveApiKey(provider: string, apiKey: string): Promise<string> {
  if (!apiKey.trim()) {
    throw new Error("A chave de API não pode estar vazia.");
  }
  if (isTauriRuntime()) {
    return invokeTauri<string>("save_api_key", { provider, apiKey });
  }
  previewKeys.set(provider, apiKey.trim());
  return "preview-memory";
}

export async function deleteApiKey(provider: string): Promise<void> {
  if (isTauriRuntime()) {
    await invokeTauri<void>("delete_api_key", { provider });
    return;
  }
  previewKeys.delete(provider);
}

export async function submitBackendJob(request: SubmitJobInput): Promise<JobRecord | null> {
  if (!isTauriRuntime()) {
    return null;
  }
  return invokeTauri<JobRecord>("submit_job", { request });
}

export async function cancelBackendJob(jobId: string): Promise<boolean> {
  if (!isTauriRuntime()) {
    return false;
  }
  return invokeTauri<boolean>("cancel_job", { jobId });
}

export async function subscribeJobEvents(
  handler: (record: JobRecord) => void
): Promise<() => void> {
  if (!isTauriRuntime()) {
    return () => {};
  }
  const { listen } = await import("@tauri-apps/api/event");
  const unlisten = await listen<JobRecord>("universe://job-event", (event) => {
    handler(event.payload);
  });
  return unlisten;
}
