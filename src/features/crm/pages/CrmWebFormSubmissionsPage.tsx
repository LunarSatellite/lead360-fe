import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Filter, Globe, UserCheck, Briefcase, FileText } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useWebForm, useWebFormSubmissions } from "../api/webforms.queries";
import type { WebFormSubmissionFilter } from "../types/webforms.types";
import { ROUTES } from "@/app/router/route-paths";

const inputCls =
  "w-full px-3 py-2 rounded-xl bg-bg-input border-thin border-border-subtle text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-glow";

export function Component() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const formQuery = useWebForm(id);
  const [filter, setFilter] = useState<WebFormSubmissionFilter>({ page: 1, pageSize: 20, isSpam: false });

  const { data, isLoading } = useWebFormSubmissions(id, filter);
  const items = useMemo(() => data?.items ?? [], [data]);
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <button onClick={() => navigate(ROUTES.dashboard.crmWebForms)} className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-text-primary mb-2">
            <ArrowLeft className="w-3 h-3" /> All forms
          </button>
          <h1 className="text-xl font-extrabold text-text-primary tracking-tight">
            {formQuery.data ? formQuery.data.name : "Form submissions"}
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Every submission is recorded. New ones create contacts and leads automatically when those toggles are on.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-52">
          <Filter className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <select
            className={inputCls + " pl-9"}
            value={filter.isSpam === undefined ? "all" : filter.isSpam ? "spam" : "inbox"}
            onChange={(e) => {
              const v = e.target.value;
              setFilter((f) => ({ ...f, isSpam: v === "all" ? undefined : v === "spam", page: 1 }));
            }}
          >
            <option value="inbox">Inbox only</option>
            <option value="spam">Spam only</option>
            <option value="all">Show everything</option>
          </select>
        </div>
        <div className="ml-auto text-xs text-text-muted">
          {data ? `${data.totalCount} submission${data.totalCount === 1 ? "" : "s"}` : " "}
        </div>
      </div>

      <div className="overflow-x-auto rounded-card border-thin border-border-subtle">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-glass-2 text-left">
              {["Status", "Submitted", "IP", "Contact", "Lead", "Actions"].map((h) => (
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
                <p className="font-medium text-text-primary">No submissions yet</p>
                <p className="text-xs mt-1">Drop the embed snippet on your site and submits will land here.</p>
              </td></tr>
            ) : items.map((s) => (
              <tr key={s.id} className="border-t border-border-subtle hover:bg-glass-1">
                <td className="px-4 py-3">
                  <span className={"text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded border " + (s.isSpam ? "text-danger border-danger/30 bg-danger/10" : "text-brand border-border-glow bg-brand-soft")}>
                    {s.isSpam ? "Spam" : "Inbox"}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-text-primary">
                  {formatDistanceToNow(new Date(s.createdAt), { addSuffix: true })}
                </td>
                <td className="px-4 py-3 text-xs text-text-muted font-mono">
                  {s.submitterIp || "—"}
                </td>
                <td className="px-4 py-3 text-xs">
                  {s.createdContactId ? (
                    <button
                      onClick={() => navigate(ROUTES.dashboard.crmContactDetail(s.createdContactId!))}
                      className="inline-flex items-center gap-1 text-brand hover:text-brand-light"
                    >
                      <UserCheck className="w-3.5 h-3.5" /> Open
                    </button>
                  ) : (
                    <span className="text-text-muted/60">No contact</span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs">
                  {s.createdLeadId ? (
                    <button
                      onClick={() => navigate(ROUTES.dashboard.crmLeadDetail(s.createdLeadId!))}
                      className="inline-flex items-center gap-1 text-brand hover:text-brand-light"
                    >
                      <Briefcase className="w-3.5 h-3.5" /> Open
                    </button>
                  ) : (
                    <span className="text-text-muted/60">No lead</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => navigate(ROUTES.dashboard.crmWebFormSubmissionDetail(id!, s.id))}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs border border-border-subtle text-text-primary hover:bg-glass-2"
                  >
                    <FileText className="w-3.5 h-3.5" /> Open
                  </button>
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
