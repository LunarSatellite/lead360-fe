import type { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  id?: string;
}

export function GlassCard({ children, className = '', id }: GlassCardProps) {
  return (
    <div
      id={id}
      className={`bg-bg-card border border-border-subtle rounded-2xl overflow-hidden ${className}`}
    >
      {children}
    </div>
  );
}

interface GlassCardHeaderProps {
  title: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export function GlassCardHeader({ title, icon, action }: GlassCardHeaderProps) {
  return (
    <div className="flex items-center justify-between px-6 py-5 border-b border-b-border-subtle">
      <div className="flex items-center gap-3 text-base font-bold text-text-primary">
        {icon && <span className="opacity-50">{icon}</span>}
        {title}
      </div>
      {action && (
        <span className="text-sm text-brand font-semibold cursor-pointer hover:text-brand-light transition-colors">
          {action}
        </span>
      )}
    </div>
  );
}
