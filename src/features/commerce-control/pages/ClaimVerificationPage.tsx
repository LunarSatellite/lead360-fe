import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BadgeCheck, Copy, Loader2, RefreshCw, XCircle } from 'lucide-react';
import {
  stylemintDimensionsApi,
  type PendingDimensionClaim,
} from '../api/stylemint-dimensions.api';
import { useAuth } from '@/shared/hooks/useAuth';
import { UserRole } from '@/features/auth/types/auth.types';
import { Button } from '@/shared/ui/primitives';

/**
 * Claim verification: vendor claims on keys the registry marks verifiable (halal, organic,
 * handmade, eco, made in Nepal …) waiting for an admin.
 *
 * The queue is readable by ContentMod, KycReviewer and Readonly; deciding takes ContentMod or
 * KycReviewer. This console cannot see the operator's Stylemint admin roles, so actions are
 * offered to Lead360 Owners and Admins (the same gate as the vendor console) and the server's
 * 403 is shown as-is when the Stylemint role is missing. Everyone else sees the queue only.
 *
 * The evidence note is for the reviewer's own record while deciding: the verify endpoint has no
 * field for it, so it is NOT sent or stored — the page says so rather than imply otherwise.
 */

export const claimsKey = ['stylemint-admin', 'dimension-claims'];

const claimId = (c: PendingDimensionClaim) => `${c.subjectKind}:${c.subjectId}:${c.key}:${c.value}`;

export function ClaimVerificationPage() {
  const { user } = useAuth();
  const canAct = user?.role === UserRole.Owner || user?.role === UserRole.Admin;
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);

  const claims = useQuery({
    queryKey: claimsKey,
    queryFn: () => stylemintDimensionsApi.pendingClaims(0, 50),
    retry: false,
  });

  const decide = useMutation({
    mutationFn: ({ claim, verified }: { claim: PendingDimensionClaim; verified: boolean }) =>
      stylemintDimensionsApi.verifyClaim({
        subjectKind: claim.subjectKind,
        subjectId: claim.subjectId,
        key: claim.key,
        value: claim.value,
        verified,
      }),
    onSuccess: async (_data, { claim, verified }) => {
      setMessage(`${claim.label}: ${claim.value} ${verified ? 'verified' : 'rejected'}.`);
      await queryClient.invalidateQueries({ queryKey: claimsKey });
    },
  });

  const items = claims.data?.items ?? [];

  return (
    <div className="flex flex-col gap-4 p-4">
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-xl font-black text-text-primary">Claim verification</h1>
          <p className="text-xs text-text-muted">
            Vendor claims shoppers rely on — halal, organic, handmade, eco, origin — stay “Pending
            verification” on the product until verified here.
          </p>
        </div>
        <Button size="sm" variant="secondary" onClick={() => claims.refetch()}>
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </Button>
      </header>

      {!canAct && (
        <p className="rounded-xl bg-glass-2 px-4 py-2 text-xs text-text-secondary">
          Read-only: verifying takes the Stylemint ContentMod or KycReviewer role.
        </p>
      )}
      {message && <p className="text-xs font-semibold text-success">{message}</p>}
      {decide.isError && (
        <p className="rounded-xl bg-danger-soft px-4 py-3 text-xs font-semibold text-danger-light">
          {(decide.error as Error).message}
        </p>
      )}

      {claims.isLoading ? (
        <div className="flex h-32 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-brand" />
        </div>
      ) : claims.isError ? (
        <p className="rounded-xl bg-danger-soft px-4 py-3 text-xs font-semibold text-danger-light">
          {(claims.error as Error).message}
        </p>
      ) : items.length === 0 ? (
        <p className="text-sm text-text-muted">No claims are waiting for verification.</p>
      ) : (
        <>
          <p className="text-xs text-text-muted">
            {claims.data?.total ?? items.length} pending
            {claims.data && claims.data.total > items.length ? `, showing ${items.length}` : ''}
          </p>
          <ul className="space-y-2" aria-label="Pending claims">
            {items.map((c) => {
              const id = claimId(c);
              return (
                <li
                  key={id}
                  className="space-y-2 rounded-xl border border-border-subtle bg-bg-card p-3"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-text-primary">{c.label}</span>
                    <span className="rounded-sm bg-brand-soft px-1.5 py-0.5 text-[11px] font-bold text-brand">
                      {c.value.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[11px] text-text-muted">
                      claimed {new Date(c.claimedUtc).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-text-secondary">
                    <span>{c.subjectKind}</span>
                    <code className="font-mono">{c.subjectId}</code>
                    <button
                      type="button"
                      aria-label={`Copy ${c.subjectKind} id`}
                      onClick={() => void navigator.clipboard?.writeText(c.subjectId)}
                      className="rounded-sm p-0.5 hover:bg-glass-2"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                  </div>
                  {canAct && (
                    <div className="flex flex-wrap items-end gap-2">
                      <label className="flex min-w-[240px] flex-1 flex-col gap-1 text-[11px] text-text-muted">
                        Evidence note (for your record — not sent to Stylemint)
                        <input
                          value={notes[id] ?? ''}
                          onChange={(e) => setNotes((n) => ({ ...n, [id]: e.target.value }))}
                          className="rounded-lg border border-border-subtle bg-bg-card px-2 py-1 text-xs text-text-primary"
                          placeholder="Certificate number, document checked…"
                        />
                      </label>
                      <Button
                        size="sm"
                        variant="primary"
                        disabled={decide.isPending}
                        onClick={() => decide.mutate({ claim: c, verified: true })}
                        aria-label={`Verify ${c.label} ${c.value}`}
                      >
                        <BadgeCheck className="h-3.5 w-3.5" /> Verify
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={decide.isPending}
                        onClick={() => decide.mutate({ claim: c, verified: false })}
                        aria-label={`Reject ${c.label} ${c.value}`}
                      >
                        <XCircle className="h-3.5 w-3.5" /> Reject
                      </Button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}

export { ClaimVerificationPage as Component };
