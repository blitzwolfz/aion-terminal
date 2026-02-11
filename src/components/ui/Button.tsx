import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  compact?: boolean;
}

const variantClass: Record<Variant, string> = {
  primary: 'border-[var(--accent-deep)] bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-hover)]',
  secondary: 'border-[var(--border-default)] bg-[var(--surface-elevated)] text-[var(--text-primary)] hover:bg-[var(--surface-tertiary)]',
  danger: 'border-[#DC2626] bg-[#FEE2E2] text-[#991B1B] hover:bg-[#FECACA]',
  ghost: 'border-transparent bg-transparent text-[var(--text-secondary)] hover:bg-[var(--surface-tertiary)] hover:text-[var(--text-primary)]'
};

export function Button({
  children,
  className = '',
  variant = 'secondary',
  compact = false,
  ...props
}: PropsWithChildren<Props>) {
  const height = compact ? 'h-7 px-2.5 text-[11px]' : 'h-8 px-3 text-xs';

  return (
    <button
      className={`inline-flex items-center justify-center border font-semibold tracking-wide uppercase transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${height} ${variantClass[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
