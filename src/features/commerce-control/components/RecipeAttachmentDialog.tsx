import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Link2, Loader2, Unlink, X } from 'lucide-react';
import { stylemintCommerceApi } from '../api/stylemint-commerce.api';

type Props = { recipeId: string; onClose: () => void; onDone: (message: string) => void };
export function RecipeAttachmentDialog({ recipeId, onClose, onDone }: Props) {
  const [briefId, setBriefId] = useState('');
  const [version, setVersion] = useState('1');
  const [primary, setPrimary] = useState(true);
  const links = useQuery({ queryKey: ['stylemint-brief-recipes', briefId], queryFn: () => stylemintCommerceApi.vendorBriefRecipes(briefId.trim()), enabled: briefId.trim().length > 10, retry: false });
  const attach = useMutation({ mutationFn: () => stylemintCommerceApi.attachVendorBriefRecipe(briefId.trim(), { recipeId, recipeVersion: Number(version), isPrimaryRecipe: primary }), onSuccess: () => onDone('Recipe version attached to the commercial brief.') });
  const detach = useMutation({ mutationFn: () => stylemintCommerceApi.deleteVendorBriefRecipeVersion(briefId.trim(), recipeId, Number(version)), onSuccess: () => onDone('Recipe version detached from the commercial brief.') });
  const busy = attach.isPending || detach.isPending;
  const valid = briefId.trim().length > 10 && Number(version) >= 1;
  return <div className="fixed inset-0 z-[70] flex items-center justify-center p-4"><button aria-label="Close" className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} /><div className="relative w-full max-w-lg rounded-[24px] border border-brand/20 bg-bg-card p-6 shadow-2xl">
    <div className="flex items-start justify-between"><div><p className="text-[10px] font-extrabold uppercase tracking-wider text-brand">Recipe governance</p><h3 className="mt-1 text-xl font-black text-text-primary">Manage brief attachment</h3><p className="mt-1 font-mono text-[10px] text-text-muted">{recipeId}</p></div><button onClick={onClose}><X className="h-4 w-4 text-text-muted" /></button></div>
    <div className="mt-5 space-y-3"><Input label="Commercial brief ID" value={briefId} onChange={setBriefId} /><Input label="Recipe version" type="number" value={version} onChange={setVersion} /><label className="flex items-center gap-3 rounded-xl border border-border-subtle bg-bg-elevated p-3 text-xs font-bold text-text-secondary"><input type="checkbox" checked={primary} onChange={(e) => setPrimary(e.target.checked)} className="accent-[var(--color-brand)]" />Use as primary recipe for this brief</label></div>
    {briefId.trim().length > 10 && <div className="mt-3 rounded-xl border border-border-subtle bg-bg-elevated p-3 text-xs text-text-secondary">{links.isLoading ? 'Loading current brief links…' : links.isError ? 'Current brief links could not be loaded.' : `${Array.isArray(links.data) ? links.data.length : Array.isArray((links.data as { items?: unknown[] })?.items) ? (links.data as { items: unknown[] }).items.length : 0} recipe link(s) currently attached to this brief.`}</div>}
    {(attach.isError || detach.isError) && <p className="mt-3 text-xs font-semibold text-danger">The attachment could not be changed. Verify the brief, recipe and version.</p>}
    <div className="mt-5 grid gap-2 sm:grid-cols-2"><button disabled={busy || !valid} onClick={() => attach.mutate()} className="flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-xs font-extrabold text-black disabled:opacity-40">{attach.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}Attach version</button><button disabled={busy || !valid} onClick={() => detach.mutate()} className="flex items-center justify-center gap-2 rounded-xl border border-danger/25 bg-danger-soft px-4 py-3 text-xs font-extrabold text-danger disabled:opacity-40">{detach.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Unlink className="h-4 w-4" />}Detach version</button></div>
  </div></div>;
}
function Input({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; type?: string }) { return <label className="block space-y-1.5"><span className="text-[10px] font-extrabold uppercase tracking-wider text-text-muted">{label}</span><input type={type} min={type === 'number' ? 1 : undefined} value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl border border-border-subtle bg-bg-elevated px-3 py-2.5 text-sm text-text-primary outline-none focus:border-brand/50" /></label>; }
