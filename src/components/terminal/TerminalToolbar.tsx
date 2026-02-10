import { Button } from '@/components/ui/Button';
import type { Session } from '@/lib/types';

interface Props {
  session: Session | null;
  onNewSession: () => void;
  onKillSession: () => void;
  onOpenSettings: () => void;
}

export function TerminalToolbar({ session, onNewSession, onKillSession, onOpenSettings }: Props) {
  return (
    <header className="flex h-10 items-center justify-between border-b border-default bg-surface-secondary px-3">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.04em]">
        <span className="text-text-secondary">Active</span>
        <span>{session?.label ?? 'None'}</span>
        <span className="text-text-tertiary">{session ? `(${session.shell})` : ''}</span>
      </div>
      <div className="flex items-center gap-2">
        <Button compact onClick={onOpenSettings}>Settings</Button>
        <Button compact onClick={onKillSession} disabled={!session}>Kill</Button>
        <Button compact variant="primary" onClick={onNewSession}>New</Button>
      </div>
    </header>
  );
}
