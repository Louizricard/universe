use crate::runtime::{inspect_engines, EngineStatus};
use crate::scheduler::{
    EventEmitter, JobRecord, JobScheduler, PipelineStepSpec, PipelineValidationResult,
    SubmitJobRequest,
};
use crate::secrets::{ApiProviderStatus, SecretsVault};
use crate::sidecar::{check_worker_health, WorkerHealth};
use serde::Serialize;
use std::sync::Arc;
use tauri::{AppHandle, Emitter, State};

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SystemInfo {
    pub app_name: String,
    pub version: String,
    pub os: String,
    pub arch: String,
}

pub struct AppState {
    pub scheduler: JobScheduler,
    pub vault: SecretsVault,
}

impl Default for AppState {
    fn default() -> Self {
        Self {
            scheduler: JobScheduler::default(),
            vault: SecretsVault::default(),
        }
    }
}

fn make_emitter(app: AppHandle) -> EventEmitter {
    Arc::new(move |record: JobRecord| {
        let _ = app.emit("universe://job-event", &record);
    })
}

#[tauri::command]
pub fn get_system_info() -> SystemInfo {
    SystemInfo {
        app_name: "Universe".to_string(),
        version: env!("CARGO_PKG_VERSION").to_string(),
        os: std::env::consts::OS.to_string(),
        arch: std::env::consts::ARCH.to_string(),
    }
}

#[tauri::command]
pub fn list_engines() -> Vec<EngineStatus> {
    inspect_engines()
}

#[tauri::command]
pub async fn check_sidecar() -> Result<WorkerHealth, String> {
    check_worker_health().await
}

#[tauri::command]
pub async fn submit_job(
    app: AppHandle,
    state: State<'_, AppState>,
    request: SubmitJobRequest,
) -> Result<JobRecord, String> {
    Ok(state
        .scheduler
        .submit_job(request, Some(make_emitter(app)))
        .await)
}

#[tauri::command]
pub async fn cancel_job(
    app: AppHandle,
    state: State<'_, AppState>,
    job_id: String,
) -> Result<bool, String> {
    Ok(state
        .scheduler
        .cancel_job(&job_id, Some(make_emitter(app)))
        .await)
}

#[tauri::command]
pub async fn list_jobs(state: State<'_, AppState>) -> Result<Vec<JobRecord>, String> {
    Ok(state.scheduler.list_jobs().await)
}

#[tauri::command]
pub fn validate_pipeline(steps: Vec<PipelineStepSpec>) -> PipelineValidationResult {
    JobScheduler::validate_pipeline(&steps)
}

#[tauri::command]
pub fn list_api_providers(state: State<'_, AppState>) -> Vec<ApiProviderStatus> {
    state.vault.list_providers()
}

#[tauri::command]
pub fn save_api_key(
    state: State<'_, AppState>,
    provider: String,
    api_key: String,
) -> Result<String, String> {
    state.vault.save_key(&provider, &api_key)
}

#[tauri::command]
pub fn delete_api_key(state: State<'_, AppState>, provider: String) -> Result<(), String> {
    state.vault.delete_key(&provider)
}
