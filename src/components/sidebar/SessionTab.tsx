import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/Input';
import type { Session } from '@/lib/types';

interface Props {
  session: Session;
  active: boolean;
  hasActivity: boolean;
  onSelect: (sessionId: string) => void;
  onRename: (sessionId: string, label: string) => void;
  onKill: (sessionId: string) => void;
  onDuplicate: (sessionId: string) => void;
  onDismiss: (sessionId: string) => void;
}

export function SessionTab({
  session,
  active,
  hasActivity,
  onSelect,
  onRename,
  onKill,
  onDuplicate,
  onDismiss
}: Props) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(session.label);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, []);

  const dotColor =
    session.status === 'terminated' ? 'bg-text-tertiary' : hasActivity ? 'bg-[#10b981]' : 'bg-[#6b7280]';

  return (
    <div
      className={`relative group border-b border-default px-2 py-2 ${active ? 'bg-surface-tertiary' : 'bg-surface-secondary hover:bg-surface-tertiary'}`}
      onClick={() => onSelect(session.id)}
      onDoubleClick={() => setEditing(true)}
      onContextMenu={(event) => {
        event.preventDefault();
        setMenuOpen(true);
      }}
    >
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 ${dotColor} ${hasActivity ? 'animate-pulse' : ''}`} />
        {editing ? (
          <Input
            autoFocus
            className="h-6"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onBlur={() => {
              setEditing(false);
              onRename(session.id, value.trim() || session.label);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                setEditing(false);
                onRename(session.id, value.trim() || session.label);
              }
            }}
          />
        ) : (
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium uppercase tracking-[0.04em]">{session.label}</p>
            <p className="truncate text-[10px] text-text-secondary">{session.status}</p>
          </div>
        )}
        {session.status === 'terminated' ? (
          <button
            className="hidden text-[10px] uppercase tracking-[0.04em] text-text-tertiary hover:text-text-primary group-hover:block"
            onClick={(event) => {
              event.stopPropagation();
              onDismiss(session.id);
            }}
          >
            Dismiss
          </button>
        ) : (
          <button
            className="hidden text-[10px] uppercase tracking-[0.04em] text-text-tertiary hover:text-[#ef4444] group-hover:block"
            onClick={(event) => {
              event.stopPropagation();
              onKill(session.id);
            }}
          >
            Kill
          </button>
        )}
      </div>

      {menuOpen ? (
        <div ref={menuRef} className="absolute right-2 top-7 z-20 w-36 border border-default bg-surface-secondary shadow">
          <button
            className="block h-8 w-full px-2 text-left text-[11px] uppercase tracking-[0.04em] hover:bg-surface-tertiary"
            onClick={(event) => {
              event.stopPropagation();
              setEditing(true);
              setMenuOpen(false);
            }}
          >
            Rename
          </button>
          <button
            className="block h-8 w-full px-2 text-left text-[11px] uppercase tracking-[0.04em] hover:bg-surface-tertiary"
            onClick={(event) => {
              event.stopPropagation();
              onDuplicate(session.id);
              setMenuOpen(false);
            }}
          >
            Duplicate
          </button>
          {session.status === 'terminated' ? (
            <button
              className="block h-8 w-full px-2 text-left text-[11px] uppercase tracking-[0.04em] hover:bg-surface-tertiary"
              onClick={(event) => {
                event.stopPropagation();
                onDismiss(session.id);
                setMenuOpen(false);
              }}
            >
              Dismiss
            </button>
          ) : (
            <button
              className="block h-8 w-full px-2 text-left text-[11px] uppercase tracking-[0.04em] text-[#ef4444] hover:bg-surface-tertiary"
              onClick={(event) => {
                event.stopPropagation();
                onKill(session.id);
                setMenuOpen(false);
              }}
            >
              Kill Session
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}
