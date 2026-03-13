import type { ReactNode } from 'react';

type BadgeVariant = 'success' | 'danger' | 'warning' | 'info' | 'neutral' | 'cyan' | 'gold' | 'violet';

const VARIANT_STYLES: Record<BadgeVariant, string> = {
  success: 'bg-up/15 text-up border-up/30',
  danger: 'bg-down/15 text-down border-down/30',
  warning: 'bg-warning/15 text-warning border-warning/30',
  info: 'bg-info/15 text-info border-info/30',
  neutral: 'bg-bg-tertiary text-text-secondary border-border',
  cyan: 'bg-accent-cyan/15 text-accent-cyan border-accent-cyan/30',
  gold: 'bg-accent-gold/15 text-accent-gold border-accent-gold/30',
  violet: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
};

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export function Badge({ children, variant = 'neutral', className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border ${VARIANT_STYLES[variant]} ${className}`}>
      {children}
    </span>
  );
}
