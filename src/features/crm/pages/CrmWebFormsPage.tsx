import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus, Loader2, Trash2, ExternalLink, Clipboard, Search, Filter,
  Globe, Send, Pencil, Eye,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import {
  useWebForms, useDeleteWebForm, usePublishWebForm,
} from "../api/webforms.queries";
import { buildEmbedSnippet } from "../api/webforms.api";
import type { CrmWebFormFilter, WebFormDto, WebFormStatus } from "../types/webforms.types";
import { ROUTES } from "@/app/router/route-paths";

const inputCls =
  "w-full px-3 py-2 rounded-xl bg-bg-input border-thin border-border-subtle text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-glow";

const STATUS_BADGE: Record<WebFormStatus, string> = {
  Draft: "text-text-muted border-border-subtle bg-glass-2",
  Published: "text-brand border-border-glow bg-brand-soft",
  Archived: "text-warning border-warning/30 bg-warning/10",
};

export function Component() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<CrmWebFormFilter>({
    page: 1, pageSize: 20, status: "All", search: "",
  });
  const { data, isLoading } = useWebForms(filter);
  const deleteMut = useDeleteWebForm();
  const publishMut = usePublishWebForm();

  const items = useMemo<WebFormDto[]>(() => data?.items ?? [], [data]);
  const totalPages = data?.totalPages ?? 1;

  function copyEmbed(formId: string) {
    const snippet = buildEmbedSnippet(formId, null);
    navigator.clipboard.writeText(snippet)
      .then(() => toast.success("Embed snippet copied"))
      .catch(() => toast.error("Clipboard write failed"));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-extrabold text-text-primary tracking-tight">Web forms</h1>
          <p className="text-sm text-text-secondary mt-1">
            Public-facing forms embedded on your site. New submissions create contacts and leads automatically.
          </p>
        </div>
        <button
          onClick={() => navigate(ROUTES.dashboard.crmWebFormNew)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-bg bg-brand hover:bg-brand-light transition-all"
        >
          <Plus className="w-3.5 h-3.5" /> New form
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 basis-64">
          <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name…"
            className={inputCls + " pl-9"}
            value={filter.search ?? ""}
            onChange={(e) => setFilter((f) => ({ ...f, search: e.target.value, page: 1 }))}
          />
        </div>
        <div className="relative w-full sm:w-52">
          <Filter className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <select
            className={inputCls + " pl-9 appearance-none"}
            value={filter.status ?? "All"}
            onChange={(e) =>
              setFilter((f) => ({ ...f, status: e.target.value as WebFormStatus | "All", page: 1 }))
            }
          >
            <option value="All">All statuses</option>
            <option value="Draft">Draft</option>
            <option value="Published">Published</option>
            <option value="Archived">Archived</option>
          </select>
        </div>
        <div className="text-xs text-text-muted">
          {data ? `${data.totalCount} form${data.totalCount === 1 ? "" : "s"}` : " "}
        </div>
      </div>

      <div className="overflow-x-auto rounded-card border-thin border-border-subtle">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-glass-2 text-left">
              {["Name", "Status", "Submissions", "Behavior", "Created", "Actions"].map((h) => (
                <th key={h} className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-text-muted">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-text-muted"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-text-muted">
                <Globe className="w-7 h-7 mx-auto mb-2 text-text-muted" />
                <p className="font-medium text-text-primary">No forms yet</p>
                <p className="text-xs mt-1">Create a form to start capturing leads from your website, careers page, or contact page.</p>
              </td></tr>
            ) : items.map((form) => (
              <tr key={form.id} className="border-t border-border-subtle hover:bg-glass-1">
                <td className="px-4 py-3">
                  <div className="text-sm font-semibold text-text-primary">{form.name}</div>
                  {form.description && (
                    <div className="text-xs text-text-muted mt-0.5 line-clamp-1">{form.description}</div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded border ${STATUS_BADGE[form.status]}`}>
                    {form.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1 text-xs text-text-secondary">
                    <Send className="w-3 h-3" /> {form.submissionCount}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-text-muted">
                  {form.createContactOnSubmit ? "Contact" : ""}
                  {form.createContactOnSubmit && form.createLeadOnSubmit ? " + " : ""}
                  {form.createLeadOnSubmit ? "Lead" : ""}
                  {!form.createContactOnSubmit && !form.createLeadOnSubmit && "—"}
                </td>
                <td className="px-4 py-3 text-xs text-text-muted">
                  {formatDistanceToNow(new Date(form.createdAt), { addSuffix: true })}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => navigate(ROUTES.dashboard.crmWebFormSubmissions(form.id))}
                      className="p-1 text-text-muted hover:text-brand" title="View submissions"
                    ><Eye className="w-3.5 h-3.5" /></button>
                    <button
                      onClick={() => copyEmbed(form.id)}
                      className="p-1 text-text-muted hover:text-brand" title="Copy embed HTML"
                    ><Clipboard className="w-3.5 h-3.5" /></button>
                    {form.status !== "Published" && (
                      <button
                        onClick={() => publishMut.mutate(form.id)}
                        disabled={publishMut.isPending && publishMut.variables === form.id}
                        className="p-1 text-text-muted hover:text-brand disabled:opacity-50"
                        title="Publish"
                      >
                        {publishMut.isPending && publishMut.variables === form.id
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <ExternalLink className="w-3.5 h-3.5" />}
                      </button>
                    )}
                    <button
                      onClick={() => navigate(ROUTES.dashboard.crmWebFormEdit(form.id))}
                      className="p-1 text-text-muted hover:text-brand" title="Edit"
                    ><Pencil className="w-3.5 h-3.5" /></button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete "${form.name}"? Existing submissions are kept.`)) {
                          deleteMut.mutate(form.id);
                        }
                      }}
                      className="p-1 text-text-muted hover:text-danger" title="Delete"
                    ><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2 text-sm">
          <button
            disabled={(filter.page ?? 1) <= 1}
            onClick={() => setFilter((f) => ({ ...f, page: Math.max(1, (f.page ?? 1) - 1) }))}
            className="px-3 py-1 rounded-md border border-border-subtle text-text-muted hover:text-text-primary disabled:opacity-40"
          >
            Prev
          </button>
          <span className="text-text-muted">Page {filter.page ?? 1} of {totalPages}</span>
          <button
            disabled={(filter.page ?? 1) >= totalPages}
            onClick={() => setFilter((f) => ({ ...f, page: Math.min(totalPages, (f.page ?? 1) + 1) }))}
            className="px-3 py-1 rounded-md border border-border-subtle text-text-muted hover:text-text-primary disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
