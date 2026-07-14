import { useState } from 'react';
import { Plus, X, Loader2, Newspaper, Trash2, Send, Archive, Calendar } from 'lucide-react';
import {
  useAnnouncements, useCreateAnnouncement, useUpdateAnnouncement,
  useDeleteAnnouncement, usePublishAnnouncement, useArchiveAnnouncement, useScheduleAnnouncement,
  useAnnouncementAnalytics, useAnnouncementRecipients, useAnnouncementSummaryStats,
} from '../api/crm.queries';
import type { AnnouncementSummaryDto, AnnouncementCreateRequest } from '../types/crm.types';
import {
  AnnouncementType, AnnouncementStatus,
  ANNOUNCEMENT_TYPE_LABELS, ANNOUNCEMENT_STATUS_LABELS, ANNOUNCEMENT_STATUS_COLORS,
} from '../types/crm.types';
import { format, parseISO } from 'date-fns';

const inputCls = 'w-full px-3 py-2 rounded-xl bg-bg-elevated border border-border-subtle text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-medium';
const selectCls = 'px-3 py-2 rounded-xl bg-bg-elevated border border-border-subtle text-sm text-text-secondary focus:outline-none focus:border-border-medium';
const btnPrimary = 'flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-accent/90 transition-all disabled:opacity-50';
const btnGhost = 'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-all';

function Badge({ label, colorCls }: { label: string; colorCls: string }) {
  return <span className={`px-2 py-0.5 rounded-md text-xs font-semibold border ${colorCls}`}>{label}</span>;
}

