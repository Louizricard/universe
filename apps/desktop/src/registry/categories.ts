import type { CategoryId, CategoryMeta } from "./types";

export const CATEGORIES: CategoryMeta[] = [
  {
    id: "docs",
    number: 1,
    name: "Conversão de Documentos",
    shortName: "Documentos",
    description: "Word, Excel, PowerPoint, HTML, TXT e imagens para/de PDF",
    cssVar: "var(--cat-docs)",
  },
  {
    id: "pdf",
    number: 2,
    name: "Ferramentas para PDF",
    shortName: "PDF",
    description: "Juntar, dividir, prensar, reorganizar, assinar, proteger e OCR",
    cssVar: "var(--cat-pdf)",
  },
  {
    id: "images",
    number: 3,
    name: "Edição e Otimização de Imagens",
    shortName: "Imagens",
    description: "Recorte de fundo IA, compressão, formatos, upscale e remoção de objetos",
    cssVar: "var(--cat-images)",
  },
  {
    id: "downloads",
    number: 4,
    name: "Download de Vídeos e Mídias",
    shortName: "Downloads",
    description: "YouTube, Shorts, Reels, TikTok, Pinterest, X, Facebook e Reddit",
    cssVar: "var(--cat-downloads)",
  },
  {
    id: "media",
    number: 5,
    name: "Vídeo e Áudio",
    shortName: "Vídeo & Áudio",
    description: "Conversão, compressão, corte, junção, remoção de ruído e transcrição",
    cssVar: "var(--cat-media)",
  },
  {
    id: "utilities",
    number: 6,
    name: "Utilitários Digitais",
    shortName: "Utilitários",
    description: "QR Code, links, senhas, contador, diff, JSON/CSV e compactação",
    cssVar: "var(--cat-utilities)",
  },
  {
    id: "extras",
    number: 7,
    name: "Outras Ferramentas Úteis",
    shortName: "Extras",
    description: "GIFs, EXIF, OCR, marca-d'água, corte de silêncio, legendas, EPUB e Excel",
    cssVar: "var(--cat-extras)",
  },
];

export const CATEGORY_MAP: Record<CategoryId, CategoryMeta> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c])
) as Record<CategoryId, CategoryMeta>;
