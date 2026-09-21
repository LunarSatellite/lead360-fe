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

// Height of a single row — kept fixed so exactly 5 rows are visible before scrolling.
const ROW_HEIGHT = 92;

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
      style={{ height: ROW_HEIGHT }}
      className={`relative w-full text-left px-4 py-3 flex items-start gap-3 shrink-0 transition-colors ${
        !isRead ? 'bg-brand-soft hover:bg-brand-soft/70' : 'hover:bg-glass-2'
      }`}
    >
      {/* Unread accent bar */}
      {!isRead && <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-brand" />}

      <span className="mt-0.5 shrink-0 w-1.5 h-1.5 rounded-full bg-brand" style={{ visibility: isRead ? 'hidden' : 'visible' }} />

      <div className="flex-1 min-w-0 space-y-0.5">
        <p className={`text-sm truncate ${!isRead ? 'font-bold text-text-primary' : 'font-medium text-text-secondary'}`}>
          {title}
        </p>
        <p className="text-xs text-text-muted line-clamp-2 leading-relaxed">{body}</p>
        <p className="text-[10px] font-semibold text-text-muted/80 mt-1 uppercase tracking-wide">
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
        className="relative w-9 h-9 flex items-center justify-center rounded-sm text-text-secondary hover:text-text-primary hover:bg-glass-2 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4" strokeWidth={1.6} />
        {badgeLabel && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 flex items-center justify-center text-[10px] font-bold text-white bg-danger rounded-full leading-none">
            {badgeLabel}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute left-1/2 top-full mt-2 -translate-x-1/2 w-96 bg-bg-elevated border-thin border-border-subtle rounded-card z-50 overflow-hidden shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-thin border-border-subtle">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-text-primary">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-xs text-[10px] font-bold bg-brand-soft text-brand border-thin border-border-glow">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllRead.mutate()}
                disabled={markAllRead.isPending}
                className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors disabled:opacity-60"
              >
                {markAllRead.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={1.8} />
                ) : (
                  <Check className="w-3.5 h-3.5" strokeWidth={1.8} />
                )}
                Mark all read
              </button>
            )}
          </div>

          {/* Body — fixed row height so exactly 5 notifications are fully visible before scrolling */}
          <div
            className="divide-y divide-border-subtle overflow-y-auto"
            style={{ maxHeight: notifications.length > 5 ? ROW_HEIGHT * 5 : undefined }}
          >
            {isLoading ? (
              <div className="px-4 py-3 space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="mt-1.5 w-2 h-2 rounded-full bg-glass-2 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <SkeletonLine width="w-3/4" />
                      <SkeletonLine width="w-full" />
                      <SkeletonLine width="w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-12 flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-sm bg-glass-1 border-thin border-border-subtle flex items-center justify-center">
                  <Bell className="w-4 h-4 text-text-muted" strokeWidth={1.6} />
                </div>
                <p className="text-sm text-text-muted">No notifications</p>
              </div>
            ) : (
              notifications.map((n: any) => (
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
        </div>
      )}
    </div>
  );
}
