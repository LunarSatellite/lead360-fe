import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Check,
  Loader2,
  Plus,
  Rocket,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import {
  CampaignCreativeKind,
  CampaignReviewGate,
  CREATIVE_KIND_LABEL,
  REVIEW_GATE_LABEL,
  stylemintCampaignWorkspacesApi,
  type CampaignCreativeKindValue,
  type CampaignReviewGateValue,
} from '../api/stylemint-campaign-workspaces.api';
import { ReportPanel } from './ReportPanel';

/**
 * Campaign workspaces: the brand-studio pipeline from brief to live campaign.
 *
 * It sits on the vendor desk, not beside storefront Campaigns — those are hero placements on
 * home and discover, a different thing that happens to share the word. Conflating them under one
 * page would make an operator guess which kind of campaign they were looking at.
 *
 * The review gates are the substance here. Nothing generated reaches a customer until a named
 * human clears every gate it was routed to, so clearing one always asks which gate and always
 * takes a note: an approve button with neither would hollow out the control it operates.
 *
 * Activation is shopper-facing and spends the budget, so it confirms first.
 */
export function CampaignWorkspacesTab() {
  const client = useQueryClient();
  const [workspaceId, setWorkspaceId] = useState('');
  const [open, setOpen] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const workspaces = useQuery({
    queryKey: ['stylemint-campaign-workspaces'],
    queryFn: () => stylemintCampaignWorkspacesApi.list(),
    retry: false,
  });

  const refresh = () => {
    client.invalidateQueries({ queryKey: ['stylemint-campaign-workspaces'] });
    if (open) client.invalidateQueries({ queryKey: ['stylemint-campaign-workspace', open] });
  };

  const report = (message: string | null, caught?: unknown) => {
    if (caught) {
      setNotice(null);
      setError(describe(caught));
    } else {
      setError(null);
      setNotice(message);
      refresh();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-text-muted">
          Brief to live campaign: configure, approve, activate, generate, review, measure.
        </p>
        <button
          onClick={() => setCreating((v) => !v)}
          className="flex items-center gap-1.5 rounded-sm bg-brand px-3 py-1.5 text-xs font-bold text-bg hover:bg-brand-light"
        >
          {creating ? (
            <X className="h-3.5 w-3.5" strokeWidth={1.6} />
          ) : (
            <Plus className="h-3.5 w-3.5" strokeWidth={1.6} />
          )}
          {creating ? 'Cancel' : 'New workspace'}
        </button>
      </div>

      {creating && (
        <CreateForm
          onDone={() => {
            setCreating(false);
            report('The workspace is open.');
          }}
          onError={(caught) => report(null, caught)}
        />
      )}

      {error && (
        <div className="flex items-start gap-3 rounded-frame border-thin border-rose-400/25 bg-rose-400/5 p-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" strokeWidth={1.6} />
          <p className="text-xs text-text-secondary">{error}</p>
        </div>
      )}
      {notice && (
        <p className="rounded-frame border-thin border-border-glow bg-brand-soft p-3 text-xs text-text-secondary">
          {notice}
        </p>
      )}

      <ReportPanel
        title="Workspaces"
        query={workspaces}
        emptyNote="No campaign workspace has been opened."
      />

      <div className="rounded-frame border-thin border-border-subtle bg-bg-card p-4">
        <p className="text-[11px] font-bold uppercase tracking-wide text-text-secondary">
          Open one workspace
        </p>
        <div className="mt-2 flex gap-2">
          <input
            value={workspaceId}
            onChange={(e) => setWorkspaceId(e.target.value)}
            placeholder="Workspace id from the list above"
            className={`${field} flex-1 font-mono`}
          />
          <button
            disabled={!workspaceId.trim()}
            onClick={() => setOpen(workspaceId.trim())}
            className="flex items-center gap-1.5 rounded-sm bg-brand px-3 py-2 text-xs font-bold text-bg hover:bg-brand-light disabled:opacity-40"
          >
            <Search className="h-3.5 w-3.5" strokeWidth={1.6} /> Open
          </button>
        </div>
      </div>

      {open && <WorkspaceDetail workspaceId={open} onReport={report} />}
    </div>
  );
}

function CreateForm({
  onDone,
  onError,
}: {
  onDone: () => void;
  onError: (caught: unknown) => void;
}) {
  const [brandBriefId, setBrandBriefId] = useState('');
  const [name, setName] = useState('');
  const [budget, setBudget] = useState('');
  const [currency, setCurrency] = useState('INR');

  const create = useMutation({
    mutationFn: () =>
      stylemintCampaignWorkspacesApi.create({
        brandBriefId: brandBriefId.trim(),
        name: name.trim(),
        budgetAmount: Number(budget),
        budgetCurrency: currency.trim(),
      }),
    onSuccess: onDone,
    onError,
  });

  const ready =
    !!brandBriefId.trim() &&
    !!name.trim() &&
    budget !== '' &&
    Number(budget) > 0 &&
    !!currency.trim();

  return (
    <div className="rounded-frame border-thin border-border-subtle bg-bg-card p-4">
      <p className="text-[11px] font-bold uppercase tracking-wide text-text-secondary">
        Open a workspace on a brief
      </p>
      <p className="mt-1 text-[11px] text-text-muted">
        The brief id comes from brand studio. The budget is a ceiling, not a commitment — nothing
        is spent until the workspace is activated.
      </p>
      <div className="mt-2 grid gap-2 sm:grid-cols-4">
        <input
          value={brandBriefId}
          onChange={(e) => setBrandBriefId(e.target.value)}
          placeholder="Brand brief id"
          className={`${field} font-mono sm:col-span-2`}
        />
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          className={field}
        />
        <div className="flex gap-1.5">
          <input
            type="number"
            min={0}
            step="any"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="Budget"
            className={field}
          />
          <input
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className={`${field} w-20`}
          />
        </div>
      </div>
      <button
        disabled={!ready || create.isPending}
        onClick={() => create.mutate()}
        className="mt-2 flex items-center gap-1.5 rounded-sm bg-brand px-3 py-1.5 text-xs font-bold text-bg hover:bg-brand-light disabled:opacity-40"
      >
        {create.isPending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.6} />
        ) : (
          <Check className="h-3.5 w-3.5" strokeWidth={1.6} />
        )}
        Open workspace
      </button>
    </div>
  );
}

