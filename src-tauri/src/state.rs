use std::path::PathBuf;
use std::sync::Arc;

use tauri::{AppHandle, Manager};

use crate::db;
use crate::pty::PtyManager;

pub struct AppState {
    pub pty_manager: PtyManager,
    pub db_path: Arc<PathBuf>,
    pub shell_config_path: Arc<PathBuf>,
}

impl AppState {
    pub fn init(app: &AppHandle) -> Result<Self, String> {
        let db_path = db::init_db(app)?;

        let config_dir = app
            .path()
            .app_config_dir()
            .map_err(|err| format!("failed to resolve app config dir: {err}"))?;

        std::fs::create_dir_all(&config_dir)
            .map_err(|err| format!("failed to create app config dir: {err}"))?;

        let shell_config_path = config_dir.join("shell_config.json");

        Ok(Self {
            pty_manager: PtyManager::new(db_path.clone()),
            db_path: Arc::new(db_path),
            shell_config_path: Arc::new(shell_config_path),
        })
    }
}
