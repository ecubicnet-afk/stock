import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export function Card({ children, className = '', hover = false }: CardProps) {
  return (
    <div
      className={`bg-bg-card border border-border rounded-xl p-4 shadow-[var(--shadow-card)] ${
        hover ? 'hover:shadow-[var(--shadow-card-hover)] transition-all' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  icon?: ReactNode;
  action?: ReactNode;
  accentColor?: string;
}

export function CardHeader({ title, icon, action, accentColor = 'text-accent-cyan' }: CardHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className={`text-sm font-semibold ${accentColor} flex items-center gap-2`}>
        {icon}
        {title}
      </h2>
      {action}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  change?: string;
  changeType?: 'up' | 'down' | 'neutral';
  className?: string;
}

export function StatCard({ label, value, change, changeType = 'neutral', className = '' }: StatCardProps) {
  const changeColor = changeType === 'up' ? 'text-up' : changeType === 'down' ? 'text-down' : 'text-text-secondary';
  return (
    <div className={`bg-bg-card border border-border rounded-xl p-4 shadow-[var(--shadow-card)] ${className}`}>
      <div className="text-xs text-text-secondary mb-1">{label}</div>
      <div className="font-mono text-lg font-semibold text-text-primary">{value}</div>
      {change && (
        <div className={`text-xs font-mono mt-1 ${changeColor}`}>{change}</div>
      )}
    </div>
  );
}
