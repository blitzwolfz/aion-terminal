import { create } from 'zustand';
import { DEFAULT_BUDGET_LIMIT_USD, DEFAULT_SHELL_CONFIG } from '@/lib/constants';
import type { BudgetSummary, ShellConfig } from '@/lib/types';

interface SettingsState {
  shellConfig: ShellConfig;
  budget: BudgetSummary;
  setShellConfig: (shellConfig: ShellConfig) => void;
  setBudget: (budget: BudgetSummary) => void;
}

function monthString(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  shellConfig: DEFAULT_SHELL_CONFIG,
  budget: {
    month: monthString(new Date()),
    limit_usd: DEFAULT_BUDGET_LIMIT_USD,
    spent_usd: 0,
    remaining_usd: DEFAULT_BUDGET_LIMIT_USD,
    pct_used: 0
  },
  setShellConfig: (shellConfig) => set({ shellConfig }),
  setBudget: (budget) => set({ budget })
}));
