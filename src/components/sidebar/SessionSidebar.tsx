import { useMemo } from 'react';
import type { Session } from '@/lib/types';
import { NewSessionButton } from './NewSessionButton';
import { SessionTab } from './SessionTab';

interface Props {
  sessions: Session[];
  activeSessionId: string | null;
  activity: Record<string, boolean>;
  onCreate: () => void;
  onSelect: (sessionId: string) => void;
  onRename: (sessionId: string, label: string) => void;
  onKill: (sessionId: string) => void;
  onDuplicate: (sessionId: string) => void;
  onDismiss: (sessionId: string) => void;
}

export function SessionSidebar({
  sessions,
  activeSessionId,
  activity,
  onCreate,
  onSelect,
  onRename,
  onKill,
  onDuplicate,
  onDismiss
}: Props) {
  const runningCount = useMemo(
    () => sessions.filter((session) => session.status !== 'terminated').length,
    [sessions]
  );

  return (
    <aside className="flex h-full w-full flex-col bg-[var(--surface-secondary)]">
      <div className="border-b-2 border-[var(--border-strong)] px-3 py-3">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-display text-sm font-bold uppercase tracking-widest">Sessions</h2>
          <span className="border-2 border-[var(--border-default)] bg-[var(--surface-tertiary)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            {runningCount}/{sessions.length}
          </span>
        </div>
        <NewSessionButton onCreate={onCreate} />
      </div>

      <div className="flex-1 space-y-1 overflow-auto p-2">
        {sessions.length === 0 ? (
          <div className="border-2 border-dashed border-[var(--border-default)] p-4 text-center text-xs text-[var(--text-secondary)]">
            No sessions yet.
          </div>
        ) : null}

        {sessions.map((session) => (
          <SessionTab
            key={session.id}
            session={session}
            active={session.id === activeSessionId}
            hasActivity={activity[session.id]}
            onSelect={onSelect}
            onRename={onRename}
            onKill={onKill}
            onDuplicate={onDuplicate}
            onDismiss={onDismiss}
          />
        ))}
      </div>
    </aside>
  );
}
