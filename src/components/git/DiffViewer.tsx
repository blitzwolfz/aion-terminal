import { useMemo, useState } from 'react';
import type { DiffLine, DiffResult } from '@/lib/types';

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

function toSideBySide(lines: DiffLine[]) {
  return lines.map((line) => {
    if (line.type === 'add') {
      return {
        left: '',
        right: line.content,
        leftLn: null,
        rightLn: line.new_ln,
        leftType: 'context' as const,
        rightType: 'add' as const
      };
    }

    if (line.type === 'del') {
      return {
        left: line.content,
        right: '',
        leftLn: line.old_ln,
        rightLn: null,
        leftType: 'del' as const,
        rightType: 'context' as const
      };
    }

    return {
      left: line.content,
      right: line.content,
      leftLn: line.old_ln,
      rightLn: line.new_ln,
      leftType: 'context' as const,
      rightType: 'context' as const
    };
  });
}

export function DiffViewer({ diff }: Props) {
  const [mode, setMode] = useState<'unified' | 'side'>('unified');

  const sideBySide = useMemo(() => {
    if (!diff) {
      return [];
    }
    return diff.hunks.map((hunk) => ({
      header: hunk.header,
      rows: toSideBySide(hunk.lines)
    }));
  }, [diff]);

  if (!diff || diff.hunks.length === 0) {
    return <div className="p-4 text-xs text-text-secondary">Select a file to view a diff.</div>;
  }

  return (
    <div className="h-full overflow-auto p-2 font-mono text-[11px]">
      <div className="mb-2 flex gap-2">
        <button
          className={`h-6 border px-2 text-[10px] uppercase tracking-[0.04em] ${mode === 'unified' ? 'border-[#10b981] text-[#10b981]' : 'border-default text-text-secondary'}`}
          onClick={() => setMode('unified')}
        >
          Unified
        </button>
        <button
          className={`h-6 border px-2 text-[10px] uppercase tracking-[0.04em] ${mode === 'side' ? 'border-[#10b981] text-[#10b981]' : 'border-default text-text-secondary'}`}
          onClick={() => setMode('side')}
        >
          Side-by-side
        </button>
      </div>

      {mode === 'unified'
        ? diff.hunks.map((hunk) => (
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
          ))
        : sideBySide.map((hunk) => (
            <section key={hunk.header} className="mb-3 border border-default">
              <header className="border-b border-default bg-surface-tertiary px-2 py-1 text-[10px] uppercase tracking-[0.04em] text-text-secondary">
                {hunk.header}
              </header>
              <div className="grid grid-cols-2">
                <div className="border-r border-default">
                  {hunk.rows.map((row, index) => (
                    <div key={`l-${hunk.header}-${index}`} className={`px-2 py-[2px] ${lineColor(row.leftType)}`}>
                      <span className="mr-3 inline-block w-10 text-right text-text-tertiary">{row.leftLn ?? ''}</span>
                      <span>{row.left}</span>
                    </div>
                  ))}
                </div>
                <div>
                  {hunk.rows.map((row, index) => (
                    <div key={`r-${hunk.header}-${index}`} className={`px-2 py-[2px] ${lineColor(row.rightType)}`}>
                      <span className="mr-3 inline-block w-10 text-right text-text-tertiary">{row.rightLn ?? ''}</span>
                      <span>{row.right}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          ))}
    </div>
  );
}
