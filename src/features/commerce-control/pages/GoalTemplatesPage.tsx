import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Archive,
  Check,
  Loader2,
  Plus,
  RefreshCw,
  Target,
  X,
} from 'lucide-react';
import {
  CAMPAIGN_GOAL_LABEL,
  CampaignGoal,
  GOAL_TEMPLATE_STATE_LABEL,
  GoalTemplateState,
  stylemintBrandStudioApi,
  type CampaignGoalValue,
  type GoalTemplateVersion,
} from '../api/stylemint-brand-studio.api';

/**
 * Goal templates — the prompt the platform uses to draft a campaign brief for each goal a vendor
 * can pick.
 *
 * Versioned rather than edited in place. Authoring a new prompt creates the next version;
 * superseding it swaps which one is Active; retiring takes the goal out of use. Exactly one
 * version per goal is Active at a time, so the page picks a goal first and shows its history
 * underneath — a flat list across goals would hide the only thing that matters, which is which
 * prompt is live for the goal you are looking at.
 */

const STATE_TONE: Record<number, string> = {
  1: 'text-brand border-border-glow bg-brand-soft',
  2: 'text-text-muted border-border-subtle bg-glass-2',
  3: 'text-rose-300 border-rose-400/25 bg-rose-400/5',
};

export function GoalTemplatesPage() {
  const client = useQueryClient();
  const [goal, setGoal] = useState<CampaignGoalValue>(CampaignGoal.DriveFirstPurchase);
  const [authoring, setAuthoring] = useState(false);

  const versions = useQuery({
    queryKey: ['stylemint-goal-templates', goal],
    queryFn: () => stylemintBrandStudioApi.versions(goal),
  });

  const refresh = () => client.invalidateQueries({ queryKey: ['stylemint-goal-templates'] });

  const active = versions.data?.find((v) => v.state === GoalTemplateState.Active);

  return (
    <div className="mx-auto max-w-[1500px] space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-brand">
            Stylemint commerce platform
          </p>
          <h1 className="mt-2 flex items-center gap-2 text-2xl font-black tracking-tight text-text-primary">
            <Target className="h-5 w-5 text-brand" strokeWidth={1.6} />
            Goal templates
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            The prompt that drafts a brief for each campaign goal. One version is live per goal.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAuthoring(true)}
            className="flex items-center gap-1.5 rounded-card bg-brand px-3 py-2 text-xs font-bold text-bg hover:bg-brand-light"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={1.6} /> New version
          </button>
          <button
            onClick={() => versions.refetch()}
            className="flex items-center gap-2 rounded-card border-thin border-border-subtle px-3 py-2 text-xs font-bold text-text-secondary hover:text-brand"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${versions.isFetching ? 'animate-spin' : ''}`}
              strokeWidth={1.6}
            />
            Refresh
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {(Object.values(CampaignGoal) as CampaignGoalValue[]).map((value) => (
          <button
            key={value}
            onClick={() => {
              setGoal(value);
              setAuthoring(false);
            }}
            className={`rounded-sm border-thin px-3 py-1.5 text-xs font-bold ${
              goal === value
                ? 'border-border-glow bg-brand-soft text-brand'
                : 'border-border-subtle text-text-secondary hover:bg-glass-2 hover:text-text-primary'
            }`}
          >
            {CAMPAIGN_GOAL_LABEL[value]}
          </button>
        ))}
      </div>

      {authoring && (
        <AuthorForm
          goal={goal}
          hasActive={!!active}
          onCancel={() => setAuthoring(false)}
          onAuthored={() => {
            setAuthoring(false);
            refresh();
          }}
        />
      )}

      {versions.isError && (
        <div className="flex items-start gap-3 rounded-frame border-thin border-rose-400/25 bg-rose-400/5 p-4">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" strokeWidth={1.6} />
          <p className="text-sm text-text-secondary">{(versions.error as Error).message}</p>
        </div>
      )}

      {versions.isLoading ? (
        <div className="flex items-center gap-3 rounded-frame border-thin border-border-subtle bg-bg-card p-8 text-sm text-text-muted">
          <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.6} /> Loading versions…
        </div>
      ) : (versions.data?.length ?? 0) === 0 ? (
        <div className="rounded-frame border-thin border-border-subtle bg-bg-card p-10 text-center">
          <Target className="mx-auto h-7 w-7 text-text-muted" strokeWidth={1.6} />
          <p className="mt-3 text-sm text-text-secondary">
            No prompt has been authored for {CAMPAIGN_GOAL_LABEL[goal]?.toLowerCase()} yet.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {versions.data!.map((version) => (
            <VersionRow key={version.id} version={version} onChanged={refresh} />
          ))}
        </div>
      )}
    </div>
  );
}

function VersionRow({
  version,
  onChanged,
}: {
  version: GoalTemplateVersion;
  onChanged: () => void;
}) {
  const [confirming, setConfirming] = useState<'supersede' | 'retire' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const act = useMutation({
    mutationFn: async (kind: 'supersede' | 'retire') => {
      if (kind === 'supersede') await stylemintBrandStudioApi.supersede(version.id);
      else await stylemintBrandStudioApi.retire(version.id);
    },
    onSuccess: () => {
      setConfirming(null);
      setError(null);
      onChanged();
    },
    onError: (caught: unknown) =>
      setError(caught instanceof Error ? caught.message : 'The version could not be changed.'),
  });

  const isActive = version.state === GoalTemplateState.Active;

  return (
    <div className="rounded-card border-thin border-border-subtle bg-glass-1 p-3.5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-xs border-thin px-1.5 py-0.5 text-[10px] font-bold ${
                STATE_TONE[version.state] ?? STATE_TONE[2]
              }`}
            >
              {GOAL_TEMPLATE_STATE_LABEL[version.state] ?? version.state}
            </span>
            <span className="text-sm font-bold text-text-primary">v{version.version}</span>
            <span className="text-[11px] text-text-muted">
              from {new Date(version.effectiveFrom).toLocaleDateString()}
              {version.effectiveTo && ` to ${new Date(version.effectiveTo).toLocaleDateString()}`}
            </span>
          </div>

          <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap rounded-sm border-thin border-border-subtle bg-bg-input p-2.5 font-mono text-[11px] leading-relaxed text-text-secondary">
            {version.promptText}
          </pre>

          {version.notes && (
            <p className="mt-1.5 text-xs text-text-muted">{version.notes}</p>
          )}
        </div>

        {isActive && (
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              onClick={() => { setConfirming('supersede'); setError(null); }}
              className="rounded-sm border-thin border-border-medium px-3 py-1.5 text-xs font-bold text-text-secondary hover:bg-glass-2 hover:text-text-primary"
            >
              Supersede
            </button>
            <button
              onClick={() => { setConfirming('retire'); setError(null); }}
              className="flex items-center gap-1.5 rounded-sm border-thin border-border-medium px-3 py-1.5 text-xs font-bold text-text-secondary hover:bg-glass-2 hover:text-rose-300"
            >
              <Archive className="h-3.5 w-3.5" strokeWidth={1.6} /> Retire
            </button>
          </div>
        )}
      </div>

      {confirming && (
        <div className="mt-3 rounded-sm border-thin border-border-glow bg-brand-soft p-3">
          <p className="text-xs font-bold text-text-primary">
            {confirming === 'supersede' ? 'Supersede this version?' : 'Retire this version?'}
          </p>
          <p className="mt-0.5 text-[11px] text-text-muted">
            {confirming === 'supersede'
              ? 'It stops being the live prompt for this goal. Author a new version to replace it.'
              : 'The goal stops being offered until a new version is authored.'}
          </p>
          {error && <p className="mt-2 text-xs text-rose-300">{error}</p>}
          <div className="mt-2 flex items-center gap-2">
            <button
              disabled={act.isPending}
              onClick={() => act.mutate(confirming)}
              className="flex items-center gap-1.5 rounded-sm bg-brand px-3 py-1.5 text-xs font-bold text-bg hover:bg-brand-light disabled:opacity-40"
            >
              {act.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.6} />}
              Confirm
            </button>
            <button
              onClick={() => setConfirming(null)}
              className="rounded-sm border-thin border-border-medium px-3 py-1.5 text-xs font-bold text-text-secondary hover:bg-glass-2 hover:text-text-primary"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {error && !confirming && <p className="mt-2 text-xs text-rose-300">{error}</p>}
    </div>
  );
}

