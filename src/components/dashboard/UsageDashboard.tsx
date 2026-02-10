import { useTokenUsage } from '@/hooks/useTokenUsage';
import { BudgetGauge } from './BudgetGauge';
import { CostTimeline } from './CostTimeline';
import { AgentBreakdown } from './AgentBreakdown';
import { BudgetConfig } from '@/components/settings/BudgetConfig';

export function UsageDashboard() {
  const { loading, error, records, aggregates, budget, updateBudget } = useTokenUsage();

  return (
    <section className="flex h-full flex-col bg-surface-secondary">
      <header className="flex h-10 items-center justify-between border-b border-default px-3">
        <h3 className="text-xs uppercase tracking-[0.04em]">Usage Dashboard</h3>
        <span className="text-[10px] text-text-secondary">{records.length} records</span>
      </header>
      <div className="flex-1 overflow-auto p-3">
        {error ? <p className="mb-3 text-xs text-[#ef4444]">{error}</p> : null}
        {loading ? <p className="mb-3 text-xs text-text-secondary">Loading usage data…</p> : null}
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          <BudgetGauge spent={budget.spent_usd} limit={budget.limit_usd} pct={budget.pct_used} />
          <BudgetConfig
            budget={budget}
            totalCost={aggregates.totalCost}
            totalTokens={aggregates.totalTokens}
            onUpdateBudget={(limit) => void updateBudget(limit)}
          />
          <CostTimeline data={aggregates.timeline} />
          <AgentBreakdown data={aggregates.breakdown} />
        </div>
      </div>
    </section>
  );
}
