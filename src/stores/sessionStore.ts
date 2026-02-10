import { create } from 'zustand';
import type { AgentType, Session, SessionStatus, ShellType } from '@/lib/types';

interface SessionState {
  sessions: Session[];
  activeSessionId: string | null;
  output: Record<string, string[]>;
  activity: Record<string, boolean>;
  createSession: (shell: ShellType, cwd: string) => Session;
  duplicateSession: (sessionId: string) => Session | null;
  setActiveSession: (sessionId: string) => void;
  renameSession: (sessionId: string, label: string) => void;
  removeSession: (sessionId: string) => void;
  reorderSessions: (fromIndex: number, toIndex: number) => void;
  setStatus: (sessionId: string, status: SessionStatus) => void;
  setAgent: (sessionId: string, agent: AgentType) => void;
  setActivity: (sessionId: string, active: boolean) => void;
  appendOutput: (sessionId: string, chunk: string) => void;
  clearOutput: (sessionId: string) => void;
}

function createSessionLabel(index: number) {
  return `Session ${index}`;
}

function makeId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `session-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  sessions: [],
  activeSessionId: null,
  output: {},
  activity: {},
  createSession: (shell, cwd) => {
    const session: Session = {
      id: makeId(),
      label: createSessionLabel(get().sessions.length + 1),
      shell,
      cwd,
      agent: null,
      status: 'idle',
      createdAt: Date.now(),
      env: {}
    };

    set((state) => ({
      sessions: [...state.sessions, session],
      activeSessionId: state.activeSessionId ?? session.id,
      output: { ...state.output, [session.id]: [] },
      activity: { ...state.activity, [session.id]: false }
    }));

    return session;
  },
  duplicateSession: (sessionId) => {
    const base = get().sessions.find((session) => session.id === sessionId);
    if (!base) {
      return null;
    }

    const session: Session = {
      id: makeId(),
      label: `${base.label} Copy`,
      shell: base.shell,
      cwd: base.cwd,
      agent: base.agent,
      status: 'idle',
      createdAt: Date.now(),
      env: { ...base.env }
    };

    set((state) => ({
      sessions: [...state.sessions, session],
      activeSessionId: session.id,
      output: { ...state.output, [session.id]: [] },
      activity: { ...state.activity, [session.id]: false }
    }));

    return session;
  },
  setActiveSession: (sessionId) => {
    set((state) => ({
      activeSessionId: sessionId,
      activity: { ...state.activity, [sessionId]: false }
    }));
  },
  renameSession: (sessionId, label) => {
    set((state) => ({
      sessions: state.sessions.map((session) =>
        session.id === sessionId ? { ...session, label } : session
      )
    }));
  },
  removeSession: (sessionId) => {
    set((state) => {
      const sessions = state.sessions.filter((session) => session.id !== sessionId);
      const nextActive = state.activeSessionId === sessionId ? sessions[0]?.id ?? null : state.activeSessionId;
      const { [sessionId]: _removedOut, ...nextOutput } = state.output;
      const { [sessionId]: _removedActivity, ...nextActivity } = state.activity;
      return {
        sessions,
        activeSessionId: nextActive,
        output: nextOutput,
        activity: nextActivity
      };
    });
  },
  reorderSessions: (fromIndex, toIndex) => {
    set((state) => {
      const next = [...state.sessions];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return { sessions: next };
    });
  },
  setStatus: (sessionId, status) => {
    set((state) => ({
      sessions: state.sessions.map((session) =>
        session.id === sessionId ? { ...session, status } : session
      )
    }));
  },
  setAgent: (sessionId, agent) => {
    set((state) => ({
      sessions: state.sessions.map((session) => {
        if (session.id !== sessionId) {
          return session;
        }

        const defaultLabel = /^Session\\s+\\d+$/i.test(session.label);
        if (!defaultLabel || !agent) {
          return { ...session, agent };
        }

        const cwdLabel = session.cwd.split('/').filter(Boolean).pop() ?? 'workspace';
        const agentLabel = agent === 'claude-code' ? 'Claude Code' : 'Copilot CLI';
        return { ...session, agent, label: `${agentLabel} — ${cwdLabel}` };
      })
    }));
  },
  setActivity: (sessionId, active) => {
    set((state) => ({
      activity: { ...state.activity, [sessionId]: active }
    }));
  },
  appendOutput: (sessionId, chunk) => {
    set((state) => {
      const current = state.output[sessionId] ?? [];
      const nextOutput = [...current, chunk].slice(-5000);
      return {
        output: {
          ...state.output,
          [sessionId]: nextOutput
        },
        activity: {
          ...state.activity,
          [sessionId]: sessionId === state.activeSessionId ? false : true
        }
      };
    });
  },
  clearOutput: (sessionId) => {
    set((state) => ({ output: { ...state.output, [sessionId]: [] } }));
  }
}));
