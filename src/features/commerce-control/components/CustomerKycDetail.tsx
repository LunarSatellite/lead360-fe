import { useState } from 'react';
import { useMutation, useQueries } from '@tanstack/react-query';
import { AlertTriangle, ExternalLink, Images, Loader2 } from 'lucide-react';
import {
  DECISION_LABEL,
  REASON_CODE_LABEL,
  stylemintKycApi,
  type KycApplicationDetail,
  type KycApplicationDocument,
  type KycPreviousAttempt,
  type KycReasonCode,
} from '../api/stylemint-kyc.api';
import {
  COMPARISON_SLOT_LABEL,
  IDENTITY_DOCUMENT_LABEL,
  ageInYears,
  arrangeForComparison,
  formatDateOfBirth,
  maskedDocumentNumber,
  missingSlots,
  type ComparisonSlot,
} from '../lib/kyc-review';

/**
 * A buyer's Tier-2 identity check (EMI phase 1): who they say they are, and the photographs
 * that are supposed to prove it.
 *
 * The check is a comparison — does the face on the ID match the selfie, does the name and date
 * of birth match what was typed — so the images sit side by side rather than as a list of
 * filenames to open one tab at a time.
 *
 * They load on the reviewer's request, not on mount. Each image's location is asked for
 * separately (as on the courier panel), so the URL of someone's citizenship scan is disclosed
 * only when a reviewer chooses to look at it — not merely because a row was clicked.
 */
export function CustomerKycDetail({ detail }: { detail: KycApplicationDetail }) {
  const age = ageInYears(detail.dateOfBirth);
  const number = maskedDocumentNumber(detail);
  const identity = detail.documentType ?? null;
  const address = [detail.addressLine, detail.city, detail.postalCode, detail.countryCode]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="space-y-3 rounded-card border-thin border-border-subtle bg-bg-elevated p-3">
      <dl className="space-y-1 text-[11px]">
        <Field label="Full name" value={detail.fullName || detail.displayName || null} />
        <Field
          label="Date of birth"
          value={
            detail.dateOfBirth
              ? `${formatDateOfBirth(detail.dateOfBirth)}${age !== null ? ` · ${age} years` : ''}`
              : null
          }
          // Under 18 is a contract refusal at submission; one reaching the queue anyway is a
          // reason to reject as UNDERAGE, and easy to approve past without this.
          tone={age !== null && age < 18 ? 'danger' : undefined}
        />
        <Field label="ID type" value={identity ? (IDENTITY_DOCUMENT_LABEL[identity] ?? identity) : null} />
        <Field label="ID number" value={number} mono />
        <Field label="Address" value={address || null} />
        <Field label="Submitted" value={new Date(detail.submittedUtc).toLocaleString()} />
      </dl>

      {age !== null && age < 18 && (
        <p className="text-[11px] font-bold text-danger">
          The date of birth makes this buyer {age}. EMI needs 18 or over — reject as
          <span className="font-mono"> UNDERAGE</span>.
        </p>
      )}

      <DocumentComparison kycItemId={detail.kycItemId} identity={identity} documents={detail.documents} />

      <PreviousAttempts attempts={detail.previousAttempts ?? []} />
    </div>
  );
}

function Field({
  label,
  value,
  tone,
  mono,
}: {
  label: string;
  value: string | null;
  tone?: 'danger';
  mono?: boolean;
}) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="shrink-0 text-text-muted">{label}</dt>
      <dd
        className={`text-right ${mono ? 'font-mono' : ''} ${
          value === null
            ? 'italic text-text-muted'
            : tone === 'danger'
              ? 'font-bold text-danger'
              : 'text-text-secondary'
        }`}
      >
        {/* "Not provided" rather than a blank: a reviewer has to be able to tell a field the
            backend did not send from one the buyer left empty — both are reasons not to approve. */}
        {value ?? 'Not provided'}
      </dd>
    </div>
  );
}

