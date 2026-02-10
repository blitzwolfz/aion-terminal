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
    <section className="border border-default p-3">
      <h4 className="text-[10px] uppercase tracking-[0.04em] text-text-secondary">Budget</h4>
      <div className="mt-2 flex items-center gap-3">
        <svg width="100" height="100" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={radius} stroke="#374151" strokeWidth="8" fill="none" />
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke="#10b981"
            strokeWidth="8"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="butt"
            transform="rotate(-90 50 50)"
          />
          <text x="50" y="54" textAnchor="middle" fill="#f9fafb" fontSize="14" fontFamily="JetBrains Mono">
            {clamped.toFixed(0)}%
          </text>
        </svg>
        <div className="text-xs">
          <p>
            <span className="text-text-secondary">Spent:</span> ${spent.toFixed(2)}
          </p>
          <p>
            <span className="text-text-secondary">Limit:</span> ${limit.toFixed(2)}
          </p>
          <p>
            <span className="text-text-secondary">Remaining:</span> ${(limit - spent).toFixed(2)}
          </p>
        </div>
      </div>
    </section>
  );
}
