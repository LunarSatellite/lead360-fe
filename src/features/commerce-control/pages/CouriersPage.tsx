import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Ban,
  BadgeCheck,
  CheckCircle2,
  GraduationCap,
  Loader2,
  RefreshCw,
  RotateCcw,
  Truck,
  TrendingUp,
} from 'lucide-react';
import {
  COURIER_STATE_LABEL,
  CourierState,
  TIER_LABEL,
  stylemintCouriersApi,
  type CourierProfile,
  type CourierStateValue,
} from '../api/stylemint-couriers.api';

/**
 * Courier onboarding and standing.
 *
 * A courier moves Applied → KYC in review → Onboarded → Active, gated by an identity check, a
 * background check and training, and can be promoted through delivery tiers or suspended. The
 * admin surface could do all of that, but every action is keyed by `courierProfileId` and there
 * was no way to obtain one — the only reads were by id or by account, both of which assume you
 * already know who you are looking for. `GET v1/admin/couriers` was added for this page.
 *
 * It opens on KYC in review, because that is the queue that blocks people from working.
 */
export function CouriersPage() {
  const client = useQueryClient();
  const [state, setState] = useState<CourierStateValue>(CourierState.KycInReview);
  const [selected, setSelected] = useState<CourierProfile | null>(null);

  const couriers = useQuery({
    queryKey: ['stylemint-couriers', state],
    queryFn: () => stylemintCouriersApi.list({ state, take: 50 }),
  });

  const refresh = () => {
    client.invalidateQueries({ queryKey: ['stylemint-couriers'] });
    setSelected(null);
  };

  return (
    <div className="mx-auto max-w-[1500px] space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-brand">
            Stylemint delivery
          </p>
          <h1 className="mt-2 flex items-center gap-2 text-2xl font-black tracking-tight text-text-primary">
            <Truck className="h-5 w-5 text-brand" strokeWidth={1.6} />
            Couriers
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            Onboarding checks, tier promotion and standing.
          </p>
        </div>
        <button
          onClick={() => couriers.refetch()}
          className="flex items-center gap-2 rounded-card border-thin border-border-subtle px-3 py-2 text-xs font-bold text-text-secondary hover:text-brand"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${couriers.isFetching ? 'animate-spin' : ''}`}
            strokeWidth={1.6}
          />
          Refresh
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-frame border-thin border-border-subtle bg-bg-card p-2">
        {(Object.entries(COURIER_STATE_LABEL) as [string, string][]).map(([value, label]) => {
          const numeric = Number(value) as CourierStateValue;
          const active = state === numeric;
          return (
            <button
              key={value}
              onClick={() => { setState(numeric); setSelected(null); }}
              className={`rounded-sm px-3 py-1.5 text-xs font-bold transition ${
                active
                  ? 'bg-brand-soft text-brand'
                  : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary'
              }`}
            >
              {label}
            </button>
          );
        })}
        <span className="ml-auto pr-2 text-xs font-bold text-text-muted">
          {couriers.data ? `${couriers.data.length} courier(s)` : 'Loading…'}
        </span>
      </div>

      {couriers.isError && (
        <div className="flex items-start gap-3 rounded-frame border-thin border-rose-400/25 bg-rose-400/5 p-4">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" strokeWidth={1.6} />
          <p className="text-sm text-text-secondary">{(couriers.error as Error).message}</p>
        </div>
      )}

      {couriers.isLoading ? (
        <div className="flex items-center gap-3 rounded-frame border-thin border-border-subtle bg-bg-card p-8 text-sm text-text-muted">
          <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.6} /> Loading couriers…
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_400px]">
          <div className="overflow-hidden rounded-frame border-thin border-border-subtle bg-bg-card">
            {(couriers.data ?? []).map((courier) => (
              <button
                key={courier.id}
                onClick={() => setSelected(courier)}
                className={`flex w-full items-center gap-3 border-b border-border-subtle px-4 py-3 text-left last:border-b-0 hover:bg-bg-elevated ${
                  selected?.id === courier.id ? 'bg-brand-soft' : ''
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-sm font-bold text-text-primary">
                    {courier.accountId.slice(0, 8)}
                  </p>
                  <p className="mt-0.5 text-[11px] text-text-muted">
                    {courier.homeGeohash || 'No home area'}
                    {courier.failureStreak > 0
                      ? ` · ${courier.failureStreak} failure(s) in a row`
                      : ''}
                  </p>
                </div>
                {courier.failureStreak > 0 && (
                  <span className="shrink-0 rounded-sm border-thin border-amber-400/25 bg-amber-400/10 px-2 py-0.5 text-[10px] font-black text-amber-300">
                    At risk
                  </span>
                )}
                <span className="shrink-0 rounded-sm border-thin border-border-subtle px-2 py-0.5 text-[10px] font-black text-text-secondary">
                  {TIER_LABEL[courier.currentTier] ?? courier.currentTier}
                </span>
              </button>
            ))}
            {(couriers.data?.length ?? 0) === 0 && !couriers.isError && (
              <div className="p-10 text-center">
                <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-300" strokeWidth={1.6} />
                <p className="mt-3 text-sm font-bold text-text-primary">
                  No couriers in {COURIER_STATE_LABEL[state].toLowerCase()}
                </p>
              </div>
            )}
          </div>

          <CourierPanel courier={selected} onChanged={refresh} />
        </div>
      )}
    </div>
  );
}

