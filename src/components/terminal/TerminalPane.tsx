import { useEffect, useRef } from 'react';
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
  const aliveRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current || terminalRef.current) {
      return;
    }

    const terminal = new Terminal({
      ...TERMINAL_OPTIONS,
      theme: TERMINAL_THEME
    });
    const fitAddon = createFitAddon();
    terminal.loadAddon(fitAddon);
    aliveRef.current = true;

    // Prefer WebGL renderer for high-throughput terminal output.
    // Loaded lazily to avoid hard runtime failures on unsupported WebViews.
    void import('@xterm/addon-webgl')
      .then(({ WebglAddon }) => {
        const webglAddon = new WebglAddon();
        terminal.loadAddon(webglAddon);
        webglAddon.onContextLoss(() => {
          // xterm falls back to software rendering when WebGL context is lost.
        });
      })
      .catch(() => {
        // Keep software renderer fallback when WebGL is unavailable.
      });

    terminal.open(containerRef.current);
    const safeFit = () => {
      if (!aliveRef.current || terminalRef.current !== terminal) {
        return;
      }
      const container = containerRef.current;
      if (!container) {
        return;
      }
      if (container.clientWidth < 8 || container.clientHeight < 8) {
        return;
      }
      try {
        fitAddon.fit();
      } catch {
        // Ignore transient renderer/measurement races during first paint.
      }
    };

    requestAnimationFrame(() => {
      safeFit();
      // Run once more to handle initial layout settling.
      requestAnimationFrame(safeFit);
    });

    terminal.onData((data) => {
      if (sessionId) {
        onInput(data);
      }
    });

    const resizeObserver = new ResizeObserver(() => {
      safeFit();
      if (sessionId && onResize) {
        onResize(terminal.cols, terminal.rows);
      }
    });

    resizeObserver.observe(containerRef.current);

    terminalRef.current = terminal;
    fitRef.current = fitAddon;

    return () => {
      aliveRef.current = false;
      resizeObserver.disconnect();
      terminal.dispose();
      terminalRef.current = null;
      fitRef.current = null;
    };
  }, [onInput, onResize, sessionId]);

  useEffect(() => {
    const terminal = terminalRef.current;
    if (!terminal) {
      return;
    }

    terminal.clear();
    outputLenRef.current = 0;
    if (output.length > 0) {
      terminal.write(output.join(''));
      outputLenRef.current = output.length;
    }
  }, [sessionId]);

  useEffect(() => {
    const terminal = terminalRef.current;
    if (!terminal) {
      return;
    }

    if (output.length < outputLenRef.current) {
      terminal.clear();
      terminal.write(output.join(''));
      outputLenRef.current = output.length;
      return;
    }

    const nextChunks = output.slice(outputLenRef.current);
    if (nextChunks.length > 0) {
      terminal.write(nextChunks.join(''));
      outputLenRef.current = output.length;
    }
  }, [output]);

  return <div ref={containerRef} className="h-full w-full bg-surface-primary" />;
}
