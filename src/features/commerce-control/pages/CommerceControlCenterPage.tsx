import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  BadgeDollarSign,
  Boxes,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Facebook,
  HeartHandshake,
  Instagram,
  Languages,
  MapPin,
  PackageCheck,
  PlaySquare,
  RefreshCw,
  Settings2,
  ShoppingBag,
  Store,
  Users,
  Youtube,
  WalletCards,
} from 'lucide-react';
import { stylemintCommerceApi } from '../api/stylemint-commerce.api';
import { isUsableSocialAccount } from '../lib/social-accounts';
import { applyTenantAccent } from '@/shared/lib/tenant-theme';
import { useAuth } from '@/shared/hooks/useAuth';
import { UserRole } from '@/features/auth/types/auth.types';

type Preferences = { locale: 'fr-CD' | 'en-CD'; currency: 'CDF' | 'USD'; timezone: 'Africa/Kinshasa' };
const STORAGE_KEY = 'kinmarche_workspace_preferences';
const defaults: Preferences = { locale: 'en-CD', currency: 'CDF', timezone: 'Africa/Kinshasa' };

function loadPreferences(): Preferences {
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') };
  } catch {
    return defaults;
  }
}

const operations = [
  [
    'Catalogue & products',
    'Products, categories, images, pricing and availability.',
    '/dashboard/business-catalog',
    Boxes,
    'from-emerald-500/20',
  ],
  [
    'Content & social media',
    'Import, review and publish reels and campaigns.',
    '/dashboard/stylemint/content',
    PlaySquare,
    'from-fuchsia-500/20',
  ],
  [
    'Orders',
    'Confirm, prepare, deliver, cancel and refund.',
    '/dashboard/stylemint/orders',
    ShoppingBag,
    'from-amber-500/20',
  ],
  [
    'Customers',
    'Profiles, consent, segments and history.',
    '/dashboard/stylemint/customers',
    Users,
    'from-sky-500/20',
  ],
  [
    'Campaigns',
    'Promotions, audiences, calendar and performance.',
    '/dashboard/crm/campaigns',
    BadgeDollarSign,
    'from-violet-500/20',
  ],
  [
    'Customer service',
    'Requests, disputes, returns and resolution tracking.',
    '/dashboard/crm/support',
    HeartHandshake,
    'from-rose-500/20',
  ],
  [
    'Vendor operations',
    'Products, stores, returns, warranties and performance.',
    '/dashboard/stylemint/vendor',
    Store,
    'from-cyan-500/20',
  ],
  [
    'Seller finance',
    'Earnings, ledger, payout requests, invoices and payment destinations.',
    '/dashboard/stylemint/finance',
    WalletCards,
    'from-emerald-500/20',
  ],
] as const;

