import { useEffect, useMemo } from 'react';
import { ptyKill, ptyResize, ptySpawn, ptyWrite, onPtyData, onPtyExit } from '@/lib/ipc';
import { useSessionStore } from '@/stores/sessionStore';

const decoder = new TextDecoder();
const encoder = new TextEncoder();

export function usePty() {
  const appendOutput = useSessionStore((state) => state.appendOutput);
  const setStatus = useSessionStore((state) => state.setStatus);
  const setAgent = useSessionStore((state) => state.setAgent);

  useEffect(() => {
    let unlistenData: (() => void) | undefined;
    let unlistenExit: (() => void) | undefined;

    void onPtyData((payload) => {
      const data = decoder.decode(Uint8Array.from(payload.data));
      appendOutput(payload.session_id, data);
      setStatus(payload.session_id, 'running');

      const normalized = data.toLowerCase();
      if (normalized.includes('claude code') || normalized.includes('/cost')) {
        setAgent(payload.session_id, 'claude-code');
      } else if (normalized.includes('copilot') || normalized.includes('github copilot')) {
        setAgent(payload.session_id, 'copilot-cli');
      }
    }).then((fn) => {
      unlistenData = fn;
    });

    void onPtyExit((payload) => {
      setStatus(payload.session_id, 'terminated');
    }).then((fn) => {
      unlistenExit = fn;
    });

    return () => {
      if (unlistenData) {
        unlistenData();
      }
      if (unlistenExit) {
        unlistenExit();
      }
    };
  }, [appendOutput, setAgent, setStatus]);

  return useMemo(
    () => ({
      spawn: (params: {
        sessionId: string;
        shell?: string;
        cwd?: string;
        env?: Record<string, string>;
        cols?: number;
        rows?: number;
      }) =>
        ptySpawn({
          ...params,
          cols: params.cols ?? 120,
          rows: params.rows ?? 32
        }),
      write: (sessionId: string, input: string) => ptyWrite(sessionId, encoder.encode(input)),
      resize: (sessionId: string, cols: number, rows: number) => ptyResize(sessionId, cols, rows),
      kill: (sessionId: string) => ptyKill(sessionId)
    }),
    []
  );
}
