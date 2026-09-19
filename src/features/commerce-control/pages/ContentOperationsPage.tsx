import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2,
  ExternalLink,
  Facebook,
  Instagram,
  Loader2,
  Play,
  RefreshCw,
  Send,
  ShieldCheck,
  Unplug,
  Users,
  XCircle,
  Youtube,
} from 'lucide-react';
import { stylemintCommerceApi, type SocialContentItem } from '../api/stylemint-commerce.api';
import { useAuth } from '@/shared/hooks/useAuth';
import { UserRole } from '@/features/auth/types/auth.types';
import { isUsableSocialAccount, socialProviderSlug } from '../lib/social-accounts';
import { VendorInsightDialog } from '../components/VendorInsightDialog';

const providers = [
  { slug: 'instagram', name: 'Instagram', platform: 1, icon: Instagram, color: 'from-fuchsia-500/25' },
  { slug: 'facebook', name: 'Facebook', platform: 4, icon: Facebook, color: 'from-blue-500/25' },
  { slug: 'tiktok', name: 'TikTok', platform: 2, icon: Play, color: 'from-cyan-500/25' },
  { slug: 'youtube', name: 'YouTube Shorts', platform: 3, icon: Youtube, color: 'from-red-500/25' },
] as const;

export function ContentOperationsPage() {
  const { user } = useAuth();
  const canOperate = user?.role === UserRole.Owner || user?.role === UserRole.Admin;
  const client = useQueryClient();
  const [provider, setProvider] = useState<(typeof providers)[number]>(providers[0]);
  const [scheduleReel, setScheduleReel] = useState<Record<string, unknown> | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [showAccountDetails, setShowAccountDetails] = useState(false);
  const accounts = useQuery({
    queryKey: ['stylemint-social-accounts'],
    queryFn: stylemintCommerceApi.socialAccounts,
    retry: false,
  });
  const content = useQuery({
    queryKey: ['stylemint-social-content', provider.slug],
    queryFn: () => stylemintCommerceApi.socialContent(provider.slug),
    retry: false,
  });
  const audience = useQuery({
    queryKey: ['stylemint-social-audience'],
    queryFn: stylemintCommerceApi.socialAudienceSummary,
    retry: false,
  });
  const reels = useQuery({
    queryKey: ['stylemint-content-reels'],
    queryFn: stylemintCommerceApi.contentReels,
    retry: false,
  });
  const jobs = useQuery({
    queryKey: ['stylemint-publish-jobs'],
    queryFn: stylemintCommerceApi.publishJobs,
    retry: false,
  });
  const reelRows = useMemo(() => {
    const raw = reels.data as
      | { items?: Array<Record<string, unknown>>; data?: Array<Record<string, unknown>> }
      | undefined;
    return Array.isArray(raw) ? raw : (raw?.items ?? raw?.data ?? []);
  }, [reels.data]);
  const importedIds = useMemo(() => {
    return new Set(reelRows.map((row) => String(row.externalId ?? '')));
  }, [reelRows]);
  const connected = new Set(
    (accounts.data ?? []).filter(isUsableSocialAccount).map(socialProviderSlug).filter(Boolean),
  );
  const providerConnected = connected.has(provider.slug);
  const scopes = useQuery({
    queryKey: ['stylemint-social-scopes', provider.slug],
    queryFn: () => stylemintCommerceApi.socialScopes(provider.slug),
    enabled: providerConnected,
    retry: false,
  });
  const publishScopes = useQuery({
    queryKey: ['stylemint-social-publish-scopes', provider.slug],
    queryFn: () => stylemintCommerceApi.socialPublishScopes(provider.slug),
    enabled: providerConnected,
    retry: false,
  });
  const accountDetails = useQuery({
    queryKey: ['stylemint-social-account', provider.slug],
    queryFn: () => stylemintCommerceApi.socialAccount(provider.slug),
    enabled: providerConnected && showAccountDetails,
    retry: false,
  });
  const jobDetails = useQuery({
    queryKey: ['stylemint-publish-job', selectedJobId],
    queryFn: () => stylemintCommerceApi.publishJob(selectedJobId!),
    enabled: !!selectedJobId,
    retry: false,
  });

  const refresh = useMutation({
    mutationFn: () => stylemintCommerceApi.refreshSocial(provider.slug),
    onSuccess: () => client.invalidateQueries({ queryKey: ['stylemint-social-content', provider.slug] }),
  });
  const connect = useMutation({
    mutationFn: () => stylemintCommerceApi.connectSocial(provider.slug),
    onSuccess: ({ url }) => window.open(url, '_blank', 'noopener,noreferrer'),
  });
  const disconnect = useMutation({
    mutationFn: () => stylemintCommerceApi.disconnectSocial(provider.slug, 'Deconnexion demandee depuis Lead360.'),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['stylemint-social-accounts'] });
      await client.invalidateQueries({ queryKey: ['stylemint-social-audience'] });
    },
  });
  const publishConsent = useMutation({
    mutationFn: (action: 'grant' | 'revoke') =>
      stylemintCommerceApi.changeSocialPublishScope(provider.slug, action),
    onSuccess: () => client.invalidateQueries({ queryKey: ['stylemint-social-publish-scopes', provider.slug] }),
  });
  const cancelJob = useMutation({
    mutationFn: (id: string) => stylemintCommerceApi.cancelPublishJob(id),
    onSuccess: () => client.invalidateQueries({ queryKey: ['stylemint-publish-jobs'] }),
  });
  const importContent = useMutation({
    mutationFn: (item: SocialContentItem) =>
      stylemintCommerceApi.importSocialContent({
        sourcePlatform: provider.platform,
        sourceUrl: item.permalink,
        externalId: item.externalId,
        durationSeconds: item.durationSeconds ?? 40,
        caption: item.caption,
        thumbnailCdnUrl: item.thumbnailUrl,
        videoCdnUrl: item.videoUrl,
      }),
    onSuccess: () => client.invalidateQueries({ queryKey: ['stylemint-content-reels'] }),
  });
  const reelAction = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'publish' | 'unpublish' | 'caption' }) => {
      if (action === 'caption') {
        const caption = window.prompt('Nouvelle legende du reel') ?? '';
        return stylemintCommerceApi.updateContentCaption(id, caption);
      }
      return stylemintCommerceApi.contentReelAction(id, action);
    },
    onSuccess: () => client.invalidateQueries({ queryKey: ['stylemint-content-reels'] }),
  });
  const schedule = useMutation({
    mutationFn: (data: {
      reelId: string;
      scheduledUtc: string;
      platforms: number[];
      baseCaption: string;
      intendedPostAtLocal: string;
      sourceVideoUrl?: string;
    }) => stylemintCommerceApi.schedulePublish({ ...data, productTitles: [] }),
    onSuccess: async () => {
      setScheduleReel(null);
      await client.invalidateQueries({ queryKey: ['stylemint-publish-jobs'] });
    },
  });

  const items = content.data?.items ?? [];
  return (
    <div className="mx-auto max-w-[1500px] space-y-5">
      <section className="overflow-hidden rounded-[26px] border border-brand/20 bg-[#08120e] p-6 md:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-brand">
              Social Content Hub
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-white md:text-4xl">
              Du reseau social au rayon Stylemint
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/55">
              Importez les contenus Kin Marche, verifiez leur rendu, puis publiez-les dans Mall et Discovery.
              Les outils createur restent exclusivement dans l'application mobile.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
            <p className="text-[9px] font-bold uppercase tracking-wider text-white/40">Couverture</p>
            <p className="mt-1 text-2xl font-black text-white">
              {connected.size}/4 <span className="text-xs font-semibold text-white/40">plateformes</span>
            </p>
            <p className="mt-1 text-[10px] text-white/45">
              {Number(audience.data?.totalFollowers ?? 0).toLocaleString('fr-CD')} abonnes au total
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 rounded-2xl border border-border-subtle bg-bg-card p-5 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-brand" />
            <h2 className="text-sm font-extrabold text-text-primary">Acces et autorisations {provider.name}</h2>
          </div>
          <p className="mt-2 text-xs leading-5 text-text-muted">
            {providerConnected
              ? `${scopes.data?.length ?? 0} autorisations plateforme · ${activePublishGrant(publishScopes.data) ? 'publication autorisee' : 'publication non autorisee'}`
              : 'Liez le compte officiel Kin Marche pour importer et diffuser son contenu.'}
          </p>
          {providerConnected && !!scopes.data?.length && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {scopes.data.slice(0, 8).map((scope, index) => (
                <span key={String(scope.name ?? scope.scope ?? index)} className="rounded-full bg-bg-elevated px-2.5 py-1 text-[9px] font-bold text-text-secondary">
                  {String(scope.name ?? scope.scope ?? 'autorisation')}
                </span>
              ))}
            </div>
          )}
        </div>
        {canOperate && (
          <div className="flex flex-wrap gap-2">
            {!providerConnected ? (
              <button onClick={() => connect.mutate()} disabled={connect.isPending} className="rounded-xl bg-brand px-4 py-2.5 text-xs font-extrabold text-black disabled:opacity-50">
                Connecter {provider.name}
              </button>
            ) : (
              <>
                <button onClick={() => setShowAccountDetails(true)} className="rounded-xl border border-border-subtle px-3 py-2.5 text-xs font-bold text-text-secondary">Account details</button>
                <button onClick={() => publishConsent.mutate(activePublishGrant(publishScopes.data) ? 'revoke' : 'grant')} disabled={publishConsent.isPending} className="rounded-xl border border-border-subtle px-3 py-2.5 text-xs font-bold text-text-secondary">
                  {activePublishGrant(publishScopes.data) ? 'Retirer la publication' : 'Autoriser la publication'}
                </button>
                <button onClick={() => connect.mutate()} disabled={connect.isPending} className="rounded-xl border border-brand/30 px-3 py-2.5 text-xs font-bold text-brand">Reconnecter</button>
                <button onClick={() => window.confirm(`Deconnecter ${provider.name} ?`) && disconnect.mutate()} disabled={disconnect.isPending} className="rounded-xl border border-danger/25 px-3 py-2.5 text-xs font-bold text-danger">Deconnecter</button>
              </>
            )}
          </div>
        )}
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {providers.map((entry) => {
          const Icon = entry.icon;
          const isConnected = connected.has(entry.slug);
          const active = provider.slug === entry.slug;
          return (
            <button
              key={entry.slug}
              onClick={() => setProvider(entry)}
              className={`relative overflow-hidden rounded-2xl border p-4 text-left transition-all ${active ? 'border-brand/40 bg-brand-soft' : 'border-border-subtle bg-bg-card hover:border-border-medium'}`}
            >
              <div
                className={`absolute inset-x-0 top-0 h-16 bg-gradient-to-b ${entry.color} to-transparent`}
              />
              <div className="relative flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-black/20">
                  <Icon className="h-4 w-4 text-text-primary" />
                </div>
                <div>
                  <p className="text-sm font-extrabold text-text-primary">{entry.name}</p>
                  <p
                    className={`mt-0.5 flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider ${isConnected ? 'text-success' : 'text-amber-400'}`}
                  >
                    {isConnected ? <CheckCircle2 className="h-3 w-3" /> : <Unplug className="h-3 w-3" />}
                    {isConnected ? 'Connecte' : 'A connecter'}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </section>

      <section className="overflow-hidden rounded-2xl border border-border-subtle bg-bg-card">
        <div className="flex flex-col gap-3 border-b border-border-subtle px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-extrabold text-text-primary">Contenus {provider.name}</h2>
            <p className="mt-0.5 text-xs text-text-muted">
              {content.data?.servedFromCache
                ? 'Contenu sauvegarde · actualisation disponible'
                : 'Synchronized with the platform'}
            </p>
          </div>
          {canOperate && (
            <button
              onClick={() => refresh.mutate()}
              disabled={refresh.isPending}
              className="flex items-center justify-center gap-2 rounded-xl border border-border-subtle px-3 py-2 text-xs font-bold text-text-secondary hover:text-brand disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refresh.isPending ? 'animate-spin' : ''}`} /> Synchronize
            </button>
          )}
        </div>
        {content.isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-brand" />
          </div>
        ) : content.isError ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3 px-6 text-center">
            <Unplug className="h-8 w-8 text-amber-400" />
            <p className="font-bold text-text-primary">Compte {provider.name} non disponible</p>
            <p className="max-w-lg text-xs leading-5 text-text-muted">
              Connectez le compte Kin Marche ou configurez le jeton operateur Stylemint pour charger ses
              contenus.
            </p>
          </div>
        ) : !items.length ? (
          <div className="flex h-64 flex-col items-center justify-center gap-2">
            <Play className="h-8 w-8 text-text-muted/40" />
            <p className="text-sm text-text-muted">Aucun contenu disponible.</p>
          </div>
        ) : (
          <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {items.map((item) => (
              <ContentCard
                key={item.externalId}
                item={item}
                imported={importedIds.has(item.externalId)}
                busy={importContent.isPending && importContent.variables?.externalId === item.externalId}
                canImport={canOperate}
                onImport={() => importContent.mutate(item)}
              />
            ))}
          </div>
        )}
      </section>
      <PublishQueue jobs={jobs.data} canOperate={canOperate} cancelling={cancelJob.isPending} onCancel={(id) => cancelJob.mutate(id)} onInspect={setSelectedJobId} />

      <section className="overflow-hidden rounded-2xl border border-border-subtle bg-bg-card">
        <div className="flex items-center justify-between border-b border-border-subtle px-5 py-4">
          <div>
            <h2 className="text-base font-extrabold text-text-primary">Reels Stylemint & diffusion</h2>
            <p className="mt-0.5 text-xs text-text-muted">
              Publiez dans Mall/Discovery, ajustez les legendes et programmez la diffusion sociale.
            </p>
          </div>
          <div className="rounded-lg bg-brand-soft px-3 py-2 text-[10px] font-extrabold uppercase text-brand">
            {reelRows.length} reels · {countItems(jobs.data)} diffusions
          </div>
        </div>
        {reels.isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-brand" />
          </div>
        ) : !reelRows.length ? (
          <div className="flex h-44 items-center justify-center text-sm text-text-muted">
            Importez un contenu social pour commencer.
          </div>
        ) : (
          <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
            {reelRows.map((reel) => (
              <ManagedReelCard
                key={String(reel.id)}
                reel={reel}
                canOperate={canOperate}
                busy={reelAction.isPending}
                onAction={(action) => reelAction.mutate({ id: String(reel.id), action })}
                onSchedule={() => setScheduleReel(reel)}
              />
            ))}
          </div>
        )}
      </section>
      {scheduleReel && (
        <SchedulePublishDialog
          reel={scheduleReel}
          busy={schedule.isPending}
          error={schedule.isError ? (schedule.error as Error).message : ''}
          onClose={() => setScheduleReel(null)}
          onSubmit={(data) => schedule.mutate(data)}
        />
      )}
      {showAccountDetails && (
        <VendorInsightDialog title={`${provider.name} account`} subtitle="Connection, identity and synchronization details from Stylemint." data={accountDetails.isLoading ? { status: 'Loading account details…' } : accountDetails.isError ? { error: 'Account details could not be loaded.' } : accountDetails.data} onClose={() => setShowAccountDetails(false)} />
      )}
      {selectedJobId && (
        <VendorInsightDialog title="Publishing job" subtitle={`Live execution detail · ${selectedJobId}`} data={jobDetails.isLoading ? { status: 'Loading publishing job…' } : jobDetails.isError ? { error: 'Publishing job details could not be loaded.' } : jobDetails.data} onClose={() => setSelectedJobId(null)} />
      )}
    </div>
  );
}

