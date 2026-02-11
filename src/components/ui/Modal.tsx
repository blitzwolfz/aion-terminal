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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#02050c]/65 p-4 backdrop-blur-sm">
      <div className="fade-up w-[760px] max-w-[96vw] overflow-hidden rounded-xl border border-default bg-surface-secondary shadow-[0_20px_80px_rgba(3,8,20,0.65)]">
        <header className="flex h-12 items-center justify-between border-b border-default bg-surface-primary px-4">
          <h2 className="text-sm font-semibold tracking-[0.02em]">{title}</h2>
          <Button compact onClick={onClose}>Close</Button>
        </header>
        <section className="max-h-[72vh] overflow-auto p-4">{children}</section>
        {footer ? <footer className="border-t border-default bg-surface-primary p-3">{footer}</footer> : null}
      </div>
    </div>
  );
}
