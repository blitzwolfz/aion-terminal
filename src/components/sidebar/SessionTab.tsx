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

  const statusColor =
    session.status === 'terminated'
      ? 'bg-[var(--text-tertiary)]'
      : hasActivity
        ? 'bg-[var(--status-success)]'
        : 'bg-[var(--status-info)]';

  return (
    <div
      className={`group relative border-2 px-2 py-2 transition-colors cursor-pointer ${
        active
          ? 'border-[var(--accent-primary)] bg-[var(--accent-muted)]'
          : 'border-[var(--border-default)] bg-[var(--surface-elevated)] hover:bg-[var(--surface-tertiary)]'
      }`}
      onClick={() => onSelect(session.id)}
      onDoubleClick={() => setEditing(true)}
      onContextMenu={(event) => {
        event.preventDefault();
        setMenuOpen(true);
      }}
    >
      <div className="flex items-center gap-2">
        <span className={`h-2.5 w-2.5 border border-[var(--border-strong)] ${statusColor} ${hasActivity ? 'animate-pulse' : ''}`} />

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
            <p className="truncate text-xs font-semibold">{session.label}</p>
            <p className="truncate text-[10px] uppercase tracking-wider text-[var(--text-secondary)]">
              {session.shell} \u2014 {session.status}
            </p>
          </div>
        )}

        {session.status === 'terminated' ? (
          <button
            className="hidden border border-[var(--border-default)] bg-[var(--surface-tertiary)] px-2 py-0.5 text-[10px] font-semibold uppercase text-[var(--text-secondary)] hover:bg-[var(--surface-inset)] group-hover:block"
            onClick={(event) => {
              event.stopPropagation();
              onDismiss(session.id);
            }}
          >
            X
          </button>
        ) : (
          <button
            className="hidden border border-[var(--status-error)] bg-[#FEE2E2] px-2 py-0.5 text-[10px] font-semibold uppercase text-[#991B1B] hover:bg-[#FECACA] group-hover:block"
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
          className="absolute right-2 top-9 z-20 w-40 overflow-hidden border-2 border-[var(--border-strong)] bg-[var(--surface-elevated)]"
        >
          <button
            className="block h-8 w-full px-3 text-left text-[11px] font-semibold uppercase tracking-wide hover:bg-[var(--surface-tertiary)]"
            onClick={(event) => {
              event.stopPropagation();
              setEditing(true);
              setMenuOpen(false);
            }}
          >
            Rename
          </button>
          <button
            className="block h-8 w-full px-3 text-left text-[11px] font-semibold uppercase tracking-wide hover:bg-[var(--surface-tertiary)]"
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
              className="block h-8 w-full px-3 text-left text-[11px] font-semibold uppercase tracking-wide hover:bg-[var(--surface-tertiary)]"
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
              className="block h-8 w-full px-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--status-error)] hover:bg-[#FEE2E2]"
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
