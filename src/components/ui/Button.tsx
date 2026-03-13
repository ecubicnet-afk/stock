import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md';

const VARIANT_STYLES: Record<ButtonVariant, string> = {
  primary: 'bg-accent-cyan/20 text-accent-cyan hover:bg-accent-cyan/30 border-accent-cyan/30',
  secondary: 'bg-bg-card text-text-secondary hover:text-text-primary hover:bg-bg-tertiary border-border',
  ghost: 'bg-transparent text-text-secondary hover:text-text-primary hover:bg-bg-tertiary border-transparent',
  danger: 'bg-down/20 text-down hover:bg-down/30 border-down/30',
};

const SIZE_STYLES: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  children: ReactNode;
}

export function Button({ variant = 'primary', size = 'md', icon, children, className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center gap-1.5 font-medium rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${VARIANT_STYLES[variant]} ${SIZE_STYLES[size]} ${className}`}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
