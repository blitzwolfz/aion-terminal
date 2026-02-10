import type { CommitEntry } from '@/lib/types';

interface Props {
  commits: CommitEntry[];
}

export function LogGraph({ commits }: Props) {
  return (
    <div className="border-t border-default p-2">
      <p className="mb-2 text-[10px] uppercase tracking-[0.04em] text-text-secondary">History</p>
      <div className="max-h-48 space-y-1 overflow-auto">
        {commits.map((commit) => (
          <div key={commit.oid} className="border border-default px-2 py-1">
            <p className="truncate text-xs">{commit.message}</p>
            <p className="text-[10px] text-text-secondary">
              {commit.short_oid} • {commit.author} • {new Date(commit.date).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
