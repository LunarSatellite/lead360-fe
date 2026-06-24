import { useState, useMemo } from 'react';
import {
  Target, Plus, Upload, Loader2, TreePine, List, Search,
  Filter, X, Zap, ShoppingCart, FolderTree, FileText,
  UserCheck, Menu, Send, Brain, LayoutGrid, Pencil, Tag,
} from 'lucide-react';
import { useIntents, useIntentTree } from '../api/intents.queries';
import { IntentTree } from '../components/IntentTree';
import { IntentList } from '../components/IntentList';
import { IntentFormModal } from '../components/IntentFormModal';
import { IntentBulkImportModal } from '../components/IntentBulkImportModal';
import {
  OPERATION_TYPE_LABEL, IntentOperationType,
} from '../types/intents.types';
import type { IntentDto, IntentOperationTypeValue } from '../types/intents.types';

type ViewMode = 'cards' | 'tree' | 'list';

const OP_META: Record<number, { icon: typeof Zap; color: string; label: string }> = {
  1: { icon: Zap, color: '#3B82F6', label: 'API Call' },
  2: { icon: ShoppingCart, color: '#10B981', label: 'Search' },
  3: { icon: FolderTree, color: '#00D97E', label: 'Browse' },
  4: { icon: FileText, color: '#F59E0B', label: 'Static' },
  5: { icon: UserCheck, color: '#F43F5E', label: 'Handoff' },
  6: { icon: Menu, color: '#A78BFA', label: 'Nav' },
  7: { icon: Send, color: '#EC4899', label: 'Outbound' },
  8: { icon: Brain, color: '#3B82F6', label: 'AI Chat' },
};

