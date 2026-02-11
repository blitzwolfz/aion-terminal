import type { PropsWithChildren, ReactNode } from 'react';
import { Button } from './Button';

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  footer?: ReactNode;
}

export function Modal({ open, title, onClose, footer, children }: PropsWithChildren<ModalProps>) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1A1A]/40 p-4">
      <div className="bauhaus-fade-in w-[760px] max-w-[96vw] overflow-hidden border-2 border-[var(--border-strong)] bg-[var(--surface-secondary)]">
        <header className="flex h-12 items-center justify-between border-b-2 border-[var(--border-strong)] bg-[var(--surface-primary)] px-4">
          <h2 className="font-display text-sm font-bold uppercase tracking-widest">{title}</h2>
          <Button compact onClick={onClose}>Close</Button>
        </header>
        <section className="max-h-[72vh] overflow-auto p-4">{children}</section>
        {footer ? <footer className="border-t-2 border-[var(--border-strong)] bg-[var(--surface-primary)] p-3">{footer}</footer> : null}
      </div>
    </div>
  );
}