function SlideOver({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="drawer-slide-in relative w-[520px] h-full flex flex-col bg-bg-shell border-l border-thin border-border-subtle" style={{ boxShadow: '-8px 0 40px rgba(0,0,0,0.5)' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle shrink-0">
          <h3 className="font-bold text-text-primary">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-all"><X className="w-4 h-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

const lbl = (t: string) => <label className="block text-xs font-semibold text-text-muted mb-1.5">{t}</label>;

function CreateForm({ onClose }: { onClose: () => void }) {
  const create = useCreateAnnouncement();
  const [form, setForm] = useState<AnnouncementCreateRequest>({ title: '', content: '', type: AnnouncementType.General });
  const set = (k: keyof AnnouncementCreateRequest, v: any) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.title.trim() || !form.content.trim()) return;
    const payload: AnnouncementCreateRequest = { ...form };
    if (payload.scheduledAt === '') delete payload.scheduledAt;
    await create.mutateAsync(payload);
    onClose();
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        {lbl('Title *')}
        <input className={inputCls} value={form.title} onChange={e => set('title', e.target.value)} placeholder="Announcement title" />
      </div>
      <div>
        {lbl('Content *')}
        <textarea className={`${inputCls} min-h-[140px] resize-y`} value={form.content} onChange={e => set('content', e.target.value)} placeholder="Write your announcement..." />
      </div>
      <div>
        {lbl('Type')}
        <select className={selectCls} value={form.type} onChange={e => set('type', Number(e.target.value))}>
          {Object.entries(ANNOUNCEMENT_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>
      <div>
        {lbl('Schedule for (optional)')}
        <input type="datetime-local" className={inputCls} value={form.scheduledAt ?? ''} onChange={e => set('scheduledAt', e.target.value || undefined)} />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button className={btnGhost} onClick={onClose}>Cancel</button>
        <button className={btnPrimary} onClick={submit} disabled={create.isPending || !form.title.trim() || !form.content.trim()}>
          {create.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Create
        </button>
      </div>
    </div>
  );
}

function AnalyticsTab({ id }: { id: string }) {
  const { data: analyticsRaw, isLoading } = useAnnouncementAnalytics(id);
  const { data: recipientsRaw } = useAnnouncementRecipients(id);
  const analytics = analyticsRaw as any;
  const recipients = ((recipientsRaw as unknown) as any[]) ?? [];

  if (isLoading) return <div className="flex items-center justify-center py-12"><div className="w-5 h-5 border-2 border-brand border-r-transparent rounded-full animate-spin" /></div>;
  if (!analytics) return <div className="py-8 text-center text-sm text-text-muted">No analytics yet. Publish the announcement to start tracking.</div>;

  const stats = [
    { label: 'Delivered', value: analytics.sentCount ?? 0, total: analytics.totalRecipients ?? 0, rate: analytics.deliveryRate ?? 0, color: 'bg-brand' },
    { label: 'Opened', value: analytics.openedCount ?? 0, total: analytics.sentCount ?? 0, rate: analytics.openRate ?? 0, color: 'bg-blue-400' },
    { label: 'Clicked', value: analytics.clickedCount ?? 0, total: analytics.sentCount ?? 0, rate: analytics.clickRate ?? 0, color: 'bg-purple-400' },
    { label: 'Failed', value: analytics.failedCount ?? 0, total: analytics.totalRecipients ?? 0, rate: analytics.totalRecipients > 0 ? Math.round((analytics.failedCount / analytics.totalRecipients) * 100 * 10) / 10 : 0, color: 'bg-red-400' },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3">
        {stats.map(s => (
          <div key={s.label} className="bg-bg-elevated rounded-xl border border-border-subtle p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-text-muted">{s.label}</span>
              <span className="text-lg font-extrabold text-text-primary">{s.value}</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-bg-shell overflow-hidden">
              <div className={`h-full rounded-full transition-all ${s.color}`} style={{ width: `${Math.min(s.rate, 100)}%` }} />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-text-muted">of {s.total}</span>
              <span className="text-[10px] font-bold text-text-secondary">{s.rate}%</span>
            </div>
          </div>
        ))}
      </div>

      {analytics.clickToOpenRate > 0 && (
        <div className="bg-bg-elevated rounded-xl border border-border-subtle p-3 flex items-center justify-between">
          <span className="text-xs font-semibold text-text-muted">Click-to-open rate</span>
          <span className="text-sm font-bold text-text-primary">{analytics.clickToOpenRate}%</span>
        </div>
      )}

      {recipients.length > 0 && (
        <div>
          <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Recipients</p>
          <div className="rounded-xl border border-border-subtle overflow-hidden">
            <div className="grid grid-cols-[1fr_auto_auto_auto] text-[10px] font-bold text-text-muted uppercase tracking-wider px-3 py-2 bg-bg-elevated border-b border-border-subtle">
              <span>Email</span><span>Sent</span><span>Opened</span><span>Clicked</span>
            </div>
            <div className="divide-y divide-border-subtle max-h-64 overflow-y-auto">
              {recipients.map((r: any) => (
                <div key={r.id} className="grid grid-cols-[1fr_auto_auto_auto] px-3 py-2 text-xs items-center hover:bg-bg-elevated transition-colors">
                  <span className="text-text-secondary truncate">{r.toAddress ?? '—'}</span>
                  <span className={`text-center ${r.recipientStatus === 'Sent' ? 'text-success' : 'text-red-400'}`}>
                    {r.recipientStatus === 'Sent' ? '✓' : '✗'}
                  </span>
                  <span className={`text-center ${r.isOpened ? 'text-blue-400' : 'text-text-muted'}`}>
                    {r.isOpened ? `✓ ${r.openCount > 1 ? `(${r.openCount}x)` : ''}` : '—'}
                  </span>
                  <span className={`text-center ${r.isClicked ? 'text-purple-400' : 'text-text-muted'}`}>
                    {r.isClicked ? '✓' : '—'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {(analytics.recentOpens ?? []).length > 0 && (
        <div>
          <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Recent opens</p>
          <div className="flex flex-col gap-1">
            {analytics.recentOpens.map((r: any) => (
              <div key={r.id} className="flex items-center justify-between text-xs py-1">
                <span className="text-text-secondary truncate">{r.toAddress ?? '—'}</span>
                <span className="text-text-muted shrink-0 ml-2">{r.openedAt ? new Date(r.openedAt).toLocaleTimeString() : '—'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-[10px] text-text-muted text-center">Updates every 15 seconds</p>
    </div>
  );
}

function DetailPanel({ item, onClose }: { item: AnnouncementSummaryDto; onClose: () => void }) {
  const update = useUpdateAnnouncement();
  const publish = usePublishAnnouncement();
  const archive = useArchiveAnnouncement();
  const schedule = useScheduleAnnouncement();
  const del = useDeleteAnnouncement();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ title: item.title, content: '', type: item.type, scheduledAt: '' });
  const [scheduleTime, setScheduleTime] = useState('');
  const [panelTab, setPanelTab] = useState<'details' | 'analytics'>('details');
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const canEdit = item.status === AnnouncementStatus.Draft || item.status === AnnouncementStatus.Scheduled;
  const canPublish = item.status !== AnnouncementStatus.Archived;
  const canArchive = item.status !== AnnouncementStatus.Archived;

  const saveEdit = async () => {
    await update.mutateAsync({ id: item.id, data: { title: form.title || undefined, content: form.content || undefined, type: form.type, scheduledAt: form.scheduledAt || undefined } });
    setEditing(false);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2">
        <Badge label={ANNOUNCEMENT_STATUS_LABELS[item.status]} colorCls={ANNOUNCEMENT_STATUS_COLORS[item.status]} />
        <Badge label={ANNOUNCEMENT_TYPE_LABELS[item.type]} colorCls="text-accent border-accent/30 bg-accent/10" />
      </div>

      <div className="flex gap-1 bg-bg-elevated rounded-lg p-0.5 border border-border-subtle">
        {(['details', 'analytics'] as const).map(t => (
          <button key={t} onClick={() => setPanelTab(t)}
            className={`flex-1 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${panelTab === t ? 'bg-accent text-white' : 'text-text-muted hover:text-text-primary'}`}>
            {t === 'details' ? 'Details' : 'Analytics'}
          </button>
        ))}
      </div>

      {panelTab === 'details' && (
        <>
          {!editing ? (
            <>
              <div>
                <p className="text-xs font-semibold text-text-muted mb-1">Title</p>
                <p className="text-text-primary font-semibold">{item.title}</p>
              </div>
              {item.scheduledAt && (
                <div>
                  <p className="text-xs font-semibold text-text-muted mb-1">Scheduled</p>
                  <p className="text-sm text-text-secondary">{format(parseISO(item.scheduledAt), 'PPP p')}</p>
                </div>
              )}
              {item.publishedAt && (
                <div>
                  <p className="text-xs font-semibold text-text-muted mb-1">Published</p>
                  <p className="text-sm text-text-secondary">{format(parseISO(item.publishedAt), 'PPP p')}</p>
                </div>
              )}
              <p className="text-xs text-text-muted">Created {format(parseISO(item.createdAt), 'PPP')}</p>
            </>
          ) : (
            <div className="flex flex-col gap-4">
              <div>{lbl('Title')}<input className={inputCls} value={form.title} onChange={e => set('title', e.target.value)} /></div>
              <div>{lbl('Content')}<textarea className={`${inputCls} min-h-[120px] resize-y`} value={form.content} onChange={e => set('content', e.target.value)} /></div>
              <div>{lbl('Type')}
                <select className={selectCls} value={form.type} onChange={e => set('type', Number(e.target.value))}>
                  {Object.entries(ANNOUNCEMENT_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>{lbl('Reschedule')}<input type="datetime-local" className={inputCls} value={form.scheduledAt} onChange={e => set('scheduledAt', e.target.value)} /></div>
              <div className="flex gap-2 justify-end">
                <button className={btnGhost} onClick={() => setEditing(false)}>Cancel</button>
                <button className={btnPrimary} onClick={saveEdit} disabled={update.isPending}>{update.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}Save</button>
              </div>
            </div>
          )}

          <div className="border-t border-border-subtle pt-4 flex flex-col gap-2">
            {canEdit && !editing && <button className={btnGhost} onClick={() => setEditing(true)}>Edit</button>}
            {canPublish && item.status !== AnnouncementStatus.Published && (
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-emerald-400 hover:bg-emerald-400/10 transition-all" onClick={() => publish.mutateAsync(item.id)} disabled={publish.isPending}>
                <Send className="w-4 h-4" />{publish.isPending ? 'Publishing…' : 'Publish now'}
              </button>
            )}
            {canArchive && item.status === AnnouncementStatus.Published && (
              <button className={btnGhost} onClick={() => archive.mutateAsync(item.id)} disabled={archive.isPending}>
                <Archive className="w-4 h-4" />{archive.isPending ? 'Archiving…' : 'Archive'}
              </button>
            )}
            {item.status !== AnnouncementStatus.Published && item.status !== AnnouncementStatus.Archived && (
              <div className="flex gap-2 items-center">
                <input type="datetime-local" className={`${inputCls} flex-1`} value={scheduleTime} onChange={e => setScheduleTime(e.target.value)} />
                <button className={btnPrimary} disabled={!scheduleTime || schedule.isPending} onClick={() => schedule.mutateAsync({ id: item.id, scheduledAt: scheduleTime })}>
                  <Calendar className="w-4 h-4" />Schedule
                </button>
              </div>
            )}
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-red-400 hover:bg-red-400/10 transition-all" onClick={async () => { await del.mutateAsync(item.id); onClose(); }} disabled={del.isPending}>
              <Trash2 className="w-4 h-4" />{del.isPending ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </>
      )}

      {panelTab === 'analytics' && <AnalyticsTab id={item.id} />}
    </div>
  );
}

export function Component() {
  const [statusFilter, setStatusFilter] = useState<AnnouncementStatus | undefined>(undefined);
  const { data, isLoading } = useAnnouncements(statusFilter);
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<AnnouncementSummaryDto | null>(null);
  const { data: statsRaw } = useAnnouncementSummaryStats();
  const overallStats = statsRaw as any;

  const items: AnnouncementSummaryDto[] = (data as any)?.data ?? data ?? [];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-border-subtle shrink-0">
        <div className="flex items-center gap-3">
          <Newspaper className="w-5 h-5 text-accent" />
          <div>
            <h1 className="text-lg font-bold text-text-primary">Announcements</h1>
            <p className="text-xs text-text-muted">Broadcast updates to your users</p>
          </div>
        </div>
        <button className={btnPrimary} onClick={() => setCreating(true)}>
          <Plus className="w-4 h-4" />New
        </button>
      </div>

      {/* Summary stats strip */}
      {overallStats && (overallStats.totalSent > 0) && (
        <div className="flex gap-3 px-6 py-3 border-b border-border-subtle shrink-0">
          {[
            { label: 'Total sent', value: overallStats.totalSent },
            { label: 'Avg open rate', value: `${overallStats.avgOpenRate}%` },
            { label: 'Avg click rate', value: `${overallStats.avgClickRate}%` },
            { label: 'Announcements', value: overallStats.totalAnnouncements },
          ].map(s => (
            <div key={s.label} className="flex flex-col">
              <span className="text-[10px] text-text-muted font-semibold uppercase tracking-wider">{s.label}</span>
              <span className="text-sm font-bold text-text-primary">{s.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-2 px-6 py-3 border-b border-border-subtle shrink-0">
        {([undefined, AnnouncementStatus.Draft, AnnouncementStatus.Scheduled, AnnouncementStatus.Published, AnnouncementStatus.Archived] as const).map(s => (
          <button key={String(s)} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${statusFilter === s ? 'bg-accent text-white' : 'bg-bg-elevated text-text-muted hover:text-text-primary'}`}>
            {s == null ? 'All' : ANNOUNCEMENT_STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-40"><Loader2 className="w-6 h-6 animate-spin text-text-muted" /></div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-text-muted gap-2">
            <Newspaper className="w-8 h-8" />
            <p className="text-sm">No announcements yet</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {items.map(a => (
              <button key={a.id} onClick={() => setSelected(a)}
                className="w-full text-left p-4 rounded-xl bg-bg-elevated border border-border-subtle hover:border-border-medium transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-text-primary text-sm truncate">{a.title}</p>
                    <p className="text-xs text-text-muted mt-0.5">{format(parseISO(a.createdAt), 'MMM d, yyyy')}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge label={ANNOUNCEMENT_TYPE_LABELS[a.type]} colorCls="text-accent border-accent/30 bg-accent/10" />
                    <Badge label={ANNOUNCEMENT_STATUS_LABELS[a.status]} colorCls={ANNOUNCEMENT_STATUS_COLORS[a.status]} />
                  </div>
                </div>
                {a.scheduledAt && (
                  <p className="text-xs text-amber-400 mt-1.5">Scheduled: {format(parseISO(a.scheduledAt), 'MMM d, p')}</p>
                )}
                {a.publishedAt && (
                  <p className="text-xs text-emerald-400 mt-1.5">Published: {format(parseISO(a.publishedAt), 'MMM d, p')}</p>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {creating && <SlideOver title="New Announcement" onClose={() => setCreating(false)}><CreateForm onClose={() => setCreating(false)} /></SlideOver>}
      {selected && <SlideOver title="Announcement" onClose={() => setSelected(null)}><DetailPanel item={selected} onClose={() => setSelected(null)} /></SlideOver>}
    </div>
  );
}
