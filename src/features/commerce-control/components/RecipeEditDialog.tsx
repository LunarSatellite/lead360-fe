import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Loader2, Save, X } from 'lucide-react';
import { stylemintCommerceApi } from '../api/stylemint-commerce.api';

type Props = { id: string; onClose: () => void; onSaved: () => void };
type JsonRecord = Record<string, unknown>;
const record = (value: unknown): JsonRecord => value && typeof value === 'object' && !Array.isArray(value) ? value as JsonRecord : {};
const text = (value: unknown) => String(value ?? '');
const list = (value: unknown) => Array.isArray(value) ? value : [];
const durationMs = (value: unknown) => {
  if (typeof value === 'number') return value;
  const match = /^(?:(\d+)\.)?(\d+):(\d+):(\d+(?:\.\d+)?)$/.exec(text(value));
  return match ? Math.round((((Number(match[1] || 0) * 24 + Number(match[2])) * 60 + Number(match[3])) * 60 + Number(match[4])) * 1000) : 0;
};
const unwrap = (value: JsonRecord) => record(value.data && typeof value.data === 'object' ? value.data : value);

function editablePayload(root: JsonRecord) {
  const context = record(root.context); const segment = record(root.segment);
  return {
    title: text(root.title), musicTrackRefId: text(root.musicTrackRefId), context,
    segment: { songTitle: text(segment.songTitle), artist: text(segment.artist), startMs: durationMs(segment.startMs ?? segment.startAt), endMs: durationMs(segment.endMs ?? segment.endAt), tempoBpm: segment.tempoBpm ?? null, segmentCharacter: text(segment.segmentCharacter), listenLinks: list(segment.listenLinks) },
    beats: list(root.beats).map((item) => { const beat = record(item); return { order: Number(beat.order ?? 0), reelTimeStartMs: durationMs(beat.reelTimeStartMs ?? beat.reelTimeStart), reelTimeEndMs: durationMs(beat.reelTimeEndMs ?? beat.reelTimeEnd), songTimeStartMs: durationMs(beat.songTimeStartMs ?? beat.songTimeStart), songTimeEndMs: durationMs(beat.songTimeEndMs ?? beat.songTimeEnd), kind: beat.kind, label: beat.label, direction: beat.direction, shotHints: list(beat.shotHints), captionOverlay: beat.captionOverlay, songMomentCue: beat.songMomentCue, productFocus: beat.productFocus, emphasisScore: beat.emphasisScore }; }),
    captionVariants: list(root.captionVariants), platformAdaptations: list(root.platformAdaptations), reasoning: root.reasoning ?? null, explanationByKey: root.explanationByKey ?? {}, rowVersion: root.rowVersion ?? null,
  };
}

