import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  compact?: boolean;
}

const variantClass: Record<Variant, string> = {
  primary: 'border-transparent bg-accent-primary text-[#032f2e] hover:bg-[#2be3c2]',
  secondary: 'border-default bg-surface-tertiary text-text-primary hover:bg-surface-elevated',
  danger: 'border-transparent bg-[#6b1c26] text-[#ffd6dc] hover:bg-[#8f2632]',
  ghost: 'border border-transparent bg-transparent text-text-secondary hover:border-default hover:bg-surface-tertiary hover:text-text-primary'
};

export function Button({
  children,
  className = '',
  variant = 'secondary',
  compact = false,
  ...props
}: PropsWithChildren<Props>) {
  const height = compact ? 'h-7 px-2.5 text-[11px]' : 'h-9 px-3 text-xs';

  return (
    <button
      className={`inline-flex items-center justify-center rounded-md border font-semibold tracking-[0.015em] transition-all disabled:cursor-not-allowed disabled:opacity-50 ${height} ${variantClass[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