export function CommerceControlCenterPage() {
  const { user } = useAuth();
  const canOperate = user?.role === UserRole.Owner || user?.role === UserRole.Admin;
  const [preferences, setPreferences] = useState<Preferences>(loadPreferences);
  const [branding, setBranding] = useState({ name: 'Kin Marche', logoUrl: '', accentColor: '#00D98A' });
  const [saved, setSaved] = useState(false);
  const integration = useQuery({
    queryKey: ['stylemint-readiness'],
    queryFn: stylemintCommerceApi.readiness,
    retry: false,
  });
  const catalogue = useQuery({
    queryKey: ['stylemint-catalogue-readiness'],
    queryFn: stylemintCommerceApi.catalogueReadiness,
    retry: false,
  });
  const social = useQuery({
    queryKey: ['stylemint-social-accounts'],
    queryFn: stylemintCommerceApi.socialAccounts,
    retry: false,
  });
  const tenantSettings = useQuery({
    queryKey: ['commerce-tenant-settings'],
    queryFn: stylemintCommerceApi.tenantSettings,
    retry: false,
  });
  useEffect(() => {
    if (!tenantSettings.data) return;
    const remote = tenantSettings.data;
    const next = { locale: remote.locale, currency: remote.currency, timezone: remote.timeZone };
    setPreferences(next);
    setBranding({ name: remote.name, logoUrl: remote.logoUrl ?? '', accentColor: remote.accentColor });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    applyTenantAccent(remote.accentColor);
  }, [tenantSettings.data]);
  const saveTenant = useMutation({
    mutationFn: (payload: { preferences: Preferences; branding: typeof branding }) =>
      stylemintCommerceApi.updateTenantSettings({
        name: payload.branding.name.trim(),
        locale: payload.preferences.locale,
        currency: payload.preferences.currency,
        timeZone: payload.preferences.timezone,
        logoUrl: payload.branding.logoUrl.trim() || null,
        accentColor: payload.branding.accentColor.toUpperCase(),
      }),
    onSuccess: (remote) => {
      setSaved(true);
      applyTenantAccent(remote.accentColor);
      window.setTimeout(() => setSaved(false), 1800);
    },
  });
  const readiness = useMemo(() => {
    const accounts = Array.isArray(social.data) ? social.data : [];
    const socialConnected = accounts.some((account) => isUsableSocialAccount(account as Record<string, unknown>));
    return [
      ['Kin Marche identity', true],
      ['Language, currency and timezone', true],
      ['Stylemint vendor access', integration.data?.vendor.reachable === true],
      ['Stylemint administrator access', integration.data?.admin.reachable === true],
      [`Catalogue: ${catalogue.data?.displayableProducts ?? 0}/${catalogue.data?.requiredProducts ?? 50} products, 5 images + reel`, catalogue.data?.ready === true],
      ['Social accounts connected', socialConnected],
    ] as const;
  }, [catalogue.data, integration.data, social.data]);
  const readyCount = readiness.filter((item) => item[1]).length;
  const refreshReadiness = () => {
    integration.refetch();
    catalogue.refetch();
    social.refetch();
  };

  const update = <K extends keyof Preferences>(key: K, value: Preferences[K]) => {
    const next = { ...preferences, [key]: value };
    setPreferences(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    if (canOperate) saveTenant.mutate({ preferences: next, branding });
  };

  return (
    <div className="mx-auto max-w-[1500px] space-y-6">
      <section className="relative overflow-hidden rounded-[28px] border border-emerald-400/20 bg-bg px-6 py-7 shadow-[0_24px_80px_rgba(0,0,0,0.28)] md:px-9 md:py-9">
        <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-emerald-400/15 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-36 w-80 bg-amber-300/10 blur-3xl" />
        <div className="relative grid gap-8 xl:grid-cols-[1.35fr_.65fr] xl:items-end">
          <div>
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-emerald-300">
                Stylemint Control Center
              </span>
              <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-semibold text-white/65">
                <MapPin className="h-3 w-3" /> Kinshasa, RDC
              </span>
            </div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-300/80">Kin Marche</p>
            <h1 className="mt-2 max-w-3xl text-3xl font-black tracking-[-0.04em] text-white md:text-5xl">
              Your entire commercial operation, in one place.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/60 md:text-base">
              Manage Stylemint content, products, orders, refunds and customer relationships from Lead360.
              Creators keep their complete experience in the mobile app; Kin Marche manages only its commercial
              partnerships with them here.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/45">
                  Demo readiness
                </p>
                <p className="mt-1 text-2xl font-black text-white">
                  {readyCount}/{readiness.length}
                </p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-300 text-text-inverted">
                <PackageCheck className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-amber-300"
                style={{ width: `${(readyCount / readiness.length) * 100}%` }}
              />
            </div>
            <p className="mt-3 text-xs leading-5 text-white/50">
              {integration.data?.ready
                ? 'Stylemint vendor and administrator access is working correctly.'
                : 'Readiness checks vendor and administrator access independently.'}
            </p>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-text-muted">Operations</p>
            <h2 className="mt-1 text-xl font-extrabold tracking-tight text-text-primary">
              What would you like to manage?
            </h2>
          </div>
          <Link
            to="/dashboard/crm/analytics"
            className="hidden items-center gap-1.5 text-xs font-bold text-brand hover:opacity-80 sm:flex"
          >
            View performance <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {operations.map(([title, description, href, Icon, accent]) => (
            <Link
              key={title}
              to={href}
              className="group relative overflow-hidden rounded-2xl border border-border-subtle bg-bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-brand/35 hover:shadow-[0_16px_40px_rgba(0,0,0,0.18)]"
            >
              <div
                className={`absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${accent} to-transparent opacity-70`}
              />
              <div className="relative">
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-black/20 text-text-primary">
                    <Icon className="h-[18px] w-[18px]" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-text-muted transition-transform group-hover:translate-x-1 group-hover:text-brand" />
                </div>
                <h3 className="mt-5 text-sm font-extrabold text-text-primary">{title}</h3>
                <p className="mt-1.5 text-xs leading-5 text-text-muted">{description}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_.9fr]">
        <div className="rounded-2xl border border-border-subtle bg-bg-card p-5 md:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-text-muted">
                Market settings
              </p>
              <h2 className="mt-1 text-base font-extrabold text-text-primary">Kin Marche regional settings</h2>
            </div>
            {saved && (
              <span className="flex items-center gap-1 text-[11px] font-bold text-success">
                <CheckCircle2 className="h-3.5 w-3.5" /> Saved
              </span>
            )}
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <Field icon={Languages} label="Language">
              <select
                disabled={!canOperate}
                value={preferences.locale}
                onChange={(e) => update('locale', e.target.value as Preferences['locale'])}
                className="w-full bg-transparent text-sm font-bold text-text-primary outline-none disabled:opacity-60"
              >
                <option value="fr-CD">French (DRC)</option>
                <option value="en-CD">English (DRC)</option>
              </select>
            </Field>
            <Field icon={BadgeDollarSign} label="Currency">
              <select
                disabled={!canOperate}
                value={preferences.currency}
                onChange={(e) => update('currency', e.target.value as Preferences['currency'])}
                className="w-full bg-transparent text-sm font-bold text-text-primary outline-none disabled:opacity-60"
              >
                <option value="CDF">CDF — Congolese franc</option>
                <option value="USD">USD — US dollar</option>
              </select>
            </Field>
            <Field icon={Clock3} label="Time zone">
              <select
                disabled={!canOperate}
                value={preferences.timezone}
                onChange={(e) => update('timezone', e.target.value as Preferences['timezone'])}
                className="w-full bg-transparent text-sm font-bold text-text-primary outline-none disabled:opacity-60"
              >
                <option value="Africa/Kinshasa">Africa/Kinshasa</option>
              </select>
            </Field>
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-[1fr_1fr_150px_auto] md:items-end">
            <label className="rounded-xl border border-border-subtle bg-bg-elevated p-3">
              <span className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-text-muted">
                Tenant name
              </span>
              <input
                disabled={!canOperate}
                value={branding.name}
                onChange={(event) => setBranding((value) => ({ ...value, name: event.target.value }))}
                className="w-full bg-transparent text-sm font-bold text-text-primary outline-none disabled:opacity-60"
              />
            </label>
            <label className="rounded-xl border border-border-subtle bg-bg-elevated p-3">
              <span className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-text-muted">
                Logo (HTTPS)
              </span>
              <input
                disabled={!canOperate}
                value={branding.logoUrl}
                onChange={(event) => setBranding((value) => ({ ...value, logoUrl: event.target.value }))}
                className="w-full bg-transparent text-sm text-text-primary outline-none disabled:opacity-60"
              />
            </label>
            <label className="rounded-xl border border-border-subtle bg-bg-elevated p-3">
              <span className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-text-muted">
                Accent color
              </span>
              <input
                disabled={!canOperate}
                type="color"
                value={branding.accentColor}
                onChange={(event) => setBranding((value) => ({ ...value, accentColor: event.target.value }))}
                className="h-6 w-full bg-transparent disabled:opacity-60"
              />
            </label>
            {canOperate ? (
              <button
                onClick={() => saveTenant.mutate({ preferences, branding })}
                disabled={saveTenant.isPending || !branding.name.trim()}
                className="rounded-xl bg-brand px-4 py-3 text-xs font-extrabold text-black disabled:opacity-40"
              >
                {saveTenant.isPending ? 'Saving…' : 'Save'}
              </button>
            ) : (
              <span className="px-2 py-3 text-xs text-text-muted">Read only</span>
            )}
          </div>
          {saveTenant.isError && (
            <p className="mt-3 text-xs font-semibold text-danger">
              Unable to save tenant settings.
            </p>
          )}
        </div>
        <div className="rounded-2xl border border-border-subtle bg-bg-card p-5 md:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-text-muted">
                Content connections
              </p>
              <h2 className="mt-1 text-base font-extrabold text-text-primary">Social networks</h2>
            </div>
            <Link
              to="/dashboard/channels"
              className="rounded-lg border border-border-subtle p-2 text-text-muted hover:text-brand"
            >
              <Settings2 className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Social icon={Instagram} name="Instagram" />
            <Social icon={Facebook} name="Facebook" />
            <Social icon={Youtube} name="YouTube" />
            <Social icon={PlaySquare} name="TikTok" />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border-subtle bg-bg-card p-5 md:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-text-muted">
              Readiness status
            </p>
            <h2 className="mt-1 text-base font-extrabold text-text-primary">
              Demo customer journey
            </h2>
          </div>
          <button
            type="button"
            onClick={refreshReadiness}
            disabled={integration.isFetching || catalogue.isFetching || social.isFetching}
            className="flex items-center justify-center gap-2 rounded-xl border border-border-subtle px-3 py-2 text-xs font-bold text-text-secondary hover:border-brand/40 hover:text-brand disabled:opacity-50"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${integration.isFetching || catalogue.isFetching || social.isFetching ? 'animate-spin' : ''}`}
            />{' '}
            Check now
          </button>
        </div>
        <div className="mt-5 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {readiness.map(([label, ready]) => (
            <div
              key={label}
              className="flex items-center gap-3 rounded-xl border border-border-subtle bg-bg-elevated px-3.5 py-3"
            >
              {ready ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
              ) : (
                <CircleAlert className="h-4 w-4 shrink-0 text-amber-400" />
              )}
              <span className="text-xs font-semibold text-text-secondary">{label}</span>
              <span
                className={`ml-auto text-[9px] font-extrabold uppercase tracking-wider ${ready ? 'text-success' : 'text-amber-400'}`}
              >
                {ready ? 'Ready' : 'Connect'}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Field({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Store;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="rounded-xl border border-border-subtle bg-bg-elevated p-3.5">
      <span className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-text-muted">
        <Icon className="h-3.5 w-3.5" /> {label}
      </span>
      {children}
    </label>
  );
}

function Social({ icon: Icon, name }: { icon: typeof Store; name: string }) {
  return (
    <div className="rounded-xl border border-border-subtle bg-bg-elevated px-3 py-3">
      <Icon className="h-4 w-4 text-text-secondary" />
      <p className="mt-2 text-xs font-bold text-text-primary">{name}</p>
      <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-wide text-amber-400">Not connected</p>
    </div>
  );
}

export { CommerceControlCenterPage as Component };
