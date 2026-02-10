use std::path::Path;

use serde::{Deserialize, Serialize};
use tauri::State;

use crate::state::AppState;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ShellConfig {
    pub default_shell: DefaultShell,
    pub custom_paths: CustomPaths,
    pub default_env: std::collections::HashMap<String, String>,
    pub login_shell: bool,
    pub profile_load: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DefaultShell {
    pub darwin: String,
    pub win32: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct CustomPaths {
    pub darwin: Option<String>,
    pub win32: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ShellInfo {
    pub path: String,
    pub args: Vec<String>,
    pub name: String,
}

impl Default for ShellConfig {
    fn default() -> Self {
        Self {
            default_shell: DefaultShell {
                darwin: "zsh".to_string(),
                win32: "pwsh".to_string(),
            },
            custom_paths: CustomPaths::default(),
            default_env: std::collections::HashMap::new(),
            login_shell: true,
            profile_load: true,
        }
    }
}

#[tauri::command]
pub fn resolve_shell(config: ShellConfig, override_shell: Option<String>) -> Result<ShellInfo, String> {
    resolve_shell_with_config(&config, override_shell)
}

#[tauri::command]
pub fn save_shell_config(state: State<'_, AppState>, config: ShellConfig) -> Result<(), String> {
    let payload = serde_json::to_string_pretty(&config)
        .map_err(|err| format!("failed to serialize shell config: {err}"))?;

    std::fs::write(state.shell_config_path.as_ref(), payload)
        .map_err(|err| format!("failed to write shell config: {err}"))
}

#[tauri::command]
pub fn load_shell_config(state: State<'_, AppState>) -> Result<ShellConfig, String> {
    load_shell_config_from_path(state.shell_config_path.as_ref())
}

pub fn load_shell_config_from_path(path: &Path) -> Result<ShellConfig, String> {
    if !path.exists() {
        let default = ShellConfig::default();
        let payload = serde_json::to_string_pretty(&default)
            .map_err(|err| format!("failed to serialize default shell config: {err}"))?;
        std::fs::write(path, payload)
            .map_err(|err| format!("failed to write default shell config: {err}"))?;
        return Ok(default);
    }

    let payload = std::fs::read_to_string(path)
        .map_err(|err| format!("failed to read shell config: {err}"))?;

    serde_json::from_str::<ShellConfig>(&payload)
        .map_err(|err| format!("failed to parse shell config: {err}"))
}

pub fn resolve_shell_with_config(
    config: &ShellConfig,
    override_shell: Option<String>,
) -> Result<ShellInfo, String> {
    let mut info = if let Some(override_shell) = override_shell {
        shell_info_from_path(&override_shell)?
    } else if cfg!(target_os = "windows") {
        resolve_windows_shell(config)?
    } else {
        resolve_unix_shell(config)?
    };

    if !cfg!(target_os = "windows") {
        if config.login_shell && !info.args.iter().any(|arg| arg == "-l") {
            info.args.push("-l".to_string());
        }

        if !config.profile_load {
            apply_no_profile_args(&mut info);
        }
    }

    Ok(info)
}

fn resolve_unix_shell(config: &ShellConfig) -> Result<ShellInfo, String> {
    let selected = config.default_shell.darwin.as_str();

    if selected == "custom" {
        let path = config
            .custom_paths
            .darwin
            .as_ref()
            .ok_or_else(|| "custom darwin shell path is missing".to_string())?;
        let mut info = shell_info_from_path(path)?;
        info.name = selected.to_string();
        return Ok(info);
    }

    let candidates: &[(&str, &str)] = match selected {
        "zsh" => &[("zsh", "/bin/zsh"), ("bash", "/bin/bash"), ("sh", "/bin/sh")],
        "bash" => &[("bash", "/bin/bash"), ("zsh", "/bin/zsh"), ("sh", "/bin/sh")],
        "fish" => &[
            ("fish", "/opt/homebrew/bin/fish"),
            ("fish", "/usr/local/bin/fish"),
            ("zsh", "/bin/zsh"),
        ],
        _ => &[("zsh", "/bin/zsh"), ("bash", "/bin/bash"), ("sh", "/bin/sh")],
    };

    for (name, path) in candidates {
        if Path::new(path).exists() {
            let mut info = shell_info_from_path(path)?;
            info.name = (*name).to_string();
            return Ok(info);
        }
    }

    Err("failed to resolve unix shell".to_string())
}

fn resolve_windows_shell(config: &ShellConfig) -> Result<ShellInfo, String> {
    let selected = config.default_shell.win32.as_str();

    if selected == "custom" {
        let path = config
            .custom_paths
            .win32
            .as_ref()
            .ok_or_else(|| "custom win32 shell path is missing".to_string())?;
        return shell_info_from_path(path);
    }

    let path_candidates: &[&str] = match selected {
        "pwsh" => &["pwsh.exe", "powershell.exe", "cmd.exe"],
        "powershell" => &["powershell.exe", "pwsh.exe", "cmd.exe"],
        "cmd" => &["cmd.exe"],
        _ => &["pwsh.exe", "powershell.exe", "cmd.exe"],
    };

    for candidate in path_candidates {
        if which_in_path(candidate) {
            return Ok(ShellInfo {
                path: candidate.to_string(),
                args: vec![],
                name: candidate.trim_end_matches(".exe").to_string(),
            });
        }
    }

    Err("failed to resolve windows shell".to_string())
}

fn apply_no_profile_args(info: &mut ShellInfo) {
    let normalized_name = info.name.to_ascii_lowercase();

    if normalized_name.contains("bash") {
        info.args.push("--noprofile".to_string());
        info.args.push("--norc".to_string());
    } else if normalized_name.contains("zsh") {
        info.args.push("-f".to_string());
    } else if normalized_name.contains("fish") {
        info.args.push("--no-config".to_string());
    }
}

fn shell_info_from_path(path: &str) -> Result<ShellInfo, String> {
    let shell_path = Path::new(path);

    if !shell_path.exists() && !which_in_path(path) {
        return Err(format!("shell path does not exist: {path}"));
    }

    let name = shell_path
        .file_name()
        .and_then(|name| name.to_str())
        .unwrap_or(path)
        .trim_end_matches(".exe")
        .to_string();

    Ok(ShellInfo {
        path: path.to_string(),
        args: vec![],
        name,
    })
}

fn which_in_path(binary: &str) -> bool {
    if binary.contains('/') || binary.contains('\\') {
        return Path::new(binary).exists();
    }

    let path = std::env::var_os("PATH");
    let Some(path) = path else {
        return false;
    };

    for dir in std::env::split_paths(&path) {
        let candidate = dir.join(binary);
        if candidate.exists() {
            return true;
        }
    }

    false
}