function AuthorForm({
  goal,
  hasActive,
  onCancel,
  onAuthored,
}: {
  goal: CampaignGoalValue;
  hasActive: boolean;
  onCancel: () => void;
  onAuthored: () => void;
}) {
  const [promptText, setPromptText] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const author = useMutation({
    mutationFn: () => stylemintBrandStudioApi.author(goal, promptText.trim(), notes.trim()),
    onSuccess: () => {
      setError(null);
      onAuthored();
    },
    onError: (caught: unknown) =>
      setError(caught instanceof Error ? caught.message : 'The version could not be authored.'),
  });

  return (
    <div className="rounded-frame border-thin border-border-glow bg-brand-soft p-4">
      <p className="text-sm font-black text-text-primary">
        New version for {CAMPAIGN_GOAL_LABEL[goal]}
      </p>
      <p className="mt-0.5 text-[11px] text-text-muted">
        {hasActive
          ? 'This becomes the next version. Supersede the current one to make it live.'
          : 'This goal has no live prompt, so this version becomes the active one.'}
      </p>

      <label className="mt-3 block">
        <span className="text-[11px] font-bold uppercase tracking-wide text-text-secondary">
          Prompt text
        </span>
        <textarea
          value={promptText}
          onChange={(e) => setPromptText(e.target.value)}
          rows={8}
          placeholder="The instruction the drafter follows for this goal…"
          className="mt-1 w-full rounded-sm border-thin border-border-subtle bg-bg-input px-3 py-2 font-mono text-xs leading-relaxed text-text-primary placeholder:text-text-muted focus:border-border-glow focus:outline-none"
        />
      </label>

      <label className="mt-2 block">
        <span className="text-[11px] font-bold uppercase tracking-wide text-text-secondary">
          Notes
        </span>
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Why this version differs from the last"
          className="mt-1 w-full rounded-sm border-thin border-border-subtle bg-bg-input px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:border-border-glow focus:outline-none"
        />
      </label>

      {error && <p className="mt-2 text-xs text-rose-300">{error}</p>}

      <div className="mt-3 flex items-center gap-2">
        <button
          disabled={!promptText.trim() || author.isPending}
          onClick={() => author.mutate()}
          className="flex items-center gap-1.5 rounded-sm bg-brand px-3 py-1.5 text-xs font-bold text-bg hover:bg-brand-light disabled:opacity-40"
        >
          {author.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.6} />
          ) : (
            <Check className="h-3.5 w-3.5" strokeWidth={1.6} />
          )}
          Author version
        </button>
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 rounded-sm border-thin border-border-medium px-3 py-1.5 text-xs font-bold text-text-secondary hover:bg-glass-2 hover:text-text-primary"
        >
          <X className="h-3.5 w-3.5" strokeWidth={1.6} /> Cancel
        </button>
      </div>
    </div>
  );
}

export { GoalTemplatesPage as Component };
