import { useEffect, useState } from 'react';
import { Loader2, SlidersHorizontal, Save, Megaphone, Sparkles, Bot } from 'lucide-react';
import { useFeatureSettings, useUpdateFeatureSettings } from '../api/crm.queries';
import type { TenantFeatureSettings } from '../types/crm.types';

type Key = keyof TenantFeatureSettings;

interface ToggleDef { key: Key; label: string; help: string }
interface Group { title: string; icon: React.ElementType; items: ToggleDef[] }

const GROUPS: Group[] = [
  {
    title: 'Lead capture',
    icon: Megaphone,
    items: [
      { key: 'unifiedLeadPipelineEnabled', label: 'Meta lead ads', help: 'Route Facebook/Instagram lead-ad submissions through the unified pipeline (identity-resolved contact + timeline).' },
      { key: 'webChatPipelineEnabled', label: 'Web chat', help: 'Capture new web-chat visitors as leads.' },
      { key: 'conversationalPipelineEnabled', label: 'Messaging channels', help: 'Capture first contact on WhatsApp, SMS, Telegram, Messenger, Instagram DMs.' },
      { key: 'emailPipelineEnabled', label: 'Inbound email', help: 'Turn emails from unknown senders into leads (deduped by sender address).' },
      { key: 'eventApiPipelineEnabled', label: 'Event API', help: 'Create a lead when a public event-API event carries contact identity.' },
    ],
  },
  {
    title: 'Ingest-time enrichment',
    icon: Sparkles,
    items: [
      { key: 'scoringAtIngestEnabled', label: 'Score on capture', help: 'Run lead scoring the moment a lead is captured.' },
      { key: 'ragEnrichmentAtIngestEnabled', label: 'RAG enrichment on capture', help: 'Enrich captured leads with retrieval context (reserved).' },
      { key: 'dedupScanAtIngestEnabled', label: 'Dedup scan on capture', help: 'Run a duplicate scan after each capture (heavier).' },
    ],
  },
  {
    title: 'AI copilot',
    icon: Bot,
    items: [
      { key: 'agentRuntimeEnabled', label: 'Agent runtime', help: 'Enable the internal CRM copilot that answers questions and takes scoped actions.' },
    ],
  },
  {
    title: 'Search quality',
    icon: Sparkles,
    items: [
      { key: 'rerankerEnabled', label: 'Product reranker', help: 'Re-rank product-search results with the cross-encoder for better relevance. Runs only when a reranker service is deployed.' },
      { key: 'knowledgeRerankerEnabled', label: 'Knowledge reranker', help: 'Also re-rank knowledge-base search results. Off by default; requires a deployed reranker service.' },
      { key: 'correctiveRagEnabled', label: 'Corrective RAG', help: 'Grade retrieved results and refine the query once when they don’t answer it.' },
    ],
  },
];

export function Component() {
  const { data, isLoading } = useFeatureSettings();
  const update = useUpdateFeatureSettings();
  const [draft, setDraft] = useState<TenantFeatureSettings | null>(null);

  useEffect(() => { if (data) setDraft(data as TenantFeatureSettings); }, [data]);

  const dirty = !!draft && !!data && (Object.keys(draft) as Key[]).some((k) => draft[k] !== (data as TenantFeatureSettings)[k]);
  const set = (k: Key, v: boolean) => setDraft((d) => (d ? { ...d, [k]: v } : d));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-brand" strokeWidth={1.8} />
            <h1 className="text-xl font-extrabold text-text-primary tracking-tight">Feature Settings</h1>
          </div>
          <p className="text-sm text-text-secondary mt-1">
            Turn capture channels and AI features on or off for your workspace. Changes take effect within a minute.
          </p>
        </div>
        <button
          onClick={() => draft && update.mutate(draft)}
          disabled={!dirty || update.isPending}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-bg bg-brand hover:bg-brand-light disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          {update.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" strokeWidth={2.5} />}
          Save changes
        </button>
      </div>

      {isLoading || !draft ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-brand animate-spin" /></div>
      ) : (
        <div className="space-y-4">
          {GROUPS.map((g) => (
            <section key={g.title} className="bg-glass-1 border-thin border-border-subtle rounded-card overflow-hidden">
              <div className="flex items-center gap-2.5 px-5 py-3 border-b border-thin border-border-subtle">
                <g.icon className="w-4 h-4 text-text-muted" strokeWidth={1.8} />
                <span className="text-sm font-bold text-text-primary">{g.title}</span>
              </div>
              <div className="divide-y divide-border-subtle">
                {g.items.map((it) => (
                  <div key={it.key} className="flex items-start justify-between gap-4 px-5 py-3.5">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-text-primary">{it.label}</div>
                      <div className="text-xs text-text-muted mt-0.5">{it.help}</div>
                    </div>
                    <Toggle on={draft[it.key]} onChange={(v) => set(it.key, v)} label={it.label} />
                  </div>
                ))}
              </div>
            </section>
          ))}
          <p className="text-xs text-text-muted px-1">
            All features default to off. Only an Owner or Admin can change these — saving as another role is rejected.
          </p>
        </div>
      )}
    </div>
  );
}

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={`relative shrink-0 w-10 h-6 rounded-full border transition-colors ${
        on ? 'bg-brand border-brand' : 'bg-bg-elevated border-border-medium'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 rounded-full bg-bg transition-transform ${on ? 'translate-x-4' : ''}`}
        style={{ width: '1.125rem', height: '1.125rem' }}
      />
    </button>
  );
}
