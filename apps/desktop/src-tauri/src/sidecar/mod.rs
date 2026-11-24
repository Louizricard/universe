use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::path::{Path, PathBuf};
use std::process::Stdio;
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};
use tokio::process::Command;
use tokio::sync::oneshot;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkerProgressEvent {
    pub job_id: String,
    pub progress: f64,
    pub stage: String,
    pub metrics: Value,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkerHealth {
    pub status: String,
    pub version: String,
    pub python: String,
    pub tools: Vec<String>,
    pub binaries: Value,
}

pub fn resolve_worker_dir() -> PathBuf {
    if let Ok(explicit) = std::env::var("UNIVERSE_WORKER_DIR") {
        let p = PathBuf::from(explicit);
        if p.is_dir() {
            return p;
        }
    }
    let manifest_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    let monorepo_candidate = manifest_dir.join("../../../workers/python");
    if monorepo_candidate.is_dir() {
        return monorepo_candidate;
    }
    PathBuf::from("workers/python")
}

fn resolve_python_bin(worker_dir: &Path) -> PathBuf {
    let venv_unix = worker_dir.join(".venv/bin/python");
    if venv_unix.is_file() {
        return venv_unix;
    }
    let venv_win = worker_dir.join(".venv/Scripts/python.exe");
    if venv_win.is_file() {
        return venv_win;
    }
    PathBuf::from("python3")
}

pub async fn check_worker_health() -> Result<WorkerHealth, String> {
    let worker_dir = resolve_worker_dir();
    let python = resolve_python_bin(&worker_dir);

    let mut child = Command::new(&python)
        .args(["-m", "universe_worker"])
        .current_dir(&worker_dir)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Falha ao iniciar Python worker ({}): {e}", python.display()))?;

    let mut stdin = child.stdin.take().ok_or("stdin indisponível")?;
    let stdout = child.stdout.take().ok_or("stdout indisponível")?;
    let mut reader = BufReader::new(stdout).lines();

    let req = format!("{}\n{}\n", json!({"id": 1, "method": "health"}), json!({"id": 2, "method": "shutdown"}));
    stdin
        .write_all(req.as_bytes())
        .await
        .map_err(|e| format!("Falha ao escrever no worker: {e}"))?;
    stdin.flush().await.map_err(|e| format!("Falha ao dar flush: {e}"))?;

    let first_line = reader
        .next_line()
        .await
        .map_err(|e| format!("Falha ao ler resposta do worker: {e}"))?
        .ok_or("Worker encerrou sem responder")?;

    let _ = child.wait().await;

    let parsed: Value = serde_json::from_str(&first_line)
        .map_err(|e| format!("JSON inválido do worker: {e}"))?;
    let result = parsed
        .get("result")
        .cloned()
        .ok_or_else(|| format!("Worker retornou erro: {parsed}"))?;

    serde_json::from_value(result).map_err(|e| format!("Formato inesperado de health: {e}"))
}

pub async fn run_worker_tool<F>(
    job_id: &str,
    tool_id: &str,
    params: Value,
    mut cancel_rx: oneshot::Receiver<()>,
    mut on_progress: F,
) -> Result<Value, String>
where
    F: FnMut(WorkerProgressEvent) + Send,
{
    let worker_dir = resolve_worker_dir();
    let python = resolve_python_bin(&worker_dir);

    let mut child = Command::new(&python)
        .args(["-m", "universe_worker"])
        .current_dir(&worker_dir)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .kill_on_drop(true)
        .spawn()
        .map_err(|e| format!("Falha ao iniciar Python worker: {e}"))?;

    let mut stdin = child.stdin.take().ok_or("stdin indisponível")?;
    let stdout = child.stdout.take().ok_or("stdout indisponível")?;
    let mut lines = BufReader::new(stdout).lines();

    let run_req = json!({
        "id": job_id,
        "method": "run_tool",
        "params": {
            "jobId": job_id,
            "toolId": tool_id,
            "params": params
        }
    });
    stdin
        .write_all(format!("{run_req}\n").as_bytes())
        .await
        .map_err(|e| format!("Falha ao enviar job ao worker: {e}"))?;
    stdin.flush().await.map_err(|e| format!("Flush falhou: {e}"))?;

    let mut cancelled = false;
    let outcome = loop {
        tokio::select! {
            _ = &mut cancel_rx, if !cancelled => {
                cancelled = true;
                let cancel_req = json!({
                    "id": format!("cancel-{job_id}"),
                    "method": "cancel",
                    "params": { "jobId": job_id }
                });
                let _ = stdin.write_all(format!("{cancel_req}\n").as_bytes()).await;
                let _ = stdin.flush().await;
            }
            next = lines.next_line() => {
                match next {
                    Ok(Some(line)) => {
                        let msg: Value = match serde_json::from_str(&line) {
                            Ok(v) => v,
                            Err(_) => continue,
                        };
                        if msg.get("method").and_then(|v| v.as_str()) == Some("job.progress") {
                            if let Some(p) = msg.get("params") {
                                if let Ok(ev) = serde_json::from_value::<WorkerProgressEvent>(p.clone()) {
                                    on_progress(ev);
                                }
                            }
                            continue;
                        }
                        if msg.get("id").and_then(|v| v.as_str()) == Some(job_id) {
                            if let Some(res) = msg.get("result") {
                                break Ok(res.clone());
                            }
                            if let Some(err) = msg.get("error") {
                                let is_cancel = err.pointer("/data/cancelled").and_then(|v| v.as_bool()).unwrap_or(false);
                                let err_msg = err.get("message").and_then(|v| v.as_str()).unwrap_or("Erro no worker");
                                if is_cancel {
                                    break Err("CANCELLED".to_string());
                                }
                                break Err(err_msg.to_string());
                            }
                        }
                    }
                    Ok(None) => break Err("Python worker encerrou inesperadamente".to_string()),
                    Err(e) => break Err(format!("Erro ao ler stdout do worker: {e}")),
                }
            }
        }
    };

    let _ = stdin
        .write_all(format!("{}\n", json!({"id": "bye", "method": "shutdown"})).as_bytes())
        .await;
    let _ = stdin.flush().await;
    let _ = child.wait().await;

    outcome
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn rust_sidecar_health_and_diagnostic_roundtrip() {
        let health = check_worker_health().await.expect("worker health should succeed");
        assert_eq!(health.status, "ok");
        assert!(health.tools.contains(&"system.diagnostic_cycle".to_string()));

        let (_tx, rx) = oneshot::channel();
        let mut updates = Vec::new();
        let res = run_worker_tool(
            "rust-test-1",
            "system.diagnostic_cycle",
            json!({ "steps": 3, "stepDelayMs": 5, "inputBytes": 200000 }),
            rx,
            |ev| updates.push(ev),
        )
        .await
        .expect("diagnostic tool should succeed");

        assert_eq!(updates.len(), 3);
        assert_eq!(updates.last().unwrap().progress, 1.0);
        assert!(res.pointer("/metrics/outputBytes").and_then(|v| v.as_u64()).unwrap() < 200000);
    }

    #[tokio::test]
    async fn rust_sidecar_cancels_running_job() {
        let (tx, rx) = oneshot::channel();
        let mut tx_opt = Some(tx);
        let result = run_worker_tool(
            "rust-cancel-1",
            "system.diagnostic_cycle",
            json!({ "steps": 15, "stepDelayMs": 50 }),
            rx,
            |_ev| {
                if let Some(sender) = tx_opt.take() {
                    let _ = sender.send(());
                }
            },
        )
        .await;

        assert_eq!(result.unwrap_err(), "CANCELLED");
    }
}
