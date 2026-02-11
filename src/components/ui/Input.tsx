import type { InputHTMLAttributes } from 'react';

export function Input({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`h-9 w-full rounded-md border border-default bg-surface-secondary px-3 text-xs text-text-primary outline-none placeholder:text-text-tertiary focus:border-[#2be3c2] focus:ring-1 focus:ring-[#2be3c2]/30 ${className}`}
      {...props}
    />
  );
}
