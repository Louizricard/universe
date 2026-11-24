import { describe, expect, it } from "vitest";
import { TOOLS, TOOL_MAP } from "@/registry/tools";
import { CATEGORIES } from "@/registry/categories";
import {
  detectFromFiles,
  detectFromUrl,
  detectUrlPlatform,
  formatBytes,
  validatePipelineCompatibility,
} from "./detector";

describe("Universe 70-tool registry integrity", () => {
  it("contains exactly 70 unique numbered tools across 7 categories", () => {
    expect(TOOLS).toHaveLength(70);
    expect(CATEGORIES).toHaveLength(7);

    const ids = new Set(TOOLS.map((t) => t.id));
    expect(ids.size).toBe(70);

    const numbers = TOOLS.map((t) => t.number);
    expect(numbers).toEqual(Array.from({ length: 70 }, (_, i) => i + 1));

    for (const cat of CATEGORIES) {
      const count = TOOLS.filter((t) => t.category === cat.id).length;
      expect(count).toBe(10);
    }
  });
});

describe("Smart Dropzone detector", () => {
  it("detects media platforms from URLs", () => {
    expect(detectUrlPlatform("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("youtube");
    expect(detectUrlPlatform("https://youtube.com/shorts/abc123")).toBe("youtube-shorts");
    expect(detectUrlPlatform("https://www.instagram.com/reel/XYZ/")).toBe("instagram-reels");
    expect(detectUrlPlatform("https://www.tiktok.com/@user/video/123")).toBe("tiktok");
    expect(detectUrlPlatform("https://x.com/user/status/12345")).toBe("twitter");
    expect(detectUrlPlatform("https://www.reddit.com/r/rust/comments/abc/title/")).toBe("reddit");

    const yt = detectFromUrl("https://youtu.be/abc123");
    expect(yt?.suggestedTools[0]?.id).toBe("dl-youtube");
  });

  it("suggests PDF tools for .pdf files and prioritizes merge for multi-PDF", () => {
    const single = detectFromFiles([{ name: "contrato.pdf", size: 2_500_000 }]);
    expect(single.mimeTypes).toEqual(["application/pdf"]);
    expect(single.suggestedTools.some((t) => t.id === "pdf-compress")).toBe(true);

    const multi = detectFromFiles([
      { name: "parte1.pdf", size: 1_000_000 },
      { name: "parte2.pdf", size: 1_200_000 },
    ]);
    expect(multi.suggestedTools[0]?.id).toBe("pdf-merge");
  });

  it("validates compatible and incompatible pipelines statically", () => {
    const valid = validatePipelineCompatibility([
      TOOL_MAP["img-heic-to-jpg"],
      TOOL_MAP["extra-strip-exif"],
      TOOL_MAP["img-compress"],
      TOOL_MAP["util-zip-create"],
    ]);
    expect(valid.valid).toBe(true);
    expect(valid.couplerValid).toEqual([true, true, true]);

    const invalid = validatePipelineCompatibility([
      TOOL_MAP["pdf-compress"],
      TOOL_MAP["media-denoise-audio"],
    ]);
    expect(invalid.valid).toBe(false);
    expect(invalid.couplerValid).toEqual([false]);
    expect(invalid.errors).toHaveLength(1);
  });

  it("formats byte sizes cleanly", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(1024)).toBe("1.0 KB");
    expect(formatBytes(15 * 1024 * 1024)).toBe("15.0 MB");
  });
});
