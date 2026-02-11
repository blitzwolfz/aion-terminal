import { useTokenUsage } from '@/hooks/useTokenUsage';
import { BudgetGauge } from './BudgetGauge';
import { CostTimeline } from './CostTimeline';
import { AgentBreakdown } from './AgentBreakdown';
import { BudgetConfig } from '@/components/settings/BudgetConfig';

export function UsageDashboard() {
  const { loading, error, records, aggregates, budget, updateBudget } = useTokenUsage();

  return (
    <section className="flex h-full flex-col bg-[var(--surface-secondary)]">
      <header className="flex h-11 items-center justify-between border-b-2 border-[var(--border-strong)] bg-[var(--surface-primary)] px-3">
        <h3 className="font-display text-sm font-bold uppercase tracking-widest">Usage</h3>
        <span className="border-2 border-[var(--border-default)] bg-[var(--surface-tertiary)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
          {records.length} records
        </span>
      </header>
      <div className="flex-1 overflow-auto p-3">
        {error ? <p className="mb-3 text-xs font-medium text-[var(--status-error)]">{error}</p> : null}
        {loading ? <p className="mb-3 text-xs text-[var(--text-secondary)]">Loading usage data...</p> : null}
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
