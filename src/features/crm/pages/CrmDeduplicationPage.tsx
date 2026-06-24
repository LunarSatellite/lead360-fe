import { GitMerge, Loader2, RefreshCw, X, Check } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useDedupPending, useResolveDedup, useScanDedup } from '../api/crm.queries';
import type { CrmDedupCandidateDto, CrmDedupContactInfo } from '../types/crm.types';
import { CRM_CONTACT_SOURCE_LABELS } from '../types/crm.types';

const NULL_GUID = '00000000-0000-0000-0000-000000000000';

// ─── Contact column ───────────────────────────────────────────────────────────

function ContactColumn({
  info, isWinner,
}: {
  info: CrmDedupContactInfo | undefined;
  name: string;
  isWinner: boolean;
}) {
  return (
    <div className={`flex-1 rounded-xl p-4 border transition-all ${
      isWinner
        ? 'border-brand bg-brand/5'
        : 'border-border-subtle bg-bg-elevated'
    }`}>
      {isWinner && (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-brand uppercase tracking-wider mb-2">
          <Check className="w-3 h-3" /> Winner
        </span>
      )}
      <p className="text-sm font-bold text-text-primary truncate">{info?.fullName ?? '—'}</p>
      <div className="mt-2 space-y-1">
        <Row label="Email" value={info?.email} />
        <Row label="Phone" value={info?.phone} />
        <Row label="Title" value={info?.jobTitle} />
        <Row label="Source" value={info ? CRM_CONTACT_SOURCE_LABELS[info.sourceKind] : undefined} />
        <Row label="Added" value={info ? formatDistanceToNow(new Date(info.createdAt), { addSuffix: true }) : undefined} />
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex gap-2 text-xs">
      <span className="w-12 shrink-0 text-text-muted">{label}</span>
      <span className={value ? 'text-text-secondary' : 'text-text-muted'}>{value ?? '—'}</span>
    </div>
  );
}

// ─── Candidate card ───────────────────────────────────────────────────────────

function CandidateCard({
  candidate,
  resolving,
  onKeepA,
  onKeepB,
  onNotDup,
}: {
  candidate: CrmDedupCandidateDto;
  resolving: boolean;
  onKeepA: () => void;
  onKeepB: () => void;
  onNotDup: () => void;
}) {
  const pct = Math.round(candidate.similarityScore * 100);

  return (
    <div className="bg-bg-card border border-border-subtle rounded-2xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <GitMerge className="w-4 h-4 text-brand" />
          <span className="text-sm font-bold text-text-primary">
            {candidate.contactAName} · {candidate.contactBName}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 w-24 h-1.5 rounded-full bg-bg-elevated overflow-hidden">
            <div
              className="h-full rounded-full bg-brand"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-xs font-bold text-brand">{pct}% match</span>
        </div>
      </div>

      {/* Match reasons */}
      {candidate.matchReasons.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {candidate.matchReasons.map((r, i) => (
            <span key={i} className="px-2 py-0.5 text-[10px] bg-bg-elevated border border-border-subtle rounded-lg text-text-secondary">
              {r}
            </span>
          ))}
        </div>
      )}

      {/* Side-by-side contacts */}
      <div className="flex gap-3">
        <ContactColumn
          name={candidate.contactAName}
          info={candidate.contactADetail}
          isWinner={false}
        />
        <ContactColumn
          name={candidate.contactBName}
          info={candidate.contactBDetail}
          isWinner={false}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2 flex-wrap pt-1">
        <button
          onClick={onKeepA}
          disabled={resolving}
          className="flex-1 min-w-[120px] py-2 rounded-xl text-xs font-bold border border-brand text-brand hover:bg-brand hover:text-bg disabled:opacity-50 transition-all"
        >
          {resolving ? <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" /> : `Keep "${candidate.contactAName}"`}
        </button>
        <button
          onClick={onKeepB}
          disabled={resolving}
          className="flex-1 min-w-[120px] py-2 rounded-xl text-xs font-bold border border-brand text-brand hover:bg-brand hover:text-bg disabled:opacity-50 transition-all"
        >
          {resolving ? <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" /> : `Keep "${candidate.contactBName}"`}
        </button>
        <button
          onClick={onNotDup}
          disabled={resolving}
          className="px-4 py-2 rounded-xl text-xs font-semibold border border-border-subtle text-text-muted hover:text-text-primary hover:border-border-medium disabled:opacity-50 transition-all"
        >
          <X className="w-3.5 h-3.5 inline mr-1" />Not a duplicate
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function Component() {
  const { data: raw, isLoading } = useDedupPending();
  const candidates = (raw as unknown as CrmDedupCandidateDto[]) ?? [];
  const pending = candidates.filter(c => c.status === 1);

  const resolve = useResolveDedup();
  const scan = useScanDedup();

  const handleResolve = (candidateId: string, winnerId: string) => {
    resolve.mutate({ candidateId, winnerId });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-text-primary tracking-tight">Duplicate Contacts</h2>
          <p className="text-xs text-text-muted mt-0.5">
            {isLoading ? 'Loading…' : `${pending.length} pair${pending.length !== 1 ? 's' : ''} pending review`}
          </p>
        </div>
        <button
          onClick={() => scan.mutate()}
          disabled={scan.isPending}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border border-border-subtle bg-bg-elevated text-text-secondary hover:border-border-medium disabled:opacity-50 transition-all"
        >
          {scan.isPending
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : <RefreshCw className="w-3.5 h-3.5" />}
          Scan for duplicates
        </button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-5 h-5 text-brand animate-spin" />
        </div>
      ) : pending.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 gap-3 text-text-muted">
          <GitMerge className="w-8 h-8 opacity-30" strokeWidth={1.2} />
          <p className="text-sm">No duplicate pairs found</p>
          <p className="text-xs">Click "Scan for duplicates" to check</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pending.map(c => (
            <CandidateCard
              key={c.id}
              candidate={c}
              resolving={resolve.isPending && resolve.variables?.candidateId === c.id}
              onKeepA={() => handleResolve(c.id, c.contactAId)}
              onKeepB={() => handleResolve(c.id, c.contactBId)}
              onNotDup={() => handleResolve(c.id, NULL_GUID)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
