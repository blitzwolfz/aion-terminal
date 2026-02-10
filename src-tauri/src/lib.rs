mod commands;
mod db;
mod git;
mod pty;
mod state;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    env_logger::init();

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_sql::Builder::new().build())
        .setup(|app| {
            let state = state::AppState::init(app.handle())?;
            app.manage(state);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::pty::pty_spawn,
            commands::pty::pty_write,
            commands::pty::pty_resize,
            commands::pty::pty_kill,
            commands::pty::pty_list,
            commands::git::git_status,
            commands::git::git_diff,
            commands::git::git_stage,
            commands::git::git_unstage,
            commands::git::git_commit,
            commands::git::git_log,
            commands::git::git_branches,
            commands::git::git_checkout,
            commands::git::git_branch_delete,
            commands::git::git_push,
            commands::git::git_pull,
            commands::git::git_fetch,
            commands::git::git_merge,
            commands::git::git_cherry_pick,
            commands::git::git_tag_create,
            commands::git::git_tag_delete,
            commands::git::git_watch_start,
            commands::git::git_watch_stop,
            commands::git::git_stash,
            commands::tokens::query_usage,
            commands::tokens::query_budget,
            commands::tokens::set_budget,
            commands::settings::resolve_shell,
            commands::settings::save_shell_config,
            commands::settings::load_shell_config
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
