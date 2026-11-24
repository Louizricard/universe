use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::path::{Path, PathBuf};
use std::process::Command;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EngineStatus {
    pub id: String,
    pub name: String,
    pub kind: String, // "binary" | "model" | "sidecar"
    pub description: String,
    pub installed: bool,
    pub path: Option<String>,
    pub version: Option<String>,
    pub estimated_size_mb: u32,
    pub sha256_expected: Option<String>,
    pub used_by: Vec<String>,
}

pub fn universe_data_dir() -> PathBuf {
    dirs::data_local_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("universe")
}

pub fn models_dir() -> PathBuf {
    universe_data_dir().join("models")
}

pub fn bin_dir() -> PathBuf {
    universe_data_dir().join("bin")
}

fn find_binary(name: &str) -> Option<PathBuf> {
    let local_candidate = bin_dir().join(name);
    if local_candidate.is_file() {
        return Some(local_candidate);
    }

    if let Ok(path_var) = std::env::var("PATH") {
        for dir in std::env::split_paths(&path_var) {
            let candidate = dir.join(name);
            if candidate.is_file() {
                return Some(candidate);
            }
            #[cfg(windows)]
            {
                let exe = dir.join(format!("{name}.exe"));
                if exe.is_file() {
                    return Some(exe);
                }
            }
        }
    }
    None
}

fn read_binary_version(path: &Path, args: &[&str]) -> Option<String> {
    let output = Command::new(path).args(args).output().ok()?;
    let stdout = String::from_utf8_lossy(&output.stdout);
    let stderr = String::from_utf8_lossy(&output.stderr);
    let text = if !stdout.trim().is_empty() {
        stdout
    } else {
        stderr
    };
    text.lines().next().map(|l| l.trim().to_string())
}

pub fn compute_sha256_bytes(data: &[u8]) -> String {
    let mut hasher = Sha256::new();
    hasher.update(data);
    hex::encode(hasher.finalize())
}

pub fn verify_file_sha256(path: &Path, expected_hex: &str) -> Result<bool, String> {
    let bytes = std::fs::read(path).map_err(|e| format!("Failed reading {}: {e}", path.display()))?;
    let actual = compute_sha256_bytes(&bytes);
    Ok(actual.eq_ignore_ascii_case(expected_hex.trim()))
}

pub fn inspect_engines() -> Vec<EngineStatus> {
    let binaries = vec![
        (
            "python3",
            "Python Sidecar Runtime",
            "sidecar",
            "Motor local para PDF, OCR, imagens e IA via NDJSON-RPC",
            &["--version"][..],
            45,
            vec!["PDF", "Imagens", "Documentos", "IA"],
        ),
        (
            "ffmpeg",
            "FFmpeg",
            "binary",
            "Transcodificação, compressão, corte e extração de vídeo e áudio",
            &["-version"][..],
            92,
            vec!["Vídeo & Áudio", "GIFs", "Downloads"],
        ),
        (
            "yt-dlp",
            "yt-dlp",
            "binary",
            "Motor local de captura para YouTube, Reels, TikTok, X, Reddit e Facebook",
            &["--version"][..],
            16,
            vec!["Downloads de Mídia"],
        ),
        (
            "gallery-dl",
            "gallery-dl",
            "binary",
            "Extrator local de fotos e galerias (Instagram, Pinterest)",
            &["--version"][..],
            14,
            vec!["Downloads de Mídia"],
        ),
        (
            "soffice",
            "LibreOffice Headless",
            "binary",
            "Conversão local fiel de Word, Excel e PowerPoint para PDF",
            &["--version"][..],
            320,
            vec!["Documentos"],
        ),
        (
            "tesseract",
            "Tesseract OCR",
            "binary",
            "Reconhecimento óptico de caracteres em PDFs escaneados e fotos",
            &["--version"][..],
            48,
            vec!["OCR PDF", "OCR Imagem"],
        ),
        (
            "gs",
            "Ghostscript",
            "binary",
            "Prensa de compressão estrutural para arquivos PDF",
            &["--version"][..],
            38,
            vec!["Comprimir PDF"],
        ),
    ];

    let mut statuses: Vec<EngineStatus> = binaries
        .into_iter()
        .map(|(id, name, kind, desc, v_args, size_mb, used_by)| {
            let found = find_binary(id);
            let version = found.as_deref().and_then(|p| read_binary_version(p, v_args));
            EngineStatus {
                id: id.to_string(),
                name: name.to_string(),
                kind: kind.to_string(),
                description: desc.to_string(),
                installed: found.is_some(),
                path: found.map(|p| p.display().to_string()),
                version,
                estimated_size_mb: size_mb,
                sha256_expected: None,
                used_by: used_by.into_iter().map(String::from).collect(),
            }
        })
        .collect();

    let model_dir = models_dir();
    let models = vec![
        (
            "rembg-u2net",
            "U2-Net / BiRefNet (ONNX)",
            "Remoção local de fundo de imagens com recorte de bordas finas",
            "u2net.onnx",
            176,
            vec!["Remover Fundo (#21)"],
        ),
        (
            "realesrgan-x4",
            "Real-ESRGAN x4plus (ONNX)",
            "Super-resolução local 2×/4× com preservação de texturas",
            "realesrgan-x4.onnx",
            67,
            vec!["Upscale IA (#29)"],
        ),
        (
            "lama-inpainting",
            "LaMa Inpainting (ONNX)",
            "Remoção de objetos e reconstrução contextual de fundo",
            "lama.onnx",
            198,
            vec!["Remover Objetos (#30)"],
        ),
        (
            "faster-whisper-small",
            "Faster-Whisper Small (CTranslate2)",
            "Transcrição local de áudio e geração de legendas SRT/VTT",
            "faster-whisper-small.bin",
            484,
            vec!["Transcrever Áudio (#50)", "Legendas (#67)"],
        ),
    ];

    for (id, name, desc, filename, size_mb, used_by) in models {
        let model_path = model_dir.join(filename);
        let installed = model_path.is_file();
        statuses.push(EngineStatus {
            id: id.to_string(),
            name: name.to_string(),
            kind: "model".to_string(),
            description: desc.to_string(),
            installed,
            path: if installed {
                Some(model_path.display().to_string())
            } else {
                None
            },
            version: None,
            estimated_size_mb: size_mb,
            sha256_expected: None,
            used_by: used_by.into_iter().map(String::from).collect(),
        });
    }

    statuses
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn sha256_verification_matches_expected_digest() {
        let tmp = std::env::temp_dir().join(format!("universe-sha-test-{}.bin", uuid::Uuid::new_v4()));
        std::fs::write(&tmp, b"universe-industrial-craft").unwrap();
        let expected = compute_sha256_bytes(b"universe-industrial-craft");
        assert!(verify_file_sha256(&tmp, &expected).unwrap());
        assert!(!verify_file_sha256(&tmp, "0000000000000000").unwrap());
        let _ = std::fs::remove_file(&tmp);
    }

    #[test]
    fn inspect_engines_returns_complete_catalog() {
        let engines = inspect_engines();
        assert!(engines.len() >= 11);
        assert!(engines.iter().any(|e| e.id == "python3"));
        assert!(engines.iter().any(|e| e.id == "rembg-u2net" && e.kind == "model"));
    }
}