export function Component() {
  const tenantId = localStorage.getItem('omniflow_tenant_id') ?? '';
  const { data: flatRaw, isLoading: flatLoading } = useIntents(tenantId);
  const { data: treeRaw, isLoading: treeLoading } = useIntentTree(tenantId);
  const flatIntents = (flatRaw as unknown as IntentDto[]) ?? [];
  const treeIntents = (treeRaw as unknown as IntentDto[]) ?? [];

  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [searchFilter, setSearchFilter] = useState('');
  const [opFilter, setOpFilter] = useState<number | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editIntent, setEditIntent] = useState<IntentDto | null>(null);

  const isLoading = viewMode === 'tree' ? treeLoading : flatLoading;

  // Stats
  const total = flatIntents.length;
  const active = flatIntents.filter(i => i.isActive).length;
  const apiCount = flatIntents.filter(i => i.operationType === IntentOperationType.ApiCall).length;

  // Operation type counts for breakdown
  const opCounts = useMemo(() => {
    const c: Record<number, number> = {};
    flatIntents.forEach(i => { c[i.operationType] = (c[i.operationType] || 0) + 1; });
    return c;
  }, [flatIntents]);
  const maxOp = Math.max(...Object.values(opCounts), 1);

  const parentOptions = useMemo(
    () => flatIntents.map(i => ({ id: i.id, name: i.name, level: i.level })),
    [flatIntents],
  );

  // Filter
  const filtered = useMemo(() => {
    let r = flatIntents;
    if (opFilter) r = r.filter(i => i.operationType === opFilter);
    if (searchFilter) {
      const q = searchFilter.toLowerCase();
      r = r.filter(i => i.name.toLowerCase().includes(q) || i.keywords?.toLowerCase().includes(q));
    }
    return r;
  }, [flatIntents, searchFilter, opFilter]);

  // Root intents for card view
  const rootIntents = useMemo(() => {
    const roots = filtered.filter(i => !i.parentIntentId);
    return roots;
  }, [filtered]);

  const handleEdit = (intent: IntentDto) => { setEditIntent(intent); setCreateOpen(true); };
  const handleCloseForm = () => { setCreateOpen(false); setEditIntent(null); };

  const opFilterOptions = Object.entries(IntentOperationType).map(([, val]) => ({
    value: val as IntentOperationTypeValue,
    label: OPERATION_TYPE_LABEL[val as IntentOperationTypeValue],
  }));

  return (
    <div className="space-y-0">

      {/* ═══ HEADER ═══ */}
      <div style={{ padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid #111916' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2.5px', color: '#00D97E' }}>Configuration</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#E8F0EC', marginTop: 3, letterSpacing: '-0.5px' }}>Intent Management</div>
        </div>
        {/* View toggle */}
        <div className="flex" style={{ padding: 3, borderRadius: 10, background: '#0A0F0D', border: '1px solid #162019' }}>
          {([
            { id: 'cards' as const, icon: LayoutGrid, label: 'Cards' },
            { id: 'tree' as const, icon: TreePine, label: 'Tree' },
            { id: 'list' as const, icon: List, label: 'List' },
          ]).map(v => (
            <button key={v.id} onClick={() => setViewMode(v.id)}
              className="flex items-center gap-1.5"
              style={{
                padding: '5px 12px', borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                background: viewMode === v.id ? 'rgba(0,217,126,0.08)' : 'transparent',
                border: viewMode === v.id ? '1px solid rgba(0,217,126,0.12)' : '1px solid transparent',
                color: viewMode === v.id ? '#00D97E' : '#708A7E',
              }}>
              <v.icon style={{ width: 12, height: 12 }} strokeWidth={1.5} /> {v.label}
            </button>
          ))}
        </div>
        {/* Search */}
        <div className="relative" style={{ width: 200 }}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2" style={{ width: 14, height: 14, color: '#708A7E' }} strokeWidth={1.5} />
          <input value={searchFilter} onChange={e => setSearchFilter(e.target.value)}
            placeholder="Search intents..."
            className="w-full text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
            style={{ padding: '8px 12px 8px 32px', borderRadius: 10, background: '#0A0F0D', border: '1px solid #1E3328' }} />
          {searchFilter && <button onClick={() => setSearchFilter('')} className="absolute right-3 top-1/2 -translate-y-1/2"><X style={{ width: 12, height: 12, color: '#708A7E' }} strokeWidth={2} /></button>}
        </div>
        <button onClick={() => setImportOpen(true)}
          style={{ padding: '8px 16px', borderRadius: 10, background: '#0A0F0D', border: '1px solid #1E2E26', fontSize: 12, fontWeight: 600, color: '#8A9B91', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
          <Upload style={{ width: 14, height: 14 }} strokeWidth={1.8} /> Import
        </button>
        <button onClick={() => { setEditIntent(null); setCreateOpen(true); }}
          style={{ padding: '8px 18px', borderRadius: 10, background: '#00D97E', fontSize: 12, fontWeight: 700, color: '#050808', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, boxShadow: '0 0 20px rgba(0,217,126,0.1)' }}>
          <Plus style={{ width: 14, height: 14 }} strokeWidth={2.5} /> Add intent
        </button>
      </div>

      {/* ═══ STATS ROW ═══ */}
      <div style={{ padding: '14px 20px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        {/* Total */}
        <div style={{ padding: 18, borderRadius: 16, background: 'linear-gradient(145deg, rgba(0,217,126,0.06), rgba(0,217,126,0.015))', border: '1.5px solid rgba(0,217,126,0.1)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: '#00D97E' }} />
          <div style={{ fontSize: 10, fontWeight: 700, color: '#708A7E', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 6 }}>Total</div>
          <div className="flex items-baseline gap-1.5">
            <span style={{ fontSize: 32, fontWeight: 800, color: '#00D97E', letterSpacing: '-1px', lineHeight: 1 }}>{total}</span>
            <span style={{ fontSize: 11, color: '#708A7E' }}>intents</span>
          </div>
        </div>
        {/* Active ring */}
        <div style={{ padding: 18, borderRadius: 16, background: '#0C1210', border: '1px solid #1E2E26' }} className="flex items-center gap-3">
          <div className="relative shrink-0" style={{ width: 50, height: 50 }}>
            <svg viewBox="0 0 50 50" className="-rotate-90">
              <circle cx="25" cy="25" r="20" fill="none" stroke="#111916" strokeWidth="5" />
              <circle cx="25" cy="25" r="20" fill="none" stroke="#10B981" strokeWidth="5"
                strokeDasharray={2 * Math.PI * 20} strokeDashoffset={total > 0 ? 2 * Math.PI * 20 * (1 - active / total) : 2 * Math.PI * 20}
                strokeLinecap="round" className="transition-all duration-700" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center" style={{ fontSize: 13, fontWeight: 800, color: '#10B981' }}>
              {total > 0 ? Math.round((active / total) * 100) : 0}%
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#708A7E', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 4 }}>Active</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#10B981', lineHeight: 1 }}>{active}</div>
          </div>
        </div>
        {/* API calls */}
        <div style={{ padding: 18, borderRadius: 16, background: '#0C1210', border: '1px solid #1E2E26' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#708A7E', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 6 }}>API Calls</div>
          <div className="flex items-baseline gap-1.5">
            <span style={{ fontSize: 32, fontWeight: 800, color: '#3B82F6', letterSpacing: '-1px', lineHeight: 1 }}>{apiCount}</span>
            <span style={{ fontSize: 11, color: '#708A7E' }}>of {total}</span>
          </div>
        </div>
        {/* Breakdown mini bars */}
        <div style={{ padding: 18, borderRadius: 16, background: '#0C1210', border: '1px solid #1E2E26' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#708A7E', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 8 }}>By type</div>
          <div className="flex gap-1 items-end" style={{ height: 36 }}>
            {[1, 2, 4, 5, 6, 7].map(op => {
              const m = OP_META[op];
              const c = opCounts[op] || 0;
              const pct = c > 0 ? Math.max(10, (c / maxOp) * 100) : 4;
              return (
                <div key={op} style={{ flex: 1, borderRadius: '4px 4px 1px 1px', height: `${pct}%`, minHeight: c > 0 ? 4 : 2, background: c > 0 ? `linear-gradient(180deg, ${m.color}CC, ${m.color})` : '#162019' }} />
              );
            })}
          </div>
          <div className="flex gap-1" style={{ marginTop: 4 }}>
            {[1, 2, 4, 5, 6, 7].map(op => (
              <div key={op} style={{ flex: 1, fontSize: 8, textAlign: 'center', color: (opCounts[op] || 0) > 0 ? OP_META[op].color : '#253D32', fontWeight: 700 }}>
                {opCounts[op] || 0}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ FILTERS ═══ */}
      <div className="flex items-center gap-1.5" style={{ padding: '2px 20px 12px' }}>
        <button onClick={() => setOpFilter(null)}
          style={{ padding: '5px 12px', borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: 'pointer', background: !opFilter ? 'rgba(0,217,126,0.08)' : 'transparent', border: !opFilter ? '1.5px solid rgba(0,217,126,0.12)' : '1px solid #1E2E26', color: !opFilter ? '#00D97E' : '#708A7E' }}>
          All {total}
        </button>
        {Object.entries(OP_META).filter(([k]) => (opCounts[Number(k)] || 0) > 0).map(([k, m]) => (
          <button key={k} onClick={() => setOpFilter(opFilter === Number(k) ? null : Number(k))}
            className="flex items-center gap-1"
            style={{ padding: '5px 12px', borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: opFilter === Number(k) ? `1.5px solid ${m.color}30` : '1px solid #1E2E26', background: opFilter === Number(k) ? `${m.color}0C` : 'transparent', color: opFilter === Number(k) ? m.color : '#708A7E' }}>
            <div style={{ width: 6, height: 6, borderRadius: 2, background: m.color }} />
            {m.label} {opCounts[Number(k)] || 0}
          </button>
        ))}
        {(searchFilter || opFilter !== null) && (
          <button onClick={() => { setSearchFilter(''); setOpFilter(null); }}
            className="flex items-center gap-1 ml-2"
            style={{ padding: '5px 10px', borderRadius: 6, fontSize: 10, fontWeight: 600, color: '#F43F5E', background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.1)', cursor: 'pointer' }}>
            <X style={{ width: 10, height: 10 }} strokeWidth={2} /> Clear
          </button>
        )}
      </div>

      {/* ═══ CONTENT ═══ */}
      <div style={{ padding: '0 20px 24px' }}>
        {isLoading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin" style={{ color: '#00D97E' }} /></div>
        ) : filtered.length === 0 && !searchFilter && opFilter === null ? (
          <EmptyState onImport={() => setImportOpen(true)} onCreate={() => { setEditIntent(null); setCreateOpen(true); }} />
        ) : viewMode === 'cards' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[10px]">
            {rootIntents.map(intent => (
              <IntentCard key={intent.id} intent={intent} allIntents={flatIntents} onEdit={handleEdit} />
            ))}
          </div>
        ) : viewMode === 'tree' ? (
          <IntentTree intents={treeIntents} onEdit={handleEdit} filter={searchFilter} operationFilter={opFilter} />
        ) : (
          <IntentList intents={filtered} onEdit={handleEdit} filter={searchFilter} operationFilter={opFilter} />
        )}
      </div>

      {/* Modals */}
      <IntentFormModal open={createOpen} onClose={handleCloseForm} tenantId={tenantId} editIntent={editIntent} parentOptions={parentOptions} />
      <IntentBulkImportModal open={importOpen} onClose={() => setImportOpen(false)} tenantId={tenantId} />
    </div>
  );
}

/* ═══ INTENT CARD ═══ */
function IntentCard({ intent, allIntents, onEdit }: { intent: IntentDto; allIntents: IntentDto[]; onEdit: (i: IntentDto) => void }) {
  const op = OP_META[intent.operationType] || OP_META[1];
  const Icon = op.icon;
  const children = allIntents.filter(i => i.parentIntentId === intent.id);
  const keywords = intent.keywords?.split(',').map(k => k.trim()).filter(Boolean) ?? [];

  return (
    <div
      className="flex flex-col transition-all cursor-pointer group"
      onClick={() => onEdit(intent)}
      style={{
        borderRadius: 16, background: '#0C1210',
        border: `1px solid ${op.color}15`, overflow: 'hidden',
      }}
      onMouseOver={e => (e.currentTarget.style.borderColor = `${op.color}35`)}
      onMouseOut={e => (e.currentTarget.style.borderColor = `${op.color}15`)}
    >
      <div style={{ height: 2, background: op.color }} />
      <div style={{ padding: 18, flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div className="flex items-center gap-2" style={{ marginBottom: 12 }}>
          <div className="flex items-center justify-center shrink-0" style={{ width: 30, height: 30, borderRadius: 10, background: `${op.color}14`, border: `1px solid ${op.color}20` }}>
            <Icon style={{ width: 14, height: 14, color: op.color }} strokeWidth={1.5} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="truncate" style={{ fontSize: 14, fontWeight: 700, color: '#E8F0EC' }}>{intent.name}</div>
            <div style={{ fontSize: 10, color: '#708A7E', marginTop: 1 }}>
              {children.length > 0 ? `Root · ${children.length} children` : intent.parentIntentId ? 'Child' : 'Root'}
            </div>
          </div>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: intent.isActive ? '#10B981' : '#F59E0B', boxShadow: intent.isActive ? '0 0 4px rgba(16,185,129,0.3)' : 'none' }} />
        </div>

        {/* Endpoint (if API) */}
        {intent.apiEndpoint && (
          <div className="flex items-center gap-1.5" style={{ padding: '8px 10px', borderRadius: 8, background: '#0A0F0D', marginBottom: 10 }}>
            {intent.apiMethod && <span style={{ padding: '2px 7px', borderRadius: 5, background: `${op.color}18`, fontSize: 10, fontWeight: 800, color: op.color }}>{intent.apiMethod}</span>}
            <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#708A7E' }} className="truncate">{intent.apiEndpoint}</span>
          </div>
        )}

        {/* Keywords */}
        {keywords.length > 0 && (
          <div className="flex flex-wrap gap-1" style={{ marginBottom: 10 }}>
            {keywords.slice(0, 4).map(k => (
              <span key={k} style={{ padding: '3px 8px', borderRadius: 10, background: 'rgba(167,139,250,0.06)', fontSize: 10, color: '#A78BFA' }}>{k}</span>
            ))}
            {keywords.length > 4 && <span style={{ padding: '3px 8px', borderRadius: 10, background: '#111916', fontSize: 10, color: '#708A7E' }}>+{keywords.length - 4}</span>}
          </div>
        )}

        {/* Description */}
        {intent.description && (
          <div className="line-clamp-2" style={{ fontSize: 11, color: '#708A7E', lineHeight: 1.4, marginTop: 'auto' }}>{intent.description}</div>
        )}
        {!intent.description && <div style={{ marginTop: 'auto' }} />}
      </div>
    </div>
  );
}

/* ═══ EMPTY STATE ═══ */
function EmptyState({ onImport, onCreate }: { onImport: () => void; onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(0,217,126,0.04)', border: '1.5px dashed rgba(0,217,126,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
        <Target style={{ width: 28, height: 28, color: '#253D32' }} strokeWidth={1.2} />
      </div>
      <p style={{ fontSize: 16, fontWeight: 700, color: '#8A9B91' }}>No intents defined yet</p>
      <p style={{ fontSize: 13, color: '#708A7E', marginTop: 6, maxWidth: 360, lineHeight: 1.5 }}>
        Intents define what your chatbot can do — track orders, browse products, answer FAQs, and more.
      </p>
      <div className="flex items-center gap-3 mt-6">
        <button onClick={onImport}
          style={{ padding: '10px 18px', borderRadius: 10, background: '#0A0F0D', border: '1px solid #1E2E26', fontSize: 13, fontWeight: 600, color: '#8A9B91', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
          <Upload style={{ width: 14, height: 14 }} strokeWidth={1.8} /> Bulk import
        </button>
        <button onClick={onCreate}
          style={{ padding: '10px 18px', borderRadius: 10, background: '#00D97E', fontSize: 13, fontWeight: 700, color: '#050808', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, boxShadow: '0 0 20px rgba(0,217,126,0.1)' }}>
          <Plus style={{ width: 14, height: 14 }} strokeWidth={2} /> Create first intent
        </button>
      </div>
    </div>
  );
}
