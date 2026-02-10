import { Reorder } from 'framer-motion';
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
  onReorder: (sessions: Session[]) => void;
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
  onDismiss,
  onReorder
}: Props) {
  return (
    <aside className="flex h-full w-60 flex-col border-r border-default bg-surface-secondary">
      <div className="p-2">
        <NewSessionButton onCreate={onCreate} />
      </div>
      <div className="border-b border-default px-2 pb-2 text-[10px] uppercase tracking-[0.04em] text-text-secondary">
        Sessions ({sessions.length})
      </div>
      <div className="flex-1 overflow-auto">
        <Reorder.Group axis="y" values={sessions} onReorder={onReorder} className="m-0 p-0">
          {sessions.map((session) => (
            <Reorder.Item key={session.id} value={session} className="list-none">
              <SessionTab
                session={session}
                active={session.id === activeSessionId}
                hasActivity={activity[session.id]}
                onSelect={onSelect}
                onRename={onRename}
                onKill={onKill}
                onDuplicate={onDuplicate}
                onDismiss={onDismiss}
              />
            </Reorder.Item>
          ))}
        </Reorder.Group>
      </div>
    </aside>
  );
}
