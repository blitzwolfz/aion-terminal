interface Point {
  date: string;
  total: number;
}

interface Props {
  data: Point[];
}

export function CostTimeline({ data }: Props) {
  const max = Math.max(...data.map((point) => point.total), 1);

  return (
    <section className="border-2 border-[var(--border-default)] bg-[var(--surface-elevated)] p-3">
      <h4 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">30-Day Cost</h4>
      <div className="space-y-1">
        {data.slice(-30).map((point) => (
          <div key={point.date} className="flex items-center gap-2 text-xs">
            <span className="w-20 font-mono text-[10px] text-[var(--text-secondary)]">{point.date}</span>
            <div className="h-4 flex-1 border-2 border-[var(--border-default)] bg-[var(--surface-tertiary)]">
              <div
                className="h-full bg-[var(--accent-primary)]"
                style={{ width: `${(point.total / max) * 100}%` }}
              />
            </div>
            <span className="w-16 text-right font-mono font-semibold">${point.total.toFixed(2)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
