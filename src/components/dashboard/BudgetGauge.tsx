interface Props {
  spent: number;
  limit: number;
  pct: number;
}

export function BudgetGauge({ spent, limit, pct }: Props) {
  const clamped = Math.max(0, Math.min(100, pct));
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);

  return (
    <section className="border-2 border-[var(--border-default)] bg-[var(--surface-elevated)] p-3">
      <h4 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">Budget</h4>
      <div className="mt-2 flex items-center gap-4">
        <svg width="100" height="100" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={radius} stroke="var(--surface-inset)" strokeWidth="8" fill="none" />
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke="var(--accent-primary)"
            strokeWidth="8"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="butt"
            transform="rotate(-90 50 50)"
          />
          <text x="50" y="54" textAnchor="middle" fill="var(--text-primary)" fontSize="14" fontFamily="IBM Plex Mono, monospace" fontWeight="600">
            {clamped.toFixed(0)}%
          </text>
        </svg>
        <div className="text-xs space-y-1">
          <p>
            <span className="font-bold uppercase tracking-wider text-[var(--text-secondary)]">Spent:</span>{' '}
            <span className="font-mono font-semibold">${spent.toFixed(2)}</span>
          </p>
          <p>
            <span className="font-bold uppercase tracking-wider text-[var(--text-secondary)]">Limit:</span>{' '}
            <span className="font-mono font-semibold">${limit.toFixed(2)}</span>
          </p>
          <p>
            <span className="font-bold uppercase tracking-wider text-[var(--text-secondary)]">Remaining:</span>{' '}
            <span className="font-mono font-semibold">${(limit - spent).toFixed(2)}</span>
          </p>
        </div>
      </div>
    </section>
  );
}