function WorkspaceDetail({
  workspaceId,
  onReport,
}: {
  workspaceId: string;
  onReport: (message: string | null, caught?: unknown) => void;
}) {
  const workspace = useQuery({
    queryKey: ['stylemint-campaign-workspace', workspaceId],
    queryFn: () => stylemintCampaignWorkspacesApi.get(workspaceId),
    retry: false,
  });
  const creative = useQuery({
    queryKey: ['stylemint-campaign-creative', workspaceId],
    queryFn: () => stylemintCampaignWorkspacesApi.creative(workspaceId),
    retry: false,
  });
  const measurement = useQuery({
    queryKey: ['stylemint-campaign-measurement', workspaceId],
    queryFn: () => stylemintCampaignWorkspacesApi.measurement(workspaceId),
    retry: false,
  });

  const step = useMutation({
    mutationFn: (which: 'approve' | 'activate' | 'refreshOutcome') => {
      if (which === 'approve') return stylemintCampaignWorkspacesApi.approve(workspaceId);
      if (which === 'activate') return stylemintCampaignWorkspacesApi.activate(workspaceId);
      return stylemintCampaignWorkspacesApi.refreshOutcome(workspaceId);
    },
    onSuccess: (_result, which) => {
      onReport(
        which === 'approve'
          ? 'The workspace is approved.'
          : which === 'activate'
            ? 'The campaign is live.'
            : 'The measured outcome has been re-read.',
      );
      measurement.refetch();
    },
    onError: (caught) => onReport(null, caught),
  });

  // Activation spends the budget and puts the campaign in front of shoppers, so it asks first.
  const [confirmingActivate, setConfirmingActivate] = useState(false);

  return (
    <div className="space-y-3">
      <ReportPanel
        title={`Workspace ${workspaceId}`}
        query={workspace}
        emptyNote="No workspace with that id."
      />

      <div className="flex flex-wrap items-center gap-1.5 rounded-frame border-thin border-border-subtle bg-bg-card p-4">
        <span className="mr-1 text-[11px] font-bold uppercase tracking-wide text-text-secondary">
          Pipeline
        </span>
        <button
          disabled={step.isPending}
          onClick={() => step.mutate('approve')}
          className="rounded-sm bg-brand px-2.5 py-1 text-[11px] font-bold text-bg hover:bg-brand-light disabled:opacity-40"
        >
          Approve
        </button>
        {confirmingActivate ? (
          <>
            <span className="text-[11px] text-amber-300">
              This puts the campaign in front of shoppers and starts spending the budget.
            </span>
            <button
              disabled={step.isPending}
              onClick={() => {
                setConfirmingActivate(false);
                step.mutate('activate');
              }}
              className="flex items-center gap-1 rounded-sm bg-brand px-2.5 py-1 text-[11px] font-bold text-bg hover:bg-brand-light disabled:opacity-40"
            >
              {step.isPending && <Loader2 className="h-3 w-3 animate-spin" strokeWidth={1.6} />}
              Yes, activate
            </button>
            <button
              onClick={() => setConfirmingActivate(false)}
              className="rounded-sm border-thin border-border-medium px-2.5 py-1 text-[11px] font-bold text-text-secondary hover:bg-glass-2"
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            disabled={step.isPending}
            onClick={() => setConfirmingActivate(true)}
            className="flex items-center gap-1 rounded-sm bg-brand px-2.5 py-1 text-[11px] font-bold text-bg hover:bg-brand-light disabled:opacity-40"
          >
            <Rocket className="h-3 w-3" strokeWidth={1.6} /> Activate
          </button>
        )}
        <button
          disabled={step.isPending}
          onClick={() => step.mutate('refreshOutcome')}
          className="rounded-sm border-thin border-border-medium px-2.5 py-1 text-[11px] font-bold text-text-secondary hover:bg-glass-2 disabled:opacity-40"
        >
          Re-read outcome
        </button>
      </div>

      <ConfigureForm
        workspaceId={workspaceId}
        onDone={() => onReport('The configuration is saved.')}
        onError={(caught) => onReport(null, caught)}
      />

      <GenerateForm
        workspaceId={workspaceId}
        onDone={() => {
          onReport('Drafts generated.');
          creative.refetch();
        }}
        onError={(caught) => onReport(null, caught)}
      />

      <ReportPanel
        title="Creative drafts"
        query={creative}
        emptyNote="Nothing has been generated for this workspace."
      />

      <ReviewForm
        workspaceId={workspaceId}
        onDone={(message) => {
          onReport(message);
          creative.refetch();
        }}
        onError={(caught) => onReport(null, caught)}
      />

      <ReportPanel
        title="Measurement"
        query={measurement}
        emptyNote="This campaign has no measured outcome — the surface says so rather than reporting one."
      />
    </div>
  );
}

