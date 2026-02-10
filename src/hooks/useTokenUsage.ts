import { useCallback, useEffect, useMemo, useState } from 'react';
import { onTokenCaptured, queryBudget, queryUsage, setBudget } from '@/lib/ipc';
import { useSettingsStore } from '@/stores/settingsStore';
import type { UsageRecord } from '@/lib/types';

function monthString(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function startOfMonthIso() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}

export function useTokenUsage() {
  const [records, setRecords] = useState<UsageRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const budget = useSettingsStore((state) => state.budget);
  const setBudgetState = useSettingsStore((state) => state.setBudget);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const month = monthString(new Date());
      const [nextRecords, nextBudget] = await Promise.all([
        queryUsage({ from: startOfMonthIso() }),
        queryBudget(month)
      ]);
      setRecords(nextRecords);
      setBudgetState(nextBudget);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [setBudgetState]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    let timeout: ReturnType<typeof setTimeout> | undefined;

    void onTokenCaptured(() => {
      if (timeout) {
        clearTimeout(timeout);
      }
      timeout = setTimeout(() => {
        void refresh();
      }, 100);
    }).then((fn) => {
      unlisten = fn;
    });

    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
      if (unlisten) {
        unlisten();
      }
    };
  }, [refresh]);

  const updateBudget = useCallback(
    async (limit: number) => {
      const month = monthString(new Date());
      await setBudget(month, limit);
      await refresh();
    },
    [refresh]
  );

  const aggregates = useMemo(() => {
    const byDay = new Map<string, { total: number; agents: Record<string, number> }>();
    const byAgent = new Map<string, number>();

    for (const record of records) {
      const day = record.captured_at.slice(0, 10);
      const dayEntry = byDay.get(day) ?? { total: 0, agents: {} };
      dayEntry.total += record.cost_usd;
      dayEntry.agents[record.agent] = (dayEntry.agents[record.agent] ?? 0) + record.cost_usd;
      byDay.set(day, dayEntry);

      byAgent.set(record.agent, (byAgent.get(record.agent) ?? 0) + record.cost_usd);
    }

    return {
      timeline: Array.from(byDay.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, value]) => ({ date, ...value })),
      breakdown: Array.from(byAgent.entries())
        .map(([agent, cost]) => ({ agent, cost }))
        .sort((a, b) => b.cost - a.cost),
      totalCost: records.reduce((sum, record) => sum + record.cost_usd, 0),
      totalTokens: records.reduce((sum, record) => sum + record.tokens_total, 0)
    };
  }, [records]);

  return {
    records,
    loading,
    error,
    budget,
    refresh,
    updateBudget,
    aggregates
  };
}
