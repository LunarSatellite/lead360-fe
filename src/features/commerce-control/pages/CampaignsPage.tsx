import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Archive,
  Check,
  Loader2,
  Megaphone,
  Plus,
  RefreshCw,
  Send,
  X,
} from 'lucide-react';
import {
  CAMPAIGN_PLACEMENT_LABEL,
  CAMPAIGN_STATE_LABEL,
  CTA_TARGET_KIND_LABEL,
  CampaignPlacement,
  CampaignState,
  isLiveNow,
  stylemintCampaignsApi,
  type Campaign,
  type CampaignStateValue,
  type UpsertCampaign,
} from '../api/stylemint-campaigns.api';

/**
 * Campaigns — the hero placements above the storefront's home and discover screens.
 *
 * A campaign is live only inside its own window, so "Published" alone does not mean a shopper
 * sees it. The page marks what is actually live right now separately from the state badge,
 * because that is the question an operator is really asking.
 *
 * Publishing is immediate and shopper-facing, so it confirms first.
 */

const STATE_TONE: Record<number, string> = {
  1: 'text-text-secondary border-border-subtle bg-glass-2',
  2: 'text-emerald-300 border-emerald-400/25 bg-emerald-400/5',
  3: 'text-text-muted border-border-subtle bg-glass-2',
};

function blankCampaign(): UpsertCampaign {
  const now = new Date();
  const inAMonth = new Date(now.getTime() + 30 * 86_400_000);
  return {
    slug: '',
    placement: CampaignPlacement.Home,
    eyebrow: '',
    title: '',
    subtitle: '',
    heroImageUrl: '',
    priority: 1,
    startsUtc: now.toISOString(),
    endsUtc: inAMonth.toISOString(),
    ctas: [],
  };
}

export function CampaignsPage() {
  const client = useQueryClient();
  const [state, setState] = useState<CampaignStateValue | undefined>(undefined);
  const [editing, setEditing] = useState<Campaign | null>(null);
  const [creating, setCreating] = useState(false);

  const campaigns = useQuery({
    queryKey: ['stylemint-campaigns', state],
    queryFn: () => stylemintCampaignsApi.list({ state, pageSize: 50 }),
  });

  const refresh = () => client.invalidateQueries({ queryKey: ['stylemint-campaigns'] });

  return (
    <div className="mx-auto max-w-[1500px] space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-brand">
            Stylemint commerce platform
          </p>
          <h1 className="mt-2 flex items-center gap-2 text-2xl font-black tracking-tight text-text-primary">
            <Megaphone className="h-5 w-5 text-brand" strokeWidth={1.6} />
            Campaigns
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            Hero placements on home and discover. A campaign shows only inside its own window.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setCreating(true);
              setEditing(null);
            }}
            className="flex items-center gap-1.5 rounded-card bg-brand px-3 py-2 text-xs font-bold text-bg hover:bg-brand-light"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={1.6} /> New campaign
          </button>
          <button
            onClick={() => campaigns.refetch()}
            className="flex items-center gap-2 rounded-card border-thin border-border-subtle px-3 py-2 text-xs font-bold text-text-secondary hover:text-brand"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${campaigns.isFetching ? 'animate-spin' : ''}`}
              strokeWidth={1.6}
            />
            Refresh
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <Chip active={state === undefined} onClick={() => setState(undefined)}>
          All
        </Chip>
        {(Object.values(CampaignState) as CampaignStateValue[]).map((value) => (
          <Chip key={value} active={state === value} onClick={() => setState(value)}>
            {CAMPAIGN_STATE_LABEL[value]}
          </Chip>
        ))}
      </div>

      {(creating || editing) && (
        <CampaignEditor
          existing={editing}
          onCancel={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={() => {
            setCreating(false);
            setEditing(null);
            refresh();
          }}
        />
      )}

      {campaigns.isError && (
        <div className="flex items-start gap-3 rounded-frame border-thin border-rose-400/25 bg-rose-400/5 p-4">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" strokeWidth={1.6} />
          <p className="text-sm text-text-secondary">{(campaigns.error as Error).message}</p>
        </div>
      )}

      {campaigns.isLoading ? (
        <div className="flex items-center gap-3 rounded-frame border-thin border-border-subtle bg-bg-card p-8 text-sm text-text-muted">
          <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.6} />
          Loading campaigns…
        </div>
      ) : (campaigns.data?.items.length ?? 0) === 0 ? (
        <div className="rounded-frame border-thin border-border-subtle bg-bg-card p-10 text-center">
          <Megaphone className="mx-auto h-7 w-7 text-text-muted" strokeWidth={1.6} />
          <p className="mt-3 text-sm text-text-secondary">
            {state ? `No ${CAMPAIGN_STATE_LABEL[state].toLowerCase()} campaigns.` : 'No campaigns yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {campaigns.data!.items.map((campaign) => (
            <CampaignRow
              key={campaign.id}
              campaign={campaign}
              onEdit={() => {
                setEditing(campaign);
                setCreating(false);
              }}
              onChanged={refresh}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-sm border-thin px-3 py-1.5 text-xs font-bold ${
        active
          ? 'border-border-glow bg-brand-soft text-brand'
          : 'border-border-subtle text-text-secondary hover:bg-glass-2 hover:text-text-primary'
      }`}
    >
      {children}
    </button>
  );
}