function ConfigureForm({
  workspaceId,
  onDone,
  onError,
}: {
  workspaceId: string;
  onDone: () => void;
  onError: (caught: unknown) => void;
}) {
  const [variants, setVariants] = useState('{}');
  const [channels, setChannels] = useState('[]');
  const [experiment, setExperiment] = useState('{}');

  const configure = useMutation({
    mutationFn: () =>
      stylemintCampaignWorkspacesApi.configure(workspaceId, {
        creativeVariantsJson: variants,
        channelsJson: channels,
        experimentJson: experiment,
      }),
    onSuccess: onDone,
    onError,
  });

  const valid = isJson(variants) && isJson(channels) && isJson(experiment);

  return (
    <div className="rounded-frame border-thin border-border-subtle bg-bg-card p-4">
      <p className="text-[11px] font-bold uppercase tracking-wide text-text-secondary">
        Configuration
      </p>
      <p className="mt-1 text-[11px] text-text-muted">
        Free-form JSON the pipeline interprets, not fixed fields — so it is edited as JSON rather
        than behind a form that would have to guess at the schema.
      </p>
      <div className="mt-2 grid gap-2 sm:grid-cols-3">
        <JsonField label="Creative variants" value={variants} onChange={setVariants} />
        <JsonField label="Channels" value={channels} onChange={setChannels} />
        <JsonField label="Experiment" value={experiment} onChange={setExperiment} />
      </div>
      <button
        disabled={!valid || configure.isPending}
        onClick={() => configure.mutate()}
        className="mt-2 flex items-center gap-1.5 rounded-sm bg-brand px-3 py-1.5 text-xs font-bold text-bg hover:bg-brand-light disabled:opacity-40"
      >
        {configure.isPending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.6} />
        ) : (
          <Check className="h-3.5 w-3.5" strokeWidth={1.6} />
        )}
        Save configuration
      </button>
    </div>
  );
}

