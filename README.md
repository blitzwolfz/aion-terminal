# Aion

Aion is a Tauri 2.0 desktop application for orchestrating local AI coding agents in native PTY sessions. It combines:

- Multi-session terminal orchestration (`portable-pty` + `@xterm/xterm`)
- Passive AI usage and cost scraping persisted to SQLite
- Integrated Git sidecar operations (`git2` + system git for push/pull/stash)

Design direction follows a Bauhaus-style UI with an emerald accent palette, geometric layout, and no gradients.

## Tech Stack

- Frontend: React 19, TypeScript, Vite 5, Tailwind CSS 3, Framer Motion, `@xterm/xterm`
- Backend: Rust, Tauri 2, portable-pty, git2, notify, rusqlite
- Persistence: SQLite (`aion.db`) in app data directory

## Repository Structure

- `src/`: React UI, stores, hooks, and IPC wrappers
- `src-tauri/`: Rust backend, Tauri commands, PTY manager, git porcelain, DB initialization
- `src-tauri/src/commands/`: Tauri command entry points
- `src-tauri/src/pty/`: PTY lifecycle and token scraper
- `src-tauri/src/git/`: Git operation layer and file watcher
- `src-tauri/src/db/`: SQLite schema and initialization

## Implemented Features

### Terminal Engine

- PTY commands: `pty_spawn`, `pty_write`, `pty_resize`, `pty_kill`, `pty_list`
- Session lifecycle management with per-session process state
- PTY output event streaming via `pty:data` with buffered emission cadence
- PTY exit event emission via `pty:exit`
- Token capture events via `token:captured`
- WebGL renderer enablement with automatic renderer fallback

### Session Sidebar

- Multi-session creation, switching, rename, kill, duplicate, and dismiss
- Activity indicators and session state labels
- Drag reorder via Framer Motion reorder group
- Keyboard shortcuts (`Cmd/Ctrl+T`, `Cmd/Ctrl+W`, `Cmd/Ctrl+Tab`)
- Agent auto-labeling for Claude Code and Copilot sessions

### Shell Settings

- Shell config load/save with platform-aware defaults
- Shell resolution command with custom path support

### Token Usage Dashboard

- Passive ANSI-stripped parser for Claude `/cost` output patterns
- SQLite persistence to `token_usage` and `budgets`
- Budget and usage query commands:
  - `query_usage`
  - `query_budget`
  - `set_budget`
- Dashboard panels for budget, timeline, and agent breakdown
- Live dashboard refresh on token capture events

### Git Sidecar

- Status, diff (unified + side-by-side), stage, unstage, commit, log, branch list, checkout
- Branch delete, fetch, merge, cherry-pick, tag create/delete
- Push/pull/stash wrappers
- Git change watcher lifecycle (`git_watch_start`/`git_watch_stop`) with debounced `git:changed` event refresh

## Local Development

### Requirements

- Rust toolchain
- Node.js + pnpm
- Tauri prerequisites for your OS

### Install

```bash
pnpm install
```

### Run frontend only

```bash
pnpm dev
```

### Run desktop app

```bash
pnpm tauri dev
```

### TypeScript check

```bash
pnpm tsc --noEmit
```

### Rust check

```bash
cargo check --manifest-path src-tauri/Cargo.toml
```

### Production build

```bash
pnpm build
```

## Notes

- Push/pull/fetch/merge/cherry-pick/stash operations use system `git` for porcelain behavior parity.
- Git watcher events are started/stopped per active repo path from the frontend hook.
- `src-tauri/icons/icon.png` is required by `tauri::generate_context!` and included in-repo.