function countItems(value: unknown): number {
  if (Array.isArray(value)) return value.length;
  if (!value || typeof value !== 'object') return 0;
  const data = value as Record<string, unknown>;
  for (const key of ['items', 'data', 'results']) if (Array.isArray(data[key])) return data[key].length;
  return 0;
}

function rowsOf(value: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(value)) return value as Array<Record<string, unknown>>;
  if (!value || typeof value !== 'object') return [];
  const data = value as Record<string, unknown>;
  for (const key of ['items', 'data', 'results']) if (Array.isArray(data[key])) return data[key] as Array<Record<string, unknown>>;
  return [];
}

function activePublishGrant(value?: Array<Record<string, unknown>>): boolean {
  return !!value?.some((item) => item.isActive === true || (!item.revokedUtc && item.grantedUtc));
}

function PublishQueue({ jobs, canOperate, cancelling, onCancel, onInspect }: { jobs: unknown; canOperate: boolean; cancelling: boolean; onCancel: (id: string) => void; onInspect: (id: string) => void }) {
  const rows = rowsOf(jobs).slice(0, 8);
  if (!rows.length) return null;
  return (
    <section className="overflow-hidden rounded-2xl border border-border-subtle bg-bg-card">
      <div className="flex items-center gap-2 border-b border-border-subtle px-5 py-4"><Users className="h-4 w-4 text-brand" /><h2 className="text-base font-extrabold text-text-primary">File de diffusion</h2></div>
      <div className="divide-y divide-border-subtle">
        {rows.map((job, index) => {
          const id = String(job.id ?? job.publishJobId ?? '');
          const status = String(job.status ?? job.state ?? 'Programme');
          const cancellable = !/cancel|complete|publish|fail/i.test(status);
          return <div key={id || index} className="flex items-center justify-between gap-4 px-5 py-3">
            <div><p className="text-xs font-extrabold text-text-primary">{String(job.baseCaption ?? job.caption ?? `Diffusion ${index + 1}`).slice(0, 90)}</p><p className="mt-1 text-[10px] uppercase tracking-wider text-text-muted">{status} · {String(job.scheduledUtc ?? job.createdUtc ?? '')}</p></div>
            <div className="flex shrink-0 gap-2">{id && <button onClick={() => onInspect(id)} className="rounded-lg border border-border-subtle px-3 py-2 text-[10px] font-bold text-text-secondary">Details</button>}{canOperate && id && cancellable && <button onClick={() => onCancel(id)} disabled={cancelling} className="flex items-center gap-1.5 rounded-lg border border-danger/25 px-3 py-2 text-[10px] font-bold text-danger disabled:opacity-40"><XCircle className="h-3 w-3" /> Cancel</button>}</div>
          </div>;
        })}
      </div>
    </section>
  );
}

