import { BarChart3, PackageOpen, ShoppingBag, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type Money = { amount?: number; currency?: string };
type Kpi<T> = { current?: T; previous?: T; deltaPercent?: number | null };
type Analytics = {
  window?: { fromUtc?: string; toUtc?: string; durationDays?: number };
  grossSales?: Kpi<Money>;
  netRevenue?: Kpi<Money>;
  conversionRate?: Kpi<number>;
  totalOrders?: Kpi<number>;
  revenueTrend?: Array<{ date: string; amount: Money }>;
  topProducts?: Array<{
    productId: string;
    name: string;
    thumbnailUrl?: string | null;
    unitsSold: number;
    totalRevenue: Money;
  }>;
  trafficSources?: Array<{ platform: string; percent: number }>;
};

const colors = ['#22c55e', '#fbbf24', '#38bdf8', '#f472b6', '#a78bfa'];
const money = (value?: Money) =>
  `${Number(value?.amount ?? 0).toLocaleString('fr-CD', { maximumFractionDigits: 0 })} ${value?.currency || 'CDF'}`;
const unwrap = (value: unknown): Analytics => {
  if (!value || typeof value !== 'object') return {};
  const source = value as Record<string, unknown>;
  return source.data && typeof source.data === 'object' ? (source.data as Analytics) : (source as Analytics);
};

export function VendorAnalyticsPanel({ data }: { data: unknown }) {
  const analytics = unwrap(data);
  const trend = (analytics.revenueTrend ?? []).map((point) => ({
    date: new Date(point.date).toLocaleDateString('fr-CD', { day: '2-digit', month: 'short' }),
    revenue: Number(point.amount?.amount ?? 0),
  }));
  const products = analytics.topProducts ?? [];
  const traffic = analytics.trafficSources ?? [];
  const cards = [
    {
      label: 'Ventes brutes',
      value: money(analytics.grossSales?.current),
      delta: analytics.grossSales?.deltaPercent,
      icon: BarChart3,
    },
    {
      label: 'Revenu net',
      value: money(analytics.netRevenue?.current),
      delta: analytics.netRevenue?.deltaPercent,
      icon: Wallet,
    },
    {
      label: 'Conversion',
      value: `${Number(analytics.conversionRate?.current ?? 0).toLocaleString('fr-CD', { maximumFractionDigits: 2 })}%`,
      delta: analytics.conversionRate?.deltaPercent,
      icon: TrendingUp,
    },
    {
      label: 'Orders',
      value: Number(analytics.totalOrders?.current ?? 0).toLocaleString('fr-CD'),
      delta: analytics.totalOrders?.deltaPercent,
      icon: ShoppingBag,
    },
  ];

  return (
    <div className="space-y-5 p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-brand">
            Performance Kin Marche
          </p>
          <h3 className="mt-1 text-xl font-black text-text-primary">Tableau commercial Stylemint</h3>
        </div>
        {/*
          "donnees attribuees en direct" over four zeros claims a live
          attribution that did not happen. The window is real either way, so
          it is still stated; the attribution claim is only made when
          something was actually attributed in it.
        */}
        <p className="text-xs text-text-muted">
          {analytics.window?.durationDays ?? 30} jours ·{' '}
          {Number(analytics.grossSales?.current ?? 0) > 0
            ? 'donnees attribuees en direct'
            : 'aucune vente attribuee sur cette periode'}
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, delta, icon: Icon }) => {
          const positive = Number(delta ?? 0) >= 0;
          return (
            <article
              key={label}
              className="relative overflow-hidden rounded-2xl border border-border-subtle bg-bg-elevated p-4"
            >
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-brand/10 blur-2xl" />
              <div className="relative flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-text-muted">
                    {label}
                  </p>
                  <p className="mt-2 text-2xl font-black tracking-tight text-text-primary">{value}</p>
                </div>
                <span className="rounded-xl bg-brand/10 p-2 text-brand">
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              <p
                className={`relative mt-3 flex items-center gap-1 text-[11px] font-bold ${delta == null ? 'text-text-muted' : positive ? 'text-success' : 'text-danger'}`}
              >
                {delta == null ? (
                  'No comparable period'
                ) : (
                  <>
                    {positive ? (
                      <TrendingUp className="h-3.5 w-3.5" />
                    ) : (
                      <TrendingDown className="h-3.5 w-3.5" />
                    )}
                    {Math.abs(delta).toLocaleString('fr-CD', { maximumFractionDigits: 1 })}% vs periode
                    precedente
                  </>
                )}
              </p>
            </article>
          );
        })}
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.65fr_1fr]">
        <section className="rounded-2xl border border-border-subtle bg-bg-elevated p-4">
          <div className="mb-4">
            <p className="text-xs font-extrabold uppercase tracking-wider text-text-primary">
              Evolution du revenu
            </p>
            <p className="mt-1 text-[11px] text-text-muted">Montants journaliers en CDF</p>
          </div>
          {trend.length ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend} margin={{ left: 8, right: 8 }}>
                  <defs>
                    <linearGradient id="kinRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22c55e" stopOpacity={0.38} />
                      <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,.12)" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                    width={62}
                  />
                  <Tooltip
                    formatter={(value) => [`${Number(value).toLocaleString('fr-CD')} CDF`, 'Revenu']}
                    contentStyle={{
                      background: '#111827',
                      border: '1px solid rgba(148,163,184,.2)',
                      borderRadius: 12,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#22c55e"
                    strokeWidth={2.5}
                    fill="url(#kinRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <Empty label="No trend available" />
          )}
        </section>
        <section className="rounded-2xl border border-border-subtle bg-bg-elevated p-4">
          <p className="text-xs font-extrabold uppercase tracking-wider text-text-primary">
            Origine du trafic
          </p>
          <p className="mt-1 text-[11px] text-text-muted">Contribution by platform</p>
          {traffic.length ? (
            <>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={traffic}
                      dataKey="percent"
                      nameKey="platform"
                      innerRadius={48}
                      outerRadius={78}
                      paddingAngle={3}
                    >
                      {traffic.map((item, index) => (
                        <Cell key={item.platform} fill={colors[index % colors.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [
                        `${Number(value).toLocaleString('fr-CD', { maximumFractionDigits: 1 })}%`,
                        'Trafic',
                      ]}
                      contentStyle={{
                        background: '#111827',
                        border: '1px solid rgba(148,163,184,.2)',
                        borderRadius: 12,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {traffic.map((item, index) => (
                  <div
                    key={item.platform}
                    className="flex items-center gap-2 text-[11px] text-text-secondary"
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: colors[index % colors.length] }}
                    />
                    <span className="truncate">{item.platform}</span>
                    <b className="ml-auto text-text-primary">
                      {item.percent.toLocaleString('fr-CD', { maximumFractionDigits: 1 })}%
                    </b>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <Empty label="No source available" />
          )}
        </section>
      </div>
      <section className="rounded-2xl border border-border-subtle bg-bg-elevated p-4">
        <div className="mb-4">
          <p className="text-xs font-extrabold uppercase tracking-wider text-text-primary">
            Produits moteurs
          </p>
          <p className="mt-1 text-[11px] text-text-muted">Ranking by attributed revenue</p>
        </div>
        {products.length ? (
          <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
            <div className="space-y-2">
              {products.slice(0, 6).map((product, index) => (
                <div
                  key={product.productId}
                  className="flex items-center gap-3 rounded-xl border border-border-subtle bg-bg-card p-3"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-xs font-black text-brand">
                    {index + 1}
                  </span>
                  {product.thumbnailUrl ? (
                    <img src={product.thumbnailUrl} alt="" className="h-10 w-10 rounded-lg object-cover" />
                  ) : (
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-bg-elevated">
                      <PackageOpen className="h-4 w-4 text-text-muted" />
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-text-primary">{product.name}</p>
                    <p className="text-[10px] text-text-muted">{product.unitsSold} unite(s)</p>
                  </div>
                  <p className="ml-auto text-xs font-black text-text-primary">
                    {money(product.totalRevenue)}
                  </p>
                </div>
              ))}
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={products
                    .slice(0, 6)
                    .map((p) => ({
                      name: p.name.length > 16 ? `${p.name.slice(0, 16)}…` : p.name,
                      revenue: Number(p.totalRevenue?.amount ?? 0),
                    }))}
                  layout="vertical"
                  margin={{ left: 10, right: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,.12)" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 9, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={110}
                    tick={{ fontSize: 9, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(value) => [`${Number(value).toLocaleString('fr-CD')} CDF`, 'Revenu']}
                    contentStyle={{
                      background: '#111827',
                      border: '1px solid rgba(148,163,184,.2)',
                      borderRadius: 12,
                    }}
                  />
                  <Bar dataKey="revenue" fill="#22c55e" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <Empty label="No ranked product" />
        )}
      </section>
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return <div className="flex h-44 items-center justify-center text-xs text-text-muted">{label}</div>;
}
