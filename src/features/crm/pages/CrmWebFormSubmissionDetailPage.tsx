import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Loader2, Download, FileText, UserCheck, Briefcase, Hash,
} from "lucide-react";
import { format } from "date-fns";
import {
  useWebForm, useWebFormSubmissionDetail, useMintSubmissionFileToken,
} from "../api/webforms.queries";
import { webformsApi } from "../api/webforms.api";
import { ROUTES } from "@/app/router/route-paths";

function niceBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

function ValueCell({ value }: { value: string | number | boolean | null | undefined }) {
  if (value === null || value === undefined || value === "") {
    return <span className="text-text-muted text-sm">—</span>;
  }
  if (typeof value === "boolean") {
    return <span className="text-sm">{value ? "Yes" : "No"}</span>;
  }
  if (typeof value === "number") {
    return <span className="text-sm font-mono">{value}</span>;
  }
  return <span className="text-sm break-words whitespace-pre-wrap">{value}</span>;
}

export function Component() {
  const { id, submissionId } = useParams<{ id: string; submissionId: string }>();
  const navigate = useNavigate();
  const formQuery = useWebForm(id);
  const { data, isLoading } = useWebFormSubmissionDetail(id, submissionId);
  const mintMut = useMintSubmissionFileToken();
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

  const parsed = useMemo<Record<string, unknown>>(() => {
    if (!data?.dataJson) return {};
    try { return JSON.parse(data.dataJson); } catch { return {}; }
  }, [data?.dataJson]);

  async function download(blobId: string) {
    if (signedUrls[blobId]) {
      window.open(signedUrls[blobId], "_blank", "noopener,noreferrer");
      return;
    }
    try {
      const token = await mintMut.mutateAsync(blobId);
      const url = webformsApi.buildDownloadUrl(token.token);
      setSignedUrls((m) => ({ ...m, [blobId]: url }));
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      // Toast already raised by hook
    }
  }

  if (isLoading || !data) {
    return (
      <div className="p-6 text-text-muted text-sm flex items-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <button onClick={() => navigate(ROUTES.dashboard.crmWebFormSubmissions(id!))} className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-text-primary mb-2">
            <ArrowLeft className="w-3 h-3" /> All submissions
          </button>
          <h1 className="text-xl font-extrabold text-text-primary tracking-tight">Submission</h1>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-muted mt-2">
            <span><Hash className="w-3 h-3 inline mr-1" /> {data.id}</span>
            <span>{format(new Date(data.createdAt), "PP p")}</span>
            {data.submitterIp && <span className="font-mono">{data.submitterIp}</span>}
            {data.submitterUserAgent && <span className="hidden sm:inline truncate max-w-[420px]" title={data.submitterUserAgent}>{data.submitterUserAgent}</span>}
            {data.isSpam && <span className="text-danger">marked as spam</span>}
          </div>
        </div>
      </div>

      <div className="rounded-card border-thin border-border-subtle bg-glass-1 p-4">
        <div className="text-xs font-bold text-text-secondary mb-2">Linked records</div>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          {data.createdContactId ? (
            <button
              onClick={() => navigate(ROUTES.dashboard.crmContactDetail(data.createdContactId!))}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-bg-elevated border-thin border-border-subtle hover:border-border-medium text-text-primary"
            >
              <UserCheck className="w-3.5 h-3.5 text-brand" /> Open contact <span className="text-text-muted text-xs font-mono">{data.createdContactId.slice(0, 8)}…</span>
            </button>
          ) : (
            <span className="text-text-muted text-xs">No contact was created</span>
          )}
          {data.createdLeadId ? (
            <button
              onClick={() => navigate(ROUTES.dashboard.crmLeadDetail(data.createdLeadId!))}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-bg-elevated border-thin border-border-subtle hover:border-border-medium text-text-primary"
            >
              <Briefcase className="w-3.5 h-3.5 text-brand" /> Open lead <span className="text-text-muted text-xs font-mono">{data.createdLeadId.slice(0, 8)}…</span>
            </button>
          ) : (
            <span className="text-text-muted text-xs">No lead was created</span>
          )}
        </div>
      </div>

      <div className="rounded-card border-thin border-border-subtle bg-glass-1 p-4 space-y-3">
        <h2 className="text-sm font-bold text-text-primary">Submitted values</h2>
        {data.values.length === 0 ? (
          <div className="text-text-muted text-sm">No field rows stored.</div>
        ) : (
          <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-glass-2 text-left">
                  {["Field", "Type", "Value"].map((h) => (
                    <th key={h} className="px-3 py-2.5 text-[11px] font-bold uppercase tracking-wide text-text-muted">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.values.map((v) => (
                  <tr key={v.id} className="border-t border-border-subtle align-top">
                    <td className="px-3 py-2 font-mono text-xs">{v.fieldKey}</td>
                    <td className="px-3 py-2 text-text-muted text-xs">
                      {v.stringValue !== null && v.stringValue !== undefined ? "string" :
                        typeof v.numberValue === "number" ? "number" :
                        v.dateValue ? "date" :
                        v.boolValue !== null && v.boolValue !== undefined ? "bool" : "—"}
                    </td>
                    <td className="px-3 py-2"><ValueCell value={v.stringValue ?? v.numberValue ?? v.dateValue ?? v.boolValue ?? null} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-card border-thin border-border-subtle bg-glass-1 p-4 space-y-3">
        <h2 className="text-sm font-bold text-text-primary">Files</h2>
        {data.files.length === 0 ? (
          <div className="text-text-muted text-sm">No files attached.</div>
        ) : (
          <ul className="space-y-2">
            {data.files.map((f) => (
              <li key={f.id} className="flex items-center justify-between gap-3 p-2 rounded-md border border-border-subtle bg-glass-2">
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="w-5 h-5 text-text-muted shrink-0" />
                  <div className="min-w-0">
                    <div className="text-sm text-text-primary truncate">{f.originalFileName}</div>
                    <div className="text-[11px] text-text-muted">{f.contentType} · {niceBytes(f.sizeBytes)} · field <span className="font-mono">{f.fieldKey}</span></div>
                  </div>
                </div>
                <button
                  onClick={() => download(f.blobId)}
                  type="button"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs border border-border-subtle hover:bg-glass-2 shrink-0"
                >
                  {mintMut.isPending && mintMut.variables === f.blobId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} Download
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {formQuery.data && Object.keys(parsed).length > 0 && (
        <div className="rounded-card border-thin border-border-subtle bg-glass-1 p-4 space-y-2">
          <h2 className="text-sm font-bold text-text-primary">Raw payload</h2>
          <pre className="text-xs font-mono bg-bg-elevated/40 rounded-md p-3 overflow-x-auto whitespace-pre-wrap break-all max-h-80 break-words">
            {JSON.stringify(parsed, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
