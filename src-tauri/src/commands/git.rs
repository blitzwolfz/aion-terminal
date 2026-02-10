use std::path::Path;

use serde::Deserialize;
use tauri::{AppHandle, State};

use crate::git::porcelain::{
    self, BranchList, CherryPickResult, CommitEntry, CommitInfo, DiffResult, FetchResult,
    FileStatus, MergeResult, PullResult, PushResult, StashAction, StashResult, TagResult,
};
use crate::git::watcher;
use crate::state::AppState;

#[tauri::command]
pub async fn git_status(path: String) -> Result<Vec<FileStatus>, String> {
    porcelain::status(&path)
}

#[tauri::command]
pub async fn git_diff(path: String, file: String, staged: bool) -> Result<DiffResult, String> {
    porcelain::diff(&path, &file, staged)
}

#[tauri::command]
pub async fn git_stage(path: String, files: Vec<String>) -> Result<(), String> {
    porcelain::stage(&path, files)
}

#[tauri::command]
pub async fn git_unstage(path: String, files: Vec<String>) -> Result<(), String> {
    porcelain::unstage(&path, files)
}

#[tauri::command]
pub async fn git_commit(
    path: String,
    message: String,
    amend: Option<bool>,
) -> Result<CommitInfo, String> {
    porcelain::commit(&path, message, amend)
}

#[tauri::command]
pub async fn git_log(
    path: String,
    limit: Option<usize>,
    branch: Option<String>,
) -> Result<Vec<CommitEntry>, String> {
    porcelain::log(&path, limit, branch)
}

#[tauri::command]
pub async fn git_branches(path: String) -> Result<BranchList, String> {
    porcelain::branches(&path)
}

#[tauri::command]
pub async fn git_checkout(
    path: String,
    branch: String,
    create: Option<bool>,
) -> Result<(), String> {
    porcelain::checkout(&path, branch, create)
}

#[tauri::command]
pub async fn git_branch_delete(
    path: String,
    branch: String,
    force: Option<bool>,
) -> Result<(), String> {
    porcelain::branch_delete(&path, branch, force)
}

#[tauri::command]
pub async fn git_push(
    path: String,
    remote: Option<String>,
    branch: Option<String>,
    force: Option<bool>,
) -> Result<PushResult, String> {
    porcelain::push(&path, remote, branch, force)
}

#[tauri::command]
pub async fn git_pull(
    path: String,
    remote: Option<String>,
    branch: Option<String>,
) -> Result<PullResult, String> {
    porcelain::pull(&path, remote, branch)
}

#[tauri::command]
pub async fn git_fetch(path: String, remote: Option<String>) -> Result<FetchResult, String> {
    porcelain::fetch(&path, remote)
}

#[tauri::command]
pub async fn git_merge(
    path: String,
    branch: String,
    no_ff: Option<bool>,
) -> Result<MergeResult, String> {
    porcelain::merge(&path, branch, no_ff)
}

#[tauri::command]
pub async fn git_cherry_pick(path: String, commit: String) -> Result<CherryPickResult, String> {
    porcelain::cherry_pick(&path, commit)
}

#[tauri::command]
pub async fn git_tag_create(
    path: String,
    tag: String,
    target: Option<String>,
) -> Result<TagResult, String> {
    porcelain::tag_create(&path, tag, target)
}

#[tauri::command]
pub async fn git_tag_delete(path: String, tag: String) -> Result<TagResult, String> {
    porcelain::tag_delete(&path, tag)
}

#[tauri::command]
pub async fn git_watch_start(
    state: State<'_, AppState>,
    app_handle: AppHandle,
    path: String,
) -> Result<String, String> {
    let root = porcelain::discover_repo_root(&path)?;

    {
        let guard = state
            .git_watchers
            .lock()
            .map_err(|_| "failed to lock watcher map".to_string())?;
        if guard.contains_key(&root) {
            return Ok(root);
        }
    }

    let watcher = watcher::start_watching(Path::new(&root), app_handle)?;

    let mut guard = state
        .git_watchers
        .lock()
        .map_err(|_| "failed to lock watcher map for insert".to_string())?;
    guard.insert(root.clone(), watcher);

    Ok(root)
}

#[tauri::command]
pub async fn git_watch_stop(state: State<'_, AppState>, path: String) -> Result<(), String> {
    let root = porcelain::discover_repo_root(&path)?;

    let mut guard = state
        .git_watchers
        .lock()
        .map_err(|_| "failed to lock watcher map for remove".to_string())?;
    guard.remove(&root);

    Ok(())
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "PascalCase")]
pub enum FrontendStashAction {
    Push,
    Pop,
    Drop,
    List,
}

impl From<FrontendStashAction> for StashAction {
    fn from(value: FrontendStashAction) -> Self {
        match value {
            FrontendStashAction::Push => StashAction::Push,
            FrontendStashAction::Pop => StashAction::Pop,
            FrontendStashAction::Drop => StashAction::Drop,
            FrontendStashAction::List => StashAction::List,
        }
    }
}

#[tauri::command]
pub async fn git_stash(
    path: String,
    action: FrontendStashAction,
    message: Option<String>,
    index: Option<usize>,
) -> Result<StashResult, String> {
    porcelain::stash(&path, action.into(), message, index)
}
