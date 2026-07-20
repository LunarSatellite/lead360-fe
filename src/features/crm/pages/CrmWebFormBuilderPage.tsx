import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Loader2, Save, ExternalLink, Plus, Trash2,
  ArrowUp, ArrowDown, Copy, Code2,
} from "lucide-react";
import { toast } from "sonner";
import {
  useWebForm, useCreateWebForm, useUpdateWebForm, usePublishWebForm,
} from "../api/webforms.queries";
import { buildEmbedSnippet } from "../api/webforms.api";
import { useAuth } from "@/shared/hooks/useAuth";
import {
  CONTACT_FIELD_OPTIONS,
  type CreateWebFormFieldRequest,
  type CreateWebFormRequest,
  type WebFormFieldType,
} from "../types/webforms.types";
import { ROUTES } from "@/app/router/route-paths";

const inputCls =
  "w-full px-3 py-2 rounded-xl bg-bg-input border-thin border-border-subtle text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-glow";

const FIELD_TYPES: { value: WebFormFieldType; label: string }[] = [
  { value: "Text", label: "Text" },
  { value: "Email", label: "Email" },
  { value: "Phone", label: "Phone" },
  { value: "Textarea", label: "Textarea" },
  { value: "Number", label: "Number" },
  { value: "Date", label: "Date" },
  { value: "Checkbox", label: "Checkbox" },
  { value: "Select", label: "Select (options JSON)" },
  { value: "File", label: "File (CV/attachment)" },
  { value: "Url", label: "URL" },
  { value: "Hidden", label: "Hidden" },
];

const SUGGESTED_KEYS = new Set([
  "firstName", "lastName", "email", "phone", "company", "jobTitle", "message",
  "fullName", "subject", "notes",
]);

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 48);
}

interface DraftField extends CreateWebFormFieldRequest {
  clientId: string;
}

function blankField(sortOrder: number): DraftField {
  return {
    clientId: crypto.randomUUID(),
    label: "",
    fieldKey: "",
    fieldType: "Text",
    isRequired: false,
    placeholder: "",
    sortOrder,
    mapsToContactField: "",
    validationRegex: "",
    optionsJson: "",
  };
}

function blankForm(): CreateWebFormRequest {
  return {
    name: "",
    description: "",
    successMessage: "Thanks — we'll be in touch soon.",
    redirectUrl: "",
    sendEmailNotification: false,
    notificationEmails: "",
    createContactOnSubmit: true,
    createLeadOnSubmit: false,
    fields: [blankField(1)],
  };
}

