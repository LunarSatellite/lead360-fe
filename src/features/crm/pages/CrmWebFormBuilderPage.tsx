import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Loader2, Save, ExternalLink, Trash2,
  GripVertical, Monitor, Smartphone, Copy, Code2, Globe, Eye, Settings2, ListChecks,
} from "lucide-react";
import { toast } from "sonner";
import {
  useWebForm, useCreateWebForm, useUpdateWebForm, usePublishWebForm,
} from "../api/webforms.queries";
import { buildEmbedSnippet, buildHostedUrl } from "../api/webforms.api";
import { useAuth } from "@/shared/hooks/useAuth";
import {
  CONTACT_FIELD_OPTIONS,
  WEB_FORM_PAGE_THEMES,
  type CreateWebFormFieldRequest,
  type CreateWebFormRequest,
  type WebFormDesignConfig,
  type WebFormDto,
  type WebFormFieldType,
  type WebFormMode,
  type WebFormPageTheme,
} from "../types/webforms.types";
import { ROUTES } from "@/app/router/route-paths";
import { useTenantDomains } from "@/features/tenant/api/tenant-domains.queries";
import { getActiveTenantDomainOrigin } from "@/features/tenant/types/tenant-domain.types";

const inputCls =
  "w-full px-3 py-2 rounded-xl bg-bg-input border-thin border-border-subtle text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-glow";

const FIELD_TYPES: { value: WebFormFieldType; label: string; icon: string }[] = [
  { value: "Text", label: "Short text", icon: "Aa" },
  { value: "Textarea", label: "Long text", icon: "P" },
  { value: "Email", label: "Email", icon: "@" },
  { value: "Phone", label: "Phone", icon: "T" },
  { value: "Number", label: "Number", icon: "#" },
  { value: "Date", label: "Date", icon: "D" },
  { value: "Url", label: "URL", icon: "U" },
  { value: "Select", label: "Dropdown", icon: "v" },
  { value: "Checkbox", label: "Checkbox", icon: "x" },
  { value: "File", label: "File upload", icon: "F" },
];

const SUGGESTED_KEYS = new Set([
  "firstName", "lastName", "email", "phone", "company", "jobTitle", "message",
  "fullName", "subject", "notes",
]);

function slugify(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9_]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 48);
}

interface DraftField extends CreateWebFormFieldRequest { clientId: string; }

function blankField(sortOrder: number, fieldType: WebFormFieldType = "Text"): DraftField {
  return {
    clientId: crypto.randomUUID(),
    label: "",
    fieldKey: "",
    fieldType,
    isRequired: false,
    placeholder: "",
    sortOrder,
    mapsToContactField: "",
    validationRegex: "",
    optionsJson: "",
  };
}

function parseDesignConfig(raw?: string | null): WebFormDesignConfig {
  if (!raw) return {};
  try { return JSON.parse(raw) as WebFormDesignConfig; } catch { return {}; }
}

function blankForm(): CreateWebFormRequest {
  return {
    name: "",
    description: "",
    successMessage: "Thanks - we will be in touch soon.",
    redirectUrl: "",
    sendEmailNotification: false,
    notificationEmails: "",
    createContactOnSubmit: true,
    createLeadOnSubmit: false,
    hostedSlug: "",
    logoUrl: "",
    primaryColor: "",
    backgroundColor: "",
    fontFamily: "",
    preFillEnabled: true,
    mode: "Classic",
    designConfigJson: "",
    pageTheme: "Minimal",
    heroImageUrl: "",
    pageTitle: "",
    pageTagline: "",
    footerText: "",
    footerLinkUrl: "",
    footerLinkLabel: "",
    showPoweredBy: true,
    companyName: "",
    companyContactInfo: "",
    pageBackgroundGradient: "",
    fields: [blankField(1)],
  };
}

type TabKey = "fields" | "settings" | "branding" | "behavior";

