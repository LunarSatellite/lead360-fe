import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { crmApi } from '../api/crm.api';
import { CustomFieldType, type CustomFieldDefinitionDto } from '../types/crm.types';

const inputCls = 'w-full px-2.5 py-1.5 rounded-lg bg-bg-input border border-border-subtle text-sm text-text-primary focus:outline-none focus:border-border-medium';

function FieldInput({ field, value, onChange }: {
  field: CustomFieldDefinitionDto;
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
      return <input type="date" value={value} onChange={e => onChange(e.target.value)} className={inputCls} />;
    case CustomFieldType.Number:
      return <input type="number" value={value} onChange={e => onChange(e.target.value)} className={inputCls} />;
    default:
      return (
        <input type={field.fieldType === CustomFieldType.Email ? 'email' : 'text'}
          value={value} onChange={e => onChange(e.target.value)} className={inputCls} placeholder={field.name} />
      );
  }
}

const SUPPORTED_TYPES = [CustomFieldType.Text, CustomFieldType.Number, CustomFieldType.Date,
  CustomFieldType.Boolean, CustomFieldType.Dropdown, CustomFieldType.Email, CustomFieldType.Url];

interface Props {
  entityType: number;
  recordId?: string;
  onValuesChange?: (values: Record<string, string>) => void;
}

export function CustomFieldsInline({ entityType, recordId, onValuesChange }: Props) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [initialized, setInitialized] = useState(false);

  const { data: definitions } = useQuery({
    queryKey: ['custom-field-defs', entityType],
    queryFn: () => crmApi.getCustomFieldDefinitions(entityType),
  });
  const fields: CustomFieldDefinitionDto[] = (definitions ?? []).filter(f => SUPPORTED_TYPES.includes(f.fieldType));

  const { data: existingValues } = useQuery({
    queryKey: ['custom-field-values', recordId, entityType],
    queryFn: () => crmApi.getCustomFieldValues(recordId!, entityType),
    enabled: !!recordId,
  });

  // Initialize once — on first mount or when fields/existingValues arrive
  useEffect(() => {
    if (initialized) return;
    if (recordId) {
      if (existingValues) {
        const init: Record<string, string> = {};
        (existingValues as any[]).forEach((v: any) => { init[v.definitionId] = v.value ?? ''; });
        setValues(init);
        onValuesChange?.(init);
        setInitialized(true);
      }
    } else if (fields.length > 0) {
      const init: Record<string, string> = {};
      fields.forEach(f => { init[f.id] = ''; });
      setValues(init);
      onValuesChange?.(init);
      setInitialized(true);
    }
  }, [fields, existingValues, recordId, onValuesChange, initialized]);

  if (fields.length === 0) return null;

  const onChange = (id: string, val: string) => {
    const next = { ...values, [id]: val };
    setValues(next);
    onValuesChange?.(next);
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      {fields.map(f => (
        <div key={f.id}>
          <p className="text-xs text-text-muted mb-1">{f.name}</p>
          <FieldInput field={f} value={values[f.id] ?? ''} onChange={v => onChange(f.id, v)} />
        </div>
      ))}
    </div>
  );
}
