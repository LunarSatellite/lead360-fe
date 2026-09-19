import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Loader2, Save, X } from 'lucide-react';
import { stylemintCommerceApi } from '../api/stylemint-commerce.api';

type Props = { id: string; initial: Record<string, unknown>; onClose: () => void; onSaved: () => void };
const value = (source: Record<string, unknown>, key: string) => String(source[key] ?? '');

export function CollectionEditDialog({ id, initial, onClose, onSaved }: Props) {
  const details = useQuery({
    queryKey: ['stylemint-vendor-collection', id],
    queryFn: () => stylemintCommerceApi.vendorCollection(id),
    retry: false,
  });
  const [form, setForm] = useState({ slug: '', title: '', subtitle: '', description: '', coverImageUrl: '', sortOrder: '0', startsUtc: '', endsUtc: '' });
  useEffect(() => {
    const raw = details.data ?? initial;
    const source = raw.data && typeof raw.data === 'object' ? raw.data as Record<string, unknown> : raw;
    setForm({
      slug: value(source, 'slug'), title: value(source, 'title'), subtitle: value(source, 'subtitle'),
      description: value(source, 'description'), coverImageUrl: value(source, 'coverImageUrl'),
      sortOrder: value(source, 'sortOrder') || '0', startsUtc: value(source, 'startsUtc').slice(0, 16),
      endsUtc: value(source, 'endsUtc').slice(0, 16),
    });
  }, [details.data, initial]);
  const save = useMutation({
    mutationFn: () => stylemintCommerceApi.updateVendorCollection(id, {
      slug: form.slug.trim(), title: form.title.trim(), subtitle: form.subtitle.trim() || null,
      description: form.description.trim() || null, coverImageUrl: form.coverImageUrl.trim() || null,
      sortOrder: Number(form.sortOrder), startsUtc: form.startsUtc ? new Date(form.startsUtc).toISOString() : null,
      endsUtc: form.endsUtc ? new Date(form.endsUtc).toISOString() : null,
    }),
    onSuccess: onSaved,
  });
  const set = (key: keyof typeof form, next: string) => setForm((current) => ({ ...current, [key]: next }));
  return <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
    <button aria-label="Close" className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
    <form onSubmit={(event) => { event.preventDefault(); save.mutate(); }} className="relative w-full max-w-3xl overflow-hidden rounded-[24px] border border-brand/20 bg-bg-card shadow-2xl">
      <header className="flex items-start justify-between border-b border-border-subtle px-5 py-4">
        <div><p className="text-[10px] font-extrabold uppercase tracking-wider text-brand">Stylemint catalogue</p><h3 className="mt-1 text-xl font-black text-text-primary">Edit collection</h3></div>
        <button type="button" onClick={onClose}><X className="h-4 w-4 text-text-muted" /></button>
      </header>
      {details.isLoading ? <div className="flex h-48 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-brand" /></div> :
        <div className="grid gap-4 p-5 md:grid-cols-2">
          <Input label="Title" value={form.title} onChange={(v) => set('title', v)} required />
          <Input label="Slug" value={form.slug} onChange={(v) => set('slug', v)} required />
          <Input label="Subtitle" value={form.subtitle} onChange={(v) => set('subtitle', v)} />
          <Input label="Cover image URL" value={form.coverImageUrl} onChange={(v) => set('coverImageUrl', v)} />
          <Input label="Sort order" type="number" value={form.sortOrder} onChange={(v) => set('sortOrder', v)} />
          <div className="grid grid-cols-2 gap-3"><Input label="Starts" type="datetime-local" value={form.startsUtc} onChange={(v) => set('startsUtc', v)} /><Input label="Ends" type="datetime-local" value={form.endsUtc} onChange={(v) => set('endsUtc', v)} /></div>
          <label className="space-y-1.5 md:col-span-2"><span className="text-[10px] font-extrabold uppercase tracking-wider text-text-muted">Description</span><textarea rows={5} value={form.description} onChange={(e) => set('description', e.target.value)} className="w-full rounded-xl border border-border-subtle bg-bg-elevated px-3 py-2.5 text-sm text-text-primary outline-none focus:border-brand/50" /></label>
        </div>}
      <footer className="flex items-center justify-end gap-2 border-t border-border-subtle px-5 py-4"><button type="button" onClick={onClose} className="rounded-xl border border-border-subtle px-4 py-2.5 text-xs font-bold text-text-secondary">Cancel</button><button disabled={save.isPending || !form.title.trim() || !form.slug.trim()} className="flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-xs font-extrabold text-black disabled:opacity-40"><Save className="h-4 w-4" />{save.isPending ? 'Saving…' : 'Save collection'}</button></footer>
    </form>
  </div>;
}

function Input({ label, value, onChange, type = 'text', required }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) {
  return <label className="space-y-1.5"><span className="text-[10px] font-extrabold uppercase tracking-wider text-text-muted">{label}</span><input type={type} required={required} value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl border border-border-subtle bg-bg-elevated px-3 py-2.5 text-sm text-text-primary outline-none focus:border-brand/50" /></label>;
}