export function Component() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;
  const { tenantId } = useAuth();
  const { data: tenantDomains } = useTenantDomains();
  const publicOrigin = getActiveTenantDomainOrigin(tenantDomains);

  const formQuery = useWebForm(isEdit ? id : null);
  const createMut = useCreateWebForm();
  const updateMut = useUpdateWebForm();
  const publishMut = usePublishWebForm();

  const [draft, setDraft] = useState<CreateWebFormRequest>(blankForm());
  const [draftFields, setDraftFields] = useState<DraftField[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("fields");
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const [previewBust, setPreviewBust] = useState<number>(Date.now());
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  useEffect(() => {
    if (!isEdit) {
      setDraft(blankForm());
      setDraftFields([blankField(1)]);
      setHydrated(true);
      return;
    }
    if (formQuery.data && !hydrated) {
      const f = formQuery.data as unknown as WebFormDto;
      setDraft({
        name: f.name,
        description: f.description ?? "",
        successMessage: f.successMessage ?? "",
        redirectUrl: f.redirectUrl ?? "",
        sendEmailNotification: f.sendEmailNotification,
        notificationEmails: f.notificationEmails ?? "",
        createContactOnSubmit: f.createContactOnSubmit,
        createLeadOnSubmit: f.createLeadOnSubmit,
        hostedSlug: f.hostedSlug ?? "",
        logoUrl: f.logoUrl ?? "",
        primaryColor: f.primaryColor ?? "",
        backgroundColor: f.backgroundColor ?? "",
        fontFamily: f.fontFamily ?? "",
        preFillEnabled: f.preFillEnabled ?? true,
        mode: f.mode ?? "Classic",
        designConfigJson: f.designConfigJson ?? (f.designConfig ? JSON.stringify(f.designConfig) : ""),
        pageTheme: f.pageTheme ?? "Minimal",
        heroImageUrl: f.heroImageUrl ?? "",
        pageTitle: f.pageTitle ?? "",
        pageTagline: f.pageTagline ?? "",
        footerText: f.footerText ?? "",
        footerLinkUrl: f.footerLinkUrl ?? "",
        footerLinkLabel: f.footerLinkLabel ?? "",
        showPoweredBy: f.showPoweredBy ?? true,
        companyName: f.companyName ?? "",
        companyContactInfo: f.companyContactInfo ?? "",
        pageBackgroundGradient: f.pageBackgroundGradient ?? "",
        fields: null,
      });
      setDraftFields([blankField(1)]);
      setHydrated(true);
    }
  }, [isEdit, formQuery.data, hydrated]);

  function patch(p: Partial<CreateWebFormRequest>) { setDraft((d) => ({ ...d, ...p })); }

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

  function moveField(from: number, to: number) {
    if (from === to) return;
    setDraftFields((rows) => {
      const next = [...rows];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next.map((r, i) => ({ ...r, sortOrder: i + 1 }));
    });
  }

  function removeField(idx: number) {
    setDraftFields((rows) => rows.filter((_, i) => i !== idx).map((r, i) => ({ ...r, sortOrder: i + 1 })));
  }

  function addField(fieldType: WebFormFieldType = "Text") {
    setDraftFields((rows) => [...rows, blankField(rows.length + 1, fieldType)]);
  }

  function duplicateField(idx: number) {
    setDraftFields((rows) => {
      const src = rows[idx];
      const copy: DraftField = { ...src, clientId: crypto.randomUUID(), label: src.label ? src.label + " (copy)" : "" };
      const next = [...rows];
      next.splice(idx + 1, 0, copy);
      return next.map((r, i) => ({ ...r, sortOrder: i + 1 }));
    });
  }

  // Save allowed when: name is set AND either (a) we have at least one fully-labeled field, or
  // (b) the user has zero labeled fields (visual-only save: just changing theme/colors/etc).
  // This lets a user tweak the hosted page theme or button shape without having to fill in fields first.
  const canSave = useMemo(() => {
    if (!draft.name.trim()) return false;
    const hasAnyField = draftFields.some((f) => f.label.trim());
    if (!hasAnyField) return true; // visual-only save
    const incompleteFields = draftFields.filter((f) => !f.label.trim());
    return incompleteFields.length === 0;
  }, [draft.name, draftFields]);

  function save() {
    if (!canSave) return;
    const design = parseDesignConfig(draft.designConfigJson);
    const payload: CreateWebFormRequest = {
      ...draft,
      hostedSlug: (draft.hostedSlug || "x").trim() || null,
      logoUrl: (draft.logoUrl || "x").trim() || null,
      primaryColor: (draft.primaryColor || "x").trim() || null,
      backgroundColor: (draft.backgroundColor || "x").trim() || null,
      fontFamily: (draft.fontFamily || "x").trim() || null,
      preFillEnabled: !!draft.preFillEnabled,
      mode: draft.mode ?? "Classic",
      designConfigJson: Object.keys(design).length > 0 ? JSON.stringify(design) : null,
      pageTheme: draft.pageTheme ?? "Minimal",
      heroImageUrl: (draft.heroImageUrl || "").trim() || null,
      pageTitle: (draft.pageTitle || "").trim() || null,
      pageTagline: (draft.pageTagline || "").trim() || null,
      footerText: (draft.footerText || "").trim() || null,
      footerLinkUrl: (draft.footerLinkUrl || "").trim() || null,
      footerLinkLabel: (draft.footerLinkLabel || "").trim() || null,
      showPoweredBy: draft.showPoweredBy ?? true,
      companyName: (draft.companyName || "").trim() || null,
      companyContactInfo: (draft.companyContactInfo || "").trim() || null,
      pageBackgroundGradient: (draft.pageBackgroundGradient || "").trim() || null,
      // Only ship the fields list when the user actually has fields. Visual-only saves
      // (e.g. theme change on an existing form) skip fields so we never wipe the saved field list.
      fields: draftFields.some((f) => f.label.trim())
        ? draftFields.filter((f) => f.label.trim()).map((f, i) => ({
        label: f.label,
        fieldKey: f.fieldKey || slugify(f.label),
        fieldType: f.fieldType || "Text",
        isRequired: !!f.isRequired,
        placeholder: f.placeholder || null,
        sortOrder: i + 1,
        mapsToContactField: f.mapsToContactField || null,
        validationRegex: f.validationRegex || null,
        optionsJson: f.optionsJson || null,
      }))
        : null,
    };
    if (isEdit && id) {
      updateMut.mutate({ id, payload }, {
        onSuccess: () => { toast.success("Saved"); setPreviewBust(Date.now()); },
        onError: (e: any) => toast.error(e?.message || "Save failed"),
      });
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
    if (!isEdit || !id) { toast.error("Save the form before publishing."); return; }
    publishMut.mutate(id);
  }

  function copyEmbed() {
    if (!id) return;
    const snippet = buildEmbedSnippet(id, tenantId ?? null);
    navigator.clipboard.writeText(snippet).then(() => toast.success("Embed snippet copied")).catch(() => toast.error("Clipboard write failed"));
  }

  function copyHostedUrl() {
    if (!id) return;
    const url = buildHostedUrl(id, draft.hostedSlug || null, publicOrigin ?? undefined);
    navigator.clipboard.writeText(url).then(() => toast.success("Hosted URL copied")).catch(() => toast.error("Clipboard write failed"));
  }

  const designConfig = useMemo(() => parseDesignConfig(draft.designConfigJson), [draft.designConfigJson]);
  function patchDesign(p: Partial<WebFormDesignConfig>) {
    const next = { ...designConfig, ...p };
    setDraft((d) => ({ ...d, designConfigJson: JSON.stringify(next) }));
  }

  function onDragStart(e: React.DragEvent, idx: number) {
    setDraggingIdx(idx);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(idx));
  }
  function onDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverIdx !== idx) setDragOverIdx(idx);
  }
  function onDragLeave() { setDragOverIdx(null); }
  function onDrop(e: React.DragEvent, idx: number) {
    e.preventDefault();
    const from = draggingIdx;
    setDraggingIdx(null);
    setDragOverIdx(null);
    if (from === null || from === idx) return;
    moveField(from, idx);
  }
  function onDragEnd() { setDraggingIdx(null); setDragOverIdx(null); }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <button onClick={() => navigate(ROUTES.dashboard.crmWebForms)} className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-text-primary mb-2">
            <ArrowLeft className="w-3 h-3" /> All forms
          </button>
          <h1 className="text-xl font-extrabold text-text-primary tracking-tight">
            {isEdit ? ((formQuery.data as unknown as WebFormDto | undefined)?.name ?? 'Edit form') : 'New form'}
          </h1>
          <p className="text-sm text-text-secondary mt-1">Build your form with drag-drop. Preview updates as you edit.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {isEdit && (
            <>
              <button onClick={copyEmbed} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-text-primary border-thin border-border-subtle bg-glass-1 hover:bg-glass-2 transition-all" title="Copy embed code">
                <Code2 className="w-3.5 h-3.5" /> Embed
              </button>
              <button onClick={copyHostedUrl} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-text-primary border-thin border-border-subtle bg-glass-1 hover:bg-glass-2 transition-all" title="Copy hosted URL">
                <Globe className="w-3.5 h-3.5" /> Hosted URL
              </button>
              <button onClick={publish} disabled={publishMut.isPending} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-text-primary border-thin border-border-subtle bg-glass-1 hover:bg-glass-2 transition-all disabled:opacity-50">
                {publishMut.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ExternalLink className="w-3.5 h-3.5" />} Publish
              </button>
            </>
          )}
          <button onClick={save} disabled={!canSave || createMut.isPending || updateMut.isPending} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-bg bg-brand hover:bg-brand-light transition-all disabled:opacity-50">
            {(createMut.isPending || updateMut.isPending) ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {isEdit ? "Save" : "Create"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_440px] gap-4 items-start">
        <div className="space-y-3 min-w-0">
          <div className="flex items-center gap-1 p-1 rounded-2xl bg-glass-1 border-thin border-border-subtle w-fit">
            <TabButton active={activeTab === "fields"} onClick={() => setActiveTab("fields")} icon={<ListChecks className="w-3.5 h-3.5" />}>Fields</TabButton>
            <TabButton active={activeTab === "settings"} onClick={() => setActiveTab("settings")} icon={<Settings2 className="w-3.5 h-3.5" />}>Settings</TabButton>
            <TabButton active={activeTab === "branding"} onClick={() => setActiveTab("branding")} icon={<Eye className="w-3.5 h-3.5" />}>Branding</TabButton>
            <TabButton active={activeTab === "behavior"} onClick={() => setActiveTab("behavior")} icon={<Settings2 className="w-3.5 h-3.5" />}>Behavior</TabButton>
          </div>

          {activeTab === "fields" && (
            <FieldsTab
              draftFields={draftFields}
              patchField={patchField}
              removeField={removeField}
              duplicateField={duplicateField}
              addField={addField}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onDragEnd={onDragEnd}
              draggingIdx={draggingIdx}
              dragOverIdx={dragOverIdx}
            />
          )}
          {activeTab === "settings" && <SettingsTab draft={draft} patch={patch} />}
          {activeTab === "branding" && <BrandingTab draft={draft} patch={patch} designConfig={designConfig} patchDesign={patchDesign} />}
          {activeTab === "behavior" && <BehaviorTab draft={draft} patch={patch} />}
        </div>

        <div className="lg:sticky lg:top-4 space-y-2">
          <div className="flex items-center justify-between gap-2 px-1">
            <span className="text-[11px] uppercase tracking-wide font-bold text-text-muted">Live preview</span>
            <div className="flex items-center gap-1 p-0.5 rounded-xl bg-glass-1 border-thin border-border-subtle">
              <button onClick={() => setPreviewMode("desktop")} className={"p-1.5 rounded-lg " + (previewMode === "desktop" ? "bg-bg-input text-text-primary" : "text-text-muted hover:text-text-primary")} title="Desktop">
                <Monitor className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setPreviewMode("mobile")} className={"p-1.5 rounded-lg " + (previewMode === "mobile" ? "bg-bg-input text-text-primary" : "text-text-muted hover:text-text-primary")} title="Mobile">
                <Smartphone className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <div className="rounded-card border-thin border-border-subtle bg-glass-1 p-3 overflow-hidden">
            <DeviceFramePreview formId={id} hostedSlug={draft.hostedSlug} draft={draft} draftFields={draftFields} mode={previewMode} bust={previewBust} />
          </div>
          {!draft.name.trim() && <p className="text-[11px] text-text-muted px-1">Add a form name to enable saving.</p>}
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={"flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all " + (active ? "bg-bg-input text-text-primary" : "text-text-muted hover:text-text-primary")}>
      {icon} {children}
    </button>
  );
}

