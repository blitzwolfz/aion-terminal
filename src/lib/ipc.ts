import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import type {
  BranchList,
  BudgetSummary,
  CherryPickResult,
  CommitEntry,
  CommitInfo,
  DiffResult,
  FileStatusEntry,
  FetchResult,
  MergeResult,
  PtyDataEvent,
  PtyExitEvent,
  PullResult,
  PushResult,
  ShellConfig,
  ShellInfo,
  StashAction,
  StashResult,
  TagResult,
  TokenCapturedEvent,
  UsageRecord
} from './types';

export async function ptySpawn(params: {
  sessionId: string;
  shell?: string;
  cwd?: string;
  env?: Record<string, string>;
  cols: number;
  rows: number;
}) {
  return invoke('pty_spawn', {
    sessionId: params.sessionId,
    shell: params.shell,
    cwd: params.cwd,
    env: params.env,
    cols: params.cols,
    rows: params.rows
  });
}

export async function ptyWrite(sessionId: string, data: Uint8Array) {
  return invoke('pty_write', { sessionId, data: Array.from(data) });
}

export async function ptyResize(sessionId: string, cols: number, rows: number) {
  return invoke('pty_resize', { sessionId, cols, rows });
}

export async function ptyKill(sessionId: string) {
  return invoke('pty_kill', { sessionId });
}

export async function ptyList() {
  return invoke('pty_list') as Promise<Array<Record<string, unknown>>>;
}

export async function gitStatus(path: string) {
  return invoke('git_status', { path }) as Promise<FileStatusEntry[]>;
}

export async function gitDiff(path: string, file: string, staged: boolean) {
  return invoke('git_diff', { path, file, staged }) as Promise<DiffResult>;
}

export async function gitStage(path: string, files: string[]) {
  return invoke('git_stage', { path, files });
}

export async function gitUnstage(path: string, files: string[]) {
  return invoke('git_unstage', { path, files });
}

export async function gitCommit(path: string, message: string, amend?: boolean) {
  return invoke('git_commit', { path, message, amend }) as Promise<CommitInfo>;
}

export async function gitLog(path: string, limit = 50, branch?: string) {
  return invoke('git_log', { path, limit, branch }) as Promise<CommitEntry[]>;
}

export async function gitBranches(path: string) {
  return invoke('git_branches', { path }) as Promise<BranchList>;
}

export async function gitCheckout(path: string, branch: string, create = false) {
  return invoke('git_checkout', { path, branch, create });
}

export async function gitBranchDelete(path: string, branch: string, force = false) {
  return invoke('git_branch_delete', { path, branch, force });
}

export async function gitPush(path: string, remote?: string, branch?: string, force = false) {
  return invoke('git_push', { path, remote, branch, force }) as Promise<PushResult>;
}

export async function gitPull(path: string, remote?: string, branch?: string) {
  return invoke('git_pull', { path, remote, branch }) as Promise<PullResult>;
}

export async function gitFetch(path: string, remote?: string) {
  return invoke('git_fetch', { path, remote }) as Promise<FetchResult>;
}

export async function gitMerge(path: string, branch: string, noFf = false) {
  return invoke('git_merge', { path, branch, noFf }) as Promise<MergeResult>;
}

export async function gitCherryPick(path: string, commit: string) {
  return invoke('git_cherry_pick', { path, commit }) as Promise<CherryPickResult>;
}

export async function gitTagCreate(path: string, tag: string, target?: string) {
  return invoke('git_tag_create', { path, tag, target }) as Promise<TagResult>;
}

export async function gitTagDelete(path: string, tag: string) {
  return invoke('git_tag_delete', { path, tag }) as Promise<TagResult>;
}

export async function gitWatchStart(path: string) {
  return invoke('git_watch_start', { path }) as Promise<string>;
}

export async function gitWatchStop(path: string) {
  return invoke('git_watch_stop', { path });
}

export async function gitStash(path: string, action: StashAction, message?: string, index?: number) {
  return invoke('git_stash', { path, action, message, index }) as Promise<StashResult>;
}

export async function queryUsage(params: {
  from?: string;
  to?: string;
  agent?: string;
  sessionId?: string;
}) {
  return invoke('query_usage', {
    from: params.from,
    to: params.to,
    agent: params.agent,
    sessionId: params.sessionId
  }) as Promise<UsageRecord[]>;
}

export async function queryBudget(month: string) {
  return invoke('query_budget', { month }) as Promise<BudgetSummary>;
}

export async function setBudget(month: string, limitUsd: number) {
  return invoke('set_budget', { month, limitUsd });
}

export async function resolveShell(config: ShellConfig, overrideShell?: string) {
  return invoke('resolve_shell', { config, overrideShell }) as Promise<ShellInfo>;
}

export async function save_shell_config(config: ShellConfig) {
  return invoke('save_shell_config', { config });
}

export async function load_shell_config() {
  return invoke('load_shell_config') as Promise<ShellConfig>;
}

export async function onPtyData(handler: (payload: PtyDataEvent) => void): Promise<UnlistenFn> {
  return listen<PtyDataEvent>('pty:data', (event) => {
    handler(event.payload);
  });
}

export async function onPtyExit(handler: (payload: PtyExitEvent) => void): Promise<UnlistenFn> {
  return listen<PtyExitEvent>('pty:exit', (event) => {
    handler(event.payload);
  });
}

export async function onGitChanged(handler: () => void): Promise<UnlistenFn> {
  return listen('git:changed', () => handler());
}

export async function onTokenCaptured(
  handler: (payload: TokenCapturedEvent) => void
): Promise<UnlistenFn> {
  return listen<TokenCapturedEvent>('token:captured', (event) => {
    handler(event.payload);
  });
}
