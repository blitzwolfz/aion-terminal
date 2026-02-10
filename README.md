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
- PTY output event streaming via `pty:data`
- PTY exit event emission via `pty:exit`

### Session Sidebar

- Multi-session creation, switching, rename, kill
- Activity indicators and session state labels
- Drag reorder via Framer Motion reorder group

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

### Git Sidecar

- Status, diff, stage, unstage, commit, log, branch list, checkout
- Push/pull/stash wrappers
- Git change watcher module with debounce event emission (`git:changed`)

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

## Notes

- Push/pull/stash operations shell out to `git` for porcelain behavior parity.
- Advanced P1/P2 Git features (hunk-level staging, merge UI, blame, tags, cherry-pick) are scaffold-ready but not fully implemented.
- The current implementation prioritizes the PRD's core architecture and P0 operational path.
