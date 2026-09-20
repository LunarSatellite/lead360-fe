import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Check,
  LayoutDashboard,
  Loader2,
  Megaphone,
  Search,
  Sprout,
  Store,
  UserRound,
  Users,
} from 'lucide-react';
import {
  ACTIVITY_KIND_LABEL,
  stylemintVendorDeskApi,
  VendorActivityKind,
} from '../api/stylemint-vendor-desk.api';
import { CampaignWorkspacesTab } from '../components/CampaignWorkspacesTab';
import { ReportPanel } from '../components/ReportPanel';

/**
 * The vendor desk: the shop's own books, as the shop sees them.
 *
 * Lead360 reaches these with the vendor credential, which is a static service identity scoped to
 * one account (`Stylemint:VendorAccountId`). That is stated on the page rather than implied,
 * because the alternative — a vendor picker — would either 403 on every vendor the credential
 * does not belong to, or, worse, quietly return this shop's numbers under another shop's name.
 *
 * Reads are rendered as reports: these shapes are wide and still moving, and a hand-written
 * layout over a moving shape is the DTO-drift failure this codebase has hit before. Clienteling
 * is the exception — assignments are a fixed list with two writes, so it gets a real interface.
 */

type Tab =
  | 'dashboard'
  | 'analytics'
  | 'activity'
  | 'creators'
  | 'growth'
  | 'clienteling'
  | 'campaignWorkspaces';

const TABS: Array<{ id: Tab; label: string; icon: typeof Store }> = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'activity', label: 'Activity', icon: Activity },
  { id: 'creators', label: 'Creator performance', icon: Users },
  { id: 'growth', label: 'Growth quality', icon: Sprout },
  { id: 'clienteling', label: 'Client book', icon: UserRound },
  { id: 'campaignWorkspaces', label: 'Campaign workspaces', icon: Megaphone },
];

const WINDOWS = [7, 30, 90];

