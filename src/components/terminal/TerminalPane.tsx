import { useEffect, useRef, useCallback } from 'react';
import { Terminal } from '@xterm/xterm';
import '@xterm/xterm/css/xterm.css';
import { createFitAddon } from './FitAddon';
import { TERMINAL_OPTIONS, TERMINAL_THEME } from '@/lib/constants';

interface Props {
  sessionId: string | null;
  output: string[];
  onInput: (value: string) => void;
  onResize?: (cols: number, rows: number) => void;
}

export function TerminalPane({ sessionId, output, onInput, onResize }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const terminalRef = useRef<Terminal | null>(null);
  const fitRef = useRef<ReturnType<typeof createFitAddon> | null>(null);
  const outputLenRef = useRef(0);
  const sessionIdRef = useRef<string | null>(sessionId);
  const onInputRef = useRef(onInput);
  const onResizeRef = useRef(onResize);
  const fitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastColsRef = useRef(0);
  const lastRowsRef = useRef(0);

  onInputRef.current = onInput;
  onResizeRef.current = onResize;

  const debouncedFit = useCallback(() => {
    if (fitTimeoutRef.current) {
      clearTimeout(fitTimeoutRef.current);
    }
    fitTimeoutRef.current = setTimeout(() => {
      const terminal = terminalRef.current;
      const fitAddon = fitRef.current;
      const container = containerRef.current;
      if (!terminal || !fitAddon || !container) return;
      if (container.clientWidth < 8 || container.clientHeight < 8) return;

      try {
        fitAddon.fit();

        if (terminal.cols !== lastColsRef.current || terminal.rows !== lastRowsRef.current) {
          lastColsRef.current = terminal.cols;
          lastRowsRef.current = terminal.rows;
          if (sessionIdRef.current && onResizeRef.current) {
            onResizeRef.current(terminal.cols, terminal.rows);
          }
        }
      } catch {
        // Ignore transient renderer measurement races
      }
    }, 50);
  }, []);

  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || terminalRef.current) return;

    const terminal = new Terminal({
      ...TERMINAL_OPTIONS,
      theme: TERMINAL_THEME
    });
    const fitAddon = createFitAddon();
    terminal.loadAddon(fitAddon);

    void import('@xterm/addon-webgl')
      .then(({ WebglAddon }) => {
        if (!terminalRef.current) return;
        const webglAddon = new WebglAddon();
        terminal.loadAddon(webglAddon);
        webglAddon.onContextLoss(() => {
          webglAddon.dispose();
        });
      })
      .catch(() => {});

    terminal.open(container);

    requestAnimationFrame(() => {
      if (!terminalRef.current) return;
      try {
        fitAddon.fit();
        lastColsRef.current = terminal.cols;
        lastRowsRef.current = terminal.rows;
      } catch {}
      requestAnimationFrame(() => {
        if (!terminalRef.current) return;
        try {
          fitAddon.fit();
          lastColsRef.current = terminal.cols;
          lastRowsRef.current = terminal.rows;
        } catch {}
      });
    });

    terminal.onData((data) => {
      if (sessionIdRef.current) {
        onInputRef.current(data);
      }
    });

    const resizeObserver = new ResizeObserver(() => {
      debouncedFit();
    });
    resizeObserver.observe(container);

    terminalRef.current = terminal;
    fitRef.current = fitAddon;

    return () => {
      if (fitTimeoutRef.current) {
        clearTimeout(fitTimeoutRef.current);
      }
      resizeObserver.disconnect();
      terminal.dispose();
      terminalRef.current = null;
      fitRef.current = null;
    };
  }, [debouncedFit]);

  // On session switch: clear and replay stored output
  useEffect(() => {
    const terminal = terminalRef.current;
    if (!terminal) return;

    terminal.clear();
    terminal.reset();
    outputLenRef.current = 0;

    if (output.length > 0) {
      terminal.write(output.join(''));
      outputLenRef.current = output.length;
    }

    requestAnimationFrame(() => {
      debouncedFit();
    });
  }, [sessionId, debouncedFit]);

  // Incremental output writes
  useEffect(() => {
    const terminal = terminalRef.current;
    if (!terminal) return;

    if (output.length < outputLenRef.current) {
      terminal.clear();
      terminal.reset();
      terminal.write(output.join(''));
      outputLenRef.current = output.length;
      return;
    }

    const newStart = outputLenRef.current;
    if (output.length > newStart) {
      const newChunks = output.slice(newStart);
      terminal.write(newChunks.join(''));
      outputLenRef.current = output.length;
    }
  }, [output]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full"
      style={{ background: TERMINAL_THEME.background }}
    />
  );
}
