import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  MessageSquare,
  FileText,
  Package,
  RefreshCw,
  LogOut,
  Zap,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { portalApi } from '@/features/portal/api/portal.api';
import { usePortalTokenRefresh } from '@/features/portal/hooks/usePortalTokenRefresh';
import { clearPortalTokens, getPortalToken } from '@/features/portal/hooks/usePortalAuth';
import { QUERY_KEYS } from '@/shared/config/query-keys';

const NAV_ITEMS = [
  { to: '/portal/cases', label: 'My Cases', icon: MessageSquare },
  { to: '/portal/invoices', label: 'Invoices', icon: FileText },
  { to: '/portal/orders', label: 'Orders', icon: Package },
  { to: '/portal/subscriptions', label: 'Subscriptions', icon: RefreshCw },
] as const;

export default function PortalLayout() {
  usePortalTokenRefresh();
  const navigate = useNavigate();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const { data: me } = useQuery({
    queryKey: [...QUERY_KEYS.portal, 'me'],
    queryFn: () => portalApi.getMe(),
    enabled: !!getPortalToken(),
    staleTime: 5 * 60_000,
  });

  function handleLogout() {
    clearPortalTokens();
    navigate('/portal/auth');
  }

  return (
    <div className="flex min-h-screen bg-bg">
      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex flex-col w-60 bg-bg-shell border-r border-thin border-border-subtle">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-4 border-b border-thin border-border-subtle">
          <div
            className="w-8 h-8 rounded-sm flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, #00FFAA 0%, #00B368 100%)' }}
          >
            <Zap className="w-4 h-4" strokeWidth={2} style={{ color: '#0A0F0D' }} />
          </div>
          <span className="text-sm font-extrabold text-text-primary truncate">Customer Portal</span>
        </div>

        {/* Nav links */}
        <nav className="flex-1 flex flex-col gap-0.5 px-3 py-3">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-sm text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-brand-soft text-brand border-thin border-border-glow'
                    : 'text-text-secondary hover:text-text-primary hover:bg-glass-2 border-thin border-transparent'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" strokeWidth={1.6} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User + logout */}
        <div className="px-3 py-3 border-t border-thin border-border-subtle">
          <div className="px-3 py-1.5 text-xs text-text-muted truncate font-medium">
            {me ? String((me as unknown as Record<string, unknown>).fullName ?? (me as unknown as Record<string, unknown>).FullName ?? '') : 'Loading...'}
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-sm text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-glass-2 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" strokeWidth={1.6} />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-bg-shell border-b border-thin border-border-subtle">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-sm flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg, #00FFAA 0%, #00B368 100%)' }}
            >
              <Zap className="w-3.5 h-3.5" strokeWidth={2} style={{ color: '#0A0F0D' }} />
            </div>
            <span className="text-sm font-extrabold text-text-primary">Portal</span>
          </div>
          <button
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            className="w-9 h-9 rounded-sm flex items-center justify-center text-text-secondary hover:bg-glass-2 transition-all"
          >
            {mobileNavOpen ? (
              <X className="w-5 h-5" strokeWidth={1.6} />
            ) : (
              <Menu className="w-5 h-5" strokeWidth={1.6} />
            )}
          </button>
        </header>

        {/* Mobile nav overlay */}
        {mobileNavOpen && (
          <div className="md:hidden bg-bg-shell border-b border-thin border-border-subtle px-4 py-3">
            <nav className="flex flex-col gap-0.5">
              {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setMobileNavOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2.5 rounded-sm text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-brand-soft text-brand border-thin border-border-glow'
                        : 'text-text-secondary hover:text-text-primary hover:bg-glass-2 border-thin border-transparent'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" strokeWidth={1.6} />
                  {label}
                </NavLink>
              ))}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-sm text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-glass-2 transition-all"
              >
                <LogOut className="w-3.5 h-3.5" strokeWidth={1.6} />
                Sign out
              </button>
            </nav>
          </div>
        )}

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
