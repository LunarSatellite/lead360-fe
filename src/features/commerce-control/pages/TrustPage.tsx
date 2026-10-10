import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  AlertTriangle,
  BadgeCheck,
  Gauge,
  Info,
  Loader2,
  ScrollText,
  ShieldOff,
  Sparkles,
} from 'lucide-react';
import {
  COMPLETED_ASSURANCE_OUTCOMES,
  PASSPORT_ASSURANCE_LABEL,
  PassportAssurance,
  REPUTATION_FACET_LABEL,
  ReputationFacet,
  stylemintTrustApi,
  type PassportAssuranceValue,
  type ReputationFacetValue,
} from '../api/stylemint-trust.api';

/**
 * Trust: profile verification, reputation, and product-passport claims.
 *
 * Every action here takes an id, because the backend exposes no queue for any of them — there is
 * no unverified-vendors list, no accounts-needing-recomputation list and no passport-claim review
 * queue. Rather than fake a queue, the page is explicit: paste the id you already have, from the
 * customers page, an application or a support ticket.
 *
 * Each panel names the role it needs, because they differ per action and a 403 here is otherwise
 * indistinguishable from a broken page.
 */
export function TrustPage() {
  return (
    <div className="mx-auto max-w-[1500px] space-y-5">
      <div>
        <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-brand">
          Stylemint commerce platform
        </p>
        <h1 className="mt-2 flex items-center gap-2 text-2xl font-black tracking-tight text-text-primary">
          <BadgeCheck className="h-5 w-5 text-brand" strokeWidth={1.6} />
          Trust &amp; verification
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          Verify a profile, recompute a reputation, revoke a badge, or record a passport-claim
          check.
        </p>
      </div>

      <div className="flex items-start gap-2.5 rounded-card border-thin border-border-subtle bg-glass-1 p-3">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-text-muted" strokeWidth={1.6} />
        <p className="text-xs text-text-muted">
          These are id-driven on purpose — the backend serves no queue behind any of them. Bring
          the account, award or record id from the customers page, an application, or the ticket
          that raised the question.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <VerificationPanel />
        <ReputationPanel />
        <BadgePanel />
        <PassportPanel />
      </div>
    </div>
  );
}

