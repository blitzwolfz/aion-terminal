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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-[680px] max-w-[95vw] border border-default bg-surface-secondary">
        <header className="flex h-10 items-center justify-between border-b border-default px-3">
          <h2 className="font-sans text-sm font-semibold uppercase tracking-[0.04em]">{title}</h2>
          <Button compact onClick={onClose}>Close</Button>
        </header>
        <section className="max-h-[70vh] overflow-auto p-4">{children}</section>
        {footer ? <footer className="border-t border-default p-3">{footer}</footer> : null}
      </div>
    </div>
  );
}
