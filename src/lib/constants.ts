import type { ShellConfig } from './types';

export const APP_NAME = 'Aion';

export const TERMINAL_THEME = {
  background: '#1A1A1A',
  foreground: '#F5F0E8',
  cursor: '#059669',
  cursorAccent: '#1A1A1A',
  selectionBackground: '#065F46',
  selectionForeground: '#F5F0E8',
  black: '#1A1A1A',
  red: '#DC2626',
  green: '#059669',
  yellow: '#D97706',
  blue: '#2563EB',
  magenta: '#9333EA',
  cyan: '#0891B2',
  white: '#F5F0E8',
  brightBlack: '#5C5C5C',
  brightRed: '#EF4444',
  brightGreen: '#10B981',
  brightYellow: '#F59E0B',
  brightBlue: '#3B82F6',
  brightMagenta: '#A855F7',
  brightCyan: '#06B6D4',
  brightWhite: '#FFFFFF'
};

export const TERMINAL_OPTIONS = {
  cursorBlink: true,
  cursorStyle: 'block' as const,
  fontFamily: '"IBM Plex Mono", monospace',
  fontSize: 13,
  lineHeight: 1.4,
  scrollback: 10000,
  allowProposedApi: true
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
