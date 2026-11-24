pub mod commands;
pub mod runtime;
pub mod scheduler;
pub mod secrets;
pub mod sidecar;

use commands::AppState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(AppState::default())
        .invoke_handler(tauri::generate_handler![
            commands::get_system_info,
            commands::list_engines,
            commands::check_sidecar,
            commands::submit_job,
            commands::cancel_job,
            commands::list_jobs,
            commands::validate_pipeline,
            commands::list_api_providers,
            commands::save_api_key,
            commands::delete_api_key,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Universe desktop application");
}
