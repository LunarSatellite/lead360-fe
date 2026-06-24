import { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { flowApi } from '../api/flow.api';
import type { BotSettings, NegotiationPlaybook } from '../types/flow.types';

const inputCls = 'w-full px-3 py-2 rounded-xl bg-bg-elevated border border-border-subtle text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-glow transition-colors';

export function Component() {
  const [settings, setSettings] = useState<BotSettings>({
    maxDiscountPercent: null,
    maxOrderAmount: null,
    handoffOnComplaint: false,
    handoffPhrases: [],
    handoffMessage: null,
    negotiationPlaybooks: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newPhrase, setNewPhrase] = useState('');
  const [expandedPlaybook, setExpandedPlaybook] = useState<number | null>(null);

  useEffect(() => {
    flowApi.getBotSettings().then((data: any) => {
      setSettings({
        maxDiscountPercent: data?.maxDiscountPercent ?? null,
        maxOrderAmount: data?.maxOrderAmount ?? null,
        handoffOnComplaint: data?.handoffOnComplaint ?? false,
        handoffPhrases: data?.handoffPhrases ?? [],
        handoffMessage: data?.handoffMessage ?? null,
        negotiationPlaybooks: data?.negotiationPlaybooks ?? [],
      });
    }).catch(() => toast.error('Failed to load bot settings')).finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await flowApi.updateBotSettings(settings);
      toast.success('Bot settings saved.');
    } catch { toast.error('Failed to save settings.'); }
    finally { setSaving(false); }
  };

  const addPhrase = () => {
    if (!newPhrase.trim()) return;
    setSettings(s => ({ ...s, handoffPhrases: [...(s.handoffPhrases ?? []), newPhrase.trim()] }));
    setNewPhrase('');
  };

  const removePhrase = (i: number) =>
    setSettings(s => ({ ...s, handoffPhrases: s.handoffPhrases?.filter((_, idx) => idx !== i) }));

  const addPlaybook = () =>
    setSettings(s => ({ ...s, negotiationPlaybooks: [...(s.negotiationPlaybooks ?? []), { trigger: '', moves: [''] }] }));

  const removePlaybook = (i: number) =>
    setSettings(s => ({ ...s, negotiationPlaybooks: s.negotiationPlaybooks?.filter((_, idx) => idx !== i) }));

  const updatePlaybook = (i: number, patch: Partial<NegotiationPlaybook>) =>
    setSettings(s => ({
      ...s,
      negotiationPlaybooks: s.negotiationPlaybooks?.map((p, idx) => idx === i ? { ...p, ...patch } : p)
    }));

  const addMove = (i: number) =>
    updatePlaybook(i, { moves: [...(settings.negotiationPlaybooks?.[i]?.moves ?? []), ''] });

  const updateMove = (pi: number, mi: number, val: string) =>
    updatePlaybook(pi, { moves: settings.negotiationPlaybooks?.[pi]?.moves.map((m, idx) => idx === mi ? val : m) });

  const removeMove = (pi: number, mi: number) =>
    updatePlaybook(pi, { moves: settings.negotiationPlaybooks?.[pi]?.moves.filter((_, idx) => idx !== mi) });

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-6 h-6 text-brand animate-spin" />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-text-primary tracking-tight">Bot Settings</h1>
        <p className="text-sm text-text-secondary mt-1">Configure handoff rules and negotiation playbooks for your bot</p>
      </div>

      {/* ── Handoff Rules ── */}
      <div className="bg-bg-card border border-border-subtle rounded-2xl p-5 space-y-4">
        <h2 className="text-sm font-bold text-text-primary">Handoff Rules</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-text-muted mb-1 block">Max Discount Bot Can Offer (%)</label>
            <input type="number" min={0} max={100} value={settings.maxDiscountPercent ?? ''}
              onChange={e => setSettings(s => ({ ...s, maxDiscountPercent: e.target.value ? Number(e.target.value) : null }))}
              placeholder="e.g. 5" className={inputCls} />
            <p className="text-2xs text-text-muted mt-1">Requests above this → handoff</p>
          </div>
          <div>
            <label className="text-xs text-text-muted mb-1 block">Max Order Amount Bot Can Handle</label>
            <input type="number" min={0} value={settings.maxOrderAmount ?? ''}
              onChange={e => setSettings(s => ({ ...s, maxOrderAmount: e.target.value ? Number(e.target.value) : null }))}
              placeholder="e.g. 500000" className={inputCls} />
            <p className="text-2xs text-text-muted mt-1">Orders above this → handoff</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button type="button"
            onClick={() => setSettings(s => ({ ...s, handoffOnComplaint: !s.handoffOnComplaint }))}
            className={`w-10 h-5 rounded-full transition-colors ${settings.handoffOnComplaint ? 'bg-brand' : 'bg-bg-elevated border border-border-subtle'}`}>
            <span className={`block w-4 h-4 rounded-full bg-white shadow transition-transform mx-0.5 ${settings.handoffOnComplaint ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
          <span className="text-sm text-text-primary">Always handoff on complaints</span>
        </div>

        <div>
          <label className="text-xs text-text-muted mb-1 block">Custom Handoff Message</label>
          <input value={settings.handoffMessage ?? ''}
            onChange={e => setSettings(s => ({ ...s, handoffMessage: e.target.value || null }))}
            placeholder="Let me connect you with our team..."
            className={inputCls} />
        </div>

        <div>
          <label className="text-xs text-text-muted mb-2 block">Custom Trigger Phrases (always handoff)</label>
          <div className="flex gap-2 mb-2">
            <input value={newPhrase} onChange={e => setNewPhrase(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addPhrase()}
              placeholder="e.g. speak to manager" className={`${inputCls} flex-1`} />
            <button onClick={addPhrase} className="px-3 py-2 rounded-xl bg-brand-soft text-brand border border-border-glow text-sm font-semibold">
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {settings.handoffPhrases?.map((p, i) => (
              <span key={i} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-bg-elevated border border-border-subtle text-xs text-text-secondary">
                {p}
                <button onClick={() => removePhrase(i)} className="text-text-muted hover:text-danger"><Trash2 className="w-3 h-3" /></button>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Negotiation Playbooks ── */}
      <div className="bg-bg-card border border-border-subtle rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-text-primary">Negotiation Playbooks</h2>
            <p className="text-xs text-text-muted mt-0.5">Bot follows these step-by-step before handing off</p>
          </div>
          <button onClick={addPlaybook}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-brand-soft text-brand border border-border-glow text-xs font-semibold">
            <Plus className="w-3 h-3" /> Add Playbook
          </button>
        </div>

        {settings.negotiationPlaybooks?.length === 0 && (
          <p className="text-sm text-text-muted text-center py-4">No playbooks — bot will handoff directly on negotiation triggers</p>
        )}

        {settings.negotiationPlaybooks?.map((pb, pi) => (
          <div key={pi} className="border border-border-subtle rounded-xl overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 bg-bg-elevated cursor-pointer"
              onClick={() => setExpandedPlaybook(expandedPlaybook === pi ? null : pi)}>
              <span className="text-xs font-bold text-brand bg-brand-soft border border-border-glow px-2 py-0.5 rounded-full">
                {pi + 1}
              </span>
              <span className="flex-1 text-sm text-text-primary truncate">{pb.trigger || 'No trigger set'}</span>
              <span className="text-xs text-text-muted">{pb.moves.length} moves</span>
              {expandedPlaybook === pi ? <ChevronUp className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
              <button onClick={e => { e.stopPropagation(); removePlaybook(pi); }}
                className="p-1 text-text-muted hover:text-danger transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {expandedPlaybook === pi && (
              <div className="p-4 space-y-3 border-t border-border-subtle">
                <div>
                  <label className="text-xs text-text-muted mb-1 block">Trigger (when does this playbook fire?)</label>
                  <input value={pb.trigger}
                    onChange={e => updatePlaybook(pi, { trigger: e.target.value })}
                    placeholder="e.g. customer asks for discount or lower price"
                    className={inputCls} />
                </div>

                <div>
                  <label className="text-xs text-text-muted mb-2 block">Moves (in order)</label>
                  <div className="space-y-2">
                    {pb.moves.map((move, mi) => (
                      <div key={mi} className="flex items-center gap-2">
                        <span className="text-xs text-text-muted w-5 flex-shrink-0">{mi + 1}.</span>
                        <input value={move}
                          onChange={e => updateMove(pi, mi, e.target.value)}
                          placeholder={mi === pb.moves.length - 1 ? 'e.g. Connect to human sales team' : 'e.g. Offer 5% discount'}
                          className={`${inputCls} flex-1`} />
                        {pb.moves.length > 1 && (
                          <button onClick={() => removeMove(pi, mi)} className="p-1 text-text-muted hover:text-danger">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button onClick={() => addMove(pi)}
                    className="mt-2 flex items-center gap-1 text-xs text-brand hover:underline">
                    <Plus className="w-3 h-3" /> Add move
                  </button>
                  <p className="text-2xs text-text-muted mt-1">Last move should connect to your team (triggers handoff)</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <button onClick={save} disabled={saving}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-brand text-bg font-bold hover:opacity-90 disabled:opacity-50 transition-all">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Save Settings
      </button>
    </div>
  );
}