export function VendorDeskPage() {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [days, setDays] = useState(30);

  return (
    <div className="mx-auto max-w-[1500px] space-y-5">
      <div>
        <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-brand">
          Stylemint commerce platform
        </p>
        <h1 className="mt-2 flex items-center gap-2 text-2xl font-black tracking-tight text-text-primary">
          <Store className="h-5 w-5 text-brand" strokeWidth={1.6} />
          Vendor desk
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          The shop's own books — takings, activity, the creators working with it, and who holds
          which clients.
        </p>
      </div>

      <p className="rounded-card border-thin border-border-subtle bg-glass-1 p-3 text-[11px] text-text-muted">
        These read as the vendor account Lead360 is configured to operate as, not as a vendor you
        choose. The credential is a service identity scoped to one shop, so there is no picker —
        one would return this shop's numbers under another shop's name.
      </p>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 rounded-sm border-thin px-3 py-1.5 text-xs font-bold ${
                tab === id
                  ? 'border-border-glow bg-brand-soft text-brand'
                  : 'border-border-subtle text-text-secondary hover:bg-glass-2 hover:text-text-primary'
              }`}
            >
              <Icon className="h-3.5 w-3.5" strokeWidth={1.6} />
              {label}
            </button>
          ))}
        </div>

        {tab !== 'activity' && tab !== 'clienteling' && tab !== 'campaignWorkspaces' && (
          <div className="flex items-center gap-1">
            {WINDOWS.map((w) => (
              <button
                key={w}
                onClick={() => setDays(w)}
                className={`rounded-sm border-thin px-2.5 py-1 text-[11px] font-bold ${
                  days === w
                    ? 'border-border-glow bg-brand-soft text-brand'
                    : 'border-border-subtle text-text-secondary hover:bg-glass-2'
                }`}
              >
                {w}d
              </button>
            ))}
          </div>
        )}
      </div>

      {tab === 'dashboard' && <DashboardTab days={days} />}
      {tab === 'analytics' && <AnalyticsTab days={days} />}
      {tab === 'activity' && <ActivityTab />}
      {tab === 'creators' && <CreatorsTab days={days} />}
      {tab === 'growth' && <GrowthTab days={days} />}
      {tab === 'clienteling' && <ClientBookTab />}
      {tab === 'campaignWorkspaces' && <CampaignWorkspacesTab />}
    </div>
  );
}

function DashboardTab({ days }: { days: number }) {
  const dashboard = useQuery({
    queryKey: ['stylemint-vendor-dashboard', days],
    queryFn: () => stylemintVendorDeskApi.dashboard(days),
    retry: false,
  });

  return (
    <ReportPanel
      title={`Dashboard — last ${days} days`}
      query={dashboard}
      emptyNote="The shop has no activity in this window."
    />
  );
}

function AnalyticsTab({ days }: { days: number }) {
  const [productId, setProductId] = useState('');
  const [lookup, setLookup] = useState('');

  const overview = useQuery({
    queryKey: ['stylemint-vendor-analytics-overview', days],
    queryFn: () => stylemintVendorDeskApi.analyticsOverview(days),
    retry: false,
  });
  const products = useQuery({
    queryKey: ['stylemint-vendor-analytics-products', days],
    queryFn: () => stylemintVendorDeskApi.topProducts(days),
    retry: false,
  });
  const creators = useQuery({
    queryKey: ['stylemint-vendor-analytics-creators', days],
    queryFn: () => stylemintVendorDeskApi.analyticsCreators(days),
    retry: false,
  });
  const product = useQuery({
    queryKey: ['stylemint-vendor-product-analytics', lookup, days],
    queryFn: () => stylemintVendorDeskApi.productAnalytics(lookup, days),
    enabled: !!lookup,
    retry: false,
  });

  return (
    <div className="space-y-3">
      <ReportPanel
        title={`Overview — last ${days} days`}
        query={overview}
        emptyNote="Nothing sold in this window."
      />
      <ReportPanel
        title="Products, best first"
        query={products}
        emptyNote="No product sold in this window."
      />
      <ReportPanel
        title="Creators driving sales"
        query={creators}
        emptyNote="No creator drove a sale in this window."
      />

      <Lookup
        title="One product in detail"
        placeholder="Product id from the list above"
        value={productId}
        onChange={setProductId}
        onOpen={() => setLookup(productId.trim())}
      />

      {lookup && (
        <ReportPanel
          title={`Product ${lookup}`}
          query={product}
          emptyNote="That product has no activity in this window."
        />
      )}
    </div>
  );
}

function ActivityTab() {
  // Kinds are a filter on one feed rather than separate queries: the point of the feed is that
  // everything the shop did is in one column, in order.
  const [kinds, setKinds] = useState<number[]>([]);

  const feed = useQuery({
    queryKey: ['stylemint-vendor-activity', kinds],
    queryFn: () => stylemintVendorDeskApi.activity(kinds),
    retry: false,
  });

  const toggle = (kind: number) =>
    setKinds((current) =>
      current.includes(kind) ? current.filter((k) => k !== kind) : [...current, kind],
    );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1">
        {Object.values(VendorActivityKind).map((kind) => (
          <button
            key={kind}
            onClick={() => toggle(kind)}
            className={`rounded-sm border-thin px-2 py-0.5 text-[10px] font-bold ${
              kinds.includes(kind)
                ? 'border-border-glow bg-brand-soft text-brand'
                : 'border-border-subtle text-text-secondary hover:bg-glass-2'
            }`}
          >
            {ACTIVITY_KIND_LABEL[kind]}
          </button>
        ))}
        {kinds.length > 0 && (
          <button
            onClick={() => setKinds([])}
            className="rounded-sm border-thin border-border-medium px-2 py-0.5 text-[10px] font-bold text-text-secondary hover:bg-glass-2"
          >
            Clear
          </button>
        )}
      </div>

      <ReportPanel
        title={kinds.length > 0 ? `Activity — ${kinds.length} kinds` : 'Activity, newest first'}
        query={feed}
        emptyNote="Nothing has happened on this shop yet."
      />
    </div>
  );
}

function CreatorsTab({ days }: { days: number }) {
  const performance = useQuery({
    queryKey: ['stylemint-vendor-creator-performance', days],
    queryFn: () => stylemintVendorDeskApi.creatorPerformance(days),
    retry: false,
  });

  return (
    <ReportPanel
      title={`Creator performance — last ${days} days`}
      query={performance}
      emptyNote="No creator has worked with this shop in this window."
    />
  );
}

function GrowthTab({ days }: { days: number }) {
  const board = useQuery({
    queryKey: ['stylemint-vendor-growth-quality', days],
    queryFn: () => stylemintVendorDeskApi.growthQuality(days),
    retry: false,
  });

  return (
    <div className="space-y-3">
      <p className="rounded-card border-thin border-border-subtle bg-glass-1 p-3 text-[11px] text-text-muted">
        Growth quality asks whether the growth is the kind that lasts — repeat buyers and held
        margin — rather than whether the line went up.
      </p>
      <ReportPanel
        title={`Growth quality — last ${days} days`}
        query={board}
        emptyNote="Not enough has happened to judge growth quality."
      />
    </div>
  );
}

function ClientBookTab() {
  const client = useQueryClient();
  const [associateFilter, setAssociateFilter] = useState('');
  const [filter, setFilter] = useState('');
  const [associate, setAssociate] = useState('');
  const [customer, setCustomer] = useState('');
  const [note, setNote] = useState('');
  const [creditOf, setCreditOf] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const assignments = useQuery({
    queryKey: ['stylemint-vendor-assignments', filter],
    queryFn: () => stylemintVendorDeskApi.clientAssignments(filter || undefined),
    retry: false,
  });

  const credit = useQuery({
    queryKey: ['stylemint-vendor-associate-credit', creditOf],
    queryFn: () => stylemintVendorDeskApi.associateCredit(creditOf),
    enabled: !!creditOf,
    retry: false,
  });

  const refresh = () =>
    client.invalidateQueries({ queryKey: ['stylemint-vendor-assignments'] });

  const grant = useMutation({
    mutationFn: () =>
      stylemintVendorDeskApi.grantAssignment({
        associateAccountId: associate.trim(),
        customerAccountId: customer.trim(),
        note,
      }),
    onSuccess: () => {
      setAssociate('');
      setCustomer('');
      setNote('');
      setError(null);
      setNotice('The client is assigned.');
      refresh();
    },
    onError: (caught: unknown) => {
      setNotice(null);
      setError(describe(caught));
    },
  });

  return (
    <div className="space-y-3">
      <div className="rounded-frame border-thin border-border-subtle bg-bg-card p-4">
        <p className="text-[11px] font-bold uppercase tracking-wide text-text-secondary">
          Assign a client to an associate
        </p>
        <p className="mt-1 text-[11px] text-text-muted">
          Both are account ids. The backend serves no directory to pick from, so the form asks for
          the ids rather than faking a picker over a list that does not exist.
        </p>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          <input
            value={associate}
            onChange={(e) => setAssociate(e.target.value)}
            placeholder="Associate account id"
            className={`${field} font-mono`}
          />
          <input
            value={customer}
            onChange={(e) => setCustomer(e.target.value)}
            placeholder="Customer account id"
            className={`${field} font-mono`}
          />
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note (optional)"
            className={field}
          />
        </div>
        <button
          disabled={!associate.trim() || !customer.trim() || grant.isPending}
          onClick={() => grant.mutate()}
          className="mt-2 flex items-center gap-1.5 rounded-sm bg-brand px-3 py-1.5 text-xs font-bold text-bg hover:bg-brand-light disabled:opacity-40"
        >
          {grant.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.6} />
          ) : (
            <Check className="h-3.5 w-3.5" strokeWidth={1.6} />
          )}
          Assign
        </button>

        {error && (
          <div className="mt-2 flex items-start gap-2 rounded-sm border-thin border-rose-400/25 bg-rose-400/5 p-2.5">
            <AlertTriangle
              className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-300"
              strokeWidth={1.6}
            />
            <p className="text-xs text-text-secondary">{error}</p>
          </div>
        )}
        {notice && (
          <p className="mt-2 rounded-sm border-thin border-border-glow bg-brand-soft p-2.5 text-xs text-text-secondary">
            {notice}
          </p>
        )}
      </div>

      <Lookup
        title="Narrow to one associate"
        placeholder="Associate account id, or blank for everyone"
        value={associateFilter}
        onChange={setAssociateFilter}
        onOpen={() => setFilter(associateFilter.trim())}
        openLabel="Filter"
      />

      <ReportPanel
        title={filter ? `Assignments held by ${filter}` : 'Every assignment'}
        query={assignments}
        emptyNote="No client is assigned to an associate."
      />

      <Lookup
        title="What an associate is credited with"
        placeholder="Associate account id"
        value={creditOf}
        onChange={setCreditOf}
        onOpen={() => setCreditOf(creditOf.trim())}
      />

      {creditOf && (
        <ReportPanel
          title={`Credit for ${creditOf}`}
          query={credit}
          emptyNote="That associate is credited with nothing yet."
        />
      )}
    </div>
  );
}

function Lookup({
  title,
  placeholder,
  value,
  onChange,
  onOpen,
  openLabel = 'Open',
}: {
  title: string;
  placeholder: string;
  value: string;
  onChange: (next: string) => void;
  onOpen: () => void;
  openLabel?: string;
}) {
  return (
    <div className="rounded-frame border-thin border-border-subtle bg-bg-card p-4">
      <p className="text-[11px] font-bold uppercase tracking-wide text-text-secondary">{title}</p>
      <div className="mt-2 flex gap-2">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`${field} flex-1 font-mono`}
        />
        <button
          onClick={onOpen}
          className="flex items-center gap-1.5 rounded-sm bg-brand px-3 py-2 text-xs font-bold text-bg hover:bg-brand-light"
        >
          <Search className="h-3.5 w-3.5" strokeWidth={1.6} /> {openLabel}
        </button>
      </div>
    </div>
  );
}

/** The api client signals absence with codes rather than prose, so each caller says it its own way. */
function describe(error: unknown): string {
  if (!(error instanceof Error)) return 'Something went wrong.';
  if (error.message === 'NOT_DEPLOYED') {
    return 'This Stylemint build does not serve the client book yet.';
  }
  if (error.message === 'NOT_FOUND') return 'No account matches that identifier.';
  return error.message;
}

const field =
  'w-full rounded-sm border-thin border-border-subtle bg-bg-input px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:border-border-glow focus:outline-none';

export { VendorDeskPage as Component };
