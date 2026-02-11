import { useMemo, useState } from 'react';
import type { DiffLine, DiffResult } from '@/lib/types';

interface Props {
  diff: DiffResult | null;
}

function lineColor(type: 'context' | 'add' | 'del') {
  if (type === 'add') {
    return 'bg-[#D1FAE5] text-[#065F46]';
  }
  if (type === 'del') {
    return 'bg-[#FEE2E2] text-[#991B1B]';
  }
  return 'text-[var(--text-secondary)]';
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
    if (!diff) return [];
    return diff.hunks.map((hunk) => ({
      header: hunk.header,
      rows: toSideBySide(hunk.lines)
    }));
  }, [diff]);

  if (!diff || diff.hunks.length === 0) {
    return (
      <div className="flex items-center justify-center p-6 text-xs text-[var(--text-secondary)]">
        Select a file to view its diff.
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-2 font-mono text-[11px]">
      <div className="mb-2 flex gap-1">
        <button
          className={`h-6 border-2 px-2 text-[10px] font-bold uppercase tracking-widest ${
            mode === 'unified'
              ? 'border-[var(--accent-primary)] bg-[var(--accent-muted)] text-[var(--accent-deep)]'
              : 'border-[var(--border-default)] text-[var(--text-secondary)]'
          }`}
          onClick={() => setMode('unified')}
        >
          Unified
        </button>
        <button
          className={`h-6 border-2 px-2 text-[10px] font-bold uppercase tracking-widest ${
            mode === 'side'
              ? 'border-[var(--accent-primary)] bg-[var(--accent-muted)] text-[var(--accent-deep)]'
              : 'border-[var(--border-default)] text-[var(--text-secondary)]'
          }`}
          onClick={() => setMode('side')}
        >
          Split
        </button>
      </div>

      {mode === 'unified'
        ? diff.hunks.map((hunk) => (
            <section key={hunk.header} className="mb-3 border-2 border-[var(--border-default)]">
              <header className="border-b-2 border-[var(--border-default)] bg-[var(--surface-tertiary)] px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">
                {hunk.header}
              </header>
              <div>
                {hunk.lines.map((line, index) => (
                  <div key={`${hunk.header}-${index}`} className={`px-2 py-[1px] ${lineColor(line.type)}`}>
                    <span className="mr-2 inline-block w-8 text-right text-[var(--text-tertiary)]">{line.old_ln ?? ''}</span>
                    <span className="mr-2 inline-block w-8 text-right text-[var(--text-tertiary)]">{line.new_ln ?? ''}</span>
                    <span>{line.content}</span>
                  </div>
                ))}
              </div>
            </section>
          ))
        : sideBySide.map((hunk) => (
            <section key={hunk.header} className="mb-3 border-2 border-[var(--border-default)]">
              <header className="border-b-2 border-[var(--border-default)] bg-[var(--surface-tertiary)] px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">
                {hunk.header}
              </header>
              <div className="grid grid-cols-2">
                <div className="border-r-2 border-[var(--border-default)]">
                  {hunk.rows.map((row, index) => (
                    <div key={`l-${hunk.header}-${index}`} className={`px-2 py-[1px] ${lineColor(row.leftType)}`}>
                      <span className="mr-2 inline-block w-8 text-right text-[var(--text-tertiary)]">{row.leftLn ?? ''}</span>
                      <span>{row.left}</span>
                    </div>
                  ))}
                </div>
                <div>
                  {hunk.rows.map((row, index) => (
                    <div key={`r-${hunk.header}-${index}`} className={`px-2 py-[1px] ${lineColor(row.rightType)}`}>
                      <span className="mr-2 inline-block w-8 text-right text-[var(--text-tertiary)]">{row.rightLn ?? ''}</span>
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
