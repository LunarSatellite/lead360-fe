import { useState } from 'react';
import { BookOpen, Search, Eye, Pencil, Check, X, ArrowLeft, FileQuestion, Sparkles } from 'lucide-react';
import {
  useKbArticles, useKbArticleById, useUpdateKbArticle,
  useKbPendingDrafts, useReviewKbDraft,
} from '../api/crm-kb.queries';
import type { CrmKbArticleDto, CrmKbDraftDto } from '../types/crm-kb.types';
import { CRM_KB_ARTICLE_STATUS_LABELS, CrmKbDraftStatus } from '../types/crm-kb.types';

const inputCls = 'w-full px-3 py-2 rounded-lg bg-bg border border-border-subtle text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand transition-all';

export function Component() {
  const [tab, setTab] = useState<'articles' | 'drafts'>('articles');
  const { data: drafts = [] } = useKbPendingDrafts();

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-text-primary tracking-tight">Knowledge Base</h1>
        <p className="text-base text-text-secondary mt-1">Reusable answers for support agents — sourced from resolved cases, reviewed before publishing</p>
      </div>

      <div className="flex border-b border-border-subtle">
        <button
          onClick={() => setTab('articles')}
          className={`px-4 py-2.5 text-sm font-bold transition-colors ${tab === 'articles' ? 'text-brand border-b-2 border-brand' : 'text-text-muted hover:text-text-secondary'}`}
        >
          Articles
        </button>
        <button
          onClick={() => setTab('drafts')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold transition-colors ${tab === 'drafts' ? 'text-brand border-b-2 border-brand' : 'text-text-muted hover:text-text-secondary'}`}
        >
          Pending Review
          {drafts.length > 0 && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-brand text-white">{drafts.length}</span>
          )}
        </button>
      </div>

      {tab === 'articles' ? <ArticlesTab /> : <DraftsTab />}
    </div>
  );
}

// ── Articles ──────────────────────────────────────────────────────────────────

function ArticlesTab() {
  const [category, setCategory] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: articles = [], isLoading } = useKbArticles(category.trim() || undefined);

  if (selectedId) return <ArticleDetail id={selectedId} onBack={() => setSelectedId(null)} />;

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Filter by category…"
          className={`${inputCls} pl-9`}
        />
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-sm text-text-muted">Loading...</div>
      ) : articles.length === 0 ? (
        <div className="bg-glass-1 border border-border-subtle rounded-2xl p-12 text-center">
          <BookOpen className="w-10 h-10 text-text-muted mx-auto mb-3" />
          <div className="text-base font-bold text-text-primary mb-1">No articles yet</div>
          <div className="text-sm text-text-muted">Articles get created by approving AI-drafted proposals generated from resolved support cases — see the Pending Review tab, or generate one from a case's detail panel.</div>
        </div>
      ) : (
        <div className="space-y-3">
          {articles.map((a) => (
            <button
              key={a.id}
              onClick={() => setSelectedId(a.id)}
              className="w-full text-left bg-glass-1 border border-border-subtle rounded-2xl p-5 hover:border-brand transition-all"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-bold text-text-primary">{a.title}</div>
                  <div className="text-xs text-text-muted mt-0.5 line-clamp-1">{a.summary}</div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {a.categoryTag && (
                    <span className="px-2 py-0.5 rounded-lg text-xs font-semibold bg-glass-2 text-text-secondary border border-border-medium">{a.categoryTag}</span>
                  )}
                  <span className="flex items-center gap-1 text-xs text-text-muted">
                    <Eye className="w-3 h-3" /> {a.viewCount}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ArticleDetail({ id, onBack }: { id: string; onBack: () => void }) {
  const { data: article, isLoading } = useKbArticleById(id);
  const update = useUpdateKbArticle();
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState('');

  const startEdit = (a: CrmKbArticleDto) => {
    setContent(a.bodyContent);
    setEditing(true);
  };

  const save = () => {
    update.mutate({ id, content }, { onSuccess: () => setEditing(false) });
  };

  if (isLoading || !article) {
    return (
      <div className="space-y-4">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-semibold text-text-muted hover:text-text-primary">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="p-8 text-center text-sm text-text-muted">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-semibold text-text-muted hover:text-text-primary">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        {!editing && (
          <button
            onClick={() => startEdit(article)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-glass-2 border border-border-medium text-text-primary hover:bg-glass-3"
          >
            <Pencil className="w-3.5 h-3.5" /> Edit
          </button>
        )}
      </div>

      <div className="bg-glass-1 border border-border-subtle rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          {article.categoryTag && (
            <span className="px-2 py-0.5 rounded-lg text-xs font-semibold bg-glass-2 text-text-secondary border border-border-medium">{article.categoryTag}</span>
          )}
          <span className="text-xs text-text-muted">{CRM_KB_ARTICLE_STATUS_LABELS[article.status]}</span>
          <span className="text-xs text-text-muted flex items-center gap-1"><Eye className="w-3 h-3" /> {article.viewCount} views</span>
        </div>
        <h2 className="text-xl font-extrabold text-text-primary">{article.title}</h2>
        <p className="text-sm text-text-secondary italic">{article.summary}</p>

        {editing ? (
          <div className="space-y-3">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={14}
              className={`${inputCls} resize-none font-mono`}
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditing(false)} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-text-muted hover:text-text-primary">Cancel</button>
              <button onClick={save} disabled={update.isPending} className="px-4 py-1.5 rounded-lg text-xs font-bold bg-brand text-white hover:brightness-110 disabled:opacity-50">
                Save
              </button>
            </div>
          </div>
        ) : (
          <div className="text-sm text-text-primary whitespace-pre-wrap leading-relaxed border-t border-border-subtle pt-4">
            {article.bodyContent}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Pending drafts ────────────────────────────────────────────────────────────

function DraftsTab() {
  const { data: drafts = [], isLoading } = useKbPendingDrafts();

  if (isLoading) return <div className="p-8 text-center text-sm text-text-muted">Loading...</div>;

  if (drafts.length === 0) {
    return (
      <div className="bg-glass-1 border border-border-subtle rounded-2xl p-12 text-center">
        <FileQuestion className="w-10 h-10 text-text-muted mx-auto mb-3" />
        <div className="text-base font-bold text-text-primary mb-1">Nothing to review</div>
        <div className="text-sm text-text-muted">AI-proposed articles from resolved support cases will show up here for approval.</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {drafts.map((d) => <DraftCard key={d.id} draft={d} />)}
    </div>
  );
}

function DraftCard({ draft }: { draft: CrmKbDraftDto }) {
  const review = useReviewKbDraft();
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState('');
  const [expanded, setExpanded] = useState(false);

  const approve = () => review.mutate({ id: draft.id, req: { decision: CrmKbDraftStatus.Approved } });
  const reject = () => {
    if (!reason.trim()) return;
    review.mutate(
      { id: draft.id, req: { decision: CrmKbDraftStatus.Rejected, rejectionReason: reason.trim() } },
      { onSuccess: () => setShowReject(false) },
    );
  };

  return (
    <div className="bg-glass-1 border border-border-subtle rounded-2xl p-5 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles className="w-4 h-4 text-brand flex-shrink-0" />
          <span className="text-sm font-bold text-text-primary truncate">{draft.proposedTitle}</span>
          {draft.articleId && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-glass-2 text-text-muted border border-border-subtle flex-shrink-0">Update</span>
          )}
        </div>
        <button onClick={() => setExpanded((v) => !v)} className="text-xs font-semibold text-text-muted hover:text-text-primary flex-shrink-0">
          {expanded ? 'Hide' : 'Preview'}
        </button>
      </div>

      {expanded && (
        <p className="text-sm text-text-secondary whitespace-pre-wrap leading-relaxed bg-bg-elevated rounded-lg p-3 border border-border-subtle max-h-64 overflow-y-auto">
          {draft.proposedContent}
        </p>
      )}

      {showReject ? (
        <div className="flex items-center gap-2 pt-2 border-t border-border-subtle">
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason for rejecting…"
            className={`${inputCls} flex-1`}
          />
          <button onClick={reject} disabled={!reason.trim() || review.isPending} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-danger text-white hover:brightness-110 disabled:opacity-50">
            Confirm reject
          </button>
          <button onClick={() => setShowReject(false)} className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-text-muted hover:text-text-primary">Cancel</button>
        </div>
      ) : (
        <div className="flex gap-2 pt-2 border-t border-border-subtle">
          <button onClick={approve} disabled={review.isPending} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-success-soft text-success border border-[rgba(34,197,94,0.2)] hover:bg-success hover:text-white transition-all disabled:opacity-50">
            <Check className="w-3.5 h-3.5" /> Approve & publish
          </button>
          <button onClick={() => setShowReject(true)} disabled={review.isPending} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-danger border border-border-subtle hover:bg-danger-soft hover:border-danger transition-all disabled:opacity-50">
            <X className="w-3.5 h-3.5" /> Reject
          </button>
        </div>
      )}
    </div>
  );
}
