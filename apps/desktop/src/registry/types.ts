export type CategoryId =
  | "docs"
  | "pdf"
  | "images"
  | "downloads"
  | "media"
  | "utilities"
  | "extras";

export type MachineArchetype =
  | "press"
  | "guillotine"
  | "scanner"
  | "vault"
  | "reel"
  | "matrix"
  | "cutout";

export type ToolInputKind = "file" | "files" | "url" | "text" | "none";

export type ApiProviderId = "openai" | "replicate" | "removebg" | "elevenlabs";

export interface CategoryMeta {
  id: CategoryId;
  number: number;
  name: string;
  shortName: string;
  description: string;
  cssVar: string;
}

export interface ToolSpec {
  number: number;
  id: string;
  name: string;
  shortDescription: string;
  category: CategoryId;
  phase: 1 | 2 | 3;
  machineArchetype: MachineArchetype;
  machineName: string;
  machineVerb: string;
  localEngine: string;
  optionalApiProvider?: ApiProviderId;
  weight: "light" | "heavy";
  supportsBatch: boolean;
  supportsPipeline: boolean;
  inputKind: ToolInputKind;
  inputMimes: string[];
  outputMimes: string[];
  urlPlatforms?: string[];
  keywords: string[];
  copyrightNotice?: boolean;
}

export type MachinePhase =
  | "idle"
  | "hover"
  | "armed"
  | "running"
  | "success"
  | "error"
  | "cancelled";

export interface MachineTelemetry {
  inputBytes?: number;
  currentBytes?: number;
  outputBytes?: number;
  deltaPercent?: number;
  step?: number;
  totalSteps?: number;
  detail?: string;
}
