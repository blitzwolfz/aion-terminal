import { Button } from '@/components/ui/Button';
import type { Session } from '@/lib/types';

interface Props {
  session: Session | null;
  onNewSession: () => void;
  onKillSession: () => void;
  onOpenSettings: () => void;
}

export function TerminalToolbar({ session, onNewSession, onKillSession, onOpenSettings }: Props) {
  const status = session?.status ?? 'idle';

  return (
    <header className="flex h-11 items-center justify-between border-b-2 border-[var(--border-strong)] bg-[var(--surface-primary)] px-3">
      <div className="flex min-w-0 items-center gap-2">
        <span
          className={`h-3 w-3 border-2 border-[var(--border-strong)] ${
            status === 'running'
              ? 'bg-[var(--status-success)]'
              : status === 'terminated'
                ? 'bg-[var(--status-error)]'
                : 'bg-[var(--status-info)]'
          }`}
        />
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold uppercase tracking-wide">
            {session?.label ?? 'No Active Session'}
          </p>
          <p className="truncate text-[10px] text-[var(--text-secondary)]">
            {session ? `${session.shell} \u2014 ${session.cwd}` : 'Create a session to begin'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button compact variant="ghost" onClick={onOpenSettings}>Settings</Button>
        <Button compact variant="danger" onClick={onKillSession} disabled={!session || session.status === 'terminated'}>Kill</Button>
        <Button compact variant="primary" onClick={onNewSession}>+ New</Button>
      </div>
    </header>
  );
}
