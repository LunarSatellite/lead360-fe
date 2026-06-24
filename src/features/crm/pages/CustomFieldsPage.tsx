import { useState } from 'react';
import { SlidersHorizontal, Plus, Trash2, Loader2, PencilLine, Check, X } from 'lucide-react';
import {
  useCustomFieldDefinitions,
  useCreateCustomFieldDefinition,
  useUpdateCustomFieldDefinition,
  useDeleteCustomFieldDefinition,
} from '../api/crm.queries';
import type { CustomFieldDefinitionDto, CreateCustomFieldDefinitionRequest } from '../types/crm.types';
import {
  CrmEntityType, CRM_ENTITY_TYPE_LABELS,
  CustomFieldType, CUSTOM_FIELD_TYPE_LABELS,
} from '../types/crm.types';

const inputCls = 'w-full px-3 py-2 rounded-xl bg-bg-elevated border border-border-subtle text-sm text-text-primary focus:outline-none focus:border-border-medium';

const ENTITY_TABS = [
  { type: CrmEntityType.Contact, label: 'Contacts' },
  { type: CrmEntityType.Lead,    label: 'Leads' },
  { type: CrmEntityType.Deal,    label: 'Deals' },
  { type: CrmEntityType.Case,    label: 'Cases' },
];

// ── Add Field Form ────────────────────────────────────────────────────────────