function DocumentComparison({
  kycItemId,
  identity,
  documents,
}: {
  kycItemId: string;
  identity: string | null;
  documents: KycApplicationDocument[];
}) {
  const [shown, setShown] = useState(false);
  const { placed, unplaced } = arrangeForComparison(documents);
  const missing = missingSlots(identity, placed);

  // One query per image so each fails or loads on its own. Signed links expire, so a link is
  // not kept around after the panel closes.
  const links = useQueries({
    queries: placed.map(({ document }) => ({
      queryKey: ['stylemint-kyc-document-link', kycItemId, document.id],
      queryFn: () => stylemintKycApi.documentLink(kycItemId, document.id),
      enabled: shown,
      staleTime: 60_000,
      gcTime: 0,
    })),
  });

  const idSide = placed.filter(({ slot }) => slot !== 'selfie');
  const selfie = placed.find(({ slot }) => slot === 'selfie');
  const linkFor = (documentId: string) => links[placed.findIndex((p) => p.document.id === documentId)];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-text-muted">
          Identity documents ({documents.length})
        </p>
        {placed.length > 0 && !shown && (
          <button
            onClick={() => setShown(true)}
            className="flex items-center gap-1.5 rounded-sm border-thin border-border-medium px-2 py-1 text-[11px] font-bold text-text-secondary hover:bg-glass-2 hover:text-text-primary"
          >
            <Images className="h-3.5 w-3.5" strokeWidth={1.6} />
            Show side by side
          </button>
        )}
      </div>

      {missing.length > 0 && (
        <div className="flex items-start gap-2 rounded-card border-thin border-warning/25 bg-warning-soft p-2.5">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" strokeWidth={1.6} />
          <p className="text-[11px] text-text-secondary">
            Missing: {missing.map((slot) => COMPARISON_SLOT_LABEL[slot]).join(', ')}. Without it
            there is nothing to compare — reject as <span className="font-mono">DOCS_UNCLEAR</span>{' '}
            so the buyer can upload it.
          </p>
        </div>
      )}

      {shown && placed.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            {idSide.map(({ slot, document }) => (
              <DocumentImage key={document.id} slot={slot} link={linkFor(document.id)} />
            ))}
            {idSide.length === 0 && <EmptySlot label="No ID image" />}
          </div>
          <div>
            {selfie ? (
              <DocumentImage slot="selfie" link={linkFor(selfie.document.id)} />
            ) : (
              <EmptySlot label="No selfie" />
            )}
          </div>
        </div>
      )}

      {!shown && placed.length > 0 && (
        <ul className="space-y-1">
          {placed.map(({ slot, document }) => (
            <li
              key={document.id}
              className="flex items-center justify-between gap-2 rounded-sm border-thin border-border-subtle px-2 py-1.5 text-[11px]"
            >
              <span className="font-bold text-text-primary">{COMPARISON_SLOT_LABEL[slot]}</span>
              <span className="text-[10px] text-text-muted">{document.status}</span>
            </li>
          ))}
        </ul>
      )}

      {unplaced.length > 0 && <OtherDocuments kycItemId={kycItemId} documents={unplaced} />}
    </div>
  );
}

type LinkQuery = { data?: string; isLoading: boolean; isError: boolean; error: unknown };

function DocumentImage({ slot, link }: { slot: ComparisonSlot; link: LinkQuery | undefined }) {
  const label = COMPARISON_SLOT_LABEL[slot];
  return (
    <figure className="space-y-1">
      <div className="flex aspect-[3/4] items-center justify-center overflow-hidden rounded-sm border-thin border-border-subtle bg-bg-card">
        {link?.isLoading && <Loader2 className="h-4 w-4 animate-spin text-text-muted" strokeWidth={1.6} />}
        {link?.isError && (
          <p className="p-2 text-center text-[10px] text-danger">
            {link.error instanceof Error ? link.error.message : 'The image could not be loaded.'}
          </p>
        )}
        {link?.data && (
          <a href={link.data} target="_blank" rel="noopener noreferrer" className="h-full w-full">
            <img src={link.data} alt={label} className="h-full w-full object-contain" />
          </a>
        )}
      </div>
      <figcaption className="text-[10px] font-bold text-text-muted">{label}</figcaption>
    </figure>
  );
}

