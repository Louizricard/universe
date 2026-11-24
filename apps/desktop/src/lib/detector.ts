import { TOOLS } from "@/registry/tools";
import type { ToolSpec } from "@/registry/types";

export interface DetectedInput {
  kind: "files" | "url";
  label: string;
  mimeTypes: string[];
  platform?: string;
  fileNames: string[];
  totalBytes: number;
  url?: string;
  suggestedTools: ToolSpec[];
}

const EXT_TO_MIME: Record<string, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  doc: "application/msword",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  xls: "application/vnd.ms-excel",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ppt: "application/vnd.ms-powerpoint",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  heic: "image/heic",
  heif: "image/heif",
  svg: "image/svg+xml",
  gif: "image/gif",
  mp4: "video/mp4",
  mov: "video/quicktime",
  webm: "video/webm",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  txt: "text/plain",
  html: "text/html",
  htm: "text/html",
  json: "application/json",
  csv: "text/csv",
  zip: "application/zip",
  epub: "application/epub+zip",
  srt: "application/x-subrip",
  vtt: "text/vtt",
};

export function inferMimeFromFile(file: { name: string; type?: string }): string {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (ext && EXT_TO_MIME[ext]) {
    return EXT_TO_MIME[ext];
  }
  if (file.type && file.type.trim().length > 0) {
    return file.type;
  }
  return "application/octet-stream";
}

export function detectUrlPlatform(rawUrl: string): string | null {
  const trimmed = rawUrl.trim();
  let parsed: URL;
  try {
    parsed = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
  } catch {
    return null;
  }

  const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
  const path = parsed.pathname.toLowerCase();

  if (host === "youtu.be" || host.endsWith("youtube.com")) {
    if (path.startsWith("/shorts/")) return "youtube-shorts";
    return "youtube";
  }
  if (host.endsWith("instagram.com")) {
    if (path.includes("/reel/") || path.includes("/reels/")) return "instagram-reels";
    return "instagram-photo";
  }
  if (host.endsWith("tiktok.com")) return "tiktok";
  if (host.endsWith("pinterest.com") || host === "pin.it") return "pinterest";
  if (host === "x.com" || host.endsWith("twitter.com")) return "twitter";
  if (host.endsWith("facebook.com") || host === "fb.watch") return "facebook";
  if (host.endsWith("reddit.com") || host === "redd.it") return "reddit";
  if (host.includes(".")) return "generic";
  return null;
}

export function detectFromUrl(rawUrl: string): DetectedInput | null {
  const platform = detectUrlPlatform(rawUrl);
  if (!platform) return null;

  const platformMatches = TOOLS.filter((t) => t.urlPlatforms?.includes(platform));
  const genericMatches = TOOLS.filter(
    (t) =>
      !platformMatches.some((m) => m.id === t.id) &&
      (t.id === "util-shorten-url" || t.id === "util-qr-generate" || t.id === "doc-html-to-pdf")
  );

  return {
    kind: "url",
    label: `Link detectado (${platform})`,
    mimeTypes: ["text/uri-list"],
    platform,
    fileNames: [],
    totalBytes: 0,
    url: rawUrl.trim(),
    suggestedTools: [...platformMatches, ...genericMatches].slice(0, 8),
  };
}

export function detectFromFiles(
  files: Array<{ name: string; type?: string; size: number }>
): DetectedInput {
  const mimes = Array.from(new Set(files.map(inferMimeFromFile)));
  const totalBytes = files.reduce((acc, f) => acc + f.size, 0);

  const scored = TOOLS.map((tool) => {
    let score = 0;
    for (const mime of mimes) {
      if (tool.inputMimes.includes(mime)) {
        score += 10;
      } else if (tool.inputMimes.includes("*/*")) {
        score += 2;
      }
    }
    if (files.length > 1 && tool.supportsBatch) score += 2;
    if (files.length > 1 && tool.id === "pdf-merge" && mimes.every((m) => m === "application/pdf")) {
      score += 5;
    }
    if (tool.phase === 1 && score > 0) score += 1;
    return { tool, score };
  })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.tool.number - b.tool.number)
    .map((entry) => entry.tool);

  return {
    kind: "files",
    label:
      files.length === 1
        ? `${files[0].name}`
        : `${files.length} arquivos detectados`,
    mimeTypes: mimes,
    fileNames: files.map((f) => f.name),
    totalBytes,
    suggestedTools: scored.slice(0, 10),
  };
}

export function validatePipelineCompatibility(steps: ToolSpec[]): {
  valid: boolean;
  couplerValid: boolean[];
  errors: string[];
} {
  if (steps.length === 0) {
    return {
      valid: false,
      couplerValid: [],
      errors: ["Adicione pelo menos uma ferramenta à cadeia."],
    };
  }
  const couplerValid: boolean[] = [];
  const errors: string[] = [];

  for (let i = 0; i < steps.length - 1; i++) {
    const curr = steps[i];
    const next = steps[i + 1];
    const ok = curr.outputMimes.some((outM) =>
      next.inputMimes.some((inM) => outM === "*/*" || inM === "*/*" || outM === inM)
    );
    couplerValid.push(ok);
    if (!ok) {
      errors.push(
        `Etapa ${i + 1} (${curr.name}) gera ${curr.outputMimes.join(", ")} — incompatível com Etapa ${i + 2} (${next.name}).`
      );
    }
  }

  return { valid: errors.length === 0, couplerValid, errors };
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const exp = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const val = bytes / 1024 ** exp;
  return `${val >= 100 || exp === 0 ? val.toFixed(0) : val.toFixed(1)} ${units[exp]}`;
}
