interface BreakdownItem {
  agent: string;
  cost: number;
}

interface Props {
  data: BreakdownItem[];
}

export function AgentBreakdown({ data }: Props) {
  const max = Math.max(...data.map((item) => item.cost), 1);

  return (
    <section className="border-2 border-[var(--border-default)] bg-[var(--surface-elevated)] p-3">
      <h4 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">Agent Breakdown</h4>
      <div className="space-y-1">
        {data.map((item) => (
          <div key={item.agent} className="flex items-center gap-2 text-xs">
            <span className="w-28 truncate font-semibold">{item.agent}</span>
            <div className="h-4 flex-1 border-2 border-[var(--border-default)] bg-[var(--surface-tertiary)]">
              <div
                className="h-full bg-[var(--accent-primary)]"
                style={{ width: `${(item.cost / max) * 100}%` }}
              />
            </div>
            <span className="w-16 text-right font-mono font-semibold">${item.cost.toFixed(2)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
