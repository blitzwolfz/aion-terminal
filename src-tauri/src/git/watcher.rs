use std::path::Path;
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};

use notify::{Event, RecommendedWatcher, RecursiveMode, Result as NotifyResult, Watcher};
use tauri::{AppHandle, Manager};

pub fn start_watching(path: &Path, app_handle: AppHandle) -> Result<RecommendedWatcher, String> {
    let last_emit = Arc::new(Mutex::new(Instant::now() - Duration::from_millis(300)));
    let emit_state = Arc::clone(&last_emit);

    let mut watcher = notify::recommended_watcher(move |event: NotifyResult<Event>| {
        let Ok(event) = event else {
            return;
        };

        if event
            .paths
            .iter()
            .any(|path| path.components().any(|comp| comp.as_os_str() == ".git"))
        {
            return;
        }

        let mut guard = match emit_state.lock() {
            Ok(guard) => guard,
            Err(_) => return,
        };

        if guard.elapsed() < Duration::from_millis(300) {
            return;
        }

        *guard = Instant::now();

        let _ = app_handle.emit("git:changed", serde_json::json!({}));
    })
    .map_err(|err| format!("failed to create watcher: {err}"))?;

    watcher
        .watch(path, RecursiveMode::Recursive)
        .map_err(|err| format!("failed to watch path: {err}"))?;

    Ok(watcher)
}
