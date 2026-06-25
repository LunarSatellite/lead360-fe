import { useState } from 'react';
import { confirmDialog } from '@/shared/ui/confirm';
import {
  Calendar,
  Copy,
  Check,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  ExternalLink,
  Clock,
  X,
} from 'lucide-react';
import {
  useBookingPage,
  useUpdateBookingPage,
  useAddEventType,
  useUpdateEventType,
  useDeleteEventType,
} from '../api/booking.queries';
import type {
  BookingPageDto,
  BookingPageEventTypeDto,
  CreateEventTypeRequest,
  UpdateEventTypeRequest,
} from '../api/booking.api';

const COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
  '#f97316', '#eab308', '#22c55e', '#06b6d4',
  '#3b82f6', '#14b8a6',
];

const inputCls =
  'w-full px-3 py-2 rounded-xl bg-bg-elevated border border-border-subtle text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-glow transition-all';

function EventTypeModal({
  initial,
  onSave,
  onClose,
  saving,
}: {
  initial?: BookingPageEventTypeDto;
  onSave: (data: CreateEventTypeRequest | UpdateEventTypeRequest) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [duration, setDuration] = useState(initial?.durationMinutes ?? 30);
  const [color, setColor] = useState(initial?.color ?? '#6366f1');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    if (initial) {
      onSave({
        title: title.trim(),
        description: description.trim() || undefined,
        durationMinutes: duration,
        color,
        isActive: initial.isActive,
        sortOrder: initial.sortOrder,
      } as UpdateEventTypeRequest);
    } else {
      onSave({
        title: title.trim(),
        description: description.trim() || undefined,
        durationMinutes: duration,
        color,
      } as CreateEventTypeRequest);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-bg-elevated border border-border-subtle rounded-card shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-text-primary">
            {initial ? 'Edit meeting type' : 'New meeting type'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-bg-card text-text-muted hover:text-text-primary transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Title *</label>
            <input
              type="text"
              placeholder="e.g. 30 min intro call"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className={inputCls}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Description</label>
            <textarea
              placeholder="What is this meeting for?"
              value={description ?? ''}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className={`${inputCls} resize-none`}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Duration</label>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className={inputCls}
            >
              {[15, 20, 30, 45, 60, 90].map((d) => (
                <option key={d} value={d}>{d} minutes</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Color</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110"
                  style={{ backgroundColor: c, borderColor: color === c ? '#fff' : 'transparent' }}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-border-subtle text-sm font-medium text-text-muted hover:text-text-primary hover:bg-bg-card transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !title.trim()}
              className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function BookingPageSettingsPage() {
  const { data: rawPage, isLoading, isError } = useBookingPage();
  const page = rawPage as unknown as BookingPageDto | undefined;

  const updatePage = useUpdateBookingPage();
  const addEventType = useAddEventType();
  const deleteEventType = useDeleteEventType();

  const [editingSlug, setEditingSlug] = useState(false);
  const [slug, setSlug] = useState('');
  const [copied, setCopied] = useState(false);
  const [copiedEtId, setCopiedEtId] = useState<string | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEventType, setEditingEventType] = useState<BookingPageEventTypeDto | null>(null);
  const updateEventType = useUpdateEventType(editingEventType?.id ?? '');

  const bookingUrl = page ? `${window.location.origin}/book/${page.slug}` : '';

  const copyLink = () => {
    navigator.clipboard.writeText(bookingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSlugSave = () => {
    if (!page || !slug.trim()) return;
    updatePage.mutate(
      {
        slug: slug.trim().toLowerCase().replace(/\s+/g, '-'),
        title: page.title,
        description: page.description ?? undefined,
        welcomeMessage: page.welcomeMessage ?? undefined,
        isActive: page.isActive,
      },
      { onSuccess: () => setEditingSlug(false) }
    );
  };

  const handleToggleActive = () => {
    if (!page) return;
    updatePage.mutate({
      title: page.title,
      description: page.description ?? undefined,
      welcomeMessage: page.welcomeMessage ?? undefined,
      isActive: !page.isActive,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
      </div>
    );
  }

  if (isError || !page) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-red-400/10 border border-red-400/20 rounded-card p-6 text-center">
          <p className="text-sm font-semibold text-red-400 mb-1">Failed to load booking page</p>
          <p className="text-xs text-text-muted">Check the browser console (F12) for the error, or try refreshing.</p>
        </div>
      </div>
    );
  }

  const eventTypes = page.eventTypes ?? [];

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-text-primary">Booking Page</h1>
            <p className="text-xs text-text-muted">Your public Calendly-style scheduling page</p>
          </div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer gap-2">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={page.isActive}
            onChange={handleToggleActive}
          />
          <div className="w-11 h-6 bg-bg-card peer-focus:outline-none rounded-full peer border border-border-subtle peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-text-muted after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 peer-checked:after:bg-white" />
          <span className="text-xs text-text-muted">{page.isActive ? 'Active' : 'Hidden'}</span>
        </label>
      </div>

      {/* Public link */}
      <div className="bg-bg-elevated border border-border-subtle rounded-card p-5">
        <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Your booking link</h2>

        {editingSlug ? (
          <div className="flex gap-2">
            <div className="flex-1 flex items-center border border-border-glow rounded-xl overflow-hidden">
              <span className="px-3 text-xs text-text-muted whitespace-nowrap">
                {window.location.origin}/book/
              </span>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                className="flex-1 py-2.5 pr-3 text-sm text-text-primary bg-transparent focus:outline-none"
                autoFocus
              />
            </div>
            <button
              onClick={handleSlugSave}
              disabled={updatePage.isPending}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-500 disabled:opacity-50 transition-colors"
            >
              Save
            </button>
            <button
              onClick={() => setEditingSlug(false)}
              className="px-4 py-2 border border-border-subtle text-sm text-text-muted rounded-xl hover:bg-bg-card transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center bg-bg-card border border-border-subtle rounded-xl px-4 py-2.5">
              <span className="text-sm text-text-primary truncate">{bookingUrl}</span>
            </div>
            <a
              href={bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl border border-border-subtle text-text-muted hover:text-indigo-400 hover:border-border-glow transition-colors"
              title="Open"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <button
              onClick={copyLink}
              className="p-2 rounded-xl border border-border-subtle text-text-muted hover:text-indigo-400 hover:border-border-glow transition-colors"
              title="Copy link"
            >
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              onClick={() => { setSlug(page.slug); setEditingSlug(true); }}
              className="p-2 rounded-xl border border-border-subtle text-text-muted hover:text-indigo-400 hover:border-border-glow transition-colors"
              title="Edit slug"
            >
              <Pencil className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Meeting types */}
      <div className="bg-bg-elevated border border-border-subtle rounded-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider">Meeting types</h2>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-500 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add type
          </button>
        </div>

        {eventTypes.length === 0 ? (
          <div className="text-center py-10 text-text-muted">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No meeting types yet.</p>
            <p className="text-xs mt-1 opacity-60">Add one to let contacts pick a time with you.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {eventTypes.map((et) => (
              <div
                key={et.id}
                className="flex items-center gap-4 p-4 rounded-xl border border-border-subtle hover:border-border-glow bg-bg-card transition-colors"
              >
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: et.color }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{et.title}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Clock className="w-3 h-3 text-text-muted" />
                    <span className="text-xs text-text-muted">{et.durationMinutes} min</span>
                    {!et.isActive && (
                      <span className="text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 px-1.5 py-0.5 rounded">Hidden</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      const directLink = `${window.location.origin}/book/${page.slug}/${et.id}`;
                      navigator.clipboard.writeText(directLink);
                      setCopiedEtId(et.id);
                      setTimeout(() => setCopiedEtId(null), 2000);
                    }}
                    className="p-1.5 rounded-lg text-text-muted hover:text-indigo-400 hover:bg-indigo-400/10 transition-colors"
                    title="Copy direct link"
                  >
                    {copiedEtId === et.id
                      ? <Check className="w-3.5 h-3.5 text-green-400" />
                      : <Copy className="w-3.5 h-3.5" />
                    }
                  </button>
                  <button
                    onClick={() => setEditingEventType(et)}
                    className="p-1.5 rounded-lg text-text-muted hover:text-indigo-400 hover:bg-indigo-400/10 transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => confirmDialog({ message: `Delete "${et.title}"?`, confirmText: 'Delete', danger: true }).then((ok) => { if (ok) deleteEventType.mutate(et.id); })}
                    className="p-1.5 rounded-lg text-text-muted hover:text-red-400 hover:bg-red-400/10 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAddModal && (
        <EventTypeModal
          onSave={(data) => addEventType.mutate(data as CreateEventTypeRequest, { onSuccess: () => setShowAddModal(false) })}
          onClose={() => setShowAddModal(false)}
          saving={addEventType.isPending}
        />
      )}

      {editingEventType && (
        <EventTypeModal
          initial={editingEventType}
          onSave={(data) => updateEventType.mutate(data as UpdateEventTypeRequest, { onSuccess: () => setEditingEventType(null) })}
          onClose={() => setEditingEventType(null)}
          saving={updateEventType.isPending}
        />
      )}
    </div>
  );
}

export const Component = BookingPageSettingsPage;
export default BookingPageSettingsPage;