function Panel({
  title,
  role,
  icon: Icon,
  blurb,
  children,
}: {
  title: string;
  role: string;
  icon: typeof BadgeCheck;
  blurb: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-frame border-thin border-border-subtle bg-bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-black text-text-primary">
            <Icon className="h-4 w-4 text-brand" strokeWidth={1.6} />
            {title}
          </p>
          <p className="mt-1 text-[11px] text-text-muted">{blurb}</p>
        </div>
        <span className="shrink-0 rounded-xs border-thin border-border-subtle bg-glass-2 px-1.5 py-0.5 text-[10px] font-bold text-text-secondary">
          {role}
        </span>
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function Result({ error, ok }: { error: string | null; ok: string | null }) {
  if (error) {
    return (
      <div className="mt-2 flex items-start gap-2 rounded-sm border-thin border-rose-400/25 bg-rose-400/5 p-2.5">
        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-300" strokeWidth={1.6} />
        <p className="text-xs text-text-secondary">{error}</p>
      </div>
    );
  }
  if (ok) {
    return (
      <p className="mt-2 rounded-sm border-thin border-border-glow bg-brand-soft p-2.5 text-xs text-text-secondary">
        {ok}
      </p>
    );
  }
  return null;
}

const input =
  'w-full rounded-sm border-thin border-border-subtle bg-bg-input px-3 py-2 font-mono text-xs text-text-primary placeholder:text-text-muted focus:border-border-glow focus:outline-none';
const plain =
  'w-full rounded-sm border-thin border-border-subtle bg-bg-input px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:border-border-glow focus:outline-none';
const primary =
  'flex items-center gap-1.5 rounded-sm bg-brand px-3 py-1.5 text-xs font-bold text-bg hover:bg-brand-light disabled:opacity-40';
const ghost =
  'flex items-center gap-1.5 rounded-sm border-thin border-border-medium px-3 py-1.5 text-xs font-bold text-text-secondary hover:bg-glass-2 hover:text-text-primary disabled:opacity-40';

function VerificationPanel() {
  const [accountId, setAccountId] = useState('');
  const [kind, setKind] = useState<'vendor' | 'creator'>('vendor');
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const act = useMutation({
    mutationFn: async (verified: boolean) => {
      const id = accountId.trim();
      return kind === 'vendor'
        ? stylemintTrustApi.setVendorVerified(id, verified)
        : stylemintTrustApi.setCreatorVerified(id, verified);
    },
    onSuccess: (result) => {
      setError(null);
      setOk(
        result.isVerified
          ? `Verified${result.verifiedUtc ? ` at ${new Date(result.verifiedUtc).toLocaleString()}` : ''}.`
          : 'Verification removed.',
      );
    },
    onError: (caught: unknown) => {
      setOk(null);
      setError(caught instanceof Error ? caught.message : 'The profile could not be changed.');
    },
  });

  return (
    <Panel
      title="Profile verification"
      role="KycReviewer"
      icon={BadgeCheck}
      blurb="The verified mark on a vendor or creator profile."
    >
      <div className="flex gap-1.5">
        {(['vendor', 'creator'] as const).map((k) => (
          <button
            key={k}
            onClick={() => setKind(k)}
            className={`rounded-sm border-thin px-3 py-1.5 text-xs font-bold capitalize ${
              kind === k
                ? 'border-border-glow bg-brand-soft text-brand'
                : 'border-border-subtle text-text-secondary hover:bg-glass-2'
            }`}
          >
            {k}
          </button>
        ))}
      </div>
      <input
        value={accountId}
        onChange={(e) => setAccountId(e.target.value)}
        placeholder="Account id"
        className={`mt-2 ${input}`}
      />
      <div className="mt-2 flex items-center gap-1.5">
        <button
          disabled={!accountId.trim() || act.isPending}
          onClick={() => act.mutate(true)}
          className={primary}
        >
          {act.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.6} />}
          Verify
        </button>
        <button
          disabled={!accountId.trim() || act.isPending}
          onClick={() => act.mutate(false)}
          className={ghost}
        >
          Unverify
        </button>
      </div>
      <Result error={error} ok={ok} />
    </Panel>
  );
}

function ReputationPanel() {
  const [accountId, setAccountId] = useState('');
  const [facet, setFacet] = useState<ReputationFacetValue | ''>('');
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const act = useMutation({
    mutationFn: () =>
      stylemintTrustApi.recomputeReputation(
        accountId.trim(),
        facet === '' ? undefined : (facet as ReputationFacetValue),
      ),
    onSuccess: () => {
      setError(null);
      setOk(
        facet === ''
          ? 'Every facet recomputed for this account.'
          : `${REPUTATION_FACET_LABEL[facet]} recomputed.`,
      );
    },
    onError: (caught: unknown) => {
      setOk(null);
      setError(caught instanceof Error ? caught.message : 'The recompute failed.');
    },
  });

  return (
    <Panel
      title="Reputation"
      role="SupportAgent / ContentMod"
      icon={Gauge}
      blurb="Recompute a facet from the underlying events. Leave the facet blank to do all of them."
    >
      <input
        value={accountId}
        onChange={(e) => setAccountId(e.target.value)}
        placeholder="Account id"
        className={input}
      />
      <select
        value={facet}
        onChange={(e) => setFacet(e.target.value === '' ? '' : (Number(e.target.value) as ReputationFacetValue))}
        className={`mt-2 ${plain}`}
      >
        <option value="">Every facet</option>
        {(Object.values(ReputationFacet) as ReputationFacetValue[]).map((value) => (
          <option key={value} value={value}>
            {REPUTATION_FACET_LABEL[value]}
          </option>
        ))}
      </select>
      <button
        disabled={!accountId.trim() || act.isPending}
        onClick={() => act.mutate()}
        className={`mt-2 ${primary}`}
      >
        {act.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.6} />}
        Recompute
      </button>
      <Result error={error} ok={ok} />
    </Panel>
  );
}

