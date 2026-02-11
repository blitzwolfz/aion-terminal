import { useState } from 'react';
import type { BudgetSummary } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface Props {
  budget: BudgetSummary;
  totalCost: number;
  totalTokens: number;
  onUpdateBudget: (limit: number) => void;
}

export function BudgetConfig({ budget, totalCost, totalTokens, onUpdateBudget }: Props) {
  const [limit, setLimit] = useState(budget.limit_usd.toFixed(2));

  return (
    <section className="border-2 border-[var(--border-default)] bg-[var(--surface-elevated)] p-3">
      <h4 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">Budget Config</h4>
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">Monthly Limit (USD)</p>
          <Input value={limit} onChange={(event) => setLimit(event.target.value)} />
        </div>
        <Button
          variant="primary"
          compact
          onClick={() => {
            const value = Number(limit);
            if (!Number.isNaN(value) && value > 0) {
              onUpdateBudget(value);
            }
          }}
        >
          Save
        </Button>
      </div>
      <div className="mt-3 space-y-1 text-xs">
        <p>
          <span className="font-bold uppercase tracking-wider text-[var(--text-secondary)]">Month:</span>{' '}
          <span className="font-mono">{budget.month}</span>
        </p>
        <p>
          <span className="font-bold uppercase tracking-wider text-[var(--text-secondary)]">Cost:</span>{' '}
          <span className="font-mono font-semibold">${totalCost.toFixed(2)}</span>
        </p>
        <p>
          <span className="font-bold uppercase tracking-wider text-[var(--text-secondary)]">Tokens:</span>{' '}
          <span className="font-mono font-semibold">{totalTokens.toLocaleString()}</span>
        </p>
      </div>
    </section>
  );
}
