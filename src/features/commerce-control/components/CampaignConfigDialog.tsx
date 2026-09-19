import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Loader2, Save, X } from 'lucide-react';
import { stylemintCommerceApi } from '../api/stylemint-commerce.api';

type Props = { id: string; onClose: () => void; onSaved: () => void };
const asText = (value: unknown, fallback: string) => typeof value === 'string' && value.trim() ? value : fallback;
const validJson = (value: string) => { try { JSON.parse(value); return true; } catch { return false; } };

export function CampaignConfigDialog({ id, onClose, onSaved }: Props) {
  const details = useQuery({ queryKey: ['stylemint-vendor-campaign', id], queryFn: () => stylemintCommerceApi.vendorCampaign(id), retry: false });
  const [form, setForm] = useState({ creativeVariantsJson: '[]', channelsJson: '[]', experimentJson: '{}' });
  useEffect(() => {
    if (!details.data) return;
    const raw = details.data.data && typeof details.data.data === 'object' ? details.data.data as Record<string, unknown> : details.data;
    setForm({ creativeVariantsJson: asText(raw.creativeVariantsJson, '[]'), channelsJson: asText(raw.channelsJson, '[]'), experimentJson: asText(raw.experimentJson, '{}') });
  }, [details.data]);
  const save = useMutation({ mutationFn: () => stylemintCommerceApi.configureVendorCampaign(id, form), onSuccess: onSaved });
  const isValid = Object.values(form).every(validJson);
  return <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
    <button aria-label="Close" className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
    <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="relative max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-[24px] border border-brand/20 bg-bg-card shadow-2xl">
      <header className="sticky top-0 z-10 flex items-start justify-between border-b border-border-subtle bg-bg-card/95 px-5 py-4 backdrop-blur-xl"><div><p className="text-[10px] font-extrabold uppercase tracking-wider text-brand">Stylemint campaign engine</p><h3 className="mt-1 text-xl font-black text-text-primary">Configure campaign workspace</h3><p className="mt-1 text-xs text-text-muted">Define creative variants, publishing channels and the measurable experiment before approval.</p></div><button type="button" onClick={onClose}><X className="h-4 w-4 text-text-muted" /></button></header>
      {details.isLoading ? <div className="flex h-48 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-brand" /></div> : <div className="grid gap-4 p-5 lg:grid-cols-2">
        <JsonField label="Creative variants" hint='Example: [{"name":"Fresh family dinner","reelId":"..."}]' value={form.creativeVariantsJson} onChange={(v) => setForm((f) => ({ ...f, creativeVariantsJson: v }))} />
        <JsonField label="Publishing channels" hint='Example: ["Instagram","Facebook","TikTok","YouTube"]' value={form.channelsJson} onChange={(v) => setForm((f) => ({ ...f, channelsJson: v }))} />
        <div className="lg:col-span-2"><JsonField label="Experiment" hint='Example: {"objective":"conversion","audiences":["families"],"successMetric":"orders"}' value={form.experimentJson} onChange={(v) => setForm((f) => ({ ...f, experimentJson: v }))} /></div>
        {!isValid && <p className="text-xs font-semibold text-danger lg:col-span-2">Every configuration block must contain valid JSON.</p>}
      </div>}
      <footer className="sticky bottom-0 flex justify-end gap-2 border-t border-border-subtle bg-bg-card/95 px-5 py-4 backdrop-blur-xl"><button type="button" onClick={onClose} className="rounded-xl border border-border-subtle px-4 py-2.5 text-xs font-bold text-text-secondary">Cancel</button><button disabled={save.isPending || !isValid} className="flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-xs font-extrabold text-black disabled:opacity-40"><Save className="h-4 w-4" />{save.isPending ? 'Saving…' : 'Save configuration'}</button></footer>
    </form>
  </div>;
}

function JsonField({ label, hint, value, onChange }: { label: string; hint: string; value: string; onChange: (value: string) => void }) {
  return <label className="block space-y-1.5"><span className="text-[10px] font-extrabold uppercase tracking-wider text-text-muted">{label}</span><textarea rows={8} spellCheck={false} value={value} onChange={(e) => onChange(e.target.value)} className={`w-full resize-y rounded-xl border bg-bg-elevated px-3 py-2.5 font-mono text-xs text-text-primary outline-none ${validJson(value) ? 'border-border-subtle focus:border-brand/50' : 'border-danger/50'}`} /><span className="block text-[10px] text-text-muted">{hint}</span></label>;
}
