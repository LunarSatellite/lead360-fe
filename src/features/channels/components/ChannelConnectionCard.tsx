import { useState } from 'react';
import {
  Phone,
  MessageCircle,
  Camera,
  Send,
  MessageSquare,
  PhoneCall,
  Globe,
  Mail,
  Power,
  PowerOff,
  Trash2,
  Loader2,
  // ExternalLink,
  // Copy,
  // Check,
  Settings,
  Vibrate,
} from 'lucide-react';
import { useActivateChannel, useDeactivateChannel, useDeleteChannel } from '../api/channels.queries';
import {
  ChannelConnectionStatus,
  CHANNEL_STATUS_LABEL,
  CHANNEL_TYPE_LABEL,
  CHANNEL_TYPE_COLOR,
} from '../types/channels.types';
import type { ChannelConnectionDto, ChannelTypeValue } from '../types/channels.types';
import { formatDistanceToNow } from 'date-fns';

/* ═══ ICON + COLOR MAPS ═══ */

const ICON_MAP: Record<ChannelTypeValue, typeof Phone> = {
  1: Phone,
  2: MessageCircle,
  3: Camera,
  4: Send,
  5: MessageSquare,
  6: PhoneCall,
  7: Globe,
  8: Mail,
  9: Vibrate,
};

const BRAND_COLOR_MAP: Record<ChannelTypeValue, string> = {
  1: '#25D366',
  2: '#0084FF',
  3: '#E1306C',
  4: '#2AABEE',
  5: '#6B7280',
  6: '#6B7280',
  7: '#00D97E',
  8: '#A78BFA',
  9: '#6650DF',
};

const BRAND_BG_MAP: Record<ChannelTypeValue, string> = {
  1: 'rgba(37,211,102,0.06)',
  2: 'rgba(0,132,255,0.06)',
  3: 'rgba(225,48,108,0.06)',
  4: 'rgba(42,171,238,0.06)',
  5: 'rgba(107,114,128,0.04)',
  6: 'rgba(107,114,128,0.04)',
  7: 'rgba(0,217,126,0.06)',
  8: 'rgba(167,139,250,0.06)',
  9: 'rgba(102,80,223,0.06)',
};

const BRAND_BORDER_MAP: Record<ChannelTypeValue, string> = {
  1: 'rgba(37,211,102,0.1)',
  2: 'rgba(0,132,255,0.1)',
  3: 'rgba(225,48,108,0.1)',
  4: 'rgba(42,171,238,0.1)',
  5: 'rgba(107,114,128,0.06)',
  6: 'rgba(107,114,128,0.06)',
  7: 'rgba(0,217,126,0.1)',
  8: 'rgba(167,139,250,0.1)',
  9: 'rgba(102,80,223,0.1)',
};

/* ═══ MAIN COMPONENT ═══ */

interface ChannelConnectionCardProps {
  connection: ChannelConnectionDto;
  variant?: 'hero' | 'medium' | 'bar';
}