function GenerateForm({
  workspaceId,
  onDone,
  onError,
}: {
  workspaceId: string;
  onDone: () => void;
  onError: (caught: unknown) => void;
}) {
  const [kind, setKind] = useState<CampaignCreativeKindValue>(CampaignCreativeKind.Copy);
  const [channel, setChannel] = useState('');
  const [locale, setLocale] = useState('en');
  const [count, setCount] = useState('3');

  const generate = useMutation({
    mutationFn: () =>
      stylemintCampaignWorkspacesApi.generateCreative(workspaceId, {
        kind,
        channel: channel.trim(),
        locale: locale.trim(),
        count: Number(count),
      }),
    onSuccess: onDone,
    onError,
  });

  const ready = !!channel.trim() && !!locale.trim() && Number(count) > 0;

  return (
    <div className="rounded-frame border-thin border-border-subtle bg-bg-card p-4">
      <p className="flex items-center gap-2 text-sm font-black text-text-primary">
        <Sparkles className="h-4 w-4 text-brand" strokeWidth={1.6} />
        Generate drafts
      </p>
      <p className="mt-1 text-[11px] text-text-muted">
        Everything generated is a draft. It reaches a customer only once a named human has cleared
        every review gate it was routed to.
      </p>
      <div className="mt-2 grid gap-2 sm:grid-cols-4">
        <select
          value={kind}
          onChange={(e) => setKind(Number(e.target.value) as CampaignCreativeKindValue)}
          className={field}
        >
          {Object.values(CampaignCreativeKind).map((value) => (
            <option key={value} value={value}>
              {CREATIVE_KIND_LABEL[value]}
            </option>
          ))}
        </select>
        <input
          value={channel}
          onChange={(e) => setChannel(e.target.value)}
          placeholder="Channel"
          className={field}
        />
        <input
          value={locale}
          onChange={(e) => setLocale(e.target.value)}
          placeholder="Locale"
          className={field}
        />
        <input
          type="number"
          min={1}
          value={count}
          onChange={(e) => setCount(e.target.value)}
          placeholder="How many"
          className={field}
        />
      </div>
      <button
        disabled={!ready || generate.isPending}
        onClick={() => generate.mutate()}
        className="mt-2 flex items-center gap-1.5 rounded-sm bg-brand px-3 py-1.5 text-xs font-bold text-bg hover:bg-brand-light disabled:opacity-40"
      >
        {generate.isPending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.6} />
        ) : (
          <Sparkles className="h-3.5 w-3.5" strokeWidth={1.6} />
        )}
        Generate
      </button>
    </div>
  );
}