function ManagedReelCard({
  reel,
  canOperate,
  busy,
  onAction,
  onSchedule,
}: {
  reel: Record<string, unknown>;
  canOperate: boolean;
  busy: boolean;
  onAction: (action: 'publish' | 'unpublish' | 'caption') => void;
  onSchedule: () => void;
}) {
  const state = Number(reel.state ?? 0);
  const image = String(reel.thumbnailCdnUrl ?? reel.videoCdnUrl ?? '');
  return (
    <article className="overflow-hidden rounded-2xl border border-border-subtle bg-bg-elevated">
      <div className="relative aspect-video bg-black">
        {image ? (
          <img src={image} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Play className="h-8 w-8 text-white/25" />
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-black/35">
            <Play className="ml-0.5 h-4 w-4 fill-white text-white" />
          </span>
        </div>
        <span className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-1 text-[9px] font-bold text-white">
          {state === 3 ? 'Publie' : state === 4 ? 'Depublie' : 'Brouillon'}
        </span>
      </div>
      <div className="p-4">
        <p className="line-clamp-2 min-h-10 text-xs leading-5 text-text-secondary">
          {String(reel.caption ?? 'Sans legende')}
        </p>
        {canOperate && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            <button
              disabled={busy}
              onClick={() => onAction(state === 3 ? 'unpublish' : 'publish')}
              className="rounded-lg bg-brand px-3 py-2 text-[10px] font-extrabold text-black disabled:opacity-40"
            >
              {state === 3 ? 'Depublier' : 'Publier'}
            </button>
            <button
              disabled={busy}
              onClick={() => onAction('caption')}
              className="rounded-lg border border-border-subtle px-3 py-2 text-[10px] font-bold text-text-secondary"
            >
              Legende
            </button>
            <button
              disabled={busy}
              onClick={onSchedule}
              className="rounded-lg border border-border-subtle px-3 py-2 text-[10px] font-bold text-text-secondary"
            >
              Programmer
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

function SchedulePublishDialog({
  reel,
  busy,
  error,
  onClose,
  onSubmit,
}: {
  reel: Record<string, unknown>;
  busy: boolean;
  error: string;
  onClose: () => void;
  onSubmit: (data: {
    reelId: string;
    scheduledUtc: string;
    platforms: number[];
    baseCaption: string;
    intendedPostAtLocal: string;
    sourceVideoUrl?: string;
  }) => void;
}) {
  const [when, setWhen] = useState('');
  const [caption, setCaption] = useState(String(reel.caption ?? ''));
  const [platforms, setPlatforms] = useState<number[]>([1, 4]);
  const toggle = (value: number) =>
    setPlatforms((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
    );
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <button aria-label="Fermer" className="absolute inset-0 bg-black/75" onClick={onClose} />
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const utc = new Date(when).toISOString();
          onSubmit({
            reelId: String(reel.id),
            scheduledUtc: utc,
            intendedPostAtLocal: utc,
            platforms,
            baseCaption: caption.trim(),
            sourceVideoUrl: String(reel.videoCdnUrl ?? '') || undefined,
          });
        }}
        className="relative w-full max-w-lg rounded-2xl border border-brand/20 bg-bg-card p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-brand">
              Diffusion multicanal
            </p>
            <h3 className="mt-1 text-lg font-black text-text-primary">Programmer le reel</h3>
          </div>
          <button type="button" onClick={onClose} className="text-text-muted">
            Fermer
          </button>
        </div>
        <label className="mt-5 block text-[10px] font-bold uppercase text-text-muted">
          Date et heure Kinshasa
          <input
            required
            type="datetime-local"
            value={when}
            onChange={(event) => setWhen(event.target.value)}
            className="mt-1.5 w-full rounded-xl border border-border-subtle bg-bg-elevated px-3 py-2.5 text-sm text-text-primary"
          />
        </label>
        <label className="mt-3 block text-[10px] font-bold uppercase text-text-muted">
          Legende
          <textarea
            required
            rows={4}
            value={caption}
            onChange={(event) => setCaption(event.target.value)}
            className="mt-1.5 w-full rounded-xl border border-border-subtle bg-bg-elevated px-3 py-2.5 text-sm text-text-primary"
          />
        </label>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {providers.map((entry) => (
            <label
              key={entry.slug}
              className="flex items-center gap-2 rounded-xl border border-border-subtle bg-bg-elevated p-3 text-xs font-semibold text-text-secondary"
            >
              <input
                type="checkbox"
                checked={platforms.includes(entry.platform)}
                onChange={() => toggle(entry.platform)}
              />
              {entry.name}
            </label>
          ))}
        </div>
        {error && <p className="mt-3 text-xs font-semibold text-danger">{error}</p>}
        <button
          disabled={busy || !when || !caption.trim() || platforms.length === 0}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3 text-sm font-extrabold text-black disabled:opacity-40"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}Programmer la diffusion
        </button>
      </form>
    </div>
  );
}

function ContentCard({
  item,
  imported,
  busy,
  canImport,
  onImport,
}: {
  item: SocialContentItem;
  imported: boolean;
  busy: boolean;
  canImport: boolean;
  onImport: () => void;
}) {
  const image = item.thumbnailUrl || item.videoUrl;
  return (
    <article className="overflow-hidden rounded-2xl border border-border-subtle bg-bg-elevated">
      <div className="relative aspect-[4/5] bg-black">
        {image ? (
          <img
            src={image}
            alt={item.caption || 'Contenu social Kin Marche'}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Play className="h-10 w-10 text-white/25" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/30 bg-black/35 backdrop-blur-sm">
            <Play className="ml-0.5 h-5 w-5 fill-white text-white" />
          </div>
        </div>
        <div className="absolute inset-x-3 bottom-3 flex items-end justify-between gap-3">
          <p className="line-clamp-2 text-xs font-semibold leading-5 text-white">
            {item.caption || 'Sans legende'}
          </p>
          <a
            href={item.permalink}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg bg-black/40 p-2 text-white backdrop-blur-sm"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 p-3">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-wider text-text-muted">{item.mediaType}</p>
          <p className="mt-0.5 text-[11px] text-text-secondary">
            {(item.viewCount ?? 0).toLocaleString('fr-CD')} vues
          </p>
        </div>
        {canImport && (
          <button
            onClick={onImport}
            disabled={imported || busy}
            className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-[10px] font-extrabold text-bg disabled:bg-bg-card disabled:text-text-muted"
          >
            {busy ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : imported ? (
              <CheckCircle2 className="h-3 w-3" />
            ) : (
              <Send className="h-3 w-3" />
            )}
            {imported ? 'Importe' : 'Importer'}
          </button>
        )}
      </div>
    </article>
  );
}

export { ContentOperationsPage as Component };
