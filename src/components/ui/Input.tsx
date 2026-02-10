import type { InputHTMLAttributes } from 'react';

export function Input({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`h-8 w-full border border-default bg-surface-secondary px-2 text-xs text-text-primary outline-none placeholder:text-text-tertiary focus:border-[#059669] ${className}`}
      {...props}
    />
  );
}