interface FieldsTabProps {
  draftFields: DraftField[];
  patchField: (idx: number, p: Partial<DraftField>) => void;
  removeField: (idx: number) => void;
  duplicateField: (idx: number) => void;
  addField: (t: WebFormFieldType) => void;
  onDragStart: (e: React.DragEvent, idx: number) => void;
  onDragOver: (e: React.DragEvent, idx: number) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, idx: number) => void;
  onDragEnd: () => void;
  draggingIdx: number | null;
  dragOverIdx: number | null;
}

function FieldsTab(props: FieldsTabProps) {
  const { draftFields, patchField, removeField, duplicateField, addField, draggingIdx, dragOverIdx } = props;

  return (
    <div className="rounded-card border-thin border-border-subtle bg-glass-1 p-4 space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-sm font-bold text-text-primary">Fields</h2>
          <p className="text-xs text-text-muted mt-0.5">Drag to reorder. {draftFields.length} field{draftFields.length === 1 ? "" : "s"}.</p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {FIELD_TYPES.map((t) => (
          <button key={t.value} onClick={() => addField(t.value)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-bold text-text-primary border-thin border-border-subtle bg-glass-2 hover:bg-glass-1 hover:border-border-glow transition-all" title={"Add " + t.label + " field"}>
            <span className="text-text-muted">{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {draftFields.length === 0 ? (
        <div className="text-text-muted text-sm text-center py-8 border-thin border-dashed border-border-subtle rounded-card">No fields yet - click a field type above to add one.</div>
      ) : (
        <div className="space-y-2">
          {draftFields.map((f, idx) => {
            const isDragging = draggingIdx === idx;
            const isOver = dragOverIdx === idx && draggingIdx !== idx;
            return (
              <div
                key={f.clientId}
                draggable
                onDragStart={(e) => props.onDragStart(e, idx)}
                onDragOver={(e) => props.onDragOver(e, idx)}
                onDragLeave={props.onDragLeave}
                onDrop={(e) => props.onDrop(e, idx)}
                onDragEnd={props.onDragEnd}
                className={"rounded-card border-thin bg-glass-2 transition-all " + (isDragging ? "opacity-40 border-border-glow" : isOver ? "border-brand bg-brand-soft" : "border-border-subtle")}
              >
                <div className="flex items-stretch">
                  <div className="flex flex-col items-center justify-center px-2 cursor-grab active:cursor-grabbing text-text-muted hover:text-text-primary border-r border-border-subtle">
                    <GripVertical className="w-4 h-4" />
                    <span className="text-[10px] font-bold mt-1">{idx + 1}</span>
                  </div>
                  <div className="flex-1 p-3 space-y-2">
                    <div className="grid grid-cols-1 md:grid-cols-[1fr_140px_120px_auto] gap-2">
                      <input className={inputCls} value={f.label} onChange={(e) => patchField(idx, { label: e.target.value })} placeholder="Field label (e.g. Full name)" />
                      <input className={inputCls + " font-mono text-xs"} value={f.fieldKey ?? ""} onChange={(e) => patchField(idx, { fieldKey: e.target.value })} placeholder="field_key" title="Storage key - auto-filled from label if left blank" />
                      <select className={inputCls} value={f.fieldType ?? "Text"} onChange={(e) => patchField(idx, { fieldType: e.target.value as WebFormFieldType })}>
                        {FIELD_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                      <label className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-bg-input border-thin border-border-subtle cursor-pointer text-xs whitespace-nowrap">
                        <input type="checkbox" checked={!!f.isRequired} onChange={(e) => patchField(idx, { isRequired: e.target.checked })} />Required
                      </label>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-[1fr_200px] gap-2">
                      <input className={inputCls} value={f.placeholder ?? ""} onChange={(e) => patchField(idx, { placeholder: e.target.value })} placeholder="Placeholder text (optional)" />
                      <select className={inputCls} value={f.mapsToContactField ?? ""} onChange={(e) => patchField(idx, { mapsToContactField: e.target.value })} title="Map this field to a contact property">
                        {CONTACT_FIELD_OPTIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="flex flex-col items-center justify-center px-2 gap-1 border-l border-border-subtle">
                    <button onClick={() => duplicateField(idx)} className="p-1.5 text-text-muted hover:text-text-primary" title="Duplicate"><Copy className="w-3.5 h-3.5" /></button>
                    <button onClick={() => removeField(idx)} className="p-1.5 text-text-muted hover:text-danger" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SettingsTab({ draft, patch }: { draft: CreateWebFormRequest; patch: (p: Partial<CreateWebFormRequest>) => void }) {
  return (
    <div className="rounded-card border-thin border-border-subtle bg-glass-1 p-4 space-y-4">
      <h2 className="text-sm font-bold text-text-primary">Form settings</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label="Form name *">
          <input className={inputCls} value={draft.name} onChange={(e) => patch({ name: e.target.value })} placeholder="Contact form" />
        </Field>
        <Field label="Mode">
          <select className={inputCls} value={draft.mode ?? "Classic"} onChange={(e) => patch({ mode: e.target.value as WebFormMode })}>
            <option value="Classic">Classic (all on one page)</option>
            <option value="Conversational">Conversational (one field at a time)</option>
          </select>
        </Field>
      </div>
      <Field label="Description (optional)">
        <textarea className={inputCls + " min-h-[60px]"} value={draft.description ?? ""} onChange={(e) => patch({ description: e.target.value })} placeholder="Tell visitors what this form is for." />
      </Field>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label="Success message">
          <input className={inputCls} value={draft.successMessage ?? ""} onChange={(e) => patch({ successMessage: e.target.value })} placeholder="Thanks - we will be in touch." />
        </Field>
        <Field label="Redirect URL (optional)">
          <input className={inputCls} value={draft.redirectUrl ?? ""} onChange={(e) => patch({ redirectUrl: e.target.value })} placeholder="https://example.com/thank-you" />
        </Field>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label="Hosted URL slug" hint="Public URL: /f/s/{slug}">
          <input className={inputCls + " font-mono text-xs"} value={draft.hostedSlug ?? ""} onChange={(e) => patch({ hostedSlug: e.target.value })} placeholder="contact-us" />
        </Field>
        <Field label="Notification emails (comma-separated)">
          <input className={inputCls} value={draft.notificationEmails ?? ""} onChange={(e) => patch({ notificationEmails: e.target.value })} placeholder="sales@example.com" />
        </Field>
      </div>
    </div>
  );
}

function BrandingTab({
  draft, patch, designConfig, patchDesign,
}: {
  draft: CreateWebFormRequest;
  patch: (p: Partial<CreateWebFormRequest>) => void;
  designConfig: WebFormDesignConfig;
  patchDesign: (p: Partial<WebFormDesignConfig>) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="rounded-card border-thin border-border-subtle bg-glass-1 p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-text-primary">Hosted page</h2>
          <span className="text-[10px] uppercase tracking-wide text-text-muted">No-code share link</span>
        </div>
        <p className="text-xs text-text-muted">These settings only affect the public hosted page (<code className="font-mono">/f/s/&lt;slug&gt;</code>). The embed snippet and inline form are unaffected.</p>

        <Field label="Page theme">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {WEB_FORM_PAGE_THEMES.map((t) => {
              const active = (draft.pageTheme ?? "Minimal") === t.value;
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => patch({ pageTheme: t.value })}
                  className={
                    "flex flex-col items-start gap-1 p-2.5 rounded-xl border text-left transition-all " +
                    (active
                      ? "border-border-glow bg-glass-2 ring-1 ring-border-glow"
                      : "border-border-subtle bg-bg-input hover:bg-glass-1")
                  }
                  title={t.description}
                >
                  <PageThemeMini theme={t.value} primary={draft.primaryColor || "#0A4D8C"} />
                  <div className="text-[11px] font-bold text-text-primary mt-1">{t.label}</div>
                </button>
              );
            })}
          </div>
        </Field>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Page title" hint="Browser tab + hero title. Defaults to form name.">
            <input className={inputCls} value={draft.pageTitle ?? ""} onChange={(e) => patch({ pageTitle: e.target.value })} placeholder="Plan Your Journey With Voyager" />
          </Field>
          <Field label="Page tagline" hint="Subtitle under the title.">
            <input className={inputCls} value={draft.pageTagline ?? ""} onChange={(e) => patch({ pageTagline: e.target.value })} placeholder="A few details and we will get back to you." />
          </Field>
        </div>

        <Field label="Hero image URL" hint="Shown on HeroBanner and FullBleed themes. Recommended 1600x500.">
          <input className={inputCls} value={draft.heroImageUrl ?? ""} onChange={(e) => patch({ heroImageUrl: e.target.value })} placeholder="https://images.example.com/voyager-hero.jpg" />
        </Field>

        <Field label="Background gradient (CSS)" hint="Used by Gradient + FullBleed. Leave blank for the theme default.">
          <input className={inputCls + " font-mono text-xs"} value={draft.pageBackgroundGradient ?? ""} onChange={(e) => patch({ pageBackgroundGradient: e.target.value })} placeholder="linear-gradient(135deg,#0A4D8C 0%,#0a0e27 100%)" />
        </Field>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Company name" hint="Shown in Sidebar theme.">
            <input className={inputCls} value={draft.companyName ?? ""} onChange={(e) => patch({ companyName: e.target.value })} placeholder="Voyager Nepal" />
          </Field>
          <Field label="Company contact info" hint="Sidebar subtitle - address, phone, etc.">
            <input className={inputCls} value={draft.companyContactInfo ?? ""} onChange={(e) => patch({ companyContactInfo: e.target.value })} placeholder="Kathmandu, Nepal  -  +977-1-555-0000" />
          </Field>
        </div>

        <div className="border-t border-border-subtle pt-3 space-y-2">
          <h3 className="text-xs font-bold text-text-primary uppercase tracking-wide">Footer</h3>
          <Field label="Footer text">
            <input className={inputCls} value={draft.footerText ?? ""} onChange={(e) => patch({ footerText: e.target.value })} placeholder="2025 Voyager Nepal. All rights reserved." />
          </Field>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Footer link label">
              <input className={inputCls} value={draft.footerLinkLabel ?? ""} onChange={(e) => patch({ footerLinkLabel: e.target.value })} placeholder="Privacy policy" />
            </Field>
            <Field label="Footer link URL">
              <input className={inputCls} value={draft.footerLinkUrl ?? ""} onChange={(e) => patch({ footerLinkUrl: e.target.value })} placeholder="https://example.com/privacy" />
            </Field>
          </div>
          <label className="flex items-center gap-2 p-3 rounded-xl bg-bg-input border-thin border-border-subtle cursor-pointer">
            <input type="checkbox" checked={!!draft.showPoweredBy} onChange={(e) => patch({ showPoweredBy: e.target.checked })} />
            <div>
              <div className="text-sm text-text-primary">Show &quot;Powered by Lead360&quot;</div>
              <div className="text-[10px] text-text-muted">Off if you want a fully white-labeled page.</div>
            </div>
          </label>
        </div>
      </div>
      <div className="rounded-card border-thin border-border-subtle bg-glass-1 p-4 space-y-3">
        <h2 className="text-sm font-bold text-text-primary">Colors & typography</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Field label="Logo URL">
            <input className={inputCls} value={draft.logoUrl ?? ""} onChange={(e) => patch({ logoUrl: e.target.value })} placeholder="https://..." />
          </Field>
          <Field label="Primary color">
            <div className="flex gap-2">
              <input type="color" className="h-10 w-12 rounded-xl bg-bg-input border-thin border-border-subtle cursor-pointer" value={draft.primaryColor || "#0A4D8C"} onChange={(e) => patch({ primaryColor: e.target.value })} />
              <input className={inputCls + " font-mono text-xs"} value={draft.primaryColor ?? ""} onChange={(e) => patch({ primaryColor: e.target.value })} placeholder="#0A4D8C" />
            </div>
          </Field>
          <Field label="Background color">
            <div className="flex gap-2">
              <input type="color" className="h-10 w-12 rounded-xl bg-bg-input border-thin border-border-subtle cursor-pointer" value={draft.backgroundColor || "#FFFFFF"} onChange={(e) => patch({ backgroundColor: e.target.value })} />
              <input className={inputCls + " font-mono text-xs"} value={draft.backgroundColor ?? ""} onChange={(e) => patch({ backgroundColor: e.target.value })} placeholder="#FFFFFF" />
            </div>
          </Field>
        </div>
        <Field label="Font family">
          <input className={inputCls} value={draft.fontFamily ?? ""} onChange={(e) => patch({ fontFamily: e.target.value })} placeholder="Inter, system-ui, sans-serif" />
        </Field>
      </div>

      <div className="rounded-card border-thin border-border-subtle bg-glass-1 p-4 space-y-3">
        <h2 className="text-sm font-bold text-text-primary">Conversational mode copy</h2>
        <p className="text-xs text-text-muted">Shown when mode = Conversational.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Welcome title">
            <input className={inputCls} value={designConfig.conversationalTitle ?? ""} onChange={(e) => patchDesign({ conversationalTitle: e.target.value })} placeholder="Plan Your Journey With Voyager" />
          </Field>
          <Field label="Welcome subtitle">
            <input className={inputCls} value={designConfig.conversationalSubtitle ?? ""} onChange={(e) => patchDesign({ conversationalSubtitle: e.target.value })} placeholder="A few quick details and we will get back to you." />
          </Field>
        </div>
      </div>

      <div className="rounded-card border-thin border-border-subtle bg-glass-1 p-4 space-y-3">
        <h2 className="text-sm font-bold text-text-primary">Consent checkbox</h2>
        <label className="flex items-center gap-2 p-3 rounded-xl bg-bg-input border-thin border-border-subtle cursor-pointer">
          <input type="checkbox" checked={!!designConfig.consentEnabled} onChange={(e) => patchDesign({ consentEnabled: e.target.checked })} />
          <span className="text-sm text-text-primary">Require consent before submit</span>
        </label>
        <Field label="Consent label">
          <input className={inputCls} value={designConfig.consentLabel ?? ""} onChange={(e) => patchDesign({ consentLabel: e.target.value })} placeholder="I agree to be contacted about my inquiry." />
        </Field>
      </div>
    </div>
  );
}

function BehaviorTab({ draft, patch }: { draft: CreateWebFormRequest; patch: (p: Partial<CreateWebFormRequest>) => void }) {
  return (
    <div className="rounded-card border-thin border-border-subtle bg-glass-1 p-4 space-y-3">
      <h2 className="text-sm font-bold text-text-primary">On submit</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <ToggleCard label="Create Contact" description="New submissions create a Contact record." checked={!!draft.createContactOnSubmit} onChange={(v) => patch({ createContactOnSubmit: v })} />
        <ToggleCard label="Create Lead" description="Track submission as a sales Lead." checked={!!draft.createLeadOnSubmit} onChange={(v) => patch({ createLeadOnSubmit: v })} />
        <ToggleCard label="Send email notification" description="Email the addresses in Settings - Notification emails." checked={!!draft.sendEmailNotification} onChange={(v) => patch({ sendEmailNotification: v })} />
        <ToggleCard label="Pre-fill from visitor identity" description="Auto-fill name/email when visitor already chatted." checked={!!draft.preFillEnabled} onChange={(v) => patch({ preFillEnabled: v })} />
      </div>
    </div>
  );
}

function ToggleCard({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-start gap-3 p-3 rounded-xl bg-bg-input border-thin border-border-subtle cursor-pointer">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5" />
      <div className="flex-1">
        <div className="text-sm font-bold text-text-primary">{label}</div>
        <div className="text-xs text-text-muted mt-0.5">{description}</div>
      </div>
    </label>
  );
}

function PageThemeMini({ theme, primary }: { theme: WebFormPageTheme; primary: string }) {
  const base = "w-full h-12 rounded-md border border-black/10 overflow-hidden flex";
  if (theme === "Minimal") {
    return <div className={base} style={{ background: "#fff", alignItems: "center", justifyContent: "center" }}><div style={{ width: "55%", height: "70%", background: "#f4f6fa", borderRadius: "3px", border: "1px solid rgba(0,0,0,0.08)" }} /></div>;
  }
  if (theme === "HeroBanner") {
    return <div className={base + " flex-col"}><div style={{ height: "55%", background: primary }} /><div style={{ flex: 1, background: "#fff", alignItems: "center", justifyContent: "center", display: "flex" }}><div style={{ width: "55%", height: "60%", background: "#f4f6fa", borderRadius: "3px", border: "1px solid rgba(0,0,0,0.08)" }} /></div></div>;
  }
  if (theme === "Sidebar") {
    return <div className={base}><div style={{ width: "40%", background: primary }} /><div style={{ flex: 1, background: "#fff", alignItems: "center", justifyContent: "center", display: "flex" }}><div style={{ width: "60%", height: "70%", background: "#f4f6fa", borderRadius: "3px", border: "1px solid rgba(0,0,0,0.08)" }} /></div></div>;
  }
  if (theme === "Gradient") {
    return <div className={base + " flex-col"} style={{ background: "linear-gradient(135deg," + primary + " 0%,#0a0e27 100%)", alignItems: "center", justifyContent: "center" }}><div style={{ width: "65%", height: "75%", background: "rgba(255,255,255,0.85)", borderRadius: "4px", boxShadow: "0 4px 14px rgba(0,0,0,0.25)" }} /></div>;
  }
  // FullBleed
  return <div className={base + " flex-col"} style={{ background: primary, alignItems: "stretch", justifyContent: "center" }}><div style={{ height: "30%", background: "rgba(255,255,255,0.25)" }} /><div style={{ flex: 1, background: "#fff", alignItems: "center", justifyContent: "center", display: "flex" }}><div style={{ width: "60%", height: "60%", background: "#f4f6fa", borderRadius: "3px", border: "1px solid rgba(0,0,0,0.08)" }} /></div></div>;
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[11px] uppercase tracking-wide text-text-muted mb-1">{label}</span>
      {children}
      {hint && <span className="block text-[11px] text-text-muted mt-1">{hint}</span>}
    </label>
  );
}

function FormPreview({ draft, draftFields, mode }: { draft: CreateWebFormRequest; draftFields: DraftField[]; mode: "desktop" | "mobile" }) {
  const useCustomBranding = !!draft.primaryColor || !!draft.backgroundColor || !!draft.logoUrl || !!draft.fontFamily;
  const primary = draft.primaryColor || "#00D98A";
  const bg = draft.backgroundColor || "#FFFFFF";
  const font = draft.fontFamily || "Inter, system-ui, sans-serif";
  const onBgIsDark = isDarkColor(bg);
  const innerInputBg = onBgIsDark
    ? "bg-white/10 border-white/20 text-white placeholder:text-white/40"
    : "bg-white border-gray-300 text-gray-900 placeholder:text-gray-400";
  const innerMutedCls = onBgIsDark ? "text-white/60" : "text-gray-500";
  const widthClass = mode === "mobile" ? "max-w-[380px] mx-auto" : "w-full";

  const validFields = draftFields.filter((f) => f.label.trim());

  return (
    <div className="rounded-card overflow-hidden">
      {useCustomBranding ? (
        <div className="flex justify-center">
          <div className={widthClass + " rounded-card overflow-hidden border border-black/10 shadow-sm transition-all"} style={{ background: bg, fontFamily: font }}>
            <div className="p-4 border-b border-black/10">
              {draft.logoUrl && /^https?:\/\//.test(draft.logoUrl) ? (
                <img src={draft.logoUrl} alt="" className="h-7 mb-2 object-contain" />
              ) : null}
              <h3 className={"text-base font-bold " + (onBgIsDark ? "text-white" : "text-gray-900")}>{draft.name || "Untitled form"}</h3>
              {draft.description && <p className={"text-xs mt-0.5 " + innerMutedCls}>{draft.description}</p>}
            </div>
            <div className="p-4 space-y-3">
              {validFields.length === 0 ? (
                <div className={"text-xs text-center py-6 border border-dashed border-black/15 rounded-card " + innerMutedCls}>Add fields to see them here.</div>
              ) : (
                validFields.map((f) => (
                  <PreviewField key={f.clientId} field={f} primary={primary} inputBgCls={innerInputBg} mutedCls={innerMutedCls} />
                ))
              )}
              {validFields.length > 0 && (
                <button type="button" disabled className="w-full py-2.5 rounded-xl text-xs font-bold text-white opacity-90 cursor-not-allowed" style={{ background: primary }}>
                  Submit
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex justify-center">
          <div className={widthClass + " rounded-card overflow-hidden border-thin border-border-subtle bg-bg-card transition-all"} style={{ fontFamily: font }}>
            <div className="p-4 border-b border-border-subtle">
              {draft.logoUrl && /^https?:\/\//.test(draft.logoUrl) ? (
                <img src={draft.logoUrl} alt="" className="h-7 mb-2 object-contain" />
              ) : null}
              <h3 className={"text-base font-bold " + (draft.name ? "text-text-primary" : "text-text-muted")}>{draft.name || "Untitled form"}</h3>
              {draft.description && <p className="text-xs text-text-muted mt-0.5">{draft.description}</p>}
            </div>
            <div className="p-4 space-y-3">
              {validFields.length === 0 ? (
                <div className="text-xs text-text-muted text-center py-6 border-thin border-dashed border-border-subtle rounded-card">Add fields to see them here.</div>
              ) : (
                validFields.map((f) => (
                  <PreviewField key={f.clientId} field={f} primary="#00D98A" inputBgCls="bg-bg-input border-border-subtle text-text-primary placeholder:text-text-muted" mutedCls="text-text-muted" />
                ))
              )}
              {validFields.length > 0 && (
                <button type="button" disabled className="w-full py-2.5 rounded-xl text-xs font-bold text-bg opacity-90 cursor-not-allowed" style={{ background: "#00D98A" }}>
                  Submit
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      <p className="text-[10px] text-text-muted text-center pt-3">Preview only - submissions are not sent from this view.</p>
    </div>
  );
}


function DeviceFramePreview({
  formId, hostedSlug, draft, draftFields, mode, bust,
}: {
  formId?: string;
  hostedSlug?: string | null;
  draft: CreateWebFormRequest;
  draftFields: DraftField[];
  mode: "desktop" | "mobile";
  bust: number;
}) {
  // Visible pane size. The right column in the builder grid is 440px with p-3
  // (24px total) so the inner content is ~400px wide. We cap the height too so
  // the page itself doesn't grow vertically with the iframe.
  const PANE_W = 400;
  const PANE_H = 560;

  // Once the form has been saved at least once, point the iframe at the real
  // hosted URL (the BE endpoint that renders the page theme). While editing a
  // brand-new form we fall back to the offline FormPreview so the panel isn't
  // empty/white.
  const url = formId ? buildHostedUrl(formId, hostedSlug) : null;
  // bust lets Save trigger an iframe reload without changing the visible URL.
  const cacheKey = url ? `${formId}:${bust}:${mode}` : "offline";

  if (!url) {
    return <FormPreview draft={draft} draftFields={draftFields} mode={mode} />;
  }

  if (mode === "mobile") {
    const PHONE_W = 390;
    const PHONE_H = 844;
    const scale = Math.min(PANE_W / PHONE_W, PANE_H / PHONE_H);
    const w = Math.round(PHONE_W * scale);
    const h = Math.round(PHONE_H * scale);
    return (
      <div className="flex justify-center items-start">
        <div
          className="rounded-[28px] border-thin border-border-subtle bg-bg-card shadow-sm p-1.5"
          style={{ width: w + 12, height: h + 12 }}
        >
          <div
            className="rounded-[20px] overflow-hidden bg-bg-card relative"
            style={{ width: w, height: h }}
          >
            <iframe
              key={cacheKey}
              src={url}
              title="Live preview (mobile)"
              className="absolute top-0 left-0"
              style={{
                width: PHONE_W,
                height: PHONE_H,
                border: 0,
                transform: `scale(${scale})`,
                transformOrigin: "top left",
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  // Desktop: render the iframe at a fixed 1280 width and scale it down to fit
  // the pane. The iframe height is grown to whatever the hosted page actually
  // reports via its documentElement.scrollHeight so nothing gets clipped.
  const DESKTOP_W = 1280;
  const [liveH, setLiveH] = useState<number>(DESKTOP_W * 0.6);
  const effectiveH = Math.max(420, liveH);
  const scale = Math.min(PANE_W / DESKTOP_W, PANE_H / effectiveH);
  const scaledW = Math.round(DESKTOP_W * scale);
  const scaledH = Math.round(effectiveH * scale);
  const chromeH = 28;

  return (
    <div className="flex justify-center">
      <div
        className="rounded-card overflow-hidden border-thin border-border-subtle bg-bg-card shadow-sm"
        style={{ width: scaledW, height: scaledH + chromeH }}
      >
        {/* Browser chrome */}
        <div className="h-7 flex items-center gap-1.5 px-3 border-b border-black/10 bg-gray-50">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
          <span className="ml-2 text-[10px] text-gray-500 truncate flex-1">{url.replace(/^https?:\/\//, "")}</span>
        </div>
        {/* Scaled viewport - container clips, only the iframe is scrollable */}
        <div className="overflow-hidden" style={{ width: scaledW, height: scaledH }}>
          <iframe
            key={cacheKey}
            src={url}
            title="Live preview (desktop)"
            onLoad={(e) => {
              try {
                const doc = (e.target as HTMLIFrameElement).contentDocument;
                if (doc) {
                  const h = Math.max(
                    doc.documentElement.scrollHeight,
                    doc.body?.scrollHeight ?? 0,
                  );
                  if (h > 0 && Math.abs(h - liveH) > 4) setLiveH(h);
                }
              } catch { /* cross-origin: ignore */ }
            }}
            style={{
              width: DESKTOP_W,
              height: effectiveH,
              border: 0,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
            }}
          />
        </div>
      </div>
    </div>
  );
}
function PreviewField({ field, primary, inputBgCls = "bg-bg-input border-border-subtle text-text-primary placeholder:text-text-muted", mutedCls = "text-text-muted" }: { field: DraftField; primary: string; inputBgCls?: string; mutedCls?: string }) {
  const baseInputCls = "w-full px-3 py-2 rounded-xl border text-sm focus:outline-none " + inputBgCls;

  const labelEl = (
    <span className="block text-xs font-medium mb-1">
      <span className={inputBgCls.includes("bg-bg-input") ? "text-text-primary" : inputBgCls.includes("text-white") ? "text-white" : "text-gray-900"}>{field.label}</span>
      {field.isRequired && <span className="ml-0.5" style={{ color: primary }}>*</span>}
    </span>
  );

  let inputEl = null;
  switch (field.fieldType) {
    case "Textarea":
      inputEl = <textarea disabled className={baseInputCls + " min-h-[64px]"} placeholder={field.placeholder ?? ""} />;
      break;
    case "Select":
      inputEl = (<select disabled className={baseInputCls}><option>-- select --</option></select>);
      break;
    case "Checkbox":
      inputEl = (
        <label className={"flex items-center gap-2 text-sm " + (inputBgCls.includes("bg-bg-input") ? "text-text-primary" : inputBgCls.includes("text-white") ? "text-white" : "text-gray-900")}>
          <input type="checkbox" disabled />
          {field.placeholder || "Yes"}
        </label>
      );
      break;
    case "File":
      inputEl = <div className={"w-full px-3 py-2 rounded-xl border border-dashed text-xs text-center " + (inputBgCls.includes("bg-bg-input") ? "bg-bg-input border-border-subtle " + mutedCls : "border-black/15 " + mutedCls)}>Click to upload</div>;
      break;
    case "Hidden":
      return null;
    default:
      inputEl = <input disabled type={inputTypeFor(field.fieldType)} className={baseInputCls} placeholder={field.placeholder ?? ""} />;
  }

  return (
    <div>
      {labelEl}
      {inputEl}
    </div>
  );
}

function isDarkColor(hex: string): boolean {
  const h = hex.replace("#", "");
  if (h.length !== 6) return false;
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.5;
}
function inputTypeFor(t: WebFormFieldType | undefined): string {
  switch (t) {
    case "Email": return "email";
    case "Phone": return "tel";
    case "Url": return "url";
    case "Number": return "number";
    case "Date": return "date";
    default: return "text";
  }
}