function AddFieldForm({ entityType, onDone }: { entityType: number; onDone: () => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [fieldType, setFieldType] = useState<CustomFieldType>(CustomFieldType.Text);
  const [options, setOptions] = useState('');
  const [isRequired, setIsRequired] = useState(false);
  const create = useCreateCustomFieldDefinition();

  const handleSubmit = () => {
    if (!name.trim()) return;
    const payload: CreateCustomFieldDefinitionRequest = {
      name: name.trim(),
      description: description.trim() || undefined,
      entityType,
      fieldType,
      isRequired,
      options: fieldType === CustomFieldType.Dropdown
        ? options.split(',').map(o => o.trim()).filter(Boolean)
        : undefined,
    };
    create.mutate(payload, { onSuccess: onDone });
  };

  return (
    <div className="rounded-2xl border border-border-glow bg-bg-card p-4 space-y-3">
      <p className="text-xs font-bold text-brand uppercase tracking-wider">New Field</p>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-text-muted mb-1 block">Name *</label>
          <input value={name} onChange={e => setName(e.target.value)} className={inputCls} placeholder="e.g. Case Reference" />
        </div>
        <div>
          <label className="text-xs text-text-muted mb-1 block">Type</label>
          <select value={fieldType} onChange={e => setFieldType(Number(e.target.value) as CustomFieldType)} className={inputCls}>
            {Object.entries(CUSTOM_FIELD_TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="text-xs text-text-muted mb-1 block">Description</label>
        <input value={description} onChange={e => setDescription(e.target.value)} className={inputCls} placeholder="Optional hint for users" />
      </div>

      {fieldType === CustomFieldType.Dropdown && (
        <div>
          <label className="text-xs text-text-muted mb-1 block">Options (comma-separated)</label>
          <input value={options} onChange={e => setOptions(e.target.value)} className={inputCls} placeholder="Option A, Option B, Option C" />
        </div>
      )}

      <div className="flex items-center gap-2">
        <input type="checkbox" id="req" checked={isRequired} onChange={e => setIsRequired(e.target.checked)} className="rounded" />
        <label htmlFor="req" className="text-sm text-text-secondary cursor-pointer">Required field</label>
      </div>

      <div className="flex gap-2 pt-1">
        <button
          onClick={handleSubmit}
          disabled={!name.trim() || create.isPending}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand text-bg text-sm font-bold hover:bg-brand-light transition-all disabled:opacity-50"
        >
          {create.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          Add Field
        </button>
        <button onClick={onDone} className="px-4 py-2 rounded-xl bg-bg-elevated border border-border-subtle text-sm text-text-primary hover:bg-bg-card transition-all">
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Field Row ─────────────────────────────────────────────────────────────────

function FieldRow({ field, entityType }: { field: CustomFieldDefinitionDto; entityType: number }) {
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState(false);
  const deleteField = useDeleteCustomFieldDefinition();
  const updateField = useUpdateCustomFieldDefinition();

  const handleToggleActive = () => {
    setToggling(true);
    updateField.mutate(
      { id: field.id, data: { isActive: !field.isActive, entityType } },
      { onSettled: () => setToggling(false) }
    );
  };

  const handleDelete = () => {
    deleteField.mutate({ id: field.id, entityType });
  };

  return (
    <div className={`flex items-center justify-between p-3 rounded-xl border ${field.isActive ? 'border-border-subtle bg-bg-elevated' : 'border-border-subtle bg-bg-card opacity-60'}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-text-primary">{field.name}</span>
          {field.isRequired && <span className="text-2xs text-danger font-bold">REQUIRED</span>}
          {!field.isActive && <span className="text-2xs text-text-muted font-bold">INACTIVE</span>}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-text-muted">{CUSTOM_FIELD_TYPE_LABELS[field.fieldType]}</span>
          {field.description && <span className="text-xs text-text-muted">· {field.description}</span>}
          {field.options && field.options.length > 0 && (
            <span className="text-xs text-text-muted">· {field.options.join(', ')}</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 ml-3">
        <button
          onClick={handleToggleActive}
          disabled={toggling}
          className="text-xs text-text-muted hover:text-text-primary px-2 py-1 rounded-lg hover:bg-bg-card transition-all"
        >
          {field.isActive ? 'Disable' : 'Enable'}
        </button>
        {!deleting ? (
          <button
            onClick={() => setDeleting(true)}
            className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger-soft transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        ) : (
          <div className="flex items-center gap-1">
            <button onClick={handleDelete} disabled={deleteField.isPending} className="text-xs text-danger font-semibold px-2 py-1 rounded-lg hover:bg-danger-soft transition-all">
              {deleteField.isPending ? '…' : 'Delete'}
            </button>
            <button onClick={() => setDeleting(false)} className="p-1.5 rounded-lg text-text-muted hover:bg-bg-card transition-all">
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function Component() {
  const [activeEntity, setActiveEntity] = useState<number>(CrmEntityType.Contact);
  const [showAdd, setShowAdd] = useState(false);

  const { data: fields, isLoading } = useCustomFieldDefinitions(activeEntity);

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <SlidersHorizontal className="w-5 h-5 text-brand" strokeWidth={1.5} />
          <div>
            <h1 className="text-xl font-extrabold text-text-primary">Custom Fields</h1>
            <p className="text-sm text-text-muted mt-0.5">Add per-tenant fields to any CRM entity</p>
          </div>
        </div>
        <button
          onClick={() => setShowAdd(s => !s)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand text-bg text-sm font-bold hover:bg-brand-light transition-all"
        >
          <Plus className="w-4 h-4" /> Add Field
        </button>
      </div>

      {/* Entity type tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-bg-elevated border border-border-subtle">
        {ENTITY_TABS.map(tab => (
          <button
            key={tab.type}
            onClick={() => { setActiveEntity(tab.type); setShowAdd(false); }}
            className={`flex-1 py-1.5 rounded-lg text-sm font-semibold transition-all ${activeEntity === tab.type ? 'bg-bg-card text-text-primary shadow-sm' : 'text-text-muted hover:text-text-primary'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {showAdd && (
        <AddFieldForm entityType={activeEntity} onDone={() => setShowAdd(false)} />
      )}

      {isLoading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-text-muted" /></div>
      ) : !fields || fields.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-text-muted">
          <SlidersHorizontal className="w-8 h-8 opacity-30" strokeWidth={1.2} />
          <p className="text-sm">No custom fields for {CRM_ENTITY_TYPE_LABELS[activeEntity as keyof typeof CRM_ENTITY_TYPE_LABELS]} yet.</p>
          <button onClick={() => setShowAdd(true)} className="text-xs text-brand hover:underline">Add the first field</button>
        </div>
      ) : (
        <div className="space-y-2">
          {fields.map(f => (
            <FieldRow key={f.id} field={f} entityType={activeEntity} />
          ))}
        </div>
      )}
    </div>
  );
}
