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
    <section className="border border-default p-3">
      <h4 className="mb-2 text-[10px] uppercase tracking-[0.04em] text-text-secondary">Agent Breakdown</h4>
      <div className="space-y-1">
        {data.map((item) => (
          <div key={item.agent} className="flex items-center gap-2 text-xs">
            <span className="w-28 truncate">{item.agent}</span>
            <div className="h-4 flex-1 border border-default">
              <div className="h-full bg-[#10b981]" style={{ width: `${(item.cost / max) * 100}%` }} />
            </div>
            <span className="w-16 text-right">${item.cost.toFixed(2)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
