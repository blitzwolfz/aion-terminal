use serde::Deserialize;

use crate::git::porcelain::{
    self, BranchList, CommitEntry, CommitInfo, DiffResult, FileStatus, PullResult, PushResult,
    StashAction, StashResult,
};

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