function CourierPanel({
  courier,
  onChanged,
}: {
  courier: CourierProfile | null;
  onChanged: () => void;
}) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);

  const run = useMutation({
    mutationFn: async (action: string) => {
      const id = courier!.id;
      switch (action) {
        case 'kyc-approve':
          return stylemintCouriersApi.completeKyc(id, { approved: true });
        case 'kyc-reject':
          return stylemintCouriersApi.completeKyc(id, {
            approved: false,
            rejectionReason: reason,
          });
        case 'background':
          return stylemintCouriersApi.recordBackgroundCheckPass(id);
        case 'training':
          return stylemintCouriersApi.recordTrainingPass(id);
        case 'traveler':
          return stylemintCouriersApi.promoteToTraveler(id);
        case 'pro':
          return stylemintCouriersApi.promoteToPro(id);
        case 'reinstate':
          return stylemintCouriersApi.reinstate(id);
        default:
          return stylemintCouriersApi.suspend(id, reason);
      }
    },
    onSuccess: () => { setReason(''); setConfirming(null); setError(null); onChanged(); },
    onError: (caught: unknown) => {
      setConfirming(null);
      setError(caught instanceof Error ? caught.message : 'The action could not be completed.');
    },
  });

  if (!courier) {
    return (
      <div className="rounded-frame border-thin border-border-subtle bg-bg-card p-8 text-center">
        <Truck className="mx-auto h-8 w-8 text-text-muted" strokeWidth={1.6} />
        <p className="mt-3 text-sm text-text-muted">Pick a courier to review their onboarding.</p>
      </div>
    );
  }

  const suspended = courier.state === CourierState.Suspended;
  /** Rejecting KYC and suspending both need a written reason. */
  const needsReason = confirming === 'kyc-reject' || confirming === 'suspend';

  return (
    <div className="space-y-3 rounded-frame border-thin border-border-subtle bg-bg-card p-4">
      <div>
        <p className="font-mono text-sm font-bold text-text-primary">{courier.accountId}</p>
        <p className="mt-0.5 text-[11px] text-text-muted">
          {COURIER_STATE_LABEL[courier.state]} · {TIER_LABEL[courier.currentTier]} tier
        </p>
      </div>

      <dl className="space-y-1 text-[11px]">
        <Check label="Identity verified" at={courier.kycVerifiedUtc} />
        <Check label="Background check" at={courier.backgroundCheckPassedUtc} />
        <Check label="Training" at={courier.trainingPassedUtc} />
        <Check label="Onboarded" at={courier.onboardedUtc} />
        {courier.suspendedUtc && (
          <div className="flex justify-between gap-3">
            <dt className="text-text-muted">Suspended</dt>
            <dd className="font-bold text-rose-300">
              {new Date(courier.suspendedUtc).toLocaleDateString()}
            </dd>
          </div>
        )}
      </dl>

      {courier.suspendedReason && (
        <p className="rounded-card border-thin border-rose-400/25 bg-rose-400/5 p-2.5 text-xs text-text-secondary">
          {courier.suspendedReason}
        </p>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-card border-thin border-rose-400/25 bg-rose-400/5 p-2.5">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-300" strokeWidth={1.6} />
          <p className="text-xs text-text-secondary">{error}</p>
        </div>
      )}

      {confirming ? (
        <div className="space-y-2 rounded-card border-thin border-amber-400/25 bg-amber-400/5 p-3">
          <p className="text-xs font-bold text-amber-300">{CONFIRM_LABEL[confirming]}</p>
          {needsReason && (
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={2}
              placeholder="Reason (required)"
              className="w-full rounded-card border-thin border-border-subtle bg-bg-elevated px-3 py-2 text-xs text-text-primary outline-none focus:border-border-glow"
            />
          )}
          <div className="flex gap-2">
            <button
              onClick={() => run.mutate(confirming)}
              disabled={run.isPending || (needsReason && !reason.trim())}
              className="rounded-card bg-brand px-3 py-2 text-xs font-bold text-bg hover:bg-brand-light disabled:opacity-40"
            >
              {run.isPending ? 'Applying…' : 'Confirm'}
            </button>
            <button
              onClick={() => setConfirming(null)}
              className="rounded-card border-thin border-border-medium px-3 py-2 text-xs font-bold text-text-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <Group title="Onboarding checks">
            <Action icon={BadgeCheck} label="Approve identity" tone="emerald"
              onClick={() => setConfirming('kyc-approve')} />
            <Action icon={Ban} label="Reject identity" tone="rose"
              onClick={() => setConfirming('kyc-reject')} />
            <Action icon={CheckCircle2} label="Background passed" tone="neutral"
              onClick={() => setConfirming('background')} />
            <Action icon={GraduationCap} label="Training passed" tone="neutral"
              onClick={() => setConfirming('training')} />
          </Group>

          <Group title="Tier">
            <Action icon={TrendingUp} label="Promote to Traveler" tone="neutral"
              onClick={() => setConfirming('traveler')} />
            <Action icon={TrendingUp} label="Promote to Pro" tone="neutral"
              onClick={() => setConfirming('pro')} />
          </Group>

          <Group title="Standing">
            {suspended ? (
              <Action icon={RotateCcw} label="Reinstate" tone="emerald"
                onClick={() => setConfirming('reinstate')} />
            ) : (
              <Action icon={Ban} label="Suspend" tone="rose"
                onClick={() => setConfirming('suspend')} />
            )}
          </Group>
        </div>
      )}
    </div>
  );
}

