import { useState } from 'react';
import { Loader2, SlidersHorizontal, Save } from 'lucide-react';
import { useCustomFieldValues, useSetCustomFieldValues } from '../api/crm.queries';
import type { CustomFieldValueDto, SetCustomFieldValuesRequest } from '../types/crm.types';
import { CustomFieldType } from '../types/crm.types';

interface Props {
  recordId: string;
  entityType: number;
}

export function CustomFieldsPanel({ recordId, entityType }: Props) {
  const { data: fields, isLoading } = useCustomFieldValues(recordId, entityType);
  const save = useSetCustomFieldValues(entityType);

  const [draft, setDraft] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState(false);

  if (isLoading) return null;
  if (!fields || fields.length === 0) return null;

  const getValue = (f: CustomFieldValueDto) =>
    draft[f.definitionId] !== undefined ? draft[f.definitionId] : (f.value ?? '');

  const handleEdit = () => {
    const init: Record<string, string> = {};
    fields.forEach(f => { init[f.definitionId] = f.value ?? ''; });
    setDraft(init);
    setEditing(true);
  };

  const handleSave = () => {
    const payload: SetCustomFieldValuesRequest = {
      values: Object.entries(draft).map(([definitionId, value]) => ({
        definitionId,
        value: value || undefined,
      })),
    };
    save.mutate({ recordId, data: payload }, {
      onSuccess: () => setEditing(false),
    });
  };

  return (
    <div className="rounded-2xl border border-border-subtle bg-bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-text-muted" strokeWidth={1.5} />
          <span className="text-sm font-bold text-text-primary">Custom Fields</span>
        </div>
        {!editing ? (
          <button
            onClick={handleEdit}
            className="text-xs text-brand hover:text-brand-light transition-colors"
          >
            Edit
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditing(false)}
              className="text-xs text-text-muted hover:text-text-primary transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={save.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand text-bg text-xs font-semibold hover:bg-brand-light transition-all disabled:opacity-50"
            >
              {save.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
              Save
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {fields.map(f => (
          <div key={f.definitionId}>
            <p className="text-xs text-text-muted mb-1">
              {f.name}{f.isRequired && <span className="text-danger ml-0.5">*</span>}
            </p>
            {!editing ? (
              <p className="text-sm text-text-primary">
                {f.value ? renderValue(f) : <span className="text-text-muted italic">—</span>}
              </p>
            ) : (
              <FieldInput
                field={f}
                value={getValue(f)}
                onChange={val => setDraft(d => ({ ...d, [f.definitionId]: val }))}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function renderValue(f: CustomFieldValueDto) {
  if (f.fieldType === CustomFieldType.Boolean)
    return f.value === 'true' ? 'Yes' : 'No';
  if (f.fieldType === CustomFieldType.Date && f.value)
    return new Date(f.value).toLocaleDateString();
  return f.value;
}

const inputCls = 'w-full px-2.5 py-1.5 rounded-lg bg-bg-elevated border border-border-subtle text-sm text-text-primary focus:outline-none focus:border-border-medium';

function FieldInput({ field, value, onChange }: {
  field: CustomFieldValueDto;
  value: string;
  onChange: (v: string) => void;
}) {
  switch (field.fieldType) {
    case CustomFieldType.Boolean:
      return (
        <select value={value} onChange={e => onChange(e.target.value)} className={inputCls}>
          <option value="">—</option>
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>
      );
    case CustomFieldType.Dropdown:
      return (
        <select value={value} onChange={e => onChange(e.target.value)} className={inputCls}>
          <option value="">—</option>
          {(field.options ?? []).map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      );
    case CustomFieldType.Date:
      return (
        <input
          type="date"
          value={value}
          onChange={e => onChange(e.target.value)}
          className={inputCls}
        />
      );
    case CustomFieldType.Number:
      return (
        <input
          type="number"
          value={value}
          onChange={e => onChange(e.target.value)}
          className={inputCls}
        />
      );
    default:
      return (
        <input
          type={field.fieldType === CustomFieldType.Email ? 'email' : field.fieldType === CustomFieldType.Url ? 'url' : 'text'}
          value={value}
          onChange={e => onChange(e.target.value)}
          className={inputCls}
          placeholder={`Enter ${field.name.toLowerCase()}`}
        />
      );
  }
}
