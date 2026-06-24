import { useState } from 'react';
import {
  Package,
  Sparkles,
  Database,
  Key,
  Search,
  Loader2,
  RefreshCw,
  CheckCircle,
  Save,
  Clock,
  AlertTriangle,
  Star,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { StatusBadge } from '@/shared/components';
import {
  useSyncStatus,
  useSyncConfig,
  useEnrichmentStatus,
  useEmbeddingStatus,
  useCacheStats,
  useTriggerSync,
  useEnrichAll,
  useEmbedAll,
  useBuildCache,
  useUpdateSyncConfig,
  useSyncLogs,
  useProductSearch,
} from '../api/catalog.queries';
import { useApiHealth } from '@/features/api-connection/api/api-connection.queries';
import type {
  SyncStatusDto,
  SyncConfigDto,
  EnrichmentStatusDto,
  EmbeddingStatusDto,
  CacheStatsDto,
  SyncLogDto,
  SearchResultDto,
  SearchProductDto,
} from '../types/catalog.types';
import { syncConfigSchema, type SyncConfigFormData } from '../types/catalog.types';

type Stage = 'sync' | 'enrich' | 'embed' | 'cache';
const M: Record<Stage, { label: string; icon: typeof Package; color: string; sub: string }> = {
  sync: { label: 'Sync', icon: Package, color: '#00D97E', sub: 'Raw product data from your API' },
  enrich: {
    label: 'Enrich',
    icon: Sparkles,
    color: '#3B82F6',
    sub: 'LLM adds descriptions, tags & attributes',
  },
  embed: { label: 'Embed', icon: Database, color: '#10B981', sub: 'Vector embeddings for AI-powered search' },
  cache: { label: 'Cache', icon: Key, color: '#F59E0B', sub: 'Keyword lookup for instant matching' },
};

export function Component() {
  const [act, setAct] = useState<Stage>('sync');
  const [q, setQ] = useState('');
  const [mr, setMr] = useState(5);

  const { data: rSync } = useSyncStatus();
  const { data: rCfg, isLoading: cfgL } = useSyncConfig();
  const { data: rEnr } = useEnrichmentStatus();
  const { data: rEmb } = useEmbeddingStatus();
  const { data: rCch } = useCacheStats();
  const { data: rHp } = useApiHealth();
  const { data: rLogs } = useSyncLogs();

  const sync = rSync as unknown as SyncStatusDto | undefined;
  const cfg = rCfg as unknown as SyncConfigDto | undefined;
  const enr = rEnr as unknown as EnrichmentStatusDto | undefined;
  const emb = rEmb as unknown as EmbeddingStatusDto | undefined;
  const cch = rCch as unknown as CacheStatsDto | undefined;
  const hp = rHp as any;
  const logs = (rLogs as unknown as SyncLogDto[]) ?? [];

  const tSync = useTriggerSync();
  const tEnr = useEnrichAll();
  const tEmb = useEmbedAll();
  const tCch = useBuildCache();
  const sm = useProductSearch();
  const sr = sm.data as unknown as SearchResultDto | undefined;

  const sDone = (sync?.productCount ?? 0) > 0;
  const ePct = enr?.enrichmentPercent ?? 0;
  const mPct = emb?.embeddingPercent ?? 0;
  const cDone = (cch?.totalKeywords ?? 0) > 0;
  const ready = Math.round((sDone ? 25 : 0) + ePct / 4 + mPct / 4 + (cDone ? 25 : 0));
  const doS = () => {
    if (q.trim()) sm.mutate({ customerMessage: q, maxResults: mr });
  };

  const stg: { k: Stage; v: string | number; done: boolean; pct?: number }[] = [
    { k: 'sync', v: sync?.productCount ?? 0, done: sDone },
    { k: 'enrich', v: `${ePct}%`, done: ePct >= 100, pct: ePct },
    { k: 'embed', v: `${mPct}%`, done: mPct >= 100, pct: mPct },
    { k: 'cache', v: cch?.totalKeywords ?? 0, done: cDone },
  ];

  return (
    <div
      className="flex h-[calc(100vh-120px)] min-h-[520px] rounded-2xl overflow-hidden"
      style={{ border: '1px solid #1E2E26' }}
    >
      {/* ═══ LEFT SIDEBAR ═══ */}
      <div
        className="w-[250px] flex flex-col shrink-0"
        style={{ background: '#040706', borderRight: '1px solid #1E2E26' }}
      >
        <div style={{ padding: '20px 20px 16px' }}>
          <h1 style={{ fontSize: 15, fontWeight: 700, color: '#E8F0EC' }}>Pipeline</h1>
          {/* Fat segmented bar */}
          <div
            style={{
              display: 'flex',
              height: 10,
              borderRadius: 8,
              overflow: 'hidden',
              gap: 3,
              marginTop: 12,
              padding: 2,
              background: '#0A0F0D',
              border: '1px solid #162019',
            }}
          >
            {stg.map((s) => (
              <div key={s.k} style={{ flex: 1, borderRadius: 6, overflow: 'hidden', background: '#111916' }}>
                <div
                  style={{
                    width: `${s.done ? 100 : (s.pct ?? 0)}%`,
                    height: '100%',
                    borderRadius: 6,
                    background: M[s.k].color,
                    transition: 'width 0.7s',
                  }}
                />
              </div>
            ))}
          </div>
          <p style={{ fontSize: 11, color: '#708A7E', marginTop: 8 }}>
            {(sync?.productCount ?? 0).toLocaleString()} products ·{' '}
            <span style={{ color: '#00D97E', fontWeight: 700 }}>{ready}%</span> search ready
          </p>
        </div>

        <div className="flex-1 overflow-y-auto" style={{ padding: '0 12px 12px' }}>
          {stg.map((s, i) => {
            const m = M[s.k];
            const Icon = m.icon;
            const sel = act === s.k;
            const pv = s.done ? 100 : (s.pct ?? 0);
            const R = 23,
              C = 2 * Math.PI * R;

            return (
              <div key={s.k}>
                <button
                  onClick={() => setAct(s.k)}
                  className="w-full text-left relative overflow-hidden transition-all"
                  style={{
                    padding: '16px 16px 16px 20px',
                    borderRadius: 16,
                    border: sel ? `2px solid ${m.color}70` : '1.5px solid #1E2E26',
                    background: sel ? `linear-gradient(145deg, ${m.color}20, ${m.color}08)` : '#0A0F0D',
                    boxShadow: sel ? `0 0 30px ${m.color}12, inset 0 1px 0 ${m.color}15` : 'none',
                    animation: sel ? 'breathe-glow 3s ease infinite' : 'none',
                    ['--glow-color' as any]: `${m.color}15`,
                  }}
                >
                  {/* Left accent */}
                  {sel && (
                    <div
                      className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full"
                      style={{ background: m.color }}
                    />
                  )}

                  {/* Ghost number */}
                  <span
                    className="absolute -right-1 top-1/2 -translate-y-1/2 leading-none pointer-events-none select-none"
                    style={{ fontSize: 60, fontWeight: 800, color: m.color, opacity: sel ? 0.1 : 0.035 }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>

                  <div className="flex items-center gap-[14px] relative">
                    {/* Machine ring + icon */}
                    <div className="relative shrink-0" style={{ width: 60, height: 60 }}>
                      {/* Spinning ring container */}
                      <svg
                        viewBox="0 0 60 60"
                        className="absolute inset-0"
                        style={
                          pv === 0
                            ? { animation: 'ring-spin-slow 12s linear infinite' }
                            : { transform: 'rotate(-90deg)' }
                        }
                      >
                        {/* Track ring — dashes march when empty */}
                        <circle
                          cx="30"
                          cy="30"
                          r={R}
                          fill="none"
                          stroke={pv > 0 ? '#1E2E26' : m.color}
                          strokeOpacity={pv > 0 ? 1 : 0.35}
                          strokeWidth="4"
                          strokeDasharray={pv > 0 ? 'none' : '5 5'}
                          style={pv === 0 ? { animation: 'ring-dash-march 2s linear infinite' } : undefined}
                        />
                        {/* Progress fill */}
                        {pv > 0 && (
                          <circle
                            cx="30"
                            cy="30"
                            r={R}
                            fill="none"
                            stroke={m.color}
                            strokeWidth="5"
                            strokeDasharray={C}
                            strokeDashoffset={C - (pv / 100) * C}
                            strokeLinecap="round"
                            className="transition-all duration-700"
                          />
                        )}
                      </svg>
                      {/* Inner icon with glow pulse */}
                      <div
                        className="absolute flex items-center justify-center"
                        style={{
                          inset: 10,
                          borderRadius: 14,
                          background: `${m.color}30`,
                          border: `1.5px solid ${m.color}50`,
                          animation: sel ? 'icon-glow 2.5s ease infinite' : 'none',
                          ['--icon-glow' as any]: `${m.color}30`,
                        }}
                      >
                        <Icon style={{ width: 22, height: 22, color: m.color }} strokeWidth={1.5} />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: '#8A9B91',
                          textTransform: 'uppercase',
                          letterSpacing: '2.5px',
                        }}
                      >
                        {m.label}
                      </div>
                      <div
                        style={{
                          fontSize: 28,
                          fontWeight: 800,
                          color: m.color,
                          lineHeight: 1.1,
                          letterSpacing: '-0.5px',
                        }}
                      >
                        {typeof s.v === 'number' ? s.v.toLocaleString() : s.v}
                      </div>
                    </div>

                    {/* Status — heartbeat dot when idle */}
                    {s.done ? (
                      <CheckCircle style={{ width: 20, height: 20, color: m.color }} strokeWidth={2.5} />
                    ) : s.pct && s.pct > 0 ? (
                      <Loader2 className="animate-spin" style={{ width: 18, height: 18, color: m.color }} />
                    ) : (
                      <div
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          background: `${m.color}30`,
                          border: `2px solid ${m.color}50`,
                          boxShadow: `0 0 8px ${m.color}20`,
                          animation: 'heartbeat 2s ease infinite',
                        }}
                      />
                    )}
                  </div>

                  {/* Progress bar with shimmer */}
                  {s.pct != null && s.pct > 0 && s.pct < 100 && (
                    <div
                      style={{
                        height: 5,
                        borderRadius: 3,
                        background: '#111916',
                        marginTop: 12,
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${s.pct}%`,
                          height: '100%',
                          borderRadius: 3,
                          background: `linear-gradient(90deg, ${m.color}, ${m.color}80)`,
                          transition: 'width 0.7s',
                          position: 'relative',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            position: 'absolute',
                            top: 0,
                            width: '60%',
                            height: '100%',
                            background:
                              'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                            animation: 'shimmer-scan 1.5s ease infinite',
                          }}
                        />
                      </div>
                    </div>
                  )}
                </button>

                {/* Pipe - glowing dot travels down */}
                {i < stg.length - 1 && (
                  <div className="flex justify-center" style={{ height: 22 }}>
                    <div
                      className="relative overflow-hidden"
                      style={{ width: 4, height: '100%', borderRadius: 3, background: `${m.color}15` }}
                    >
                      {/* Traveling dot */}
                      <div
                        style={{
                          position: 'absolute',
                          left: 0,
                          width: '100%',
                          height: 10,
                          borderRadius: 3,
                          background: m.color,
                          boxShadow: `0 0 8px ${m.color}60`,
                          animation: `pipe-dot ${s.done ? '1s' : '2.5s'} ease infinite`,
                          opacity: s.done ? 1 : 0.4,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Search readiness */}
          <div style={{ marginTop: 'auto', paddingTop: 16 }}>
            <div
              style={{
                padding: 18,
                borderRadius: 16,
                background: `linear-gradient(145deg, rgba(0,217,126,0.06), rgba(0,217,126,0.02))`,
                border: '1.5px solid rgba(0,217,126,0.15)',
              }}
            >
              <div className="flex items-center gap-[14px]">
                <SvgRing pct={ready} color="#00D97E" size={56} sw={5} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#00D97E' }}>Search</div>
                  <div style={{ fontSize: 12, color: '#708A7E' }}>readiness</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ RIGHT DETAIL ═══ */}
      <div className="flex-1 flex flex-col overflow-hidden" style={{ background: '#070A08' }}>
        <div className="flex-1 overflow-y-auto">
          {act === 'sync' && <SyncDtl sync={sync} cfg={cfg} cfgL={cfgL} hp={hp} logs={logs} mut={tSync} />}
          {act === 'enrich' && <EnrDtl d={enr} mut={tEnr} />}
          {act === 'embed' && <EmbDtl d={emb} mut={tEmb} />}
          {act === 'cache' && <CchDtl d={cch} mut={tCch} />}
        </div>

        {/* Search bar */}
        <div
          className="shrink-0 flex items-center gap-3"
          style={{ padding: '14px 24px', borderTop: '1px solid #1E2E26', background: '#050808' }}
        >
          <div
            className="shrink-0 flex items-center justify-center"
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: 'rgba(0,217,126,0.12)',
              border: '1.5px solid rgba(0,217,126,0.2)',
            }}
          >
            <Search style={{ width: 18, height: 18, color: '#00D97E' }} strokeWidth={1.5} />
          </div>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && doS()}
            placeholder='Test search: "phones under $500"'
            className="cfi flex-1"
            style={{ padding: '12px 18px', fontSize: 13 }}
          />
          <select
            value={mr}
            onChange={(e) => setMr(Number(e.target.value))}
            className="cfi appearance-none cursor-pointer"
            style={{ width: 60, padding: '12px', fontSize: 12 }}
          >
            {[3, 5, 10, 15, 20].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <button
            onClick={doS}
            disabled={sm.isPending || !q.trim()}
            className="flex items-center gap-2 font-semibold disabled:opacity-40 transition-all"
            style={{
              padding: '12px 24px',
              borderRadius: 12,
              background: '#00D97E',
              color: '#050808',
              fontSize: 13,
              boxShadow: '0 0 24px rgba(0,217,126,0.15)',
            }}
          >
            {sm.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search style={{ width: 16, height: 16 }} strokeWidth={2} />
            )}
            Search
          </button>
        </div>

        {sr && (
          <div
            className="shrink-0 max-h-[280px] overflow-y-auto px-6 py-4 space-y-3"
            style={{ borderTop: '1px solid #1E2E26', background: '#050808' }}
          >
            <div className="flex items-center gap-3 flex-wrap">
              <span
                className="px-3 py-1.5 rounded-lg text-2xs font-semibold"
                style={{ background: '#0A0F0D', border: '1px solid #1E2E26', color: '#8A9B91' }}
              >
                Complexity: <span style={{ color: '#00D97E' }}>{sr.complexity}</span>
              </span>
              <span
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-2xs font-semibold"
                style={{ background: '#0A0F0D', border: '1px solid #1E2E26', color: '#8A9B91' }}
              >
                <Clock className="w-3 h-3" style={{ color: '#708A7E' }} /> {sr.metrics.totalTimeMs}ms
              </span>
            </div>
            {sr.summary && (
              <div
                className="px-4 py-3 rounded-xl text-xs leading-relaxed"
                style={{ background: '#0A0F0D', border: '1px solid #1E2E26', color: '#8A9B91' }}
              >
                <p
                  className="font-bold uppercase tracking-wide mb-1"
                  style={{ fontSize: 10, color: '#708A7E' }}
                >
                  AI Summary
                </p>
                {sr.summary}
              </div>
            )}
            {sr.products.map((p, i) => (
              <SRCard key={i} item={p} rank={i + 1} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══ SVG RING ═══ */
function SvgRing({ pct, color, size, sw = 5 }: { pct: number; color: string; size: number; sw?: number }) {
  const r = size / 2 - 5,
    c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg
        viewBox={`0 0 ${size} ${size}`}
        style={
          pct === 0 ? { animation: 'ring-spin-slow 12s linear infinite' } : { transform: 'rotate(-90deg)' }
        }
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={pct > 0 ? '#1E2E26' : color}
          strokeOpacity={pct > 0 ? 1 : 0.35}
          strokeWidth={sw}
          strokeDasharray={pct > 0 ? 'none' : '5 5'}
          style={pct === 0 ? { animation: 'ring-dash-march 2s linear infinite' } : undefined}
        />
        {pct > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={sw}
            strokeDasharray={c}
            strokeDashoffset={c - (pct / 100) * c}
            strokeLinecap="round"
            className="transition-all duration-700"
          />
        )}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span style={{ fontSize: size > 50 ? 15 : 12, fontWeight: 800, color: '#E8F0EC' }}>
          {Math.round(pct)}%
        </span>
      </div>
    </div>
  );
}

/* ═══ STAGE HEADER ═══ */
function Hdr({ stg, badge, children }: { stg: Stage; badge?: React.ReactNode; children?: React.ReactNode }) {
  const m = M[stg];
  const Icon = m.icon;
  return (
    <div className="relative overflow-hidden shrink-0">
      {/* Thick gradient bar */}
      <div style={{ height: 4, background: `linear-gradient(90deg, ${m.color}, ${m.color}20)` }} />
      {/* Radial glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: -50,
          left: 30,
          width: 200,
          height: 150,
          borderRadius: '50%',
          background: `${m.color}0C`,
        }}
      />
      <div className="flex items-center gap-4 relative" style={{ padding: '22px 28px' }}>
        <div
          className="flex items-center justify-center"
          style={{
            width: 52,
            height: 52,
            borderRadius: 18,
            background: `${m.color}20`,
            border: `2px solid ${m.color}40`,
            boxShadow: `0 0 20px ${m.color}10`,
          }}
        >
          <Icon style={{ width: 26, height: 26, color: m.color }} strokeWidth={1.5} />
        </div>
        <div className="flex-1">
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#E8F0EC', letterSpacing: '-0.3px' }}>
            {m.label}
          </h2>
          <p style={{ fontSize: 13, color: '#708A7E', marginTop: 2 }}>{m.sub}</p>
        </div>
        {badge}
        {children}
      </div>
    </div>
  );
}

/* ═══ TILE ═══ */
function T({ span = 2, accent, children }: { span?: number; accent?: string; children: React.ReactNode }) {
  return (
    <div
      className="relative overflow-hidden"
      style={{
        gridColumn: `span ${span}`,
        padding: 22,
        borderRadius: 16,
        background: '#0C1210',
        border: `1.5px solid ${accent ? accent + '30' : '#1E2E26'}`,
      }}
    >
      {accent && <div className="absolute top-0 left-0 right-0" style={{ height: 3, background: accent }} />}
      {children}
    </div>
  );
}
function TL({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 700,
        color: '#708A7E',
        textTransform: 'uppercase',
        letterSpacing: '1.5px',
        marginBottom: 10,
      }}
    >
      {children}
    </div>
  );
}
function TV({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 38, fontWeight: 800, color, lineHeight: 1, letterSpacing: '-1.5px' }}>
      {children}
    </div>
  );
}

/* ═══ ACTION BUTTON ═══ */
function AB({
  color,
  loading,
  icon: Icon,
  children,
  onClick,
}: {
  color: string;
  loading: boolean;
  icon: typeof Package;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="flex items-center gap-2 font-semibold transition-all disabled:opacity-40"
      style={{
        padding: '12px 24px',
        borderRadius: 14,
        background: `${color}20`,
        border: `2px solid ${color}40`,
        color,
        fontSize: 14,
        boxShadow: `0 0 24px ${color}18`,
      }}
    >
      {loading ? (
        <Loader2 className="w-[18px] h-[18px] animate-spin" />
      ) : (
        <Icon style={{ width: 18, height: 18 }} strokeWidth={1.8} />
      )}
      {children}
    </button>
  );
}

/* ═══ SYNC DETAIL ═══ */
function SyncDtl({
  sync,
  cfg,
  cfgL,
  hp,
  logs,
  mut,
}: {
  sync: SyncStatusDto | undefined;
  cfg: SyncConfigDto | undefined;
  cfgL: boolean;
  hp: any;
  logs: SyncLogDto[];
  mut: ReturnType<typeof useTriggerSync>;
}) {
  const upd = useUpdateSyncConfig();
  const f = useForm<SyncConfigFormData>({
    resolver: zodResolver(syncConfigSchema),
    values: cfg
      ? {
          productEndpointPath: cfg.productEndpointPath || '',
          paginationType: (cfg.paginationType as any) || 'page',
          pageSize: cfg.pageSize || 50,
          dataArrayPath: cfg.dataArrayPath || 'data',
          fieldMappingsJson: cfg.fieldMappingsJson || '',
          syncIntervalMinutes: cfg.syncIntervalMinutes || 360,
          isEnabled: cfg.isEnabled ?? true,
        }
      : undefined,
  });
  return (
    <>
      <Hdr
        stg="sync"
        badge={
          hp?.status === 'healthy' ? (
            <div
              className="flex items-center gap-2"
              style={{
                padding: '8px 16px',
                borderRadius: 12,
                background: 'rgba(16,185,129,0.1)',
                border: '1.5px solid rgba(16,185,129,0.2)',
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: '#10B981',
                  boxShadow: '0 0 8px rgba(16,185,129,0.4)',
                }}
              />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#10B981' }}>API Healthy</span>
              {hp.responseTimeMs != null && (
                <span style={{ fontSize: 12, color: 'rgba(16,185,129,0.5)' }}>{hp.responseTimeMs}ms</span>
              )}
            </div>
          ) : undefined
        }
      >
        <button
          onClick={() => mut.mutate()}
          disabled={mut.isPending}
          className="flex items-center gap-2 font-semibold disabled:opacity-40 transition-all"
          style={{
            padding: '12px 24px',
            borderRadius: 14,
            background: '#00D97E',
            color: '#050808',
            fontSize: 14,
            boxShadow: '0 0 30px rgba(0,217,126,0.15)',
          }}
        >
          <RefreshCw className={`w-[18px] h-[18px] ${mut.isPending ? 'animate-spin' : ''}`} strokeWidth={2} />
          Sync now
        </button>
      </Hdr>
      <div style={{ padding: '20px 24px' }} className="space-y-3">
        <div className="grid grid-cols-6 gap-3">
          <T span={2} accent="#00D97E">
            <TL>Products synced</TL>
            <TV color="#00D97E">{(sync?.productCount ?? 0).toLocaleString()}</TV>
            {sync?.lastSyncAt && (
              <div style={{ fontSize: 12, color: '#708A7E', marginTop: 8 }}>
                Last: {format(new Date(sync.lastSyncAt), 'MMM d, HH:mm')}
              </div>
            )}
          </T>
          <T span={2}>
            <TL>Last sync delta</TL>
            {logs[0] ? (
              <div className="flex gap-5 mt-1">
                <div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#10B981' }}>
                    +{logs[0].newProducts}
                  </div>
                  <div style={{ fontSize: 11, color: '#708A7E' }}>new</div>
                </div>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#3B82F6' }}>
                    ~{logs[0].updatedProducts}
                  </div>
                  <div style={{ fontSize: 11, color: '#708A7E' }}>updated</div>
                </div>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#708A7E' }}>
                    {logs[0].removedProducts}
                  </div>
                  <div style={{ fontSize: 11, color: '#708A7E' }}>removed</div>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 15, color: '#708A7E', marginTop: 4 }}>No sync yet</div>
            )}
          </T>
          <T span={2}>
            <div className="flex items-center gap-4 h-full">
              <SvgRing pct={sync?.productCount ? 100 : 0} color="#00D97E" size={64} />
              <div>
                <div
                  style={{ fontSize: 15, fontWeight: 700, color: sync?.productCount ? '#10B981' : '#708A7E' }}
                >
                  {sync?.productCount ? 'Healthy' : 'Not synced'}
                </div>
                {logs[0] && (
                  <div style={{ fontSize: 13, color: '#708A7E', marginTop: 2 }}>{logs[0].durationMs}ms</div>
                )}
              </div>
            </div>
          </T>
        </div>

        {/* Config */}
        <div style={{ padding: 22, borderRadius: 16, background: '#0C1210', border: '1.5px solid #1E2E26' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#E8F0EC', marginBottom: 16 }}>
            Configuration
          </div>
          {cfgL ? (
            <div className="h-32 animate-pulse rounded-xl" style={{ background: '#111916' }} />
          ) : (
            <form
              onSubmit={f.handleSubmit((d) => upd.mutate(d as unknown as SyncConfigDto))}
              className="grid grid-cols-2 gap-3"
            >
              <FF l="Product Endpoint Path" r>
                <input
                  {...f.register('productEndpointPath')}
                  placeholder="/api/products"
                  className="cfi font-mono"
                />
              </FF>
              <FF l="Pagination Type">
                <select {...f.register('paginationType')} className="cfi appearance-none cursor-pointer">
                  <option value="page">Page</option>
                  <option value="offset">Offset</option>
                  <option value="cursor">Cursor</option>
                  <option value="none">None</option>
                </select>
              </FF>
              <FF l="Page Size">
                <input {...f.register('pageSize', { valueAsNumber: true })} type="number" className="cfi" />
              </FF>
              <FF l="Sync Interval">
                <select
                  {...f.register('syncIntervalMinutes', { valueAsNumber: true })}
                  className="cfi appearance-none cursor-pointer"
                >
                  <option value={60}>Every 1 hour</option>
                  <option value={180}>Every 3 hours</option>
                  <option value={360}>Every 6 hours</option>
                  <option value={720}>Every 12 hours</option>
                  <option value={1440}>Every 24 hours</option>
                </select>
              </FF>
              <FF l="Data Array Path">
                <input {...f.register('dataArrayPath')} placeholder="data" className="cfi font-mono" />
              </FF>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    {...f.register('isEnabled')}
                    type="checkbox"
                    className="w-4 h-4 rounded accent-brand"
                    style={{ borderColor: '#253D32' }}
                  />
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#8A9B91' }}>Enable auto-sync</span>
                </label>
              </div>
              <div className="col-span-2">
                <FF l="Field Mappings (JSON)">
                  <textarea
                    {...f.register('fieldMappingsJson')}
                    rows={2}
                    placeholder='{"name": "product_name"}'
                    className="cfi resize-none font-mono text-[11px]"
                  />
                </FF>
              </div>
              <div className="col-span-2 pt-1">
                <button
                  type="submit"
                  disabled={upd.isPending}
                  className="flex items-center gap-2 font-semibold disabled:opacity-50 transition-all"
                  style={{
                    padding: '12px 24px',
                    borderRadius: 12,
                    background: '#00D97E',
                    color: '#050808',
                    fontSize: 13,
                  }}
                >
                  {upd.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" strokeWidth={1.8} />
                  )}{' '}
                  Save config
                </button>
              </div>
            </form>
          )}
        </div>

        {/* History */}
        {logs.length > 0 && (
          <div
            style={{
              borderRadius: 16,
              background: '#0C1210',
              border: '1.5px solid #1E2E26',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '16px 22px',
                borderBottom: '1px solid #162019',
                fontSize: 14,
                fontWeight: 700,
                color: '#E8F0EC',
              }}
            >
              Recent syncs
            </div>
            {logs.slice(0, 5).map((l) => (
              <div
                key={l.id}
                className="flex items-center gap-3"
                style={{ padding: '12px 22px', borderBottom: '1px solid #0D1410', fontSize: 13 }}
              >
                <span style={{ color: '#8A9B91', width: 120 }}>
                  {format(new Date(l.startedAt), 'MMM d, HH:mm')}
                </span>
                <span style={{ color: '#10B981', fontWeight: 700, width: 44 }}>
                  {l.newProducts > 0 ? `+${l.newProducts}` : '0'}
                </span>
                <span style={{ color: '#3B82F6', width: 64 }}>~{l.updatedProducts} upd</span>
                <span style={{ color: '#708A7E', width: 52 }}>{l.durationMs}ms</span>
                <StatusBadge
                  variant={l.status === 'Success' ? 'success' : l.status === 'Failed' ? 'danger' : 'warning'}
                >
                  {l.status}
                </StatusBadge>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

/* ═══ ENRICH ═══ */
function EnrDtl({ d, mut }: { d: EnrichmentStatusDto | undefined; mut: ReturnType<typeof useEnrichAll> }) {
  if (!d) return <EmpS />;
  return (
    <>
      <Hdr stg="enrich">
        <AB color="#3B82F6" loading={mut.isPending} icon={Sparkles} onClick={() => mut.mutate()}>
          Enrich all
        </AB>
      </Hdr>
      <div style={{ padding: '20px 24px' }}>
        <div className="grid grid-cols-6 gap-3">
          <T span={3} accent="#3B82F6">
            <TL>Enrichment progress</TL>
            <div className="flex items-center gap-5">
              <TV color="#3B82F6">{d.enrichmentPercent}%</TV>
              <div className="flex-1">
                <div
                  style={{
                    height: 10,
                    borderRadius: 5,
                    background: '#111916',
                    overflow: 'hidden',
                    position: 'relative',
                  }}
                >
                  <div
                    className="transition-all duration-500"
                    style={{
                      width: `${d.enrichmentPercent}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #3B82F6, #60A5FA)',
                      borderRadius: 5,
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        width: '50%',
                        height: '100%',
                        background:
                          'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
                        animation: 'shimmer-scan 2s ease infinite',
                      }}
                    />
                  </div>
                </div>
                <div style={{ fontSize: 12, color: '#708A7E', marginTop: 6 }}>
                  {d.enrichedCount.toLocaleString()} / {d.totalProducts.toLocaleString()}
                </div>
              </div>
            </div>
          </T>
          <T span={3}>
            <div className="flex items-center gap-4 h-full">
              <SvgRing pct={d.enrichmentPercent} color="#3B82F6" size={64} />
              <div>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: d.enrichmentPercent >= 100 ? '#10B981' : '#3B82F6',
                  }}
                >
                  {d.enrichmentPercent >= 100 ? 'Complete' : 'In progress'}
                </div>
                <div style={{ fontSize: 13, color: '#708A7E', marginTop: 2 }}>
                  {d.pendingCount.toLocaleString()} pending
                </div>
              </div>
            </div>
          </T>
          <T span={2}>
            <TL>Enriched</TL>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#3B82F6' }}>
              {d.enrichedCount.toLocaleString()}
            </div>
          </T>
          <T span={2}>
            <TL>Pending</TL>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#E8F0EC' }}>
              {d.pendingCount.toLocaleString()}
            </div>
          </T>
          <T span={2}>
            <TL>Tokens used</TL>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#E8F0EC' }}>
              {d.totalTokensUsed.toLocaleString()}
            </div>
          </T>
          {d.failedCount > 0 && (
            <T span={6} accent="#F43F5E">
              <div className="flex items-center gap-3">
                <AlertTriangle style={{ width: 18, height: 18, color: '#F43F5E' }} strokeWidth={1.8} />
                <span style={{ fontSize: 15, fontWeight: 700, color: '#F43F5E' }}>
                  {d.failedCount} failed
                </span>
              </div>
            </T>
          )}
        </div>
      </div>
    </>
  );
}

/* ═══ EMBED ═══ */
function EmbDtl({ d, mut }: { d: EmbeddingStatusDto | undefined; mut: ReturnType<typeof useEmbedAll> }) {
  if (!d) return <EmpS />;
  return (
    <>
      <Hdr stg="embed">
        <AB color="#10B981" loading={mut.isPending} icon={Database} onClick={() => mut.mutate()}>
          Generate all
        </AB>
      </Hdr>
      <div style={{ padding: '20px 24px' }}>
        <div className="grid grid-cols-6 gap-3">
          <T span={3} accent="#10B981">
            <TL>Embedding progress</TL>
            <div className="flex items-center gap-5">
              <TV color="#10B981">{d.embeddingPercent}%</TV>
              <div className="flex-1">
                <div
                  style={{
                    height: 10,
                    borderRadius: 5,
                    background: '#111916',
                    overflow: 'hidden',
                    position: 'relative',
                  }}
                >
                  <div
                    className="transition-all duration-500"
                    style={{
                      width: `${d.embeddingPercent}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #10B981, #34D399)',
                      borderRadius: 5,
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        width: '50%',
                        height: '100%',
                        background:
                          'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
                        animation: 'shimmer-scan 2s ease infinite',
                      }}
                    />
                  </div>
                </div>
                <div style={{ fontSize: 12, color: '#708A7E', marginTop: 6 }}>
                  {d.embeddedCount.toLocaleString()} / {d.totalEnriched.toLocaleString()}
                </div>
              </div>
            </div>
          </T>
          <T span={3}>
            <div className="flex items-center gap-4 h-full">
              <SvgRing pct={d.embeddingPercent} color="#10B981" size={64} />
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#10B981' }}>
                  {d.embeddingPercent >= 100 ? 'Complete' : 'In progress'}
                </div>
                <div style={{ fontSize: 13, color: '#708A7E', marginTop: 2 }}>
                  {d.pendingCount.toLocaleString()} pending
                </div>
              </div>
            </div>
          </T>
          <T span={2}>
            <TL>Model</TL>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#E8F0EC', fontFamily: 'monospace' }}>
              {d.embeddingModel}
            </div>
          </T>
          <T span={2}>
            <TL>Dimensions</TL>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#E8F0EC' }}>
              {d.dimensions.toLocaleString()}
            </div>
          </T>
          <T span={2}>
            <TL>Embedded</TL>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#10B981' }}>
              {d.embeddedCount.toLocaleString()}
            </div>
          </T>
        </div>
      </div>
    </>
  );
}

/* ═══ CACHE ═══ */
function CchDtl({ d, mut }: { d: CacheStatsDto | undefined; mut: ReturnType<typeof useBuildCache> }) {
  if (!d) return <EmpS />;
  return (
    <>
      <Hdr stg="cache">
        <AB color="#F59E0B" loading={mut.isPending} icon={Key} onClick={() => mut.mutate()}>
          Rebuild cache
        </AB>
      </Hdr>
      <div style={{ padding: '20px 24px' }}>
        <div className="grid grid-cols-6 gap-3">
          <T span={2} accent="#F59E0B">
            <TL>Keywords cached</TL>
            <TV color="#F59E0B">{(d.totalKeywords ?? 0).toLocaleString()}</TV>
          </T>
          <T span={2}>
            <TL>Product mappings</TL>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#E8F0EC' }}>
              {(d.totalProductMappings ?? 0).toLocaleString()}
            </div>
          </T>
          <T span={2}>
            <TL>Unique products</TL>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#E8F0EC' }}>
              {(d.uniqueProducts ?? 0).toLocaleString()}
            </div>
          </T>
          <T span={6}>
            <TL>Last built</TL>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#8A9B91' }}>
              {d.builtAt
                ? format(new Date(d.builtAt), 'MMMM d, yyyy · HH:mm')
                : 'Cache has not been built yet'}
            </div>
          </T>
        </div>
      </div>
    </>
  );
}

/* ═══ SHARED ═══ */
function FF({ l, r, children }: { l: string; r?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block" style={{ fontSize: 12, fontWeight: 600, color: '#8A9B91', marginBottom: 5 }}>
        {l} {r && <span style={{ color: '#F43F5E' }}>*</span>}
      </label>
      {children}
    </div>
  );
}
function EmpS() {
  return (
    <div className="flex flex-col items-center justify-center py-24">
      <Package style={{ width: 40, height: 40, color: '#708A7E', marginBottom: 12 }} strokeWidth={1.2} />
      <p style={{ fontSize: 15, color: '#708A7E' }}>Data unavailable</p>
    </div>
  );
}

function SRCard({ item, rank }: { item: SearchProductDto; rank: number }) {
  const p = (item.product ?? {}) as Record<string, unknown>;
  const name = String(p.name || p.title || `Product #${rank}`);
  const cat = String(p.category || '');
  const price = p.price != null ? Number(p.price) : null;
  const sc = Math.min(100, Math.max(0, item.relevanceScore * 100));
  const scC = sc >= 80 ? '#10B981' : sc >= 50 ? '#F59E0B' : '#F43F5E';
  return (
    <div
      className="flex items-start justify-between gap-3"
      style={{
        padding: 18,
        borderRadius: 14,
        background: '#0C1210',
        border: `1.5px solid ${item.isRecommended ? 'rgba(16,185,129,0.2)' : '#1E2E26'}`,
      }}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className="flex items-center justify-center"
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: '#708A7E',
              background: '#162019',
              width: 26,
              height: 26,
              borderRadius: 8,
            }}
          >
            #{rank}
          </span>
          <h4 className="truncate" style={{ fontSize: 15, fontWeight: 700, color: '#E8F0EC' }}>
            {name}
          </h4>
          {item.isRecommended && (
            <Star style={{ width: 14, height: 14, color: '#F59E0B', fill: '#F59E0B' }} />
          )}
        </div>
        {(cat || price != null) && (
          <div className="flex items-center gap-3 mt-2">
            {cat && (
              <span
                style={{
                  padding: '3px 10px',
                  borderRadius: 8,
                  background: '#162019',
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#708A7E',
                  textTransform: 'uppercase',
                }}
              >
                {cat}
              </span>
            )}
            {price != null && (
              <span style={{ fontSize: 14, fontWeight: 700, color: '#E8F0EC' }}>${price.toFixed(2)}</span>
            )}
          </div>
        )}
      </div>
      <div className="flex flex-col items-end shrink-0">
        <span style={{ fontSize: 15, fontWeight: 800, color: scC }}>{sc.toFixed(0)}%</span>
        <div
          style={{
            width: 64,
            height: 7,
            background: '#111916',
            borderRadius: 4,
            marginTop: 4,
            overflow: 'hidden',
          }}
        >
          <div style={{ width: `${sc}%`, height: '100%', background: scC, borderRadius: 4 }} />
        </div>
      </div>
    </div>
  );
}
