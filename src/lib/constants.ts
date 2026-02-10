import type { ShellConfig } from './types';

export const APP_NAME = 'Aion';

export const TERMINAL_THEME = {
  background: '#111827',
  foreground: '#f3f4f6',
  cursor: '#10b981',
  selectionBackground: '#047857'
};

export const TERMINAL_OPTIONS = {
  cursorBlink: true,
  cursorStyle: 'block' as const,
  fontFamily: '"JetBrains Mono", "Fira Code", monospace',
  fontSize: 13,
  scrollback: 10000
};

export const DEFAULT_CWD = '.';

export const DEFAULT_SHELL_CONFIG: ShellConfig = {
  defaultShell: {
    darwin: 'zsh',
    win32: 'pwsh'
  },
  customPaths: {},
  defaultEnv: {},
  loginShell: true,
  profileLoad: true
};

export const DEFAULT_BUDGET_LIMIT_USD = 100;
