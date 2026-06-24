import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Bell, Loader2, Check } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useMarkRead, useMarkAllRead } from '../api/crm.queries';
import { crmApi } from '../api/crm.api';

// ─── Skeleton loader ──────────────────────────────────────────────────────────
function SkeletonLine({ width }: { width: string }) {
  return <div className={`h-3 bg-bg-elevated rounded-full animate-pulse ${width}`} />;
}

// ─── Notification item ────────────────────────────────────────────────────────
function NotificationItem({
  id,
  title,
  body,
  isRead,
  createdAt,
  relatedLeadId,
  onMarkRead,
}: {
  id: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  relatedLeadId: string | null;
  onMarkRead: (id: string) => void;
}) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (!isRead) onMarkRead(id);
    if (relatedLeadId) {
      navigate(`/dashboard/crm/leads/${relatedLeadId}`);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-bg-elevated transition-colors ${
        !isRead ? 'bg-brand-soft' : ''
      }`}
    >
      {/* Unread dot */}
      <span
        className={`mt-1.5 shrink-0 w-2 h-2 rounded-full ${
          !isRead ? 'bg-brand' : 'bg-transparent'
        }`}
      />
      <div className="flex-1 min-w-0 space-y-0.5">
        <p className="text-sm font-medium text-text-primary truncate">{title}</p>
        <p className="text-xs text-text-muted line-clamp-2 leading-relaxed">{body}</p>
        <p className="text-xs text-text-muted mt-1">
          {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
        </p>
      </div>
    </button>
  );
}

// ─── NotificationBell ─────────────────────────────────────────────────────────
export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Use useQuery directly so we can pass refetchInterval without changing crm.queries.ts
  const { data, isLoading } = useQuery({
    queryKey: ['crm', 'notifications', 1],
    queryFn: () => crmApi.getNotifications(1),
    refetchInterval: 30_000,
  });

  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();

  const notifications = (data as any)?.items ?? [];
  const unreadCount = notifications.filter((n: any) => !n.isRead).length;
  const badgeLabel = unreadCount > 9 ? '9+' : unreadCount > 0 ? String(unreadCount) : null;

  // Close on outside click
  useEffect(() => {
    if (!open) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      {/* Bell button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {badgeLabel && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-bold text-white bg-danger rounded-full leading-none">
            {badgeLabel}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-bg-card border border-border-subtle rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
            <span className="text-sm font-semibold text-text-primary">Notifications</span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllRead.mutate()}
                disabled={markAllRead.isPending}
                className="flex items-center gap-1.5 text-xs font-medium text-text-secondary hover:text-text-primary transition-colors disabled:opacity-60"
              >
                {markAllRead.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                Mark all read
              </button>
            )}
          </div>

          {/* Body */}
          <div className="divide-y divide-border-subtle">
            {isLoading ? (
              // Skeleton — 3 lines
              <div className="px-4 py-3 space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="mt-1.5 w-2 h-2 rounded-full bg-bg-elevated shrink-0" />
                    <div className="flex-1 space-y-2">
                      <SkeletonLine width="w-3/4" />
                      <SkeletonLine width="w-full" />
                      <SkeletonLine width="w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-sm text-text-muted">No notifications</p>
              </div>
            ) : (
              notifications.slice(0, 5).map((n: any) => (
                <NotificationItem
                  key={n.id}
                  id={n.id}
                  title={n.title}
                  body={n.body}
                  isRead={n.isRead}
                  createdAt={n.createdAt}
                  relatedLeadId={n.relatedLeadId}
                  onMarkRead={(id) => markRead.mutate(id)}
                />
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-border-subtle text-center">
            <button
              type="button"
              className="text-xs text-text-muted hover:text-text-secondary transition-colors"
            >
              View all
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
