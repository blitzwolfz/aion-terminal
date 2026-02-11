import { useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react';
import { APP_NAME, DEFAULT_CWD } from '@/lib/constants';
import { usePty } from '@/hooks/usePty';
import { useSessionStore } from '@/stores/sessionStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { SessionSidebar } from '@/components/sidebar/SessionSidebar';
import { TerminalPane } from '@/components/terminal/TerminalPane';
import { TerminalToolbar } from '@/components/terminal/TerminalToolbar';
import { GitPanel } from '@/components/git/GitPanel';
import { UsageDashboard } from '@/components/dashboard/UsageDashboard';
import { SettingsModal } from '@/components/settings/SettingsModal';
import type { Session, ShellType } from '@/lib/types';

function inferShell(): ShellType {
  const isWindows = navigator.userAgent.toLowerCase().includes('windows');
  return isWindows ? 'pwsh' : 'zsh';
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export default function App() {
  const pty = usePty();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [rightView, setRightView] = useState<'git' | 'dashboard'>('git');
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [rightPanelWidth, setRightPanelWidth] = useState(520);
  const dragTargetRef = useRef<'left' | 'right' | null>(null);

  const sessions = useSessionStore((state) => state.sessions);
  const activeSessionId = useSessionStore((state) => state.activeSessionId);
  const output = useSessionStore((state) => state.output);
  const activity = useSessionStore((state) => state.activity);
  const createSession = useSessionStore((state) => state.createSession);
  const duplicateSession = useSessionStore((state) => state.duplicateSession);
  const removeSession = useSessionStore((state) => state.removeSession);
  const renameSession = useSessionStore((state) => state.renameSession);
  const setActiveSession = useSessionStore((state) => state.setActiveSession);
  const setStatus = useSessionStore((state) => state.setStatus);

  const shellConfig = useSettingsStore((state) => state.shellConfig);

  const activeSession = useMemo(
    () => sessions.find((session) => session.id === activeSessionId) ?? null,
    [sessions, activeSessionId]
  );

  const runningCount = useMemo(
    () => sessions.filter((session) => session.status !== 'terminated').length,
    [sessions]
  );

  const terminatedCount = sessions.length - runningCount;

  async function spawnSession(session: Session, overrideShell?: string) {
    try {
      await pty.spawn({
        sessionId: session.id,
        shell: overrideShell ?? session.shell,
        cwd: session.cwd,
        env: { ...shellConfig.defaultEnv, ...session.env },
        cols: 120,
        rows: 32
      });
    } catch (error) {
      setStatus(session.id, 'terminated');
      console.error(error);
    }
  }

  useEffect(() => {
    async function ensureInitialSession() {
      if (sessions.length > 0) {
        return;
      }

      const fallbackShell = inferShell();
      const preferredShell = navigator.userAgent.toLowerCase().includes('windows')
        ? shellConfig.defaultShell.win32
        : shellConfig.defaultShell.darwin;
      const shell = preferredShell === 'custom' ? fallbackShell : preferredShell;

      const session = createSession(shell, DEFAULT_CWD);
      await spawnSession(session, shell);
    }

    void ensureInitialSession();
  }, [createSession, sessions.length, shellConfig.defaultShell.darwin, shellConfig.defaultShell.win32]);

  useEffect(() => {
    const onMouseMove = (event: MouseEvent) => {
      if (!dragTargetRef.current) {
        return;
      }

      if (dragTargetRef.current === 'left') {
        const next = clamp(event.clientX - 18, 220, 420);
        setSidebarWidth(next);
        return;
      }

      const next = clamp(window.innerWidth - event.clientX - 18, 360, 760);
      setRightPanelWidth(next);
    };

    const onMouseUp = () => {
      dragTargetRef.current = null;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  function beginResize(target: 'left' | 'right') {
    return (event: ReactMouseEvent<HTMLDivElement>) => {
      event.preventDefault();
      dragTargetRef.current = target;
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    };
  }

  async function handleCreateSession() {
    const fallbackShell = inferShell();
    const preferredShell = navigator.userAgent.toLowerCase().includes('windows')
      ? shellConfig.defaultShell.win32
      : shellConfig.defaultShell.darwin;
    const shell = preferredShell === 'custom' ? fallbackShell : preferredShell;

    const session = createSession(shell, DEFAULT_CWD);
    setActiveSession(session.id);
    await spawnSession(session, shell);
  }

  async function handleDuplicateSession(sessionId: string) {
    const duplicated = duplicateSession(sessionId);
    if (!duplicated) {
      return;
    }
    setActiveSession(duplicated.id);
    await spawnSession(duplicated);
  }

  async function handleKillSession(sessionId: string) {
    try {
      await pty.kill(sessionId);
    } catch (error) {
      console.error(error);
    } finally {
      setStatus(sessionId, 'terminated');
      if (activeSessionId === sessionId) {
        const next = sessions.find((session) => session.id !== sessionId && session.status !== 'terminated');
        if (next) {
          setActiveSession(next.id);
        }
      }
    }
  }

  function handleDismissSession(sessionId: string) {
    removeSession(sessionId);
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const isMeta = event.metaKey || event.ctrlKey;
      if (!isMeta) {
        return;
      }

      if (event.key.toLowerCase() === 't') {
        event.preventDefault();
        void handleCreateSession();
        return;
      }

      if (event.key.toLowerCase() === 'w') {
        if (activeSession && activeSession.status !== 'terminated') {
          event.preventDefault();
          void handleKillSession(activeSession.id);
        }
        return;
      }

      if (event.key === 'Tab') {
        const candidates = sessions.filter((session) => session.status !== 'terminated');
        if (candidates.length === 0) {
          return;
        }

        event.preventDefault();

        const currentIndex = candidates.findIndex((session) => session.id === activeSessionId);
        const direction = event.shiftKey ? -1 : 1;
        const nextIndex = currentIndex < 0
          ? 0
          : (currentIndex + direction + candidates.length) % candidates.length;

        setActiveSession(candidates[nextIndex].id);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeSession, activeSessionId, sessions, setActiveSession]);

  const repoPath = activeSession?.cwd ?? DEFAULT_CWD;
  const terminalOutput = activeSession ? output[activeSession.id] ?? [] : [];

  return (
    <main className="h-screen w-screen p-3 text-text-primary">
      <div className="fade-up flex h-full flex-col overflow-hidden rounded-2xl border border-default bg-surface-primary shadow-[0_18px_80px_rgba(1,5,18,0.65)] backdrop-blur-sm">
        <header className="flex h-14 items-center justify-between border-b border-default bg-surface-secondary px-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl border border-default bg-surface-elevated text-sm font-bold text-accent-primary">
              AI
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-[14px] font-semibold tracking-[0.02em]">{APP_NAME} Command Center</h1>
              <p className="truncate text-[11px] text-text-secondary">
                {activeSession
                  ? `${activeSession.label} (${activeSession.shell}) - ${activeSession.cwd}`
                  : 'No active session'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              className={`h-8 rounded-md border px-3 text-[11px] font-semibold ${rightView === 'git' ? 'border-[#2be3c2] bg-[#2be3c2]/15 text-[#a6fff0]' : 'border-default text-text-secondary hover:bg-surface-tertiary'}`}
              onClick={() => setRightView('git')}
            >
              Git Ops
            </button>
            <button
              className={`h-8 rounded-md border px-3 text-[11px] font-semibold ${rightView === 'dashboard' ? 'border-[#2be3c2] bg-[#2be3c2]/15 text-[#a6fff0]' : 'border-default text-text-secondary hover:bg-surface-tertiary'}`}
              onClick={() => setRightView('dashboard')}
            >
              Usage
            </button>
            <div className="hidden items-center gap-2 rounded-md border border-default bg-surface-tertiary px-2 py-1 text-[10px] text-text-secondary xl:flex">
              <span>{runningCount} live</span>
              <span className="text-text-tertiary">|</span>
              <span>{terminatedCount} closed</span>
            </div>
          </div>
        </header>

        <div className="min-h-0 flex-1 p-2">
          <div
            className="grid h-full min-h-0"
            style={{
              gridTemplateColumns: `${sidebarWidth}px 8px minmax(520px,1fr) 8px ${rightPanelWidth}px`
            }}
          >
            <section className="min-h-0 overflow-hidden rounded-xl border border-default bg-surface-secondary">
              <SessionSidebar
                sessions={sessions}
                activeSessionId={activeSessionId}
                activity={activity}
                onCreate={() => {
                  void handleCreateSession();
                }}
                onSelect={(sessionId) => setActiveSession(sessionId)}
                onRename={renameSession}
                onKill={(sessionId) => {
                  void handleKillSession(sessionId);
                }}
                onDuplicate={(sessionId) => {
                  void handleDuplicateSession(sessionId);
                }}
                onDismiss={handleDismissSession}
              />
            </section>

            <div
              className="group flex cursor-col-resize items-center justify-center"
              onMouseDown={beginResize('left')}
              role="separator"
              aria-label="Resize sidebar"
            >
              <div className="h-full w-[2px] rounded-full bg-[var(--border-default)] transition-colors group-hover:bg-[#2be3c2]" />
            </div>

            <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-default bg-surface-secondary">
              <TerminalToolbar
                session={activeSession}
                onNewSession={() => {
                  void handleCreateSession();
                }}
                onKillSession={() => {
                  if (activeSession && activeSession.status !== 'terminated') {
                    void handleKillSession(activeSession.id);
                  }
                }}
                onOpenSettings={() => setSettingsOpen(true)}
              />
              <div className="min-h-0 flex-1 bg-[#0a111e]">
                <TerminalPane
                  sessionId={activeSession?.id ?? null}
                  output={terminalOutput}
                  onInput={(value) => {
                    if (activeSession && activeSession.status !== 'terminated') {
                      void pty.write(activeSession.id, value);
                    }
                  }}
                  onResize={(cols, rows) => {
                    if (activeSession && activeSession.status !== 'terminated') {
                      void pty.resize(activeSession.id, cols, rows);
                    }
                  }}
                />
              </div>
            </section>

            <div
              className="group flex cursor-col-resize items-center justify-center"
              onMouseDown={beginResize('right')}
              role="separator"
              aria-label="Resize details panel"
            >
              <div className="h-full w-[2px] rounded-full bg-[var(--border-default)] transition-colors group-hover:bg-[#2be3c2]" />
            </div>

            <section className="min-h-0 overflow-hidden rounded-xl border border-default bg-surface-secondary">
              {rightView === 'git' ? <GitPanel repoPath={repoPath} /> : <UsageDashboard />}
            </section>
          </div>
        </div>
      </div>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </main>
  );
}
