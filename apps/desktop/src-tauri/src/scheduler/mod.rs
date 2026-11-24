use crate::sidecar::{run_worker_tool, WorkerProgressEvent};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::{oneshot, Mutex, Semaphore};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum JobStatus {
    Queued,
    Running,
    Done,
    Error,
    Cancelled,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum JobWeight {
    Light,
    Heavy,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct JobRecord {
    pub id: String,
    pub tool_id: String,
    pub label: String,
    pub weight: JobWeight,
    pub status: JobStatus,
    pub progress: f64,
    pub stage: String,
    pub metrics: Value,
    pub result: Option<Value>,
    pub error: Option<String>,
    pub batch_id: Option<String>,
    pub pipeline_id: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SubmitJobRequest {
    pub tool_id: String,
    pub label: String,
    pub weight: Option<JobWeight>,
    pub params: Option<Value>,
    pub batch_id: Option<String>,
    pub pipeline_id: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PipelineStepSpec {
    pub tool_id: String,
    pub label: String,
    pub input_mimes: Vec<String>,
    pub output_mimes: Vec<String>,
    pub params: Option<Value>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PipelineValidationResult {
    pub valid: bool,
    pub errors: Vec<String>,
}

pub type EventEmitter = Arc<dyn Fn(JobRecord) + Send + Sync>;

pub struct JobScheduler {
    jobs: Arc<Mutex<HashMap<String, JobRecord>>>,
    order: Arc<Mutex<Vec<String>>>,
    cancellers: Arc<Mutex<HashMap<String, oneshot::Sender<()>>>>,
    light_semaphore: Arc<Semaphore>,
    heavy_semaphore: Arc<Semaphore>,
}

impl Default for JobScheduler {
    fn default() -> Self {
        Self::new(4, 1)
    }
}

impl JobScheduler {
    pub fn new(max_light_concurrent: usize, max_heavy_concurrent: usize) -> Self {
        Self {
            jobs: Arc::new(Mutex::new(HashMap::new())),
            order: Arc::new(Mutex::new(Vec::new())),
            cancellers: Arc::new(Mutex::new(HashMap::new())),
            light_semaphore: Arc::new(Semaphore::new(max_light_concurrent.max(1))),
            heavy_semaphore: Arc::new(Semaphore::new(max_heavy_concurrent.max(1))),
        }
    }

    pub fn validate_pipeline(steps: &[PipelineStepSpec]) -> PipelineValidationResult {
        if steps.is_empty() {
            return PipelineValidationResult {
                valid: false,
                errors: vec!["Pipeline precisa ter pelo menos 1 etapa.".to_string()],
            };
        }
        let mut errors = Vec::new();
        for idx in 0..steps.len().saturating_sub(1) {
            let current = &steps[idx];
            let next = &steps[idx + 1];
            let compatible = current.output_mimes.iter().any(|out_m| {
                next.input_mimes
                    .iter()
                    .any(|in_m| out_m == "*/*" || in_m == "*/*" || out_m == in_m)
            });
            if !compatible {
                errors.push(format!(
                    "Incompatibilidade entre etapa {} ({}) e etapa {} ({}): saídas {:?} não casam com entradas {:?}",
                    idx + 1,
                    current.label,
                    idx + 2,
                    next.label,
                    current.output_mimes,
                    next.input_mimes
                ));
            }
        }
        PipelineValidationResult {
            valid: errors.is_empty(),
            errors,
        }
    }

    pub async fn list_jobs(&self) -> Vec<JobRecord> {
        let order = self.order.lock().await;
        let jobs = self.jobs.lock().await;
        order
            .iter()
            .rev()
            .filter_map(|id| jobs.get(id).cloned())
            .collect()
    }

    pub async fn get_job(&self, job_id: &str) -> Option<JobRecord> {
        self.jobs.lock().await.get(job_id).cloned()
    }

    pub async fn cancel_job(&self, job_id: &str, emit: Option<EventEmitter>) -> bool {
        let sender = self.cancellers.lock().await.remove(job_id);
        let signalled = if let Some(tx) = sender {
            tx.send(()).is_ok()
        } else {
            false
        };

        let mut jobs = self.jobs.lock().await;
        if let Some(rec) = jobs.get_mut(job_id) {
            if matches!(rec.status, JobStatus::Queued | JobStatus::Running) {
                rec.status = JobStatus::Cancelled;
                rec.stage = "cancelled".to_string();
                let snapshot = rec.clone();
                drop(jobs);
                if let Some(cb) = emit {
                    cb(snapshot);
                }
                return true;
            }
        }
        signalled
    }

    pub async fn submit_job(
        &self,
        req: SubmitJobRequest,
        emit: Option<EventEmitter>,
    ) -> JobRecord {
        let id = Uuid::new_v4().to_string();
        let weight = req.weight.unwrap_or(JobWeight::Light);
        let record = JobRecord {
            id: id.clone(),
            tool_id: req.tool_id.clone(),
            label: req.label.clone(),
            weight: weight.clone(),
            status: JobStatus::Queued,
            progress: 0.0,
            stage: "queued".to_string(),
            metrics: json!({}),
            result: None,
            error: None,
            batch_id: req.batch_id,
            pipeline_id: req.pipeline_id,
        };

        let (cancel_tx, cancel_rx) = oneshot::channel::<()>();
        {
            self.jobs.lock().await.insert(id.clone(), record.clone());
            self.order.lock().await.push(id.clone());
            self.cancellers.lock().await.insert(id.clone(), cancel_tx);
        }
        if let Some(cb) = &emit {
            cb(record.clone());
        }

        let jobs = Arc::clone(&self.jobs);
        let cancellers = Arc::clone(&self.cancellers);
        let sem = match weight {
            JobWeight::Light => Arc::clone(&self.light_semaphore),
            JobWeight::Heavy => Arc::clone(&self.heavy_semaphore),
        };
        let params = req.params.unwrap_or_else(|| json!({}));
        let worker_tool = if req.tool_id.starts_with("system.") {
            req.tool_id.clone()
        } else {
            "system.diagnostic_cycle".to_string()
        };

        let job_id_clone = id.clone();
        tokio::spawn(async move {
            let _permit = match sem.acquire_owned().await {
                Ok(p) => p,
                Err(_) => return,
            };

            // Check if cancelled while waiting in queue
            {
                let mut map = jobs.lock().await;
                if let Some(rec) = map.get_mut(&job_id_clone) {
                    if rec.status == JobStatus::Cancelled {
                        return;
                    }
                    rec.status = JobStatus::Running;
                    rec.stage = "running".to_string();
                    if let Some(cb) = &emit {
                        cb(rec.clone());
                    }
                }
            }

            let jobs_progress = Arc::clone(&jobs);
            let emit_progress = emit.clone();
            let job_id_for_cb = job_id_clone.clone();

            let outcome = run_worker_tool(
                &job_id_clone,
                &worker_tool,
                params,
                cancel_rx,
                move |ev: WorkerProgressEvent| {
                    let jobs_inner = Arc::clone(&jobs_progress);
                    let emit_inner = emit_progress.clone();
                    let jid = job_id_for_cb.clone();
                    tokio::spawn(async move {
                        let mut map = jobs_inner.lock().await;
                        if let Some(rec) = map.get_mut(&jid) {
                            if rec.status == JobStatus::Running {
                                rec.progress = ev.progress;
                                rec.stage = ev.stage;
                                rec.metrics = ev.metrics;
                                if let Some(cb) = emit_inner {
                                    cb(rec.clone());
                                }
                            }
                        }
                    });
                },
            )
            .await;

            cancellers.lock().await.remove(&job_id_clone);

            let mut map = jobs.lock().await;
            if let Some(rec) = map.get_mut(&job_id_clone) {
                match outcome {
                    Ok(res) => {
                        if rec.status != JobStatus::Cancelled {
                            rec.status = JobStatus::Done;
                            rec.progress = 1.0;
                            rec.stage = "done".to_string();
                            if let Some(m) = res.get("metrics") {
                                rec.metrics = m.clone();
                            }
                            rec.result = Some(res);
                        }
                    }
                    Err(e) if e == "CANCELLED" => {
                        rec.status = JobStatus::Cancelled;
                        rec.stage = "cancelled".to_string();
                    }
                    Err(e) => {
                        rec.status = JobStatus::Error;
                        rec.stage = "error".to_string();
                        rec.error = Some(e);
                    }
                }
                if let Some(cb) = &emit {
                    cb(rec.clone());
                }
            }
        });

        record
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tokio::time::{sleep, Duration};

    #[test]
    fn pipeline_validator_detects_compatible_and_incompatible_chains() {
        let valid_steps = vec![
            PipelineStepSpec {
                tool_id: "img-heic-jpg".into(),
                label: "HEIC → JPG".into(),
                input_mimes: vec!["image/heic".into()],
                output_mimes: vec!["image/jpeg".into()],
                params: None,
            },
            PipelineStepSpec {
                tool_id: "img-compress".into(),
                label: "Comprimir Imagem".into(),
                input_mimes: vec!["image/jpeg".into(), "image/png".into()],
                output_mimes: vec!["image/jpeg".into()],
                params: None,
            },
        ];
        assert!(JobScheduler::validate_pipeline(&valid_steps).valid);

        let invalid_steps = vec![
            PipelineStepSpec {
                tool_id: "pdf-compress".into(),
                label: "Comprimir PDF".into(),
                input_mimes: vec!["application/pdf".into()],
                output_mimes: vec!["application/pdf".into()],
                params: None,
            },
            PipelineStepSpec {
                tool_id: "audio-denoise".into(),
                label: "Remover Ruído".into(),
                input_mimes: vec!["audio/mpeg".into()],
                output_mimes: vec!["audio/mpeg".into()],
                params: None,
            },
        ];
        let res = JobScheduler::validate_pipeline(&invalid_steps);
        assert!(!res.valid);
        assert_eq!(res.errors.len(), 1);
    }

    #[tokio::test]
    async fn scheduler_executes_job_to_completion() {
        let scheduler = JobScheduler::default();
        let job = scheduler
            .submit_job(
                SubmitJobRequest {
                    tool_id: "system.diagnostic_cycle".into(),
                    label: "Prensa Diagnóstica".into(),
                    weight: Some(JobWeight::Light),
                    params: Some(json!({ "steps": 3, "stepDelayMs": 5 })),
                    batch_id: None,
                    pipeline_id: None,
                },
                None,
            )
            .await;

        for _ in 0..40 {
            if let Some(current) = scheduler.get_job(&job.id).await {
                if current.status == JobStatus::Done {
                    assert_eq!(current.progress, 1.0);
                    return;
                }
            }
            sleep(Duration::from_millis(25)).await;
        }
        panic!("Job did not complete in time");
    }
}
