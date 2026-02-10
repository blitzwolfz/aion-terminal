use std::path::PathBuf;

use rusqlite::Connection;
use tauri::{AppHandle, Manager};

pub fn init_db(app: &AppHandle) -> Result<PathBuf, String> {
    let app_dir = app
        .path()
        .app_data_dir()
        .map_err(|err| format!("failed to resolve app data dir: {err}"))?;

    std::fs::create_dir_all(&app_dir)
        .map_err(|err| format!("failed to create app data dir: {err}"))?;

    let db_path = app_dir.join("aion.db");
    let conn = Connection::open(&db_path).map_err(|err| format!("failed to open db: {err}"))?;

    let schema = include_str!("schema.sql");
    conn.execute_batch(schema)
        .map_err(|err| format!("failed to apply db schema: {err}"))?;

    Ok(db_path)
}