function BadgePanel() {
  const [awardId, setAwardId] = useState('');
  const [reason, setReason] = useState('');
  const [override, setOverride] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const revoke = useMutation({
    mutationFn: () => stylemintTrustApi.revokeBadge(awardId.trim(), reason.trim(), override),
    onSuccess: () => {
      setError(null);
      setOk('Badge revoked.');
      setAwardId('');
      setReason('');
    },
    onError: (caught: unknown) => {
      setOk(null);
      setError(caught instanceof Error ? caught.message : 'The badge could not be revoked.');
    },
  });

  const seed = useMutation({
    mutationFn: () => stylemintTrustApi.seedBadgeDefinitions(),
    onSuccess: (result) => {
      setError(null);
      setOk(`Badge definitions seeded. ${JSON.stringify(result)}`);
    },
    onError: (caught: unknown) => {
      setOk(null);
      setError(caught instanceof Error ? caught.message : 'Seeding failed.');
    },
  });

  return (
    <Panel
      title="Badges"
      role="ContentMod / SuperAdmin"
      icon={Sparkles}
      blurb="Revoke an awarded badge, or seed the definitions. Seeding is idempotent."
    >
      <input
        value={awardId}
        onChange={(e) => setAwardId(e.target.value)}
        placeholder="Award id"
        className={input}
      />
      <input
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Reason for revoking"
        className={`mt-2 ${plain}`}
      />
      <label className="mt-2 flex items-center gap-2 text-[11px] text-text-muted">
        <input
          type="checkbox"
          checked={override}
          onChange={(e) => setOverride(e.target.checked)}
          className="h-3.5 w-3.5 accent-brand-glow"
        />
        SuperAdmin override — revoke a badge the normal rules protect
      </label>
      <div className="mt-2 flex items-center gap-1.5">
        <button
          disabled={!awardId.trim() || !reason.trim() || revoke.isPending}
          onClick={() => revoke.mutate()}
          className={ghost}
        >
          {revoke.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.6} />
          ) : (
            <ShieldOff className="h-3.5 w-3.5" strokeWidth={1.6} />
          )}
          Revoke
        </button>
        <button disabled={seed.isPending} onClick={() => seed.mutate()} className={ghost}>
          {seed.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.6} />}
          Seed definitions
        </button>
      </div>
      <Result error={error} ok={ok} />
    </Panel>
  );
}

function PassportPanel() {
  const [recordId, setRecordId] = useState('');
  const [outcome, setOutcome] = useState<PassportAssuranceValue>(PassportAssurance.Verified);
  const [method, setMethod] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const act = useMutation({
    mutationFn: () =>
      stylemintTrustApi.verifyPassportClaim(
        recordId.trim(),
        outcome,
        method.trim(),
        note.trim(),
      ),
    onSuccess: () => {
      setError(null);
      setOk(`Recorded as ${PASSPORT_ASSURANCE_LABEL[outcome]}.`);
    },
    onError: (caught: unknown) => {
      setOk(null);
      setError(caught instanceof Error ? caught.message : 'The check could not be recorded.');
    },
  });

  // The backend requires a note whenever the check did not succeed — a failure without a finding
  // is not evidence either.
  const noteRequired = outcome !== PassportAssurance.Verified;
  const valid = recordId.trim() && method.trim() && (!noteRequired || note.trim());

  return (
    <Panel
      title="Passport claims"
      role="KycReviewer / SuperAdmin"
      icon={ScrollText}
      blurb="Record what checking a product-passport claim found. A verdict without a method is not evidence."
    >
      <input
        value={recordId}
        onChange={(e) => setRecordId(e.target.value)}
        placeholder="Passport record id"
        className={input}
      />
      <select
        value={outcome}
        onChange={(e) => setOutcome(Number(e.target.value) as PassportAssuranceValue)}
        className={`mt-2 ${plain}`}
      >
        {COMPLETED_ASSURANCE_OUTCOMES.map((value) => (
          <option key={value} value={value}>
            {PASSPORT_ASSURANCE_LABEL[value]}
          </option>
        ))}
      </select>
      <input
        value={method}
        onChange={(e) => setMethod(e.target.value)}
        placeholder="How the check was carried out (required)"
        className={`mt-2 ${plain}`}
      />
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder={noteRequired ? 'What the check found (required)' : 'What the check found (optional)'}
        className={`mt-2 ${plain}`}
      />
      <button
        disabled={!valid || act.isPending}
        onClick={() => act.mutate()}
        className={`mt-2 ${primary}`}
      >
        {act.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.6} />}
        Record check
      </button>
      <Result error={error} ok={ok} />
    </Panel>
  );
}

export { TrustPage as Component };
