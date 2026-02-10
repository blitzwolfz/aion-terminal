export type ShellType = 'zsh' | 'bash' | 'fish' | 'pwsh' | 'powershell' | 'cmd' | 'custom';

export type AgentType = 'claude-code' | 'copilot-cli' | null;

export type SessionStatus = 'running' | 'idle' | 'terminated';

export interface Session {
  id: string;
  label: string;
  shell: ShellType;
  cwd: string;
  agent: AgentType;
  status: SessionStatus;
  createdAt: number;
  env: Record<string, string>;
}

export interface SessionInfo {
  session_id: string;
  shell: string;
  cwd: string;
  pid: number;
  started_at: string;
}

export interface PtyDataEvent {
  session_id: string;
  data: number[];
}

export interface PtyExitEvent {
  session_id: string;
  code: number;
}

export interface TokenCapturedEvent {
  session_id: string;
  inserts: number;
}

export interface FileStatusEntry {
  path: string;
  status: string;
  staged: boolean;
  is_binary: boolean;
}

export interface DiffLine {
  type: 'context' | 'add' | 'del';
  content: string;
  old_ln: number | null;
  new_ln: number | null;
}

export interface DiffHunk {
  header: string;
  lines: DiffLine[];
}

export interface DiffResult {
  hunks: DiffHunk[];
}

export interface CommitInfo {
  oid: string;
  message: string;
  author: string;
  timestamp: string;
}

export interface CommitEntry {
  oid: string;
  short_oid: string;
  message: string;
  author: string;
  date: string;
  parents: string[];
  refs: string[];
}

export interface BranchList {
  current: string | null;
  local: string[];
  remote: string[];
}

export interface PushResult {
  ok: boolean;
  detail: string;
}

export interface PullResult {
  ok: boolean;
  detail: string;
}

export interface FetchResult {
  ok: boolean;
  detail: string;
}

export interface MergeResult {
  ok: boolean;
  detail: string;
}

export interface CherryPickResult {
  ok: boolean;
  detail: string;
}

export interface TagResult {
  ok: boolean;
  detail: string;
}

export type StashAction = 'Push' | 'Pop' | 'Drop' | 'List';

export interface StashEntry {
  index: number;
  message: string;
  oid: string;
}

export interface StashResult {
  action: StashAction;
  stashes: StashEntry[];
  detail: string;
}

export interface UsageRecord {
  id: number;
  session_id: string;
  agent: string;
  cost_usd: number;
  tokens_in: number;
  tokens_out: number;
  tokens_total: number;
  duration_s: number | null;
  captured_at: string;
  raw_output: string;
}

export interface BudgetSummary {
  month: string;
  limit_usd: number;
  spent_usd: number;
  remaining_usd: number;
  pct_used: number;
}

export interface ShellConfig {
  defaultShell: {
    darwin: ShellType;
    win32: ShellType;
  };
  customPaths: {
    darwin?: string;
    win32?: string;
  };
  defaultEnv: Record<string, string>;
  loginShell: boolean;
  profileLoad: boolean;
}

export interface ShellInfo {
  path: string;
  args: string[];
  name: string;
}
