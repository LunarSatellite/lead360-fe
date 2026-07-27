import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { SlidersHorizontal, Plus, Trash2, Loader2, X, ChevronDown } from 'lucide-react';
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

const ENTITY_TABS = [
  { type: CrmEntityType.Contact, label: 'Contacts' },
  { type: CrmEntityType.Lead,    label: 'Leads' },
  { type: CrmEntityType.Deal,    label: 'Deals' },
  { type: CrmEntityType.Case,    label: 'Cases' },
];

// ── Add Field Drawer ──────────────────────────────────────────────────────────

function AddFieldDrawer({ entityType, onDone }: { entityType: CrmEntityType; onDone: () => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [fieldType, setFieldType] = useState<CustomFieldType>(CustomFieldType.Text);
  const [options, setOptions] = useState('');
  const [isRequired, setIsRequired] = useState(false);
  const [typeOpen, setTypeOpen] = useState(false);
  const typeDropRef = useRef<HTMLDivElement>(null);
  const create = useCreateCustomFieldDefinition();

  // Close type dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (typeDropRef.current && !typeDropRef.current.contains(e.target as Node)) {
        setTypeOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

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
    <div className="flex flex-col">
      {/* Header */}
      <div className="px-6 pt-4 pb-3 border-b border-border-subtle">
        <div className="flex items-start justify-between">
          <div>
            <h2
              className="text-base font-extrabold leading-tight"
              style={{
                background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--primary) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >New Field</h2>
            <p className="text-xs text-text-muted mt-0.5">Add a custom field to {CRM_ENTITY_TYPE_LABELS[entityType as keyof typeof CRM_ENTITY_TYPE_LABELS]}</p>
          </div>
          <button onClick={onDone} className="text-text-muted hover:text-text-primary mt-0.5">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Scrollable Body */}
      <div className="overflow-y-auto px-6 py-5 space-y-4">
        {/* Field Name + Type */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="grid grid-cols-[auto_1fr] items-center gap-2 mb-1.5">
              <span className="text-[10px] font-bold text-brand uppercase tracking-widest">Name</span>
              <div className="h-px bg-brand/20" />
            </div>
            <div className="relative">
              <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" strokeWidth={1.6} />
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Case Reference"
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)] transition-colors"
                style={{ backgroundColor: '#1A2F27', backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)' }}
              />
            </div>
          </div>
          <div>
            <div className="grid grid-cols-[auto_1fr] items-center gap-2 mb-1.5">
              <span className="text-[10px] font-bold text-brand uppercase tracking-widest">Type</span>
              <div className="h-px bg-brand/20" />
            </div>
            {/* Custom dropdown */}
            <div className="relative" ref={typeDropRef}>
              <button
                type="button"
                onClick={() => setTypeOpen(o => !o)}
                className="w-full flex items-center gap-2 pl-3 pr-3 py-2 rounded-xl text-sm text-text-primary"
                style={{
                  backgroundColor: '#1A2F27',
                  backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)',
                  border: `1px solid ${typeOpen ? 'rgba(0,217,138,0.50)' : 'rgba(0,217,138,0.20)'}`,
                  boxShadow: typeOpen ? '0 0 0 1px rgba(0,217,138,0.50), 0 0 10px rgba(0,217,138,0.20), 0 0 20px rgba(0,217,138,0.08)' : 'none',
                  outline: 'none',
                  transition: 'box-shadow 0.2s ease',
                }}
              >
                <span className="flex-1 text-left font-medium text-text-secondary">
                  {CUSTOM_FIELD_TYPE_LABELS[fieldType]}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-text-muted transition-transform duration-200 ${typeOpen ? 'rotate-180' : ''}`} strokeWidth={1.6} />
              </button>
              {typeOpen && (
                <div
                  className="absolute top-full left-0 right-0 mt-1.5 z-20 overflow-hidden max-h-[240px] overflow-y-auto"
                  style={{
                    borderRadius: 12,
                    background: 'var(--bg-card)',
                    border: '1px solid rgba(0,217,138,0.20)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 12px rgba(0,217,138,0.08)',
                  }}
                >
                  {Object.entries(CUSTOM_FIELD_TYPE_LABELS).map(([k, v]) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => { setFieldType(Number(k) as CustomFieldType); setTypeOpen(false); }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium transition-colors hover:bg-glass-1 ${
                        fieldType === Number(k) ? 'bg-[rgba(0,217,138,0.08)] text-brand' : 'text-text-secondary'
                      }`}
                    >
                      {fieldType === Number(k) && (
                        <span className="w-2 h-2 rounded-full bg-brand shrink-0" style={{ boxShadow: '0 0 6px rgba(0,217,138,0.9)' }} />
                      )}
                      {v}
                      {fieldType === Number(k) && <span className="ml-auto text-[10px] font-bold text-text-muted">selected</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <div className="grid grid-cols-[auto_1fr] items-center gap-2 mb-1.5">
            <span className="text-[10px] font-bold text-brand uppercase tracking-widest">Description</span>
            <div className="h-px bg-brand/20" />
          </div>
          <input
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Optional hint for users"
            className="w-full px-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)] transition-colors"
            style={{ backgroundColor: '#1A2F27', backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)' }}
          />
        </div>

        {/* Dropdown Options */}
        {fieldType === CustomFieldType.Dropdown && (
          <div>
            <div className="grid grid-cols-[auto_1fr] items-center gap-2 mb-1.5">
              <span className="text-[10px] font-bold text-brand uppercase tracking-widest">Options <span className="opacity-60 normal-case font-normal tracking-normal ml-1">(comma-separated)</span></span>
              <div className="h-px bg-brand/20" />
            </div>
            <input
              value={options}
              onChange={e => setOptions(e.target.value)}
              placeholder="Option A, Option B, Option C"
              className="w-full px-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)] transition-colors"
              style={{ backgroundColor: '#1A2F27', backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)' }}
            />
          </div>
        )}

        {/* Required Toggle */}
        <div>
          <div className="grid grid-cols-[auto_1fr] items-center gap-2 mb-1.5">
            <span className="text-[10px] font-bold text-brand uppercase tracking-widest">Settings</span>
            <div className="h-px bg-brand/20" />
          </div>
          <label className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[rgba(0,217,138,0.20)] cursor-pointer hover:border-[rgba(0,217,138,0.40)] transition-colors"
            style={{ backgroundColor: '#1A2F27', backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)' }}
          >
            <div className="relative">
              <input
                type="checkbox"
                checked={isRequired}
                onChange={e => setIsRequired(e.target.checked)}
                className="sr-only"
              />
              <div className={`w-9 h-5 rounded-full transition-colors ${isRequired ? 'bg-brand' : 'bg-glass-2'}`}>
                <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform mt-0.5 ${isRequired ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </div>
            </div>
            <span className="text-sm text-text-secondary">Required field</span>
          </label>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border-subtle">
        <button
          onClick={onDone}
          className="px-4 py-2 rounded-xl text-xs font-semibold text-text-secondary border border-border-subtle hover:border-border-medium hover:text-text-primary transition-all"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={!name.trim() || create.isPending}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-bg bg-brand hover:bg-brand-light disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {create.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
          Add Field
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
  const [activeEntity, setActiveEntity] = useState<CrmEntityType>(CrmEntityType.Contact);
  const [showAdd, setShowAdd] = useState(false);

  const { data: fields, isLoading } = useCustomFieldDefinitions(activeEntity);
  const fieldList = ((fields as any)?.data ?? []) as CustomFieldDefinitionDto[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <SlidersHorizontal className="w-5 h-5 text-brand" strokeWidth={1.5} />
          <div>
            <h1 className="text-xl font-extrabold text-text-primary">Custom Fields</h1>
            <p className="text-sm text-text-muted mt-0.5">Add per-tenant fields to any CRM entity</p>
          </div>
        </div>
        <button
          onClick={() => setShowAdd(true)}
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

      {/* Add Field Drawer */}
      {showAdd && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-end pr-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowAdd(false)} />
          <div
            className="drawer-slide-in relative w-[540px] flex flex-col"
            style={{
              borderRadius: 18,
              background: 'var(--bg-card)',
              border: '1px solid rgba(0,217,138,0.2)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.7), 0 0 24px rgba(0,217,138,0.25), inset 0 1px 0 rgba(0,255,163,0.05)',
            }}
          >
            {/* Accent bar */}
            <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, #00D98A 35%, #00FFA3 65%, transparent)', flexShrink: 0 }} />
            <AddFieldDrawer entityType={activeEntity} onDone={() => setShowAdd(false)} />
          </div>
        </div>,
        document.body,
      )}

      {isLoading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-text-muted" /></div>
      ) : fieldList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-text-muted">
          <SlidersHorizontal className="w-8 h-8 opacity-30" strokeWidth={1.2} />
          <p className="text-sm">No custom fields for {CRM_ENTITY_TYPE_LABELS[activeEntity as keyof typeof CRM_ENTITY_TYPE_LABELS]} yet.</p>
          <button onClick={() => setShowAdd(true)} className="text-xs text-brand hover:underline">Add the first field</button>
        </div>
      ) : (
        <div className="space-y-2">
          {fieldList.map(f => (
            <FieldRow key={f.id} field={f} entityType={activeEntity} />
          ))}
        </div>
      )}
    </div>
  );
}
