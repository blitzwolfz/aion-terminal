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
    <aside className="flex h-full w-full flex-col bg-transparent">
      <div className="border-b border-default px-3 py-3">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold tracking-[0.02em]">Sessions</h2>
          <span className="rounded-md border border-default bg-surface-tertiary px-2 py-1 text-[10px] text-text-secondary">
            {runningCount}/{sessions.length} active
          </span>
        </div>
        <NewSessionButton onCreate={onCreate} />
      </div>

      <div className="flex-1 space-y-2 overflow-auto p-2">
        {sessions.length === 0 ? (
          <div className="rounded-lg border border-default bg-surface-tertiary px-3 py-4 text-xs text-text-secondary">
            No sessions yet. Start one to run your agent workflow.
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
