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
    <section className="border border-default p-3">
      <h4 className="mb-2 text-[10px] uppercase tracking-[0.04em] text-text-secondary">Budget Config</h4>
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <p className="mb-1 text-[10px] uppercase tracking-[0.04em] text-text-secondary">Monthly Limit (USD)</p>
          <Input value={limit} onChange={(event) => setLimit(event.target.value)} />
        </div>
        <Button
          variant="primary"
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
          <span className="text-text-secondary">Current Month:</span> {budget.month}
        </p>
        <p>
          <span className="text-text-secondary">Captured Cost:</span> ${totalCost.toFixed(2)}
        </p>
        <p>
          <span className="text-text-secondary">Captured Tokens:</span> {totalTokens.toLocaleString()}
        </p>
      </div>
    </section>
  );
}
