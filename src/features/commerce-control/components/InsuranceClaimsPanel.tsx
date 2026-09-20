import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { AlertTriangle, Check, Loader2, Search, ShieldQuestion } from 'lucide-react';
import { stylemintInsuranceApi } from '../api/stylemint-insurance.api';
import { ReportPanel } from './ReportPanel';

/**
 * Partnership insurance, and the PayoutsOps decision on a claim.
 *
 * It sits with payouts because it is the same job and the same role: money the platform owes,
 * decided by PayoutsOps.
 *
 * Keyed on a partnership id, because the backend serves no queue of claims awaiting review — the
 * cover and its claims are readable only per partnership. The panel asks for the id rather than
 * faking a picker over a list that does not exist.
 *
 * Settlement is left blank by default and sent absent rather than zero: an approval with no
 * figure means the amount is settled elsewhere, where sending 0 would record a decision to pay
 * nothing.
 */
export function InsuranceClaimsPanel() {
  const [partnershipDraft, setPartnershipDraft] = useState('');
  const [partnershipId, setPartnershipId] = useState('');

  const cover = useQuery({
    queryKey: ['stylemint-insurance-cover', partnershipId],
    queryFn: () => stylemintInsuranceApi.cover(partnershipId),
    enabled: !!partnershipId,
    retry: false,
  });

  const claims = useQuery({
    queryKey: ['stylemint-insurance-claims', partnershipId],
    queryFn: () => stylemintInsuranceApi.claims(partnershipId),
    enabled: !!partnershipId,
    retry: false,
  });

  return (
    <div className="space-y-3">
      <div className="rounded-frame border-thin border-border-subtle bg-bg-card p-4">
        <p className="flex items-center gap-2 text-sm font-black text-text-primary">
          <ShieldQuestion className="h-4 w-4 text-brand" strokeWidth={1.6} />
          Cover and claims on one partnership
        </p>
        <p className="mt-1 text-[11px] text-text-muted">
          There is no platform-wide queue of claims awaiting review — cover and claims are readable
          only per partnership, so this asks for the id rather than faking a picker.
        </p>
        <div className="mt-2 flex gap-2">
          <input
            value={partnershipDraft}
            onChange={(e) => setPartnershipDraft(e.target.value)}
            placeholder="Partnership id"
            className={`${field} flex-1 font-mono`}
          />
          <button
            disabled={!partnershipDraft.trim()}
            onClick={() => setPartnershipId(partnershipDraft.trim())}
            className="flex items-center gap-1.5 rounded-sm bg-brand px-3 py-2 text-xs font-bold text-bg hover:bg-brand-light disabled:opacity-40"
          >
            <Search className="h-3.5 w-3.5" strokeWidth={1.6} /> Open
          </button>
        </div>
      </div>

      {partnershipId && (
        <>
          <ReportPanel
            title="Cover"
            query={cover}
            emptyNote="This partnership holds no cover."
          />
          <ReportPanel
            title="Claims"
            query={claims}
            emptyNote="No claim has been filed against this cover."
          />
        </>
      )}

      <ReviewForm />
    </div>
  );
}

function ReviewForm() {
  const [claimId, setClaimId] = useState('');
  const [approved, setApproved] = useState(true);
  const [notes, setNotes] = useState('');
  const [settlement, setSettlement] = useState('');

  const review = useMutation({
    mutationFn: () =>
      stylemintInsuranceApi.reviewClaim(claimId.trim(), {
        approved,
        notes,
        settlementAmount: settlement === '' ? undefined : Number(settlement),
      }),
  });

  const settlementValid = settlement === '' || Number.isFinite(Number(settlement));
  // Notes are required on a refusal: a claim turned down with no stated reason is not a decision
  // anyone can answer for later.
  const ready = !!claimId.trim() && settlementValid && (approved || !!notes.trim());

  return (
    <div className="rounded-frame border-thin border-border-subtle bg-bg-card p-4">
      <p className="text-[11px] font-bold uppercase tracking-wide text-text-secondary">
        Decide a claim
      </p>
      <p className="mt-1 text-[11px] text-text-muted">
        Takes the PayoutsOps role. Leave the settlement blank when the amount is settled elsewhere
        — blank is sent as no figure, not as zero.
      </p>

      <div className="mt-2 grid gap-2 sm:grid-cols-3">
        <input
          value={claimId}
          onChange={(e) => setClaimId(e.target.value)}
          placeholder="Claim id from the claims above"
          className={`${field} font-mono sm:col-span-2`}
        />
        <input
          type="number"
          step="any"
          min={0}
          value={settlement}
          onChange={(e) => setSettlement(e.target.value)}
          placeholder="Settlement (optional)"
          className={field}
        />
        <div className="flex gap-1.5 sm:col-span-3">
          <button
            onClick={() => setApproved(true)}
            className={`rounded-sm border-thin px-3 py-1.5 text-[11px] font-bold ${
              approved
                ? 'border-border-glow bg-brand-soft text-brand'
                : 'border-border-subtle text-text-secondary hover:bg-glass-2'
            }`}
          >
            Approve
          </button>
          <button
            onClick={() => setApproved(false)}
            className={`rounded-sm border-thin px-3 py-1.5 text-[11px] font-bold ${
              !approved
                ? 'border-rose-400/40 bg-rose-400/5 text-rose-300'
                : 'border-border-subtle text-text-secondary hover:bg-glass-2'
            }`}
          >
            Refuse
          </button>
        </div>
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={approved ? 'Notes (optional)' : 'Why it is refused (required)'}
          className={`${field} sm:col-span-3`}
        />
      </div>

      <button
        disabled={!ready || review.isPending}
        onClick={() => review.mutate()}
        className="mt-2 flex items-center gap-1.5 rounded-sm bg-brand px-3 py-1.5 text-xs font-bold text-bg hover:bg-brand-light disabled:opacity-40"
      >
        {review.isPending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.6} />
        ) : (
          <Check className="h-3.5 w-3.5" strokeWidth={1.6} />
        )}
        Record decision
      </button>

      {review.isError && (
        <div className="mt-2 flex items-start gap-2 rounded-sm border-thin border-rose-400/25 bg-rose-400/5 p-2.5">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-300" strokeWidth={1.6} />
          <p className="text-xs text-text-secondary">{describe(review.error)}</p>
        </div>
      )}
      {review.isSuccess && (
        <p className="mt-2 rounded-sm border-thin border-border-glow bg-brand-soft p-2.5 text-xs text-text-secondary">
          The decision is recorded.
        </p>
      )}
    </div>
  );
}

/** The api client signals absence with codes rather than prose, so each caller says it its own way. */
function describe(error: unknown): string {
  if (!(error instanceof Error)) return 'Something went wrong.';
  if (error.message === 'NOT_DEPLOYED') {
    return 'This Stylemint build does not serve insurance claims yet.';
  }
  if (error.message === 'NOT_FOUND') return 'No claim matches that identifier.';
  return error.message;
}

const field =
  'w-full rounded-sm border-thin border-border-subtle bg-bg-input px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:border-border-glow focus:outline-none';
