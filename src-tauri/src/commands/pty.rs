use std::collections::HashMap;
use std::io::{Read, Write};

use chrono::Utc;
use portable_pty::{CommandBuilder, NativePtySystem, PtySize, PtySystem};
use serde::Serialize;
use tauri::{AppHandle, Emitter, State};

use crate::pty::session::{PtySession, SessionInfo};
use crate::state::AppState;

#[derive(Debug, Clone, Serialize)]
struct PtyDataPayload {
    session_id: String,
    data: Vec<u8>,
}

#[derive(Debug, Clone, Serialize)]
struct PtyExitPayload {
    session_id: String,
    code: i32,
}

#[tauri::command]
pub async fn pty_spawn(
    state: State<'_, AppState>,
    app_handle: AppHandle,
    session_id: String,
    shell: Option<String>,
    cwd: Option<String>,
    env: Option<HashMap<String, String>>,
    cols: u16,
    rows: u16,
) -> Result<(), String> {
    let pty_system = NativePtySystem::default();

    let pty_pair = pty_system
        .openpty(PtySize {
            rows,
            cols,
            pixel_width: 0,
            pixel_height: 0,
        })
        .map_err(|err| format!("failed to open pty pair: {err}"))?;

    let resolved_shell = shell.unwrap_or_else(default_shell);
    let mut command = CommandBuilder::new(&resolved_shell);

    if !cfg!(target_os = "windows") {
        command.arg("-l");
    }

    if let Some(cwd) = cwd.as_ref() {
        command.cwd(cwd);
    }

    if let Some(env) = env {
        for (key, value) in env {
            command.env(key, value);
        }
    }

    let child = pty_pair
        .slave
        .spawn_command(command)
        .map_err(|err| format!("failed to spawn command: {err}"))?;

    let pid = child.process_id().map(i64::from).unwrap_or_default();

    let mut reader = pty_pair
        .master
        .try_clone_reader()
        .map_err(|err| format!("failed to clone pty reader: {err}"))?;

    let writer = pty_pair
        .master
        .take_writer()
        .map_err(|err| format!("failed to acquire pty writer: {err}"))?;

    let session = PtySession::new(
        session_id.clone(),
        resolved_shell,
        cwd.unwrap_or_else(|| ".".to_string()),
        pid,
        Utc::now(),
        pty_pair.master,
        writer,
        child,
    );

    let child_handle = session.child();
    let sessions = state.pty_manager.sessions();

    {
        let mut guard = sessions
            .lock()
            .map_err(|_| "failed to lock pty sessions for insert".to_string())?;
        guard.insert(session_id.clone(), session);
    }

    let scraper = state.pty_manager.scraper();
    let app_for_data = app_handle.clone();
    let data_session_id = session_id.clone();

    std::thread::spawn(move || {
        let mut buf = [0_u8; 4096];
        loop {
            match reader.read(&mut buf) {
                Ok(0) => break,
                Ok(read_len) => {
                    let bytes = buf[..read_len].to_vec();
                    let payload = PtyDataPayload {
                        session_id: data_session_id.clone(),
                        data: bytes.clone(),
                    };
                    let _ = app_for_data.emit("pty:data", payload);
                    scraper.ingest(&data_session_id, &bytes);
                }
                Err(_) => break,
            }
        }
    });

    let app_for_exit = app_handle;
    let exit_session_id = session_id;

    std::thread::spawn(move || {
        let code = {
            let mut guard = match child_handle.lock() {
                Ok(guard) => guard,
                Err(_) => {
                    let _ = app_for_exit.emit(
                        "pty:exit",
                        PtyExitPayload {
                            session_id: exit_session_id.clone(),
                            code: -1,
                        },
                    );
                    return;
                }
            };

            match guard.wait() {
                Ok(status) => i32::try_from(status.exit_code()).unwrap_or(i32::MAX),
                Err(_) => -1,
            }
        };

        let _ = app_for_exit.emit(
            "pty:exit",
            PtyExitPayload {
                session_id: exit_session_id.clone(),
                code,
            },
        );

        if let Ok(mut guard) = sessions.lock() {
            guard.remove(&exit_session_id);
        }
    });

    Ok(())
}

#[tauri::command]
pub async fn pty_write(
    state: State<'_, AppState>,
    session_id: String,
    data: Vec<u8>,
) -> Result<(), String> {
    let sessions = state.pty_manager.sessions();
    let session = {
        let guard = sessions
            .lock()
            .map_err(|_| "failed to lock pty sessions for write".to_string())?;
        guard
            .get(&session_id)
            .cloned()
            .ok_or_else(|| format!("pty session not found: {session_id}"))?
    };

    let writer = session.writer();
    let mut guard = writer
        .lock()
        .map_err(|_| format!("failed to lock writer for session: {session_id}"))?;

    guard
        .write_all(&data)
        .map_err(|err| format!("failed to write to pty: {err}"))
}

#[tauri::command]
pub async fn pty_resize(
    state: State<'_, AppState>,
    session_id: String,
    cols: u16,
    rows: u16,
) -> Result<(), String> {
    let sessions = state.pty_manager.sessions();
    let session = {
        let guard = sessions
            .lock()
            .map_err(|_| "failed to lock pty sessions for resize".to_string())?;
        guard
            .get(&session_id)
            .cloned()
            .ok_or_else(|| format!("pty session not found: {session_id}"))?
    };

    let master = session.master();
    let guard = master
        .lock()
        .map_err(|_| format!("failed to lock pty master for session: {session_id}"))?;

    guard
        .resize(PtySize {
            rows,
            cols,
            pixel_width: 0,
            pixel_height: 0,
        })
        .map_err(|err| format!("failed to resize pty: {err}"))
}

#[tauri::command]
pub async fn pty_kill(
    state: State<'_, AppState>,
    app_handle: AppHandle,
    session_id: String,
) -> Result<(), String> {
    let session = {
        let sessions = state.pty_manager.sessions();
        let mut guard = sessions
            .lock()
            .map_err(|_| "failed to lock pty sessions for kill".to_string())?;
        guard
            .remove(&session_id)
            .ok_or_else(|| format!("pty session not found: {session_id}"))?
    };

    {
        let child = session.child();
        let mut guard = child
            .lock()
            .map_err(|_| format!("failed to lock child for session: {session_id}"))?;
        let _ = guard.kill();
        let _ = guard.wait();
    }

    app_handle
        .emit(
            "pty:exit",
            PtyExitPayload {
                session_id,
                code: -1,
            },
        )
        .map_err(|err| format!("failed to emit pty exit event: {err}"))
}

#[tauri::command]
pub async fn pty_list(state: State<'_, AppState>) -> Result<Vec<SessionInfo>, String> {
    let sessions = state.pty_manager.sessions();
    let guard = sessions
        .lock()
        .map_err(|_| "failed to lock pty sessions for list".to_string())?;

    Ok(guard.values().map(PtySession::info).collect())
}

fn default_shell() -> String {
    if cfg!(target_os = "windows") {
        "pwsh".to_string()
    } else {
        std::env::var("SHELL").unwrap_or_else(|_| "/bin/zsh".to_string())
    }
}