function CampaignRow({
  campaign,
  onEdit,
  onChanged,
}: {
  campaign: Campaign;
  onEdit: () => void;
  onChanged: () => void;
}) {
  const [confirming, setConfirming] = useState<'publish' | 'archive' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const act = useMutation({
    mutationFn: async (kind: 'publish' | 'archive') => {
      if (kind === 'publish') await stylemintCampaignsApi.publish(campaign.id);
      else await stylemintCampaignsApi.archive(campaign.id);
    },
    onSuccess: () => {
      setConfirming(null);
      setError(null);
      onChanged();
    },
    onError: (caught: unknown) =>
      setError(caught instanceof Error ? caught.message : 'The campaign could not be changed.'),
  });

  const live = isLiveNow(campaign);

  return (
    <div className="rounded-card border-thin border-border-subtle bg-glass-1 p-3.5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          {campaign.heroImageUrl && (
            <img
              src={campaign.heroImageUrl}
              alt=""
              className="h-12 w-20 shrink-0 rounded-sm object-cover"
            />
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-xs border-thin px-1.5 py-0.5 text-[10px] font-bold ${
                  STATE_TONE[campaign.state] ?? STATE_TONE[1]
                }`}
              >
                {CAMPAIGN_STATE_LABEL[campaign.state] ?? campaign.state}
              </span>
              {live && (
                <span className="rounded-xs border-thin border-border-glow bg-brand-soft px-1.5 py-0.5 text-[10px] font-bold text-brand">
                  live now
                </span>
              )}
              <span className="text-sm font-bold text-text-primary">{campaign.title}</span>
              <span className="text-[11px] text-text-muted">
                {CAMPAIGN_PLACEMENT_LABEL[campaign.placement] ?? 'Placement'} · priority{' '}
                {campaign.priority}
              </span>
            </div>
            {campaign.subtitle && (
              <p className="mt-0.5 truncate text-xs text-text-secondary">{campaign.subtitle}</p>
            )}
            <p className="mt-1 text-[11px] text-text-muted">
              <span className="font-mono">{campaign.slug}</span> ·{' '}
              {new Date(campaign.startsUtc).toLocaleDateString()} →{' '}
              {new Date(campaign.endsUtc).toLocaleDateString()}
              {campaign.collectionSlug && ` · collection ${campaign.collectionSlug}`}
            </p>
            {campaign.ctas.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {campaign.ctas.map((cta, i) => (
                  <span
                    key={i}
                    className="rounded-xs border-thin border-border-subtle bg-glass-2 px-1.5 py-0.5 text-[10px] text-text-muted"
                  >
                    {cta.label} → {CTA_TARGET_KIND_LABEL[cta.targetKind] ?? cta.targetKind}
                    {cta.targetValue ? `:${cta.targetValue}` : ''}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <button
            onClick={onEdit}
            className="rounded-sm border-thin border-border-medium px-3 py-1.5 text-xs font-bold text-text-secondary hover:bg-glass-2 hover:text-text-primary"
          >
            Edit
          </button>
          {campaign.state === CampaignState.Draft && (
            <button
              onClick={() => { setConfirming('publish'); setError(null); }}
              className="flex items-center gap-1.5 rounded-sm bg-brand px-3 py-1.5 text-xs font-bold text-bg hover:bg-brand-light"
            >
              <Send className="h-3.5 w-3.5" strokeWidth={1.6} /> Publish
            </button>
          )}
          {campaign.state !== CampaignState.Archived && (
            <button
              onClick={() => { setConfirming('archive'); setError(null); }}
              className="flex items-center gap-1.5 rounded-sm border-thin border-border-medium px-3 py-1.5 text-xs font-bold text-text-secondary hover:bg-glass-2 hover:text-text-primary"
            >
              <Archive className="h-3.5 w-3.5" strokeWidth={1.6} /> Archive
            </button>
          )}
        </div>
      </div>

      {confirming && (
        <div className="mt-3 rounded-sm border-thin border-border-glow bg-brand-soft p-3">
          <p className="text-xs font-bold text-text-primary">
            {confirming === 'publish' ? 'Publish this campaign?' : 'Archive this campaign?'}
          </p>
          <p className="mt-0.5 text-[11px] text-text-muted">
            {confirming === 'publish'
              ? 'It becomes shopper-facing as soon as its start date has passed.'
              : 'It stops showing and cannot be published again without editing.'}
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

function CampaignEditor({
  existing,
  onCancel,
  onSaved,
}: {
  existing: Campaign | null;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<UpsertCampaign>(() =>
    existing
      ? {
          slug: existing.slug,
          placement: existing.placement,
          eyebrow: existing.eyebrow ?? '',
          title: existing.title,
          subtitle: existing.subtitle ?? '',
          heroImageUrl: existing.heroImageUrl,
          heroReelId: existing.heroReelId ?? null,
          priority: existing.priority,
          startsUtc: existing.startsUtc,
          endsUtc: existing.endsUtc,
          collectionId: existing.collectionId ?? null,
          ctas: existing.ctas ?? [],
        }
      : blankCampaign(),
  );
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof UpsertCampaign>(key: K, value: UpsertCampaign[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const save = useMutation({
    mutationFn: () =>
      existing
        ? stylemintCampaignsApi.update(existing.id, form)
        : stylemintCampaignsApi.create(form),
    onSuccess: () => {
      setError(null);
      onSaved();
    },
    onError: (caught: unknown) =>
      setError(caught instanceof Error ? caught.message : 'The campaign could not be saved.'),
  });

  const windowValid = new Date(form.endsUtc).getTime() > new Date(form.startsUtc).getTime();
  const valid = form.slug.trim() && form.title.trim() && form.heroImageUrl.trim() && windowValid;

  return (
    <div className="rounded-frame border-thin border-border-glow bg-brand-soft p-4">
      <p className="text-sm font-black text-text-primary">
        {existing ? `Edit ${existing.slug}` : 'New campaign'}
      </p>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Field label="Slug">
          <input
            value={form.slug}
            onChange={(e) => set('slug', e.target.value)}
            placeholder="spring-drop"
            className={inputClass}
          />
        </Field>
        <Field label="Placement">
          <select
            value={form.placement}
            onChange={(e) => set('placement', Number(e.target.value))}
            className={inputClass}
          >
            {Object.entries(CAMPAIGN_PLACEMENT_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Eyebrow">
          <input
            value={form.eyebrow ?? ''}
            onChange={(e) => set('eyebrow', e.target.value)}
            placeholder="Now in public beta"
            className={inputClass}
          />
        </Field>
        <Field label="Title">
          <input
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Subtitle">
          <input
            value={form.subtitle ?? ''}
            onChange={(e) => set('subtitle', e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Priority">
          <input
            type="number"
            value={form.priority}
            onChange={(e) => set('priority', Number(e.target.value))}
            className={inputClass}
          />
        </Field>
        <Field label="Hero image URL">
          <input
            value={form.heroImageUrl}
            onChange={(e) => set('heroImageUrl', e.target.value)}
            placeholder="https://…"
            className={inputClass}
          />
        </Field>
        <Field label="Collection id (optional)">
          <input
            value={form.collectionId ?? ''}
            onChange={(e) => set('collectionId', e.target.value || null)}
            placeholder="GUID"
            className={inputClass}
          />
        </Field>
        <Field label="Starts">
          <input
            type="datetime-local"
            value={form.startsUtc.slice(0, 16)}
            onChange={(e) => set('startsUtc', new Date(e.target.value).toISOString())}
            className={inputClass}
          />
        </Field>
        <Field label="Ends">
          <input
            type="datetime-local"
            value={form.endsUtc.slice(0, 16)}
            onChange={(e) => set('endsUtc', new Date(e.target.value).toISOString())}
            className={inputClass}
          />
        </Field>
      </div>

      {!windowValid && (
        <p className="mt-2 text-[11px] text-rose-300">
          The end date must be after the start date, or the campaign can never show.
        </p>
      )}
      {error && <p className="mt-2 text-xs text-rose-300">{error}</p>}

      <p className="mt-3 text-[11px] text-text-muted">
        Calls to action are edited on the campaign itself in the storefront studio; they are shown
        here read-only and preserved on save.
      </p>

      <div className="mt-3 flex items-center gap-2">
        <button
          disabled={!valid || save.isPending}
          onClick={() => save.mutate()}
          className="flex items-center gap-1.5 rounded-sm bg-brand px-3 py-1.5 text-xs font-bold text-bg hover:bg-brand-light disabled:opacity-40"
        >
          {save.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.6} />
          ) : (
            <Check className="h-3.5 w-3.5" strokeWidth={1.6} />
          )}
          Save
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

const inputClass =
  'w-full rounded-sm border-thin border-border-subtle bg-bg-input px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:border-border-glow focus:outline-none';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] font-bold uppercase tracking-wide text-text-secondary">
        {label}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

export { CampaignsPage as Component };
