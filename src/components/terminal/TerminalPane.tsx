import { useEffect, useRef } from 'react';
import { Terminal } from 'xterm';
import 'xterm/css/xterm.css';
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
    terminal.open(containerRef.current);
    fitAddon.fit();

    terminal.onData((data) => {
      if (sessionId) {
        onInput(data);
      }
    });

    const resizeObserver = new ResizeObserver(() => {
      fitAddon.fit();
      if (sessionId && onResize) {
        onResize(terminal.cols, terminal.rows);
      }
    });

    resizeObserver.observe(containerRef.current);

    terminalRef.current = terminal;
    fitRef.current = fitAddon;

    return () => {
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
