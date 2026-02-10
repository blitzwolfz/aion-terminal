use std::io::Write;
use std::sync::{Arc, Mutex};

use chrono::{DateTime, Utc};
use portable_pty::{Child, MasterPty};
use serde::Serialize;

#[derive(Clone)]
pub struct PtySession {
    pub session_id: String,
    pub shell: String,
    pub cwd: String,
    pub pid: i64,
    pub started_at: DateTime<Utc>,
    master: Arc<Mutex<Box<dyn MasterPty + Send>>>,
    writer: Arc<Mutex<Box<dyn Write + Send>>>,
    child: Arc<Mutex<Box<dyn Child + Send>>>,
}

#[derive(Debug, Clone, Serialize)]
pub struct SessionInfo {
    pub session_id: String,
    pub shell: String,
    pub cwd: String,
    pub pid: i64,
    pub started_at: String,
}

impl PtySession {
    #[allow(clippy::too_many_arguments)]
    pub fn new(
        session_id: String,
        shell: String,
        cwd: String,
        pid: i64,
        started_at: DateTime<Utc>,
        master: Box<dyn MasterPty + Send>,
        writer: Box<dyn Write + Send>,
        child: Box<dyn Child + Send>,
    ) -> Self {
        Self {
            session_id,
            shell,
            cwd,
            pid,
            started_at,
            master: Arc::new(Mutex::new(master)),
            writer: Arc::new(Mutex::new(writer)),
            child: Arc::new(Mutex::new(child)),
        }
    }

    pub fn info(&self) -> SessionInfo {
        SessionInfo {
            session_id: self.session_id.clone(),
            shell: self.shell.clone(),
            cwd: self.cwd.clone(),
            pid: self.pid,
            started_at: self.started_at.to_rfc3339(),
        }
    }

    pub fn master(&self) -> Arc<Mutex<Box<dyn MasterPty + Send>>> {
        Arc::clone(&self.master)
    }

    pub fn writer(&self) -> Arc<Mutex<Box<dyn Write + Send>>> {
        Arc::clone(&self.writer)
    }

    pub fn child(&self) -> Arc<Mutex<Box<dyn Child + Send>>> {
        Arc::clone(&self.child)
    }
}
