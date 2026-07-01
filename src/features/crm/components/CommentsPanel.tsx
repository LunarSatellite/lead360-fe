import { useMemo, useState } from 'react';
import { Loader2, Send, MessageSquare, AtSign } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { useComments, useAddComment } from '../api/crm.queries';
import { useTeamMembers } from '@/features/team/api/team.queries';

function userLabel(u: { firstName: string | null; lastName: string | null; fullName: string | null; email: string | null }) {
  return u.fullName || [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email || 'Unknown';
}

/**
 * Reusable comment thread for any CRM record. `kind` is the CrmCommentableKind
 * (Contact=1, Deal=2, SupportCase=3, Lead=4, Account=5).
 */
export function CommentsPanel({ kind, entityId }: { kind: number; entityId: string }) {
  const { data: comments, isLoading } = useComments(kind, entityId);
  const { data: team } = useTeamMembers();
  const addComment = useAddComment(kind, entityId);

  const [text, setText] = useState('');
  const [mentions, setMentions] = useState<string[]>([]);

  const userById = useMemo(() => {
    const m = new Map<string, string>();
    (team ?? []).forEach((u) => m.set(u.id, userLabel(u)));
    return m;
  }, [team]);

  const submit = () => {
    if (!text.trim()) return;
    addComment.mutate(
      { content: text.trim(), mentionedUserIds: mentions },
      {
        onSuccess: () => {
          setText('');
          setMentions([]);
        },
      },
    );
  };

  const toggleMention = (id: string) =>
    setMentions((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const list = comments ?? [];

  return (
    <div className="rounded-2xl border border-border-subtle bg-bg-card">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-border-subtle">
        <MessageSquare className="w-4 h-4 text-text-muted" />
        <h3 className="font-semibold text-text-primary">Comments</h3>
        <span className="text-xs text-text-muted">{list.length}</span>
      </div>

      <div className="px-5 py-4 max-h-[420px] overflow-y-auto space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-8 text-text-muted"><Loader2 className="w-5 h-5 animate-spin" /></div>
        ) : list.length === 0 ? (
          <p className="text-sm text-text-muted text-center py-8">No comments yet. Start the conversation.</p>
        ) : (
          list.map((c) => (
            <div key={c.id} className="flex gap-3">
              <div className="shrink-0 w-8 h-8 rounded-full bg-brand-soft border border-border-glow flex items-center justify-center text-xs font-bold text-brand">
                {(userById.get(c.authorUserId) ?? '?').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-xs text-text-muted">
                  <span className="font-semibold text-text-primary">{userById.get(c.authorUserId) ?? 'Teammate'}</span>
                  <span>· {formatDistanceToNow(parseISO(c.createdAt), { addSuffix: true })}</span>
                  {c.editedAt && <span>· edited</span>}
                </div>
                <p className="text-sm text-text-secondary whitespace-pre-wrap mt-0.5">{c.content}</p>
                {c.mentionedUserIds?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {c.mentionedUserIds.map((id) => (
                      <span key={id} className="inline-flex items-center gap-0.5 text-[11px] text-brand bg-brand-soft border border-border-glow rounded px-1.5 py-0.5">
                        <AtSign className="w-3 h-3" />{userById.get(id) ?? 'someone'}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="px-5 py-4 border-t border-border-subtle space-y-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a comment…"
          rows={2}
          className="w-full px-3 py-2 rounded-xl bg-bg-elevated border border-border-subtle text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-medium resize-none"
        />
        {(team?.length ?? 0) > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-text-muted inline-flex items-center gap-1"><AtSign className="w-3 h-3" />Notify:</span>
            {team!.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => toggleMention(u.id)}
                className={`text-[11px] rounded-full px-2 py-0.5 border transition-all ${
                  mentions.includes(u.id)
                    ? 'bg-brand-soft text-brand border-border-glow'
                    : 'bg-bg-elevated text-text-secondary border-border-subtle hover:border-border-medium'
                }`}
              >
                {userLabel(u)}
              </button>
            ))}
          </div>
        )}
        <div className="flex justify-end">
          <button
            onClick={submit}
            disabled={!text.trim() || addComment.isPending}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all"
          >
            {addComment.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Comment
          </button>
        </div>
      </div>
    </div>
  );
}
