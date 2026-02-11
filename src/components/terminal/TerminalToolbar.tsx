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
    <header className="flex h-12 items-center justify-between border-b border-default bg-surface-primary px-3">
      <div className="flex min-w-0 items-center gap-2">
        <span
          className={`h-2.5 w-2.5 rounded-full ${
            status === 'running' ? 'bg-[#22c55e]' : status === 'terminated' ? 'bg-[#ef4444]' : 'bg-[#0ea5e9]'
          }`}
        />
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold">{session?.label ?? 'No Active Session'}</p>
          <p className="truncate text-[10px] text-text-secondary">
            {session ? `${session.shell} - ${session.cwd}` : 'Create a session to start working'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button compact onClick={onOpenSettings}>Settings</Button>
        <Button compact onClick={onKillSession} disabled={!session}>Kill</Button>
        <Button compact variant="primary" onClick={onNewSession}>New Session</Button>
      </div>
    </header>
  );
}
