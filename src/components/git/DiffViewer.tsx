import type { DiffResult } from '@/lib/types';

interface Props {
  diff: DiffResult | null;
}

function lineColor(type: 'context' | 'add' | 'del') {
  if (type === 'add') {
    return 'bg-[#064e3b] text-[#d1fae5]';
  }
  if (type === 'del') {
    return 'bg-[#7f1d1d] text-[#fecaca]';
  }
  return 'text-text-secondary';
}

export function DiffViewer({ diff }: Props) {
  if (!diff || diff.hunks.length === 0) {
    return <div className="p-4 text-xs text-text-secondary">Select a file to view a diff.</div>;
  }

  return (
    <div className="h-full overflow-auto p-2 font-mono text-[11px]">
      {diff.hunks.map((hunk) => (
        <section key={hunk.header} className="mb-3 border border-default">
          <header className="border-b border-default bg-surface-tertiary px-2 py-1 text-[10px] uppercase tracking-[0.04em] text-text-secondary">
            {hunk.header}
          </header>
          <div>
            {hunk.lines.map((line, index) => (
              <div key={`${hunk.header}-${index}`} className={`px-2 py-[2px] ${lineColor(line.type)}`}>
                <span className="mr-3 inline-block w-10 text-right text-text-tertiary">{line.old_ln ?? ''}</span>
                <span className="mr-3 inline-block w-10 text-right text-text-tertiary">{line.new_ln ?? ''}</span>
                <span>{line.content}</span>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
