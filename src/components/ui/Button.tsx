import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  compact?: boolean;
}

const variantClass: Record<Variant, string> = {
  primary: 'bg-accent-primary text-text-primary hover:bg-[#047857] border-transparent',
  secondary: 'bg-surface-tertiary text-text-primary hover:bg-[#4b5563] border-default',
  danger: 'bg-[#7f1d1d] text-text-primary hover:bg-[#991b1b] border-transparent',
  ghost: 'bg-transparent text-text-secondary hover:text-text-primary border-default'
};

export function Button({
  children,
  className = '',
  variant = 'secondary',
  compact = false,
  ...props
}: PropsWithChildren<Props>) {
  const height = compact ? 'h-6 px-2 text-[11px]' : 'h-8 px-3 text-xs';

  return (
    <button
      className={`inline-flex items-center justify-center border font-medium uppercase tracking-[0.04em] transition-colors ${height} ${variantClass[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