const CONFIRM_LABEL: Record<string, string> = {
  'kyc-approve': 'Approve this courier’s identity check?',
  'kyc-reject': 'Reject this courier’s identity check?',
  background: 'Record the background check as passed?',
  training: 'Record training as passed?',
  traveler: 'Promote this courier to Traveler?',
  pro: 'Promote this courier to Pro?',
  reinstate: 'Reinstate this courier?',
  suspend: 'Suspend this courier? They stop receiving work immediately.',
};

function Check({ label, at }: { label: string; at?: string | null }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-text-muted">{label}</dt>
      <dd className={at ? 'text-emerald-300' : 'text-text-muted'}>
        {at ? new Date(at).toLocaleDateString() : 'Not yet'}
      </dd>
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-extrabold uppercase tracking-wider text-text-muted">{title}</p>
      <div className="mt-1.5 flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Action({
  icon: Icon,
  label,
  tone,
  onClick,
}: {
  icon: typeof BadgeCheck;
  label: string;
  tone: 'emerald' | 'rose' | 'neutral';
  onClick: () => void;
}) {
  const styles = {
    emerald: 'border-emerald-400/25 text-emerald-300 hover:bg-emerald-400/10',
    rose: 'border-rose-400/25 text-rose-300 hover:bg-rose-400/10',
    neutral: 'border-border-medium text-text-secondary hover:bg-bg-elevated',
  }[tone];

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-card border-thin px-3 py-2 text-xs font-bold ${styles}`}
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={1.6} />
      {label}
    </button>
  );
}

export { CouriersPage as Component };
