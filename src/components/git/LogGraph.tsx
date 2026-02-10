import { useMemo, useState } from 'react';
import type { CommitEntry } from '@/lib/types';
import { Button } from '@/components/ui/Button';

interface Props {
  commits: CommitEntry[];
  onCherryPick: (oid: string) => Promise<void>;
}

export function LogGraph({ commits, onCherryPick }: Props) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return commits;
    }

    return commits.filter((commit) => {
      return (
        commit.message.toLowerCase().includes(q) ||
        commit.author.toLowerCase().includes(q) ||
        commit.short_oid.toLowerCase().includes(q)
      );
    });
  }, [commits, query]);

  return (
    <div className="border-t border-default p-2">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[10px] uppercase tracking-[0.04em] text-text-secondary">History</p>
        <input
          className="h-6 w-36 border border-default bg-surface-secondary px-2 text-[10px]"
          placeholder="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>
      <div className="max-h-56 space-y-1 overflow-auto">
        {filtered.map((commit) => (
          <div key={commit.oid} className="border border-default px-2 py-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-xs">{commit.message}</p>
                <p className="text-[10px] text-text-secondary">
                  {commit.short_oid} • {commit.author} • {new Date(commit.date).toLocaleString()}
                </p>
              </div>
              <Button compact onClick={() => void onCherryPick(commit.oid)}>Cherry</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