function ReviewForm({
  workspaceId,
  onDone,
  onError,
}: {
  workspaceId: string;
  onDone: (message: string) => void;
  onError: (caught: unknown) => void;
}) {
  const [draftId, setDraftId] = useState('');
  const [gate, setGate] = useState<CampaignReviewGateValue>(CampaignReviewGate.Claim);
  const [cleared, setCleared] = useState(true);
  const [note, setNote] = useState('');
  const [retireReason, setRetireReason] = useState('');

  const review = useMutation({
    mutationFn: () =>
      stylemintCampaignWorkspacesApi.reviewCreative(workspaceId, draftId.trim(), {
        gate,
        cleared,
        note: note.trim(),
      }),
    onSuccess: () =>
      onDone(
        `${REVIEW_GATE_LABEL[gate]} ${cleared ? 'cleared' : 'failed'} on that draft.`,
      ),
    onError,
  });

  const retire = useMutation({
    mutationFn: () =>
      stylemintCampaignWorkspacesApi.retireCreative(
        workspaceId,
        draftId.trim(),
        retireReason.trim(),
      ),
    onSuccess: () => onDone('The draft is retired.'),
    onError,
  });

  // The note is the reviewer's reasoning and is what makes the gate meaningful, so it is
  // required in both directions — a cleared gate with no stated reason is a rubber stamp.
  const canReview = !!draftId.trim() && !!note.trim();

  return (
    <div className="rounded-frame border-thin border-border-subtle bg-bg-card p-4">
      <p className="text-[11px] font-bold uppercase tracking-wide text-text-secondary">
        Review a draft
      </p>
      <p className="mt-1 text-[11px] text-text-muted">
        One gate at a time, with the reasoning. A cleared gate with no stated reason is a rubber
        stamp, so the note is required either way.
      </p>

      <div className="mt-2 grid gap-2 sm:grid-cols-4">
        <input
          value={draftId}
          onChange={(e) => setDraftId(e.target.value)}
          placeholder="Draft id"
          className={`${field} font-mono sm:col-span-2`}
        />
        <select
          value={gate}
          onChange={(e) => setGate(Number(e.target.value) as CampaignReviewGateValue)}
          className={field}
        >
          {Object.values(CampaignReviewGate).map((value) => (
            <option key={value} value={value}>
              {REVIEW_GATE_LABEL[value]}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-[11px] text-text-secondary">
          <input
            type="checkbox"
            checked={cleared}
            onChange={(e) => setCleared(e.target.checked)}
            className="h-3.5 w-3.5 accent-brand"
          />
          Gate cleared
        </label>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="What you checked and what you found"
          className={`${field} sm:col-span-4`}
        />
      </div>

      <button
        disabled={!canReview || review.isPending}
        onClick={() => review.mutate()}
        className="mt-2 flex items-center gap-1.5 rounded-sm bg-brand px-3 py-1.5 text-xs font-bold text-bg hover:bg-brand-light disabled:opacity-40"
      >
        {review.isPending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.6} />
        ) : (
          <Check className="h-3.5 w-3.5" strokeWidth={1.6} />
        )}
        Record review
      </button>

      <div className="mt-3 border-t-thin border-border-subtle pt-3">
        <p className="text-[11px] font-bold uppercase tracking-wide text-text-secondary">
          Retire that draft
        </p>
        <div className="mt-1.5 flex gap-2">
          <input
            value={retireReason}
            onChange={(e) => setRetireReason(e.target.value)}
            placeholder="Why it is being retired"
            className={`${field} flex-1`}
          />
          <button
            disabled={!draftId.trim() || !retireReason.trim() || retire.isPending}
            onClick={() => retire.mutate()}
            className="rounded-sm border-thin border-rose-400/30 px-3 py-2 text-[11px] font-bold text-rose-300 hover:bg-rose-400/10 disabled:opacity-40"
          >
            Retire
          </button>
        </div>
      </div>
    </div>
  );
}

function JsonField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
}) {
  const valid = isJson(value);
  return (
    <label className="block">
      <span className="text-[11px] font-bold uppercase tracking-wide text-text-secondary">
        {label}
      </span>
      <textarea
        rows={3}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${field} mt-1 font-mono ${valid ? '' : 'border-rose-400/40'}`}
      />
      {!valid && <span className="text-[11px] text-rose-300">That is not valid JSON.</span>}
    </label>
  );
}

function isJson(text: string): boolean {
  try {
    JSON.parse(text);
    return true;
  } catch {
    return false;
  }
}

/** The api client signals absence with codes rather than prose, so each caller says it its own way. */
function describe(error: unknown): string {
  if (!(error instanceof Error)) return 'Something went wrong.';
  if (error.message === 'NOT_DEPLOYED') {
    return 'This Stylemint build does not serve campaign workspaces yet.';
  }
  if (error.message === 'NOT_FOUND') return 'No workspace or draft matches that identifier.';
  return error.message;
}

const field =
  'w-full rounded-sm border-thin border-border-subtle bg-bg-input px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:border-border-glow focus:outline-none';
