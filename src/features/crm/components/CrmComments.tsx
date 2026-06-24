import { useState } from 'react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { Send, Pencil, Trash2, CornerDownRight } from 'lucide-react';
import { toast } from 'sonner';
import { useComments, useAddComment, useEditComment, useDeleteComment } from '../api/crm.queries';
import type { CrmCommentDto, CrmCommentableKind } from '../types/crm.types';

interface CrmCommentsProps {
  kind: CrmCommentableKind;
  entityId: string;
}

function Avatar({ name }: { name: string }) {
  const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div className="w-7 h-7 rounded-full bg-brand/20 text-brand flex items-center justify-center text-xs font-bold shrink-0">
      {initials}
    </div>
  );
}

interface CommentItemProps {
  comment: CrmCommentDto;
  onEdit: (id: string, body: string) => void;
  onDelete: (id: string) => void;
  onReply: (id: string) => void;
  editingId: string | null;
  editBody: string;
  setEditBody: (v: string) => void;
  onSaveEdit: (id: string) => void;
  onCancelEdit: () => void;
  replyingToId: string | null;
  replyBody: string;
  setReplyBody: (v: string) => void;
  onSendReply: (parentId: string) => void;
  onCancelReply: () => void;
}

function CommentItem({
  comment,
  onEdit, onDelete, onReply,
  editingId, editBody, setEditBody, onSaveEdit, onCancelEdit,
  replyingToId, replyBody, setReplyBody, onSendReply, onCancelReply,
}: CommentItemProps) {
  const isEditing = editingId === comment.id;
  const isReplying = replyingToId === comment.id;

  return (
    <div>
      <div className="flex gap-3">
        <Avatar name={comment.authorName} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-text-primary">{comment.authorName}</span>
            <span className="text-xs text-text-muted">
              {formatDistanceToNow(parseISO(comment.createdAt))} ago
            </span>
          </div>

          {isEditing ? (
            <div className="space-y-2">
              <textarea
                className="w-full rounded-lg border border-border-subtle bg-bg-elevated text-text-primary text-sm px-3 py-2 resize-none focus:outline-none focus:border-brand"
                rows={3}
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => onSaveEdit(comment.id)}
                  className="text-xs px-3 py-1 rounded-lg bg-brand text-white font-semibold hover:opacity-90 transition-opacity"
                >
                  Save
                </button>
                <button
                  onClick={onCancelEdit}
                  className="text-xs px-3 py-1 rounded-lg border border-border-subtle text-text-muted hover:text-text-primary transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-text-secondary whitespace-pre-wrap">{comment.body}</p>
          )}

          {!isEditing && (
            <div className="flex items-center gap-3 mt-1.5">
              <button
                onClick={() => onReply(comment.id)}
                className="text-xs text-text-muted hover:text-text-primary transition-colors flex items-center gap-1"
              >
                <CornerDownRight className="w-3 h-3" /> Reply
              </button>
              <button
                onClick={() => onEdit(comment.id, comment.body)}
                className="text-xs text-text-muted hover:text-text-primary transition-colors flex items-center gap-1"
              >
                <Pencil className="w-3 h-3" /> Edit
              </button>
              <button
                onClick={() => onDelete(comment.id)}
                className="text-xs text-text-muted hover:text-danger transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" /> Delete
              </button>
            </div>
          )}

          {isReplying && (
            <div className="mt-2 space-y-2">
              <textarea
                className="w-full rounded-lg border border-border-subtle bg-bg-elevated text-text-primary text-sm px-3 py-2 resize-none focus:outline-none focus:border-brand"
                rows={2}
                placeholder="Write a reply..."
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => onSendReply(comment.id)}
                  className="text-xs px-3 py-1 rounded-lg bg-brand text-white font-semibold hover:opacity-90 transition-opacity flex items-center gap-1"
                >
                  <Send className="w-3 h-3" /> Send
                </button>
                <button
                  onClick={onCancelReply}
                  className="text-xs px-3 py-1 rounded-lg border border-border-subtle text-text-muted hover:text-text-primary transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="border-l-2 border-border-subtle ml-8 mt-2 pl-4 space-y-3">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onEdit={onEdit} onDelete={onDelete} onReply={onReply}
              editingId={editingId} editBody={editBody} setEditBody={setEditBody}
              onSaveEdit={onSaveEdit} onCancelEdit={onCancelEdit}
              replyingToId={replyingToId} replyBody={replyBody} setReplyBody={setReplyBody}
              onSendReply={onSendReply} onCancelReply={onCancelReply}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function CrmComments({ kind, entityId }: CrmCommentsProps) {
  const { data: raw } = useComments(kind, entityId);
  const comments: CrmCommentDto[] = (raw as any)?.items ?? (raw as any) ?? [];

  const addComment = useAddComment(kind, entityId);
  const editComment = useEditComment(kind, entityId);
  const deleteComment = useDeleteComment(kind, entityId);

  const [newBody, setNewBody] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState('');
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState('');

  const topLevel = comments.filter((c) => !c.parentCommentId);

  function handlePost() {
    if (!newBody.trim()) return;
    addComment.mutate({ body: newBody.trim() }, {
      onSuccess: () => setNewBody(''),
      onError: () => toast.error('Failed to post comment.'),
    });
  }

  function handleEdit(id: string, body: string) {
    setEditingId(id);
    setEditBody(body);
  }

  function handleSaveEdit(commentId: string) {
    if (!editBody.trim()) return;
    editComment.mutate({ commentId, data: { body: editBody.trim() } }, {
      onSuccess: () => { setEditingId(null); setEditBody(''); },
    });
  }

  function handleDelete(commentId: string) {
    deleteComment.mutate(commentId);
  }

  function handleReply(parentId: string) {
    setReplyingToId(parentId);
    setReplyBody('');
  }

  function handleSendReply(parentId: string) {
    if (!replyBody.trim()) return;
    addComment.mutate({ body: replyBody.trim(), parentCommentId: parentId }, {
      onSuccess: () => { setReplyingToId(null); setReplyBody(''); },
      onError: () => toast.error('Failed to post reply.'),
    });
  }

  return (
    <div className="space-y-4">
      {topLevel.length === 0 ? (
        <p className="text-sm text-text-muted text-center py-4">No comments yet. Be the first.</p>
      ) : (
        <div className="space-y-4">
          {topLevel.map((c) => (
            <CommentItem
              key={c.id}
              comment={c}
              onEdit={handleEdit} onDelete={handleDelete} onReply={handleReply}
              editingId={editingId} editBody={editBody} setEditBody={setEditBody}
              onSaveEdit={handleSaveEdit} onCancelEdit={() => setEditingId(null)}
              replyingToId={replyingToId} replyBody={replyBody} setReplyBody={setReplyBody}
              onSendReply={handleSendReply} onCancelReply={() => setReplyingToId(null)}
            />
          ))}
        </div>
      )}

      {/* New comment input */}
      <div className="pt-2 border-t border-border-subtle space-y-2">
        <textarea
          className="w-full rounded-lg border border-border-subtle bg-bg-elevated text-text-primary text-sm px-3 py-2 resize-none focus:outline-none focus:border-brand placeholder:text-text-muted"
          rows={3}
          placeholder="Write a comment..."
          value={newBody}
          onChange={(e) => setNewBody(e.target.value)}
        />
        <div className="flex justify-end">
          <button
            onClick={handlePost}
            disabled={!newBody.trim() || addComment.isPending}
            className="text-sm px-4 py-1.5 rounded-lg bg-brand text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" /> Post
          </button>
        </div>
      </div>
    </div>
  );
}
