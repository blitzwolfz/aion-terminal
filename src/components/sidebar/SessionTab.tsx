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
    setValue(session.label);
  }, [session.label]);

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
    session.status === 'terminated' ? 'bg-[#6b7280]' : hasActivity ? 'bg-[#22c55e]' : 'bg-[#0ea5e9]';

  return (
    <div
      className={`group relative rounded-lg border px-2 py-2 transition-colors ${active ? 'border-[#2be3c2] bg-[#10253f]' : 'border-default bg-surface-tertiary hover:bg-surface-elevated'}`}
      onClick={() => onSelect(session.id)}
      onDoubleClick={() => setEditing(true)}
      onContextMenu={(event) => {
        event.preventDefault();
        setMenuOpen(true);
      }}
    >
      <div className="flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${dotColor} ${hasActivity ? 'animate-pulse' : ''}`} />

        {editing ? (
          <Input
            autoFocus
            className="h-7"
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
            <p className="truncate text-xs font-semibold tracking-[0.01em]">{session.label}</p>
            <p className="truncate text-[10px] text-text-secondary">{session.shell} - {session.status}</p>
          </div>
        )}

        {session.status === 'terminated' ? (
          <button
            className="hidden rounded bg-surface-secondary px-2 py-1 text-[10px] font-medium text-text-tertiary hover:text-text-primary group-hover:block"
            onClick={(event) => {
              event.stopPropagation();
              onDismiss(session.id);
            }}
          >
            Dismiss
          </button>
        ) : (
          <button
            className="hidden rounded bg-surface-secondary px-2 py-1 text-[10px] font-medium text-text-tertiary hover:text-[#fda4af] group-hover:block"
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
        <div
          ref={menuRef}
          className="absolute right-2 top-9 z-20 w-40 overflow-hidden rounded-md border border-default bg-surface-secondary shadow-[0_12px_24px_rgba(3,8,20,0.45)]"
        >
          <button
            className="block h-8 w-full px-3 text-left text-[11px] font-medium hover:bg-surface-tertiary"
            onClick={(event) => {
              event.stopPropagation();
              setEditing(true);
              setMenuOpen(false);
            }}
          >
            Rename
          </button>
          <button
            className="block h-8 w-full px-3 text-left text-[11px] font-medium hover:bg-surface-tertiary"
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
              className="block h-8 w-full px-3 text-left text-[11px] font-medium hover:bg-surface-tertiary"
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
              className="block h-8 w-full px-3 text-left text-[11px] font-medium text-[#fda4af] hover:bg-surface-tertiary"
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