export function RecipeEditDialog({ id, onClose, onSaved }: Props) {
  const details = useQuery({ queryKey: ['stylemint-vendor-recipe', id], queryFn: () => stylemintCommerceApi.vendorRecipe(id), retry: false });
  const [title, setTitle] = useState(''); const [musicTrackRefId, setMusicTrackRefId] = useState(''); const [story, setStory] = useState(''); const [mood, setMood] = useState(''); const [duration, setDuration] = useState('40'); const [advanced, setAdvanced] = useState(''); const [jsonError, setJsonError] = useState('');
  useEffect(() => { if (!details.data) return; const value = editablePayload(unwrap(details.data)); const context = record(value.context); setTitle(value.title); setMusicTrackRefId(value.musicTrackRefId); setStory(text(context.brandStoryAnchor)); setMood(text(context.moodLabel)); setDuration(text(context.intendedDurationSeconds || 40)); setAdvanced(JSON.stringify(value, null, 2)); }, [details.data]);
  const payload = useMemo(() => { try { const parsed = record(JSON.parse(advanced)); const context = record(parsed.context); return { ...parsed, title: title.trim(), musicTrackRefId: musicTrackRefId.trim(), context: { ...context, brandStoryAnchor: story.trim(), moodLabel: mood.trim(), intendedDurationSeconds: Number(duration) } }; } catch { return null; } }, [advanced, duration, mood, musicTrackRefId, story, title]);
  const save = useMutation({ mutationFn: async () => { if (!payload) throw new Error('Advanced recipe JSON is invalid.'); return stylemintCommerceApi.updateVendorRecipe(id, payload); }, onSuccess: onSaved, onError: (error) => setJsonError(error instanceof Error ? error.message : 'Recipe could not be saved.') });
  const valid = payload && title.trim() && musicTrackRefId.trim() && story.trim() && mood.trim() && Number(duration) >= 5;
  return <div className="fixed inset-0 z-[70] flex items-center justify-center p-4"><button aria-label="Close" className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} /><form onSubmit={(event) => { event.preventDefault(); setJsonError(''); save.mutate(); }} className="relative flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-[24px] border border-brand/20 bg-bg-card shadow-2xl">
    <header className="flex items-start justify-between border-b border-border-subtle px-5 py-4"><div><p className="text-[10px] font-extrabold uppercase tracking-wider text-brand">Stylemint Reel Studio</p><h3 className="mt-1 text-xl font-black text-text-primary">Edit story recipe</h3><p className="mt-1 text-xs text-text-muted">Change the narrative while preserving platform adaptations and production beats.</p></div><button type="button" onClick={onClose}><X className="h-4 w-4 text-text-muted" /></button></header>
    {details.isLoading ? <div className="flex h-64 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-brand" /></div> : details.isError ? <div className="p-8 text-sm font-semibold text-danger">The recipe details could not be loaded.</div> : <div className="grid gap-4 overflow-y-auto p-5 md:grid-cols-2">
      <Input label="Recipe title" value={title} onChange={setTitle} /><Input label="Music track ID" value={musicTrackRefId} onChange={setMusicTrackRefId} /><Input label="Product story anchor" value={story} onChange={setStory} /><Input label="Mood" value={mood} onChange={setMood} /><Input label="Duration in seconds" type="number" value={duration} onChange={setDuration} />
      <div className="rounded-xl border border-brand/20 bg-brand-soft p-3 text-xs leading-5 text-text-secondary">Advanced production data remains editable below for campaign teams that need precise beat, caption, platform, or reasoning control.</div>
      <label className="space-y-1.5 md:col-span-2"><span className="text-[10px] font-extrabold uppercase tracking-wider text-text-muted">Advanced recipe contract</span><textarea rows={14} value={advanced} onChange={(event) => { setAdvanced(event.target.value); setJsonError(''); }} className={`${control} resize-y font-mono text-xs`} spellCheck={false} /></label>
      {(jsonError || (!payload && advanced)) && <p className="md:col-span-2 text-xs font-semibold text-danger">{jsonError || 'Advanced recipe JSON is invalid.'}</p>}
    </div>}
    <footer className="flex justify-end gap-2 border-t border-border-subtle px-5 py-4"><button type="button" onClick={onClose} className="rounded-xl border border-border-subtle px-4 py-2.5 text-xs font-bold text-text-secondary">Cancel</button><button disabled={save.isPending || !valid} className="flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-xs font-extrabold text-black disabled:opacity-40"><Save className="h-4 w-4" />{save.isPending ? 'Saving…' : 'Save recipe'}</button></footer>
  </form></div>;
}
const control = 'w-full rounded-xl border border-border-subtle bg-bg-elevated px-3 py-2.5 text-sm text-text-primary outline-none focus:border-brand/50';
function Input({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; type?: string }) { return <label className="space-y-1.5"><span className="text-[10px] font-extrabold uppercase tracking-wider text-text-muted">{label}</span><input className={control} required type={type} min={type === 'number' ? 5 : undefined} value={value} onChange={(event) => onChange(event.target.value)} /></label>; }
