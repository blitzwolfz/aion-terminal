import type { ShellConfig } from './types';

export const APP_NAME = 'Aion';

export const TERMINAL_THEME = {
  background: '#0a111e',
  foreground: '#e7eefc',
  cursor: '#13c6a6',
  selectionBackground: '#1f4d6e'
};

export const TERMINAL_OPTIONS = {
  cursorBlink: true,
  cursorStyle: 'block' as const,
  fontFamily: '"IBM Plex Mono", "JetBrains Mono", monospace',
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
