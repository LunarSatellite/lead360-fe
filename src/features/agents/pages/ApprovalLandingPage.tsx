// ═══════════════════════════════════════════════════════════════
// Agents Feature — Approval landing page
// Route: /approvals/:runId?token=<base64url>&decision=approve|reject
//
// Reached via the email link sent to an approver. The flow:
//   1. Read runId, token, decision from the URL
//   2. If not logged in → redirect to /auth/login?return=<this URL>
//   3. Fetch the run detail
//      - 404 → "no longer exists"
//      - terminal status → "already handled" + dashboard CTA
//   4. Show summary card + Confirm button matching the pre-selected
//      decision (approver may also flip it before confirming)
//   5. POST /respond with { token, decision, note }
//   6. Success → "Thanks. Recorded." + dashboard CTA
//   7. 401 / 409 errors get specific copy
//
// SECURITY (spec §6): the token sits in the URL. Don't log it,
// don't echo it to analytics. We never inspect window.location
// outside this file; the token is read once via useSearchParams
// and held in component state.
// ═══════════════════════════════════════════════════════════════

import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Loader2, ShieldCheck, ShieldX, AlertTriangle, ArrowRight, Clock } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ApiError } from '@/shared/lib/api-client';
import { useAgentRun, useRespondToRun } from '../api/agents.queries';
import {
  ApprovalDecision,
  AGENT_RUN_STATUS_LABEL,
  AgentRunStatus,
  isTerminalRunStatus,
  parseDecisionParam,
  type ApprovalDecisionValue,
} from '../types/agents.types';
import {
  approverRespondSchema,
  type ApproverRespondFormData,
} from '../types/agents.schemas';

/* ───────────────────────────────────────────────────────────────
   Auth presence — checked synchronously here. The router does NOT
   wrap this page in <RequireAuth>: the email link points straight
   here, and a logged-out approver still needs to land somewhere
   that knows how to round-trip them through login while preserving
   the ?token= and ?decision= query string.
   ───────────────────────────────────────────────────────────── */
function isLoggedIn(): boolean {
  return !!localStorage.getItem('omniflow_token');
}

/* ───────────────────────────────────────────────────────────────
   Build the /auth/login redirect target. The full target URL
   (path + query) is URL-encoded into a single ?return= param so
   nested ?token=&decision= survives the round-trip.
   ───────────────────────────────────────────────────────────── */
function buildLoginRedirect(currentPath: string, search: string): string {
  const target = `${currentPath}${search}`;
  return `/auth/login?return=${encodeURIComponent(target)}`;
}

/* ═══════════════════════════════════════════════════════════════
   Page component (default export — React Router lazy loader picks
   up the `Component` named export; same convention as other pages.)
   ═══════════════════════════════════════════════════════════════ */