export function ChannelConnectionCard({ connection, variant = 'medium' }: ChannelConnectionCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const activate = useActivateChannel();
  const deactivate = useDeactivateChannel();
  const remove = useDeleteChannel();

  const Icon = ICON_MAP[connection.channelType] ?? Globe;
  const brandColor = BRAND_COLOR_MAP[connection.channelType] || '#708A7E';
  const brandBg = BRAND_BG_MAP[connection.channelType] || 'rgba(112,138,126,0.04)';
  const brandBorder = BRAND_BORDER_MAP[connection.channelType] || 'rgba(112,138,126,0.06)';
  const typeLabel = CHANNEL_TYPE_LABEL[connection.channelType];
  const isActive = connection.status === ChannelConnectionStatus.Active;
  const isToggling = activate.isPending || deactivate.isPending;

  const handleToggle = () => {
    if (isActive) deactivate.mutate(connection.id);
    else activate.mutate(connection.id);
  };

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }
    remove.mutate(connection.id);
  };

  const lastActive = connection.lastMessageReceivedAt
    ? formatDistanceToNow(new Date(connection.lastMessageReceivedAt), { addSuffix: true })
    : null;

  /* ─── Actions row (shared) ─── */
  const Actions = ({ compact = false }: { compact?: boolean }) => (
    <div className="flex gap-[5px]">
      <button
        className="flex-1 flex items-center justify-center gap-1.5 py-[6px] px-3 rounded-[7px]
                   bg-bg-card border border-border-subtle text-2xs font-medium text-text-secondary
                   hover:border-glass-3 hover:text-text-primary transition-all"
      >
        <Settings className="w-3 h-3" strokeWidth={1.5} />
        {!compact && 'Configure'}
      </button>
      {isActive ? (
        <button
          onClick={handleToggle}
          disabled={isToggling}
          className="flex items-center justify-center gap-1.5 py-[6px] px-3 rounded-[7px]
                     bg-[rgba(245,158,11,0.04)] border border-[rgba(245,158,11,0.08)]
                     text-2xs font-medium text-warning
                     hover:bg-[rgba(245,158,11,0.08)] disabled:opacity-40 transition-all"
        >
          {isToggling ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <PowerOff className="w-3 h-3" strokeWidth={1.5} />
          )}
          {!compact && 'Deactivate'}
        </button>
      ) : (
        <button
          onClick={handleToggle}
          disabled={isToggling}
          className="flex items-center justify-center gap-1.5 py-[6px] px-3 rounded-[7px]
                     bg-[rgba(16,185,129,0.04)] border border-[rgba(16,185,129,0.1)]
                     text-2xs font-medium text-success
                     hover:bg-[rgba(16,185,129,0.08)] disabled:opacity-40 transition-all"
        >
          {isToggling ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Power className="w-3 h-3" strokeWidth={1.5} />
          )}
          {!compact && 'Activate'}
        </button>
      )}
      <button
        onClick={handleDelete}
        disabled={remove.isPending}
        className={`flex items-center justify-center gap-1 py-[6px] px-3 rounded-[7px]
                   text-2xs font-medium transition-all disabled:opacity-40 ${
                     confirmDelete
                       ? 'bg-danger-soft border border-[rgba(244,63,94,0.15)] text-danger'
                       : 'text-danger hover:bg-danger-soft'
                   }`}
      >
        {remove.isPending ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <Trash2 className="w-3 h-3" strokeWidth={1.5} />
        )}
        {confirmDelete && !compact && 'Confirm?'}
        {!confirmDelete && !compact && 'Del'}
      </button>
    </div>
  );

  /* ─── Toggle switch ─── */
  const Toggle = () => (
    <button
      onClick={handleToggle}
      disabled={isToggling}
      className={`
        relative w-9 h-5 rounded-full transition-colors shrink-0 disabled:opacity-40
        ${isActive ? 'bg-brand' : 'bg-glass-3'}
      `}
    >
      <div
        className={`
          absolute top-[2px] w-4 h-4 rounded-full transition-all
          ${isActive ? 'left-[18px] bg-bg' : 'left-[2px] bg-text-muted'}
        `}
      />
    </button>
  );

  /* ═══ HERO VARIANT ═══ */
  if (variant === 'hero') {
    return (
      <div
        className="rounded-[14px] bg-bg-card border border-border-subtle overflow-hidden
                      hover:border-glass-3 transition-all relative"
      >
        {/* Top brand bar */}
        <div
          className="h-[3px]"
          style={{ background: `linear-gradient(90deg, ${brandColor}, ${brandColor}90)` }}
        />

        <div className="p-5 flex gap-5">
          {/* Left: info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-11 h-11 rounded-[13px] flex items-center justify-center shrink-0 border"
                style={{ background: brandBg, borderColor: brandBorder }}
              >
                <Icon className="w-5 h-5" style={{ color: brandColor }} strokeWidth={1.5} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-base font-bold text-text-primary">
                  {connection.displayName || typeLabel}
                </div>
                <div className="text-2xs text-text-muted font-mono truncate">
                  {connection.channelIdentifier}
                </div>
              </div>
              <Toggle />
            </div>

            {/* Big number */}
            <div className="text-[36px] font-bold text-text-primary tracking-tight leading-none">
              {/* Placeholder — real data would come from stats */}—
            </div>
            <div className="text-xs text-text-muted mt-1 mb-4">messages today</div>

            {/* Sparkline placeholder */}
            <div className="flex items-end gap-[2px] h-7 mb-4">
              {[25, 40, 30, 55, 65, 50, 80, 70, 90, 100, 85].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-sm"
                  style={{
                    height: `${h}%`,
                    background: i >= 8 ? `${brandColor}${i === 10 ? '' : '60'}` : '#111916',
                  }}
                />
              ))}
            </div>

            <Actions />
          </div>

          {/* Right: ring gauge */}
          <div className="flex flex-col items-center justify-center w-24 shrink-0">
            <div className="relative w-[72px] h-[72px]">
              <svg viewBox="0 0 72 72" className="-rotate-90">
                <circle cx="36" cy="36" r="30" fill="none" stroke="#111916" strokeWidth="4" />
                <circle
                  cx="36"
                  cy="36"
                  r="30"
                  fill="none"
                  stroke={brandColor}
                  strokeWidth="4"
                  strokeDasharray="189"
                  strokeDashoffset="4"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-base font-bold text-text-primary">—</span>
                <span className="text-2xs text-text-muted">health</span>
              </div>
            </div>
            {lastActive && <div className="text-2xs text-text-muted mt-2 text-center">{lastActive}</div>}
          </div>
        </div>
      </div>
    );
  }

  /* ═══ MEDIUM VARIANT ═══ */
  if (variant === 'medium') {
    return (
      <div
        className="rounded-[14px] bg-bg-card border border-border-subtle overflow-hidden
                      hover:border-glass-3 transition-all relative h-full"
      >
        <div className="h-[3px]" style={{ background: brandColor }} />
        <div className="p-[18px]">
          <div className="flex items-center gap-[9px] mb-3">
            <div
              className="w-9 h-9 rounded-[11px] flex items-center justify-center shrink-0 border"
              style={{ background: brandBg, borderColor: brandBorder }}
            >
              <Icon className="w-[17px] h-[17px]" style={{ color: brandColor }} strokeWidth={1.5} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-text-primary truncate">
                {connection.displayName || typeLabel}
              </div>
              <div className="text-2xs text-text-muted font-mono truncate">
                {connection.channelIdentifier}
              </div>
            </div>
            <Toggle />
          </div>

          <div className="flex items-baseline gap-[5px] mb-1">
            <span className="text-2xl font-bold text-text-primary tracking-tight">—</span>
            <span className="text-xs text-text-muted">msgs/d</span>
          </div>

          <div className="flex gap-3 mb-3">
            {lastActive && <span className="text-xs text-text-secondary">{lastActive}</span>}
          </div>

          <Actions />
        </div>
      </div>
    );
  }

  /* ═══ BAR VARIANT (paused/inactive) ═══ */
  return (
    <div
      className={`rounded-[14px] bg-bg-card border border-border-subtle overflow-hidden
                  hover:border-glass-3 transition-all flex items-center gap-4 px-[18px] py-[14px]
                  ${!isActive ? 'opacity-55' : ''}`}
    >
      {/* Brand bar */}
      <div
        className="w-1 h-8 rounded-sm shrink-0"
        style={{ background: isActive ? brandColor : '#708A7E' }}
      />

      {/* Icon */}
      <div
        className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center shrink-0"
        style={{ background: isActive ? brandBg : 'rgba(112,138,126,0.04)' }}
      >
        <Icon
          className="w-[15px] h-[15px]"
          style={{ color: isActive ? brandColor : '#708A7E' }}
          strokeWidth={1.5}
        />
      </div>

      {/* Name */}
      <div className="min-w-[100px]">
        <div className={`text-sm font-semibold ${isActive ? 'text-text-primary' : 'text-text-secondary'}`}>
          {connection.displayName || typeLabel}
        </div>
        <div className="text-2xs text-text-muted font-mono truncate">{connection.channelIdentifier}</div>
      </div>

      {/* Toggle */}
      <Toggle />

      {/* Status */}
      <span className={`text-xs font-medium shrink-0 ${isActive ? 'text-success' : 'text-warning'}`}>
        {CHANNEL_STATUS_LABEL[connection.status]}
      </span>

      {/* Last active */}
      {lastActive && <span className="text-xs text-text-muted shrink-0">Last active {lastActive}</span>}

      {/* Actions pushed right */}
      <div className="ml-auto">
        <Actions compact />
      </div>
    </div>
  );
}
