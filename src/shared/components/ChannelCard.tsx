import type { ReactNode } from 'react';
import { StatusBadge } from './StatusBadge';

interface ChannelCardProps {
  icon: ReactNode;
  iconBg: string;
  name: string;
  status: string;
  badgeVariant: 'success' | 'warning' | 'muted';
  badgeText: string;
  locked?: boolean;
}

export function ChannelCard({ icon, iconBg, name, status, badgeVariant, badgeText, locked }: ChannelCardProps) {
  return (
    <div className={`flex items-center gap-4 p-5 rounded-xl bg-glass-1 border border-border-subtle transition-all duration-150 cursor-pointer ${
      locked ? 'opacity-45' : 'hover:border-border-medium'
    }`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-base font-bold text-text-primary">{name}</div>
        <div className="text-sm text-text-muted mt-0.5">{status}</div>
      </div>
      <StatusBadge variant={badgeVariant}>{badgeText}</StatusBadge>
    </div>
  );
}