export function Component() {
  const { runId } = useParams<{ runId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // ── Read URL params once on mount and freeze them. We don't want
  // the user accidentally re-triggering effects by typing in the
  // address bar. ────────────────────────────────────────────────
  const [token] = useState<string>(() => searchParams.get('token') ?? '');
  const [urlDecision] = useState<ApprovalDecisionValue | null>(() =>
    parseDecisionParam(searchParams.get('decision')),
  );

  // The approver may flip the decision before confirming. Default
  // to whatever the email link said.
  const [decision, setDecision] = useState<ApprovalDecisionValue>(
    urlDecision ?? ApprovalDecision.Approved,
  );

  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<{ status: number; message: string } | null>(null);

  // ── Auth gate ──────────────────────────────────────────────
  // If the user lands here without a token, push them through
  // /auth/login with a return URL that preserves token + decision.
  useEffect(() => {
    if (!runId) return;
    if (!isLoggedIn()) {
      const redirect = buildLoginRedirect(
        `/approvals/${encodeURIComponent(runId)}`,
        window.location.search,
      );
      navigate(redirect, { replace: true });
    }
    // We intentionally only check this on mount — once logged in,
    // we don't want a stale localStorage read kicking us back to
    // login mid-flow.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Fetch the run ──────────────────────────────────────────
  // useAgentRun gates internally on !!runId; the auth-gate effect
  // above already redirects logged-out visitors before this fetch
  // would fire, so we don't need to layer on an isLoggedIn() check.
  const runQuery = useAgentRun(runId, {
    retry: false,
  });

  // ── Form ───────────────────────────────────────────────────
  const form = useForm<ApproverRespondFormData>({
    resolver: zodResolver(approverRespondSchema),
    defaultValues: { note: '' },
  });

  const respond = useRespondToRun();

  // ── Render branching ───────────────────────────────────────
  if (!runId) return <NotFoundShell message="This approval link is malformed." />;

  if (runQuery.isLoading) return <LoadingShell />;

  if (runQuery.isError) {
    const err = runQuery.error;
    const status = err instanceof ApiError ? err.status : undefined;
    if (status === 404) {
      return (
        <NotFoundShell message="This approval no longer exists. It may have been deleted by an admin." />
      );
    }
    return (
      <NotFoundShell message={err.message || 'Something went wrong loading this approval.'} />
    );
  }

  const run = runQuery.data;
  if (!run) return <NotFoundShell message="This approval could not be loaded." />;

  // Terminal — show the "already handled" view.
  if (isTerminalRunStatus(run.status)) {
    return <AlreadyHandledShell statusLabel={AGENT_RUN_STATUS_LABEL[run.status]} />;
  }

  // Run is live but not actually waiting on a human (e.g. Pending
  // before the worker picks it up — should be near-instant). Show
  // a polite please-retry rather than a confusing form.
  if (run.status !== AgentRunStatus.InProgress) {
    return (
      <PleaseRetryShell statusLabel={AGENT_RUN_STATUS_LABEL[run.status]} />
    );
  }

  // ── Submitted view ─────────────────────────────────────────
  if (submitted) {
    return <ThanksShell decision={decision} />;
  }

  // ── Confirmation form ──────────────────────────────────────
  const onSubmit = async (data: ApproverRespondFormData) => {
    setSubmitError(null);
    if (!token) {
      // No token + non-admin => server will 401 anyway, but be
      // honest up-front.
      setSubmitError({
        status: 401,
        message:
          'This link is missing its security token. Ask the person who sent the email to resend it.',
      });
      return;
    }
    try {
      await respond.mutateAsync({
        runId: run.id,
        data: { token, decision, note: data.note },
      });
      setSubmitted(true);
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.status === 401) {
          setSubmitError({
            status: 401,
            message:
              'This link is no longer valid. The token may have been rotated or revoked. Ask an admin to override if needed.',
          });
        } else if (e.status === 409) {
          // Server says it's already terminal — refetch to catch
          // up the UI, then the next render shows AlreadyHandled.
          runQuery.refetch();
          setSubmitError({
            status: 409,
            message: 'This approval was already handled by someone else.',
          });
        } else {
          setSubmitError({ status: e.status ?? 500, message: e.message });
        }
        return;
      }
      setSubmitError({ status: 500, message: 'Something unexpected went wrong.' });
    }
  };

  // ── Helpful timing copy ────────────────────────────────────
  const expiresLabel = run.expiresAt ? formatExpiry(run.expiresAt) : null;

  return (
    <PageShell>
      <div className="bg-bg-card border border-border-subtle rounded-2xl overflow-hidden">
        {/* Header band */}
        <div className="px-6 sm:px-8 py-5 border-b border-b-border-subtle">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                decision === ApprovalDecision.Approved
                  ? 'bg-success-soft border border-[rgba(16,185,129,0.15)]'
                  : 'bg-danger-soft border border-[rgba(244,63,94,0.15)]'
              }`}
            >
              {decision === ApprovalDecision.Approved ? (
                <ShieldCheck className="w-5 h-5 text-success" strokeWidth={2} />
              ) : (
                <ShieldX className="w-5 h-5 text-danger" strokeWidth={2} />
              )}
            </div>
            <div className="min-w-0">
              <div className="text-2xs font-bold uppercase tracking-wider text-text-muted">
                Confirm your decision
              </div>
              <h1 className="text-xl font-extrabold text-text-primary mt-0.5">
                You're about to{' '}
                <span
                  className={
                    decision === ApprovalDecision.Approved ? 'text-success' : 'text-danger'
                  }
                >
                  {decision === ApprovalDecision.Approved ? 'approve' : 'reject'}
                </span>
              </h1>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 sm:px-8 py-5 space-y-5">
          {/* Summary block — backend's 1-line summary is the headline */}
          <div className="bg-glass-1 border border-border-subtle rounded-card px-4 py-3.5">
            <div className="text-2xs font-bold uppercase tracking-wider text-text-muted mb-1">
              Summary
            </div>
            <p className="text-sm font-semibold text-text-primary leading-relaxed">
              {run.summary?.trim() || 'No summary was provided for this approval.'}
            </p>
            {expiresLabel && (
              <div className="mt-3 pt-3 border-t border-t-border-subtle flex items-center gap-2 text-xs text-text-muted">
                <Clock className="w-3.5 h-3.5" strokeWidth={1.6} />
                <span>{expiresLabel}</span>
              </div>
            )}
          </div>

          {/* Optional decision flip — only show if the approver came
             without a pre-set decision in the URL, OR if they're
             explicitly changing their mind */}
          <DecisionToggle value={decision} onChange={setDecision} />

          {/* Optional note */}
          <div>
            <label
              htmlFor="approval-note"
              className="text-sm font-semibold text-text-primary block mb-1.5"
            >
              Add a note <span className="text-text-muted font-normal">(optional)</span>
            </label>
            <textarea
              id="approval-note"
              {...form.register('note')}
              rows={3}
              placeholder="Anything the team should know about this decision…"
              className="w-full px-3.5 py-2.5 rounded-xl bg-bg-input border border-border-subtle text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand focus:shadow-[0_0_0_3px_rgba(0,217,126,0.1)] transition-all resize-none"
            />
            {form.formState.errors.note && (
              <p className="text-xs text-danger mt-1.5">
                {form.formState.errors.note.message}
              </p>
            )}
          </div>

          {/* Error banner */}
          {submitError && (
            <div className="px-3.5 py-3 rounded-xl bg-danger-soft border border-[rgba(244,63,94,0.15)] flex gap-2.5 text-sm text-danger">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={2} />
              <span>{submitError.message}</span>
            </div>
          )}

          {/* Submit + cancel */}
          <div className="flex flex-col-reverse sm:flex-row gap-2.5 pt-2">
            <Link
              to="/dashboard/chat"
              className="flex-1 sm:flex-initial sm:px-5 py-3 rounded-xl border border-border-subtle bg-bg-card text-sm font-semibold text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-all text-center"
            >
              Cancel
            </Link>
            <button
              type="button"
              onClick={form.handleSubmit(onSubmit)}
              disabled={respond.isPending}
              className={`flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-xl text-base font-bold transition-all disabled:opacity-50 ${
                decision === ApprovalDecision.Approved
                  ? 'bg-brand hover:bg-brand-light text-bg'
                  : 'bg-danger hover:opacity-90 text-bg'
              }`}
            >
              {respond.isPending ? (
                <span className="w-5 h-5 border-2 border-bg/30 border-t-bg rounded-full animate-spin" />
              ) : null}
              {respond.isPending
                ? 'Submitting…'
                : decision === ApprovalDecision.Approved
                  ? 'Confirm approve'
                  : 'Confirm reject'}
            </button>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

/* ───────────────────────────────────────────────────────────────
   Sub-components
   ───────────────────────────────────────────────────────────── */

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-xl">{children}</div>
    </div>
  );
}

function LoadingShell() {
  return (
    <PageShell>
      <div className="bg-bg-card border border-border-subtle rounded-2xl px-6 py-12 flex flex-col items-center gap-3">
        <Loader2 className="w-6 h-6 text-brand animate-spin" />
        <span className="text-sm text-text-muted font-semibold">Loading approval…</span>
      </div>
    </PageShell>
  );
}

function NotFoundShell({ message }: { message: string }) {
  return (
    <PageShell>
      <div className="bg-bg-card border border-border-subtle rounded-2xl overflow-hidden">
        <div className="px-6 sm:px-8 py-8 text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-glass-2 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-text-muted" strokeWidth={1.6} />
          </div>
          <h1 className="text-xl font-extrabold text-text-primary">
            We couldn't load this approval
          </h1>
          <p className="text-sm text-text-secondary leading-relaxed max-w-sm mx-auto">
            {message}
          </p>
          <DashboardLink />
        </div>
      </div>
    </PageShell>
  );
}

function AlreadyHandledShell({ statusLabel }: { statusLabel: string }) {
  return (
    <PageShell>
      <div className="bg-bg-card border border-border-subtle rounded-2xl overflow-hidden">
        <div className="px-6 sm:px-8 py-8 text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-success-soft border border-[rgba(16,185,129,0.15)] flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-success" strokeWidth={1.8} />
          </div>
          <h1 className="text-xl font-extrabold text-text-primary">All set</h1>
          <p className="text-sm text-text-secondary leading-relaxed max-w-sm mx-auto">
            This approval has already been{' '}
            <span className="font-semibold text-text-primary">
              {statusLabel.toLowerCase()}
            </span>
            . No further action is needed.
          </p>
          <DashboardLink />
        </div>
      </div>
    </PageShell>
  );
}

function PleaseRetryShell({ statusLabel }: { statusLabel: string }) {
  return (
    <PageShell>
      <div className="bg-bg-card border border-border-subtle rounded-2xl overflow-hidden">
        <div className="px-6 sm:px-8 py-8 text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-warning-soft border border-[rgba(245,158,11,0.15)] flex items-center justify-center">
            <Clock className="w-6 h-6 text-warning" strokeWidth={1.8} />
          </div>
          <h1 className="text-xl font-extrabold text-text-primary">Just a moment</h1>
          <p className="text-sm text-text-secondary leading-relaxed max-w-sm mx-auto">
            This approval is currently <span className="font-semibold">{statusLabel.toLowerCase()}</span>.
            It should be ready in a few seconds — try refreshing the page.
          </p>
          <DashboardLink />
        </div>
      </div>
    </PageShell>
  );
}

function ThanksShell({ decision }: { decision: ApprovalDecisionValue }) {
  const approved = decision === ApprovalDecision.Approved;
  return (
    <PageShell>
      <div className="bg-bg-card border border-border-subtle rounded-2xl overflow-hidden">
        <div className="px-6 sm:px-8 py-8 text-center space-y-4">
          <div
            className={`w-12 h-12 mx-auto rounded-2xl flex items-center justify-center ${
              approved
                ? 'bg-success-soft border border-[rgba(16,185,129,0.15)]'
                : 'bg-danger-soft border border-[rgba(244,63,94,0.15)]'
            }`}
          >
            {approved ? (
              <ShieldCheck className="w-6 h-6 text-success" strokeWidth={1.8} />
            ) : (
              <ShieldX className="w-6 h-6 text-danger" strokeWidth={1.8} />
            )}
          </div>
          <h1 className="text-xl font-extrabold text-text-primary">Thanks — recorded</h1>
          <p className="text-sm text-text-secondary leading-relaxed max-w-sm mx-auto">
            Your{' '}
            <span className="font-semibold text-text-primary">
              {approved ? 'approval' : 'rejection'}
            </span>{' '}
            has been logged. The system will pick it up from here.
          </p>
          <DashboardLink />
        </div>
      </div>
    </PageShell>
  );
}

function DashboardLink() {
  return (
    <Link
      to="/dashboard/chat"
      className="inline-flex items-center gap-1.5 text-sm font-bold text-brand hover:text-brand-light transition-colors"
    >
      Go to dashboard
      <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.4} />
    </Link>
  );
}

function DecisionToggle({
  value,
  onChange,
}: {
  value: ApprovalDecisionValue;
  onChange: (v: ApprovalDecisionValue) => void;
}) {
  const opts = useMemo(
    () => [
      { v: ApprovalDecision.Approved, label: 'Approve', tone: 'success' as const },
      { v: ApprovalDecision.Rejected, label: 'Reject', tone: 'danger' as const },
    ],
    [],
  );
  return (
    <div className="flex gap-1 p-1 bg-glass-1 border border-border-subtle rounded-xl">
      {opts.map((opt) => {
        const active = value === opt.v;
        return (
          <button
            key={opt.v}
            type="button"
            onClick={() => onChange(opt.v)}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
              active
                ? opt.tone === 'success'
                  ? 'bg-success-soft text-success'
                  : 'bg-danger-soft text-danger'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────
   Helpers
   ───────────────────────────────────────────────────────────── */

function formatExpiry(iso: string): string {
  try {
    const date = parseISO(iso);
    const ms = date.getTime() - Date.now();
    if (ms <= 0) return 'Expired';
    return `Expires ${formatDistanceToNow(date, { addSuffix: true })}`;
  } catch {
    return '';
  }
}
