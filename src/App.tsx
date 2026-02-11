import { useEffect, useMemo, useState } from 'react';
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

export default function App() {
  const pty = usePty();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [rightView, setRightView] = useState<'git' | 'dashboard'>('git');
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
  }, [activeSession, activeSessionId, sessions]);

  const repoPath = activeSession?.cwd ?? DEFAULT_CWD;
  const terminalOutput = activeSession ? output[activeSession.id] ?? [] : [];

  return (
    <main className="h-screen w-screen bg-surface-primary text-text-primary">
      <div className="flex h-full flex-col">
        <header className="flex h-10 items-center border-b border-default bg-surface-secondary px-3">
          <h1 className="font-sans text-sm font-bold uppercase tracking-[0.06em]">{APP_NAME}</h1>
          <div className="ml-4 flex gap-2">
            <button
              className={`h-6 border px-2 text-[10px] uppercase tracking-[0.04em] ${rightView === 'git' ? 'border-[#10b981] text-[#10b981]' : 'border-default text-text-secondary'}`}
              onClick={() => setRightView('git')}
            >
              Git
            </button>
            <button
              className={`h-6 border px-2 text-[10px] uppercase tracking-[0.04em] ${rightView === 'dashboard' ? 'border-[#10b981] text-[#10b981]' : 'border-default text-text-secondary'}`}
              onClick={() => setRightView('dashboard')}
            >
              Dashboard
            </button>
          </div>
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-[240px_1fr_520px]">
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

          <section className="flex min-h-0 flex-col border-r border-default">
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
            <div className="min-h-0 flex-1">
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

          <section className="min-h-0">
            {rightView === 'git' ? <GitPanel repoPath={repoPath} /> : <UsageDashboard />}
          </section>
        </div>
      </div>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </main>
  );
}
