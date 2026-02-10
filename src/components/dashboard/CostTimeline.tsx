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
    <section className="border border-default p-3">
      <h4 className="mb-2 text-[10px] uppercase tracking-[0.04em] text-text-secondary">30-Day Cost Timeline</h4>
      <div className="space-y-1">
        {data.slice(-30).map((point) => (
          <div key={point.date} className="flex items-center gap-2 text-xs">
            <span className="w-24 text-text-secondary">{point.date}</span>
            <div className="h-4 flex-1 border border-default">
              <div className="h-full bg-[#047857]" style={{ width: `${(point.total / max) * 100}%` }} />
            </div>
            <span className="w-16 text-right">${point.total.toFixed(2)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