export function Component() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;
  const { tenantId } = useAuth();

  const formQuery = useWebForm(isEdit ? id : null);
  const createMut = useCreateWebForm();
  const updateMut = useUpdateWebForm();
  const publishMut = usePublishWebForm();

  const [draft, setDraft] = useState<CreateWebFormRequest>(blankForm());
  const [draftFields, setDraftFields] = useState<DraftField[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!isEdit) {
      setDraft(blankForm());
      setDraftFields([blankField(1)]);
      setHydrated(true);
      return;
    }
    if (formQuery.data && !hydrated) {
      const f = formQuery.data;
      setDraft({
        name: f.name,
        description: f.description ?? "",
        successMessage: f.successMessage ?? "",
        redirectUrl: f.redirectUrl ?? "",
        sendEmailNotification: f.sendEmailNotification,
        notificationEmails: f.notificationEmails ?? "",
        createContactOnSubmit: f.createContactOnSubmit,
        createLeadOnSubmit: f.createLeadOnSubmit,
        fields: null,
      });
      setDraftFields([blankField(1)]);
      setHydrated(true);
    }
  }, [isEdit, formQuery.data, hydrated]);

  function patch(p: Partial<CreateWebFormRequest>) {
    setDraft((d) => ({ ...d, ...p }));
  }

  function patchField(idx: number, p: Partial<DraftField>) {
    setDraftFields((rows) => {
      const next = [...rows];
      const row = { ...next[idx], ...p };
      if (p.label !== undefined && (!row.fieldKey || SUGGESTED_KEYS.has(row.fieldKey))) {
        row.fieldKey = slugify(row.label || "");
      }
      next[idx] = row;
      return next;
    });
  }

  function moveField(idx: number, dir: -1 | 1) {
    setDraftFields((rows) => {
      const target = idx + dir;
      if (target < 0 || target >= rows.length) return rows;
      const next = [...rows];
      [next[idx], next[target]] = [next[target], next[idx]];
      return next.map((r, i) => ({ ...r, sortOrder: i + 1 }));
    });
  }

  function removeField(idx: number) {
    setDraftFields((rows) => rows.filter((_, i) => i !== idx).map((r, i) => ({ ...r, sortOrder: i + 1 })));
  }

  function addField() {
    setDraftFields((rows) => [...rows, blankField(rows.length + 1)]);
  }

  const canSave = useMemo(() => {
    if (!draft.name.trim()) return false;
    if (draftFields.length === 0) return false;
    if (draftFields.some((f) => !f.label.trim())) return false;
    return true;
  }, [draft, draftFields]);

  function save() {
    if (!canSave) return;
    const payload: CreateWebFormRequest = {
      ...draft,
      fields: draftFields.map((f, i) => ({
        label: f.label,
        fieldKey: f.fieldKey || slugify(f.label),
        fieldType: f.fieldType || "Text",
        isRequired: !!f.isRequired,
        placeholder: f.placeholder || null,
        sortOrder: i + 1,
        mapsToContactField: f.mapsToContactField || null,
        validationRegex: f.validationRegex || null,
        optionsJson: f.optionsJson || null,
      })),
    };
    if (isEdit && id) {
      updateMut.mutate(
        { id, payload },
        {
          onSuccess: () => toast.success("Saved"),
          onError: (e: any) => toast.error(e?.message || "Save failed"),
        },
      );
    } else {
      createMut.mutate(payload, {
        onSuccess: (res: any) => {
          const newId = res?.data?.id || res?.id;
          if (newId) navigate(ROUTES.dashboard.crmWebFormEdit(newId));
        },
        onError: (e: any) => toast.error(e?.message || "Create failed"),
      });
    }
  }

  function publish() {
    if (!isEdit || !id) {
      toast.error("Save the form before publishing.");
      return;
    }
    publishMut.mutate(id);
  }

  function copyEmbed() {
    if (!id) return;
    const snippet = buildEmbedSnippet(id, tenantId ?? null);
    navigator.clipboard.writeText(snippet)
      .then(() => toast.success("Embed snippet copied"))
      .catch(() => toast.error("Clipboard write failed"));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <button onClick={() => navigate(ROUTES.dashboard.crmWebForms)} className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-text-primary mb-2">
            <ArrowLeft className="w-3 h-3" /> All forms
          </button>
          <h1 className="text-xl font-extrabold text-text-primary tracking-tight">
            {isEdit ? (formQuery.data?.name ?? "Edit form") : "New form"}
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Define what visitors see and what happens when they submit. New submissions can create a contact, a lead, or both.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isEdit && (
            <button
              onClick={publish}
              disabled={publishMut.isPending}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-text-primary border-thin border-border-subtle bg-glass-1 hover:bg-glass-2 transition-all disabled:opacity-50"
            >
              {publishMut.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ExternalLink className="w-3.5 h-3.5" />}
              Publish
            </button>
          )}
          <button
            onClick={save}
            disabled={!canSave || createMut.isPending || updateMut.isPending}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-bg bg-brand hover:bg-brand-light transition-all disabled:opacity-50"
          >
            {createMut.isPending || updateMut.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {isEdit ? "Save" : "Create"}
          </button>
        </div>
      </div>

      <div className="rounded-card border-thin border-border-subtle bg-glass-1 p-4 space-y-4">
        <h2 className="text-sm font-bold text-text-primary">Form settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="block">
            <span className="block text-[11px] uppercase tracking-wide text-text-muted mb-1">Name</span>
            <input className={inputCls} value={draft.name} onChange={(e) => patch({ name: e.target.value })} placeholder="Contact form" />
          </label>
          <label className="block">
            <span className="block text-[11px] uppercase tracking-wide text-text-muted mb-1">Success message</span>
            <input className={inputCls} value={draft.successMessage ?? ""} onChange={(e) => patch({ successMessage: e.target.value })} placeholder="Thanks — we'll be in touch." />
          </label>
        </div>
        <label className="block">
          <span className="block text-[11px] uppercase tracking-wide text-text-muted mb-1">Description (optional)</span>
          <input className={inputCls} value={draft.description ?? ""} onChange={(e) => patch({ description: e.target.value })} placeholder="Shown to visitors above the form" />
        </label>
        <label className="block">
          <span className="block text-[11px] uppercase tracking-wide text-text-muted mb-1">Redirect URL after submit (optional)</span>
          <input className={inputCls} value={draft.redirectUrl ?? ""} onChange={(e) => patch({ redirectUrl: e.target.value })} placeholder="https://example.com/thank-you" />
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="block">
            <span className="block text-[11px] uppercase tracking-wide text-text-muted mb-1">Notification emails (comma-separated)</span>
            <input className={inputCls} value={draft.notificationEmails ?? ""} onChange={(e) => patch({ notificationEmails: e.target.value })} placeholder="sales@acme.com, ceo@acme.com" />
          </label>
          <label className="flex items-center gap-2 p-3 rounded-xl bg-bg-input border-thin border-border-subtle cursor-pointer">
            <input
              type="checkbox"
              checked={!!draft.sendEmailNotification}
              onChange={(e) => patch({ sendEmailNotification: e.target.checked })}
            />
            <span className="text-sm text-text-primary">Send email notifications</span>
          </label>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="flex items-center gap-2 p-3 rounded-xl bg-bg-input border-thin border-border-subtle cursor-pointer">
            <input
              type="checkbox"
              checked={!!draft.createContactOnSubmit}
              onChange={(e) => patch({ createContactOnSubmit: e.target.checked })}
            />
            <span className="text-sm text-text-primary">Auto-create Contact on submit</span>
          </label>
          <label className="flex items-center gap-2 p-3 rounded-xl bg-bg-input border-thin border-border-subtle cursor-pointer">
            <input
              type="checkbox"
              checked={!!draft.createLeadOnSubmit}
              onChange={(e) => patch({ createLeadOnSubmit: e.target.checked })}
            />
            <span className="text-sm text-text-primary">Auto-create Lead on submit</span>
          </label>
        </div>
      </div>

      <div className="rounded-card border-thin border-border-subtle bg-glass-1 p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-text-primary">Fields</h2>
          <button
            onClick={addField}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-bg bg-brand hover:bg-brand-light transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> Add field
          </button>
        </div>

        {draftFields.length === 0 ? (
          <div className="text-text-muted text-sm text-center py-6">Add at least one field.</div>
        ) : (
          <div className="overflow-x-auto rounded-card border-thin border-border-subtle">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-glass-2 text-left">
                  {["#", "Label", "Key", "Type", "Required", "Map to", "Actions"].map((h) => (
                    <th key={h} className="px-3 py-2.5 text-[11px] font-bold uppercase tracking-wide text-text-muted">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {draftFields.map((f, idx) => (
                  <tr key={f.clientId} className="border-t border-border-subtle align-top">
                    <td className="px-3 py-3 text-xs text-text-muted">{idx + 1}</td>
                    <td className="px-3 py-3">
                      <input className={inputCls} value={f.label} onChange={(e) => patchField(idx, { label: e.target.value })} placeholder="Full name" />
                    </td>
                    <td className="px-3 py-3">
                      <input className={inputCls + " font-mono text-xs"} value={f.fieldKey ?? ""} onChange={(e) => patchField(idx, { fieldKey: e.target.value })} placeholder="fullName" />
                    </td>
                    <td className="px-3 py-3">
                      <select className={inputCls} value={f.fieldType ?? "Text"} onChange={(e) => patchField(idx, { fieldType: e.target.value as WebFormFieldType })}>
                        {FIELD_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-3">
                      <input type="checkbox" checked={!!f.isRequired} onChange={(e) => patchField(idx, { isRequired: e.target.checked })} />
                    </td>
                    <td className="px-3 py-3">
                      <select className={inputCls} value={f.mapsToContactField ?? ""} onChange={(e) => patchField(idx, { mapsToContactField: e.target.value })}>
                        {CONTACT_FIELD_OPTIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => moveField(idx, -1)} disabled={idx === 0} className="p-1 text-text-muted hover:text-text-primary disabled:opacity-30" title="Move up"><ArrowUp className="w-3.5 h-3.5" /></button>
                        <button onClick={() => moveField(idx, 1)} disabled={idx === draftFields.length - 1} className="p-1 text-text-muted hover:text-text-primary disabled:opacity-30" title="Move down"><ArrowDown className="w-3.5 h-3.5" /></button>
                        <button onClick={() => removeField(idx)} className="p-1 text-text-muted hover:text-danger" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="text-xs text-text-muted space-y-1 list-disc list-inside">
          <p>Label is what the visitor sees. Key is how the value is stored.</p>
          <p>Mapping a field to a contact column writes the submitted value straight onto the contact.</p>
          <p>For Select fields, add a JSON options array like <code className="font-mono">[&#123;"value":"a","label":"A"&#125;]</code> below.</p>
        </div>

        {draftFields.length > 0 && (
          <details className="rounded-card border-thin border-border-subtle bg-glass-2 p-3">
            <summary className="text-xs font-bold text-text-secondary cursor-pointer">Advanced options per field</summary>
            <div className="mt-3 space-y-4">
              {draftFields.map((f, idx) => (
                <div key={f.clientId} className="rounded-card border-thin border-border-subtle bg-glass-1 p-3 space-y-2">
                  <div className="text-xs font-bold text-text-secondary">{idx + 1}. {f.label || "(unnamed)"}</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <label className="block">
                      <span className="block text-[11px] uppercase tracking-wide text-text-muted mb-1">Placeholder</span>
                      <input className={inputCls} value={f.placeholder ?? ""} onChange={(e) => patchField(idx, { placeholder: e.target.value })} />
                    </label>
                    <label className="block">
                      <span className="block text-[11px] uppercase tracking-wide text-text-muted mb-1">Validation regex</span>
                      <input className={inputCls + " font-mono"} value={f.validationRegex ?? ""} onChange={(e) => patchField(idx, { validationRegex: e.target.value })} placeholder="^\+977\d{10}$" />
                    </label>
                  </div>
                  {f.fieldType === "Select" && (
                    <label className="block">
                      <span className="block text-[11px] uppercase tracking-wide text-text-muted mb-1">Options (JSON array of {"{value,label}"})</span>
                      <input className={inputCls + " font-mono"} value={f.optionsJson ?? ""} onChange={(e) => patchField(idx, { optionsJson: e.target.value })} placeholder='[{"value":"sales","label":"Sales"}]' />
                    </label>
                  )}
                </div>
              ))}
            </div>
          </details>
        )}
      </div>

      {isEdit && id && (
        <div className="rounded-card border-thin border-border-subtle bg-glass-1 p-4 space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-bold text-text-primary inline-flex items-center gap-2">
              <Code2 className="w-4 h-4 text-brand" /> Embed on your site
            </div>
            <button onClick={copyEmbed} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-bg bg-brand hover:bg-brand-light transition-all">
              <Copy className="w-3.5 h-3.5" /> Copy
            </button>
          </div>
          <pre className="text-[11px] bg-bg-elevated rounded-md p-3 overflow-x-auto whitespace-pre-wrap break-all font-mono">
            {buildEmbedSnippet(id, tenantId ?? null)}
          </pre>
          <p className="text-xs text-text-muted">Drop this snippet on any page where you want this form to appear.</p>
        </div>
      )}
    </div>
  );
}

