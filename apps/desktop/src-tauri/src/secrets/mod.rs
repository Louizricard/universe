use keyring::Entry;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Mutex;

const SERVICE_NAME: &str = "dev.louizricard.universe";

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ApiProviderStatus {
    pub id: String,
    pub name: String,
    pub capabilities: Vec<String>,
    pub configured: bool,
    pub storage_backend: String, // "os-keyring" | "session-memory"
}

/// Manages optional external AI API keys using the OS Keyring (Secret Service / Credential Manager / Keychain),
/// with an automatic in-memory fallback when running in headless CI environments without a D-Bus keyring daemon.
pub struct SecretsVault {
    session_fallback: Mutex<HashMap<String, String>>,
}

impl Default for SecretsVault {
    fn default() -> Self {
        Self {
            session_fallback: Mutex::new(HashMap::new()),
        }
    }
}

impl SecretsVault {
    pub fn providers() -> Vec<(&'static str, &'static str, Vec<&'static str>)> {
        vec![
            (
                "openai",
                "OpenAI (Whisper / Vision)",
                vec!["Transcrever Áudio (#50)", "Legendas Automáticas (#67)", "OCR Avançado"],
            ),
            (
                "replicate",
                "Replicate (Real-ESRGAN / LaMa)",
                vec!["Upscale IA (#29)", "Remover Objetos (#30)"],
            ),
            (
                "removebg",
                "Remove.bg",
                vec!["Remover Fundo (#21)"],
            ),
            (
                "elevenlabs",
                "ElevenLabs (Audio Isolation)",
                vec!["Remover Ruído de Áudio (#49)"],
            ),
        ]
    }

    pub fn save_key(&self, provider: &str, api_key: &str) -> Result<String, String> {
        let trimmed = api_key.trim();
        if trimmed.is_empty() {
            return Err("A chave de API não pode estar vazia.".to_string());
        }

        if let Ok(entry) = Entry::new(SERVICE_NAME, provider) {
            if entry.set_password(trimmed).is_ok() {
                return Ok("os-keyring".to_string());
            }
        }

        let mut map = self
            .session_fallback
            .lock()
            .map_err(|_| "Falha ao acessar cofre em memória".to_string())?;
        map.insert(provider.to_string(), trimmed.to_string());
        Ok("session-memory".to_string())
    }

    pub fn delete_key(&self, provider: &str) -> Result<(), String> {
        if let Ok(entry) = Entry::new(SERVICE_NAME, provider) {
            let _ = entry.delete_credential();
        }
        if let Ok(mut map) = self.session_fallback.lock() {
            map.remove(provider);
        }
        Ok(())
    }

    pub fn has_key(&self, provider: &str) -> (bool, &'static str) {
        if let Ok(entry) = Entry::new(SERVICE_NAME, provider) {
            if entry.get_password().is_ok() {
                return (true, "os-keyring");
            }
        }
        if let Ok(map) = self.session_fallback.lock() {
            if map.contains_key(provider) {
                return (true, "session-memory");
            }
        }
        (false, "os-keyring")
    }

    pub fn list_providers(&self) -> Vec<ApiProviderStatus> {
        Self::providers()
            .into_iter()
            .map(|(id, name, caps)| {
                let (configured, backend) = self.has_key(id);
                ApiProviderStatus {
                    id: id.to_string(),
                    name: name.to_string(),
                    capabilities: caps.into_iter().map(String::from).collect(),
                    configured,
                    storage_backend: backend.to_string(),
                }
            })
            .collect()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn vault_rejects_empty_keys_and_tracks_configured_state() {
        let vault = SecretsVault::default();
        assert!(vault.save_key("openai", "   ").is_err());

        let backend = vault.save_key("universe-test-provider", "sk-test-12345").unwrap();
        assert!(backend == "os-keyring" || backend == "session-memory");
        assert!(vault.has_key("universe-test-provider").0);

        vault.delete_key("universe-test-provider").unwrap();
        assert!(!vault.has_key("universe-test-provider").0);
    }
}
