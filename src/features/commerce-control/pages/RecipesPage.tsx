import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Check,
  ChefHat,
  ChevronDown,
  ChevronRight,
  EyeOff,
  Loader2,
  Music,
  RefreshCw,
} from 'lucide-react';
import {
  RECIPE_ORIGIN_LABEL,
  RECIPE_STATE_LABEL,
  stylemintRecipesApi,
  type ReelRecipe,
} from '../api/stylemint-recipes.api';

/**
 * Reel recipes drafted by the model and waiting on a human.
 *
 * This is a review queue, not a browser: the backend exposes exactly one recipe read for
 * operators — LLM drafts still in Draft state — and four actions that need an id. Promoting a
 * draft makes it platform-curated and usable by creators, so each one is a publishing decision
 * and the page shows the beats and captions before asking for it.
 *
 * ContentMod, no step-up MFA.
 */
export function RecipesPage() {
  const client = useQueryClient();

  const drafts = useQuery({
    queryKey: ['stylemint-recipe-drafts'],
    queryFn: () => stylemintRecipesApi.pendingReview({ take: 50 }),
  });

  const refresh = () => client.invalidateQueries({ queryKey: ['stylemint-recipe-drafts'] });

  return (
    <div className="mx-auto max-w-[1500px] space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-brand">
            Stylemint commerce platform
          </p>
          <h1 className="mt-2 flex items-center gap-2 text-2xl font-black tracking-tight text-text-primary">
            <ChefHat className="h-5 w-5 text-brand" strokeWidth={1.6} />
            Reel recipes
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            Model-drafted recipes awaiting review. Promoting one makes it curated and available to
            creators.
          </p>
        </div>
        <button
          onClick={() => drafts.refetch()}
          className="flex items-center gap-2 self-start rounded-card border-thin border-border-subtle px-3 py-2 text-xs font-bold text-text-secondary hover:text-brand"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${drafts.isFetching ? 'animate-spin' : ''}`}
            strokeWidth={1.6}
          />
          Refresh
        </button>
      </div>

      {drafts.isError && (
        <div className="flex items-start gap-3 rounded-frame border-thin border-rose-400/25 bg-rose-400/5 p-4">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" strokeWidth={1.6} />
          <p className="text-sm text-text-secondary">{(drafts.error as Error).message}</p>
        </div>
      )}

      {drafts.isLoading ? (
        <div className="flex items-center gap-3 rounded-frame border-thin border-border-subtle bg-bg-card p-8 text-sm text-text-muted">
          <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.6} />
          Loading drafts…
        </div>
      ) : !drafts.data || drafts.data.length === 0 ? (
        <div className="rounded-frame border-thin border-border-subtle bg-bg-card p-10 text-center">
          <ChefHat className="mx-auto h-7 w-7 text-text-muted" strokeWidth={1.6} />
          <p className="mt-3 text-sm text-text-secondary">
            No drafted recipes are waiting for review.
          </p>
        </div>
      ) : (
        <>
          <p className="text-xs text-text-muted">
            {drafts.data.length} {drafts.data.length === 1 ? 'draft' : 'drafts'} awaiting review
          </p>
          <div className="space-y-2">
            {drafts.data.map((recipe) => (
              <RecipeRow key={recipe.id} recipe={recipe} onChanged={refresh} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function RecipeRow({ recipe, onChanged }: { recipe: ReelRecipe; onChanged: () => void }) {
  const [open, setOpen] = useState(false);
  const [hiding, setHiding] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const act = useMutation({
    mutationFn: async (kind: 'promote' | 'hide') => {
      if (kind === 'promote') await stylemintRecipesApi.promote(recipe.id);
      else await stylemintRecipesApi.hide(recipe.id, reason.trim());
    },
    onSuccess: () => {
      setHiding(false);
      setReason('');
      setError(null);
      onChanged();
    },
    onError: (caught: unknown) =>
      setError(caught instanceof Error ? caught.message : 'The recipe could not be changed.'),
  });

  const captions = recipe.captionVariants ?? [];
  const beats = recipe.beats ?? [];

  return (
    <div className="rounded-card border-thin border-border-subtle bg-glass-1">
      <div className="flex flex-wrap items-start justify-between gap-3 p-3.5">
        <button onClick={() => setOpen((v) => !v)} className="flex min-w-0 flex-1 items-start gap-2 text-left">
          {open ? (
            <ChevronDown className="mt-0.5 h-3.5 w-3.5 shrink-0 text-text-muted" strokeWidth={1.6} />
          ) : (
            <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-text-muted" strokeWidth={1.6} />
          )}
          <div className="min-w-0">
            <p className="text-sm font-bold text-text-primary">{recipe.title || 'Untitled recipe'}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-text-muted">
              <span className="rounded-xs border-thin border-border-subtle bg-glass-2 px-1.5 py-0.5 font-bold">
                {RECIPE_ORIGIN_LABEL[recipe.origin] ?? 'Origin'}
              </span>
              <span className="rounded-xs border-thin border-border-subtle bg-glass-2 px-1.5 py-0.5 font-bold">
                {RECIPE_STATE_LABEL[recipe.state] ?? recipe.state}
              </span>
              <span>{beats.length} beats</span>
              <span>{captions.length} captions</span>
              <span>cited in {recipe.citedInReelCount} reels</span>
            </div>
          </div>
        </button>

        <div className="flex shrink-0 items-center gap-1.5">
          <button
            disabled={act.isPending}
            onClick={() => act.mutate('promote')}
            className="flex items-center gap-1.5 rounded-sm bg-brand px-3 py-1.5 text-xs font-bold text-bg hover:bg-brand-light disabled:opacity-40"
          >
            {act.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.6} />
            ) : (
              <Check className="h-3.5 w-3.5" strokeWidth={1.6} />
            )}
            Promote
          </button>
          <button
            onClick={() => {
              setHiding(true);
              setError(null);
            }}
            className="flex items-center gap-1.5 rounded-sm border-thin border-border-medium px-3 py-1.5 text-xs font-bold text-text-secondary hover:bg-glass-2 hover:text-text-primary"
          >
            <EyeOff className="h-3.5 w-3.5" strokeWidth={1.6} /> Hide
          </button>
        </div>
      </div>

      {open && (
        <div className="space-y-3 border-t-thin border-border-subtle p-3.5 pt-3">
          <div className="flex items-center gap-1.5 text-[11px] text-text-muted">
            <Music className="h-3.5 w-3.5" strokeWidth={1.6} />
            <span className="font-mono">track {recipe.musicTrackRefId}</span>
          </div>

          {beats.length > 0 && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-text-secondary">
                Beats
              </p>
              <ol className="mt-1 space-y-1">
                {beats.map((beat, i) => (
                  <li key={i} className="flex gap-2 text-xs text-text-secondary">
                    <span className="shrink-0 font-mono text-text-muted">
                      {typeof beat.seconds === 'number' ? `${beat.seconds}s` : `${i + 1}.`}
                    </span>
                    <span>{beat.instruction ?? JSON.stringify(beat)}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {captions.length > 0 && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-text-secondary">
                Caption variants
              </p>
              <ul className="mt-1 space-y-1">
                {captions.map((caption, i) => (
                  <li key={i} className="text-xs text-text-secondary">
                    {caption.text ?? JSON.stringify(caption)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {recipe.explanationByKey && Object.keys(recipe.explanationByKey).length > 0 && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-text-secondary">
                Why the model chose this
              </p>
              <dl className="mt-1 space-y-0.5">
                {Object.entries(recipe.explanationByKey).map(([key, value]) => (
                  <div key={key} className="flex gap-2 text-xs">
                    <dt className="shrink-0 font-mono text-text-muted">{key}</dt>
                    <dd className="text-text-secondary">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      )}

      {hiding && (
        <div className="border-t-thin border-border-subtle p-3.5">
          <div className="rounded-sm border-thin border-border-glow bg-brand-soft p-3">
            <p className="text-xs font-bold text-text-primary">Hide this recipe</p>
            <p className="mt-0.5 text-[11px] text-text-muted">
              It stops being offered to creators. The reason is recorded.
            </p>
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason"
              className="mt-2 w-full rounded-sm border-thin border-border-subtle bg-bg-input px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:border-border-glow focus:outline-none"
            />
            {error && <p className="mt-2 text-xs text-rose-300">{error}</p>}
            <div className="mt-2 flex items-center gap-2">
              <button
                disabled={!reason.trim() || act.isPending}
                onClick={() => act.mutate('hide')}
                className="flex items-center gap-1.5 rounded-sm bg-brand px-3 py-1.5 text-xs font-bold text-bg hover:bg-brand-light disabled:opacity-40"
              >
                {act.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.6} />}
                Confirm hide
              </button>
              <button
                onClick={() => {
                  setHiding(false);
                  setReason('');
                  setError(null);
                }}
                className="rounded-sm border-thin border-border-medium px-3 py-1.5 text-xs font-bold text-text-secondary hover:bg-glass-2 hover:text-text-primary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {error && !hiding && <p className="px-3.5 pb-3 text-xs text-rose-300">{error}</p>}
    </div>
  );
}

export { RecipesPage as Component };