function EmptySlot({ label }: { label: string }) {
  return (
    <div className="flex aspect-[3/4] items-center justify-center rounded-sm border-thin border-dashed border-border-subtle text-[10px] text-text-muted">
      {label}
    </div>
  );
}

/** Documents that could not be placed in the comparison — still reachable, one at a time. */
function OtherDocuments({
  kycItemId,
  documents,
}: {
  kycItemId: string;
  documents: KycApplicationDocument[];
}) {
  const open = useMutation({
    mutationFn: (document: KycApplicationDocument) =>
      stylemintKycApi.documentLink(kycItemId, document.id),
    onSuccess: (url) => window.open(url, '_blank', 'noopener,noreferrer'),
  });

  return (
    <div className="space-y-1">
      <p className="text-[10px] text-text-muted">Other uploads</p>
      {documents.map((document) => (
        <button
          key={document.id}
          onClick={() => open.mutate(document)}
          disabled={open.isPending}
          className="flex w-full items-center gap-2 rounded-sm border-thin border-border-subtle px-2 py-1.5 text-left hover:bg-bg-card disabled:opacity-60"
        >
          <ExternalLink className="h-3.5 w-3.5 shrink-0 text-text-muted" strokeWidth={1.6} />
          <span className="min-w-0 flex-1 truncate text-[11px] font-bold text-text-primary">
            {document.kind ?? document.documentType}
          </span>
          <span className="shrink-0 text-[10px] text-text-muted">{document.status}</span>
        </button>
      ))}
      {open.isError && (
        <p className="text-[11px] text-danger">{(open.error as Error).message}</p>
      )}
    </div>
  );
}

function decisionLabel(decision: KycPreviousAttempt['decision']): string {
  if (typeof decision === 'number') return DECISION_LABEL[decision] ?? 'Decided';
  if (decision === 'Approved') return DECISION_LABEL[1];
  if (decision === 'RejectedRetryable') return DECISION_LABEL[2];
  if (decision === 'RejectedTerminal') return DECISION_LABEL[3];
  return decision ?? 'Decided';
}

/**
 * Earlier submissions by the same buyer. A second attempt that fixes the reason the first was
 * rejected for is the normal case; a third with the same problem is worth noticing.
 */
function PreviousAttempts({ attempts }: { attempts: KycPreviousAttempt[] }) {
  if (attempts.length === 0) return null;
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-text-muted">
        Previous attempts ({attempts.length})
      </p>
      <ul className="mt-1.5 space-y-1">
        {attempts.map((attempt, index) => (
          <li
            key={attempt.kycItemId ?? `${attempt.submittedUtc}-${index}`}
            className="rounded-sm border-thin border-border-subtle px-2 py-1.5 text-[11px]"
          >
            <div className="flex justify-between gap-2">
              <span className="font-bold text-text-primary">{decisionLabel(attempt.decision)}</span>
              <span className="text-[10px] text-text-muted">
                {new Date(attempt.decidedUtc ?? attempt.submittedUtc).toLocaleDateString()}
              </span>
            </div>
            {attempt.decisionReasonCode && (
              <p className="mt-0.5 text-[10px] text-text-secondary">
                {REASON_CODE_LABEL[attempt.decisionReasonCode as KycReasonCode] ??
                  attempt.decisionReasonCode}
              </p>
            )}
            {attempt.decisionNote && (
              <p className="mt-0.5 text-[10px] text-text-muted">{attempt.decisionNote}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
