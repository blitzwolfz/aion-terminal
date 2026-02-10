use std::cell::RefCell;
use std::path::{Path, PathBuf};
use std::process::Command;

use chrono::{DateTime, Utc};
use git2::{BranchType, Commit, DiffOptions, ErrorCode, Repository, Signature, Status, StatusOptions};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize)]
pub struct FileStatus {
    pub path: String,
    pub status: String,
    pub staged: bool,
    pub is_binary: bool,
}

#[derive(Debug, Clone, Serialize)]
pub struct DiffLine {
    pub r#type: String,
    pub content: String,
    pub old_ln: Option<u32>,
    pub new_ln: Option<u32>,
}

#[derive(Debug, Clone, Serialize)]
pub struct DiffHunk {
    pub header: String,
    pub lines: Vec<DiffLine>,
}

#[derive(Debug, Clone, Serialize)]
pub struct DiffResult {
    pub hunks: Vec<DiffHunk>,
}

#[derive(Debug, Clone, Serialize)]
pub struct CommitInfo {
    pub oid: String,
    pub message: String,
    pub author: String,
    pub timestamp: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct CommitEntry {
    pub oid: String,
    pub short_oid: String,
    pub message: String,
    pub author: String,
    pub date: String,
    pub parents: Vec<String>,
    pub refs: Vec<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct BranchList {
    pub current: Option<String>,
    pub local: Vec<String>,
    pub remote: Vec<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct PushResult {
    pub ok: bool,
    pub detail: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct PullResult {
    pub ok: bool,
    pub detail: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum StashAction {
    Push,
    Pop,
    Drop,
    List,
}

#[derive(Debug, Clone, Serialize)]
pub struct StashEntry {
    pub index: usize,
    pub message: String,
    pub oid: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct StashResult {
    pub action: StashAction,
    pub stashes: Vec<StashEntry>,
    pub detail: String,
}

pub fn status(path: &str) -> Result<Vec<FileStatus>, String> {
    let repo = open_repo(path)?;

    let mut options = StatusOptions::new();
    options
        .include_untracked(true)
        .renames_head_to_index(true)
        .renames_index_to_workdir(true)
        .include_ignored(false)
        .recurse_untracked_dirs(true);

    let statuses = repo
        .statuses(Some(&mut options))
        .map_err(|err| format!("failed to get statuses: {err}"))?;

    let mut files = Vec::new();

    for entry in statuses.iter() {
        let Some(path) = entry.path() else {
            continue;
        };
        let status = entry.status();
        files.push(FileStatus {
            path: path.to_string(),
            status: status_to_label(status).to_string(),
            staged: is_staged(status),
            is_binary: false,
        });
    }

    Ok(files)
}

pub fn diff(path: &str, file: &str, staged: bool) -> Result<DiffResult, String> {
    let repo = open_repo(path)?;

    let mut options = DiffOptions::new();
    options.pathspec(file);

    let index = repo
        .index()
        .map_err(|err| format!("failed to read index for diff: {err}"))?;

    let diff = if staged {
        let tree = repo
            .head()
            .ok()
            .and_then(|head| head.peel_to_tree().ok());

        repo.diff_tree_to_index(tree.as_ref(), Some(&index), Some(&mut options))
            .map_err(|err| format!("failed to diff tree to index: {err}"))?
    } else {
        repo.diff_index_to_workdir(Some(&index), Some(&mut options))
            .map_err(|err| format!("failed to diff index to workdir: {err}"))?
    };

    let hunks: RefCell<Vec<DiffHunk>> = RefCell::new(Vec::new());

    diff.foreach(
        &mut |_delta, _progress| true,
        None,
        Some(&mut |_delta, hunk| {
            let mut hunks = hunks.borrow_mut();
            let header = String::from_utf8_lossy(hunk.header())
                .trim()
                .to_string();
            hunks.push(DiffHunk {
                header,
                lines: Vec::new(),
            });
            true
        }),
        Some(&mut |_delta, _hunk, line| {
            let mut hunks = hunks.borrow_mut();
            if hunks.is_empty() {
                hunks.push(DiffHunk {
                    header: "@@".to_string(),
                    lines: Vec::new(),
                });
            }

            let line_type = match line.origin() {
                '+' => "add",
                '-' => "del",
                _ => "context",
            }
            .to_string();

            let content = String::from_utf8_lossy(line.content())
                .trim_end_matches('\n')
                .to_string();

            let old_ln = line.old_lineno();
            let new_ln = line.new_lineno();

            if let Some(last) = hunks.last_mut() {
                last.lines.push(DiffLine {
                    r#type: line_type,
                    content,
                    old_ln,
                    new_ln,
                });
            }

            true
        }),
    )
    .map_err(|err| format!("failed to walk diff: {err}"))?;

    Ok(DiffResult {
        hunks: hunks.into_inner(),
    })
}

pub fn stage(path: &str, files: Vec<String>) -> Result<(), String> {
    let repo = open_repo(path)?;
    let mut index = repo
        .index()
        .map_err(|err| format!("failed to open index for stage: {err}"))?;

    for file in files {
        index
            .add_path(Path::new(&file))
            .map_err(|err| format!("failed to stage file '{file}': {err}"))?;
    }

    index
        .write()
        .map_err(|err| format!("failed to write index while staging: {err}"))
}

pub fn unstage(path: &str, files: Vec<String>) -> Result<(), String> {
    let repo = open_repo(path)?;
    let mut index = repo
        .index()
        .map_err(|err| format!("failed to open index for unstage: {err}"))?;

    for file in files {
        index
            .remove_path(Path::new(&file))
            .map_err(|err| format!("failed to unstage file '{file}': {err}"))?;
    }

    index
        .write()
        .map_err(|err| format!("failed to write index while unstaging: {err}"))
}

pub fn commit(path: &str, message: String, amend: Option<bool>) -> Result<CommitInfo, String> {
    let repo = open_repo(path)?;
    let signature = repo
        .signature()
        .or_else(|_| Signature::now("Aion", "aion@local"))
        .map_err(|err| format!("failed to build signature: {err}"))?;

    let mut index = repo
        .index()
        .map_err(|err| format!("failed to open index for commit: {err}"))?;

    let tree_oid = index
        .write_tree()
        .map_err(|err| format!("failed to write tree for commit: {err}"))?;
    let tree = repo
        .find_tree(tree_oid)
        .map_err(|err| format!("failed to find tree for commit: {err}"))?;

    let oid = if amend.unwrap_or(false) {
        let head_commit = repo
            .head()
            .and_then(|head| head.peel_to_commit())
            .map_err(|err| format!("failed to resolve HEAD for amend: {err}"))?;

        head_commit
            .amend(
                Some("HEAD"),
                Some(&signature),
                Some(&signature),
                None,
                Some(&message),
                Some(&tree),
            )
            .map_err(|err| format!("failed to amend commit: {err}"))?
    } else {
        let parents: Vec<Commit<'_>> = match repo.head() {
            Ok(head) => vec![head
                .peel_to_commit()
                .map_err(|err| format!("failed to peel HEAD commit: {err}"))?],
            Err(err) if err.code() == ErrorCode::UnbornBranch || err.code() == ErrorCode::NotFound => {
                Vec::new()
            }
            Err(err) => return Err(format!("failed to resolve HEAD: {err}")),
        };

        let parent_refs: Vec<&Commit<'_>> = parents.iter().collect();

        repo.commit(
            Some("HEAD"),
            &signature,
            &signature,
            &message,
            &tree,
            &parent_refs,
        )
        .map_err(|err| format!("failed to create commit: {err}"))?
    };

    Ok(CommitInfo {
        oid: oid.to_string(),
        message,
        author: signature.name().unwrap_or("unknown").to_string(),
        timestamp: Utc::now().to_rfc3339(),
    })
}

pub fn log(path: &str, limit: Option<usize>, branch: Option<String>) -> Result<Vec<CommitEntry>, String> {
    let repo = open_repo(path)?;
    let mut walk = repo
        .revwalk()
        .map_err(|err| format!("failed to create revwalk: {err}"))?;

    if let Some(branch) = branch {
        walk.push_ref(&format!("refs/heads/{branch}"))
            .map_err(|err| format!("failed to revwalk branch: {err}"))?;
    } else {
        walk.push_head()
            .map_err(|err| format!("failed to revwalk HEAD: {err}"))?;
    }

    walk.set_sorting(git2::Sort::TOPOLOGICAL | git2::Sort::TIME)
        .map_err(|err| format!("failed to configure revwalk sorting: {err}"))?;

    let mut commits = Vec::new();
    for oid in walk.take(limit.unwrap_or(50)) {
        let oid = oid.map_err(|err| format!("failed to iterate revwalk: {err}"))?;
        let commit = repo
            .find_commit(oid)
            .map_err(|err| format!("failed to find commit: {err}"))?;

        let short_oid = oid.to_string().chars().take(7).collect::<String>();
        let message = commit.summary().unwrap_or_default().to_string();
        let author = commit.author().name().unwrap_or("unknown").to_string();
        let timestamp = DateTime::<Utc>::from_timestamp(commit.time().seconds(), 0)
            .unwrap_or_else(Utc::now)
            .to_rfc3339();

        commits.push(CommitEntry {
            oid: oid.to_string(),
            short_oid,
            message,
            author,
            date: timestamp,
            parents: commit.parent_ids().map(|parent| parent.to_string()).collect(),
            refs: vec![],
        });
    }

    Ok(commits)
}

pub fn branches(path: &str) -> Result<BranchList, String> {
    let repo = open_repo(path)?;

    let current = repo
        .head()
        .ok()
        .and_then(|head| head.shorthand().map(str::to_string));

    let mut local = Vec::new();
    let mut remote = Vec::new();

    let iter = repo
        .branches(None)
        .map_err(|err| format!("failed to list branches: {err}"))?;

    for branch in iter {
        let (branch, kind) = branch.map_err(|err| format!("failed to read branch: {err}"))?;
        let Some(name) = branch
            .name()
            .map_err(|err| format!("failed to read branch name: {err}"))?
        else {
            continue;
        };

        match kind {
            BranchType::Local => local.push(name.to_string()),
            BranchType::Remote => remote.push(name.to_string()),
        }
    }

    Ok(BranchList {
        current,
        local,
        remote,
    })
}

pub fn checkout(path: &str, branch: String, create: Option<bool>) -> Result<(), String> {
    let repo = open_repo(path)?;

    if create.unwrap_or(false) {
        let head_commit = repo
            .head()
            .and_then(|head| head.peel_to_commit())
            .map_err(|err| format!("failed to resolve HEAD for branch create: {err}"))?;
        repo.branch(&branch, &head_commit, false)
            .map_err(|err| format!("failed to create branch: {err}"))?;
    }

    let reference = format!("refs/heads/{branch}");
    repo.set_head(&reference)
        .map_err(|err| format!("failed to set HEAD: {err}"))?;

    let mut checkout = git2::build::CheckoutBuilder::new();
    checkout.safe();
    repo.checkout_head(Some(&mut checkout))
        .map_err(|err| format!("failed to checkout branch: {err}"))?;

    Ok(())
}

pub fn push(path: &str, remote: Option<String>, branch: Option<String>, force: Option<bool>) -> Result<PushResult, String> {
    let repo = open_repo(path)?;
    let repo_dir = repo_root(&repo, path);

    let mut command = Command::new("git");
    command.arg("-C").arg(repo_dir).arg("push");

    if let Some(remote) = remote {
        command.arg(remote);
    }

    if let Some(branch) = branch {
        command.arg(branch);
    }

    if force.unwrap_or(false) {
        command.arg("--force");
    }

    let output = command
        .output()
        .map_err(|err| format!("failed to execute git push: {err}"))?;

    let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
    let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();

    Ok(PushResult {
        ok: output.status.success(),
        detail: if output.status.success() { stdout } else { stderr },
    })
}

pub fn pull(path: &str, remote: Option<String>, branch: Option<String>) -> Result<PullResult, String> {
    let repo = open_repo(path)?;
    let repo_dir = repo_root(&repo, path);

    let mut command = Command::new("git");
    command.arg("-C").arg(repo_dir).arg("pull");

    if let Some(remote) = remote {
        command.arg(remote);
    }

    if let Some(branch) = branch {
        command.arg(branch);
    }

    let output = command
        .output()
        .map_err(|err| format!("failed to execute git pull: {err}"))?;

    let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
    let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();

    Ok(PullResult {
        ok: output.status.success(),
        detail: if output.status.success() { stdout } else { stderr },
    })
}

pub fn stash(
    path: &str,
    action: StashAction,
    message: Option<String>,
    index: Option<usize>,
) -> Result<StashResult, String> {
    let repo = open_repo(path)?;
    let repo_dir = repo_root(&repo, path);

    match action {
        StashAction::Push => {
            let mut command = Command::new("git");
            command.arg("-C").arg(&repo_dir).arg("stash").arg("push");
            if let Some(message) = message {
                command.arg("-m").arg(message);
            }
            run_command(command, "stash push")?;
        }
        StashAction::Pop => {
            let mut command = Command::new("git");
            command.arg("-C").arg(&repo_dir).arg("stash").arg("pop");
            if let Some(index) = index {
                command.arg(format!("stash@{{{index}}}"));
            }
            run_command(command, "stash pop")?;
        }
        StashAction::Drop => {
            let Some(index) = index else {
                return Err("stash drop requires an index".to_string());
            };
            let mut command = Command::new("git");
            command
                .arg("-C")
                .arg(&repo_dir)
                .arg("stash")
                .arg("drop")
                .arg(format!("stash@{{{index}}}"));
            run_command(command, "stash drop")?;
        }
        StashAction::List => {}
    }

    let list_output = Command::new("git")
        .arg("-C")
        .arg(&repo_dir)
        .arg("stash")
        .arg("list")
        .output()
        .map_err(|err| format!("failed to execute stash list: {err}"))?;

    let text = String::from_utf8_lossy(&list_output.stdout);
    let stashes = parse_stash_list(&text);

    Ok(StashResult {
        action,
        stashes,
        detail: "ok".to_string(),
    })
}

fn run_command(mut command: Command, operation: &str) -> Result<(), String> {
    let output = command
        .output()
        .map_err(|err| format!("failed to execute {operation}: {err}"))?;

    if !output.status.success() {
        return Err(format!(
            "{operation} failed: {}",
            String::from_utf8_lossy(&output.stderr).trim()
        ));
    }

    Ok(())
}

fn parse_stash_list(text: &str) -> Vec<StashEntry> {
    text.lines()
        .enumerate()
        .map(|(idx, line)| StashEntry {
            index: idx,
            message: line.to_string(),
            oid: format!("stash-{idx}"),
        })
        .collect()
}

fn open_repo(path: &str) -> Result<Repository, String> {
    Repository::discover(path).map_err(|err| format!("failed to discover repository: {err}"))
}

fn repo_root(repo: &Repository, fallback: &str) -> PathBuf {
    repo.workdir()
        .map(Path::to_path_buf)
        .unwrap_or_else(|| PathBuf::from(fallback))
}

fn status_to_label(status: Status) -> &'static str {
    if status.is_wt_new() {
        "?"
    } else if status.is_wt_deleted() || status.is_index_deleted() {
        "D"
    } else if status.is_wt_renamed() || status.is_index_renamed() {
        "R"
    } else if status.is_wt_modified() || status.is_index_modified() {
        "M"
    } else if status.is_index_new() {
        "A"
    } else {
        "M"
    }
}

fn is_staged(status: Status) -> bool {
    status.is_index_new()
        || status.is_index_modified()
        || status.is_index_deleted()
        || status.is_index_renamed()
        || status.is_index_typechange()
}
