import { useState } from 'react';
import { Boxes, ChevronDown, ChevronRight, Loader2, Lock, Trash2 } from 'lucide-react';
import { useProfile } from '@/features/auth/api/auth.queries';
import { UserRole, type UserDto } from '@/features/auth/types/auth.types';
import {
  useAddCustomObjectField,
  useCreateCustomObject,
  useCustomObjectDefinition,
  useCustomObjectDefinitions,
  useDeleteCustomObject,
} from '../api/crm-custom-object.queries';
import {
  CUSTOM_OBJECT_FIELD_TYPES,
  FIELD_TYPE_NEEDS_OPTIONS,
  FIELD_TYPE_NEEDS_REFERENCE,
  type CrmCustomObjectDefinitionDto,
  type CustomObjectFieldType,
} from '../types/crm-custom-object.types';
import { Button } from '@/shared/ui/primitives';

const field =
  'rounded-xl bg-bg-input border border-border-subtle px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand';

/** API names are identifiers, not labels: letters, digits and underscores. */
const toApiName = (s: string) =>
  s.trim().replace(/[^A-Za-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

function FieldsPanel({ objectId }: { objectId: string }) {
  const { data, isLoading } = useCustomObjectDefinition(objectId);
  const addField = useAddCustomObjectField();

  const [name, setName] = useState('');
  const [type, setType] = useState<CustomObjectFieldType>('Text');
  const [required, setRequired] = useState(false);
  const [options, setOptions] = useState('');

  const needsOptions = type === FIELD_TYPE_NEEDS_OPTIONS;
  const needsReference = type === FIELD_TYPE_NEEDS_REFERENCE;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const apiName = toApiName(name);
    if (!apiName) return;
    addField.mutate(
      {
        objectDefId: objectId,
        req: {
          objectDefinitionId: objectId,
          name: name.trim(),
          apiName,
          fieldType: type,
          isRequired: required,
          sortOrder: (data?.fields?.length ?? 0) + 1,
          optionsJson: needsOptions
            ? JSON.stringify(
                options
                  .split(',')
                  .map((o) => o.trim())
                  .filter(Boolean)
              )
            : null,
        },
      },
      {
        onSuccess: () => {
          setName('');
          setOptions('');
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-6 text-text-muted">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    );
  }

  const fields = data?.fields ?? [];

  return (
    <div className="mt-3 space-y-3 border-l border-border-subtle pl-4">
      {fields.length === 0 ? (
        <p className="text-xs text-text-muted">
          No fields yet — an object with no fields can hold a name and nothing else.
        </p>
      ) : (
        <ul className="space-y-1">
          {fields.map((f) => (
            <li key={f.id} className="text-xs text-text-secondary">
              <span className="text-text-primary font-medium">{f.name}</span>
              <span className="text-text-muted"> · {f.fieldType}</span>
              <span className="font-mono text-text-muted"> · {f.apiName}</span>
              {f.isRequired && <span className="text-warning"> · required</span>}
              {f.isUnique && <span className="text-text-muted"> · unique</span>}
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={submit} className="flex flex-wrap gap-2 items-start">
        <input
          aria-label="Field name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Field name"
          className={`flex-1 min-w-[140px] ${field}`}
        />
        <select
          aria-label="Field type"
          value={type}
          onChange={(e) => setType(e.target.value as CustomObjectFieldType)}
          className={field}
        >
          {CUSTOM_OBJECT_FIELD_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        {needsOptions && (
          <input
            aria-label="Select options"
            value={options}
            onChange={(e) => setOptions(e.target.value)}
            placeholder="Red, Green, Blue"
            className={`flex-1 min-w-[160px] ${field}`}
          />
        )}
        <label className="flex items-center gap-1.5 text-xs text-text-secondary px-1 py-2">
          <input
            type="checkbox"
            checked={required}
            onChange={(e) => setRequired(e.target.checked)}
            className="accent-brand"
          />
          Required
        </label>
        <button
          type="submit"
          disabled={addField.isPending || !toApiName(name) || needsReference}
          title={
            needsReference
              ? 'A Reference field needs a target object, which this API does not accept yet'
              : undefined
          }
          className="rounded-xl border border-border-medium px-3 py-2 text-xs font-semibold text-text-secondary hover:border-border-glow disabled:opacity-40"
        >
          Add field
        </button>
        {name.trim() && (
          <p className="w-full text-xs text-text-muted">
            API name:{' '}
            <span className="font-mono text-text-secondary">{toApiName(name)}</span>
          </p>
        )}
        {needsReference && (
          <p
            className="w-full text-xs text-warning"
            data-testid="custom-object-reference-unsupported"
          >
            A Reference field points at another object, and the add-field endpoint
            takes the target id but the console has no picker for it yet. Pick
            another type, or add this one through the API.
          </p>
        )}
      </form>
    </div>
  );
}

export function Component() {
  const { data: profile } = useProfile();
  const role = (profile as UserDto | undefined)?.role;
  const isManager = role === UserRole.Owner || role === UserRole.Admin;

  const { data, isLoading } = useCustomObjectDefinitions();
  const create = useCreateCustomObject();
  const remove = useDeleteCustomObject();

  const [open, setOpen] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [plural, setPlural] = useState('');

  if (profile && !isManager) {
    return (
      <div className="py-16 text-center">
        <Lock className="w-8 h-8 text-text-muted mx-auto mb-3" />
        <h1 className="text-lg font-bold text-text-primary">Restricted</h1>
        <p className="text-sm text-text-muted mt-1">
          Custom objects change the shape of the workspace, so Owners and Admins only.
        </p>
      </div>
    );
  }

  const rows = (data?.items ?? []) as CrmCustomObjectDefinitionDto[];

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const apiName = toApiName(name);
    if (!apiName) return;
    create.mutate(
      {
        name: name.trim(),
        apiName,
        pluralLabel: plural.trim() || null,
      },
      {
        onSuccess: () => {
          setName('');
          setPlural('');
        },
      }
    );
  };

  return (
    <div className="py-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-brand-soft border border-border-glow flex items-center justify-center">
          <Boxes className="w-6 h-6 text-brand" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-text-primary">Custom objects</h1>
          <p className="text-sm text-text-muted">
            For the things your business tracks that the built-in records do not cover.
          </p>
        </div>
      </div>

      <form
        onSubmit={submit}
        className="rounded-2xl border border-border-subtle bg-bg-card px-5 py-4 space-y-3"
      >
        <h2 className="text-sm font-semibold text-text-primary">Create an object</h2>
        <div className="flex flex-wrap gap-3">
          <input
            aria-label="Object name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Service visit"
            className={`flex-1 min-w-[180px] ${field}`}
          />
          <input
            aria-label="Plural label"
            value={plural}
            onChange={(e) => setPlural(e.target.value)}
            placeholder="Service visits"
            className={`flex-1 min-w-[180px] ${field}`}
          />
          <Button
            type="submit"
            disabled={create.isPending || !toApiName(name)}
            variant="primary"
          >
            Create
          </Button>
        </div>
        {name.trim() && (
          <p className="text-xs text-text-muted">
            API name:{' '}
            <span className="font-mono text-text-secondary">{toApiName(name)}</span>{' '}
            — derived from the name, and what integrations will refer to.
          </p>
        )}
      </form>

      <div className="rounded-2xl border border-border-subtle bg-bg-card px-5 py-4">
        {isLoading ? (
          <div className="flex justify-center py-12 text-text-muted">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-text-muted text-center py-12">
            No custom objects — everything is modelled with the built-in records.
          </p>
        ) : (
          <ul className="divide-y divide-border-subtle">
            {rows.map((o) => (
              <li key={o.id} className="py-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    aria-label={`Fields of ${o.name}`}
                    onClick={() => setOpen(open === o.id ? null : o.id)}
                    className="flex items-center gap-1.5 text-sm text-text-primary font-medium"
                  >
                    {open === o.id ? (
                      <ChevronDown className="w-4 h-4 text-text-muted" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-text-muted" />
                    )}
                    {o.name}
                  </button>
                  <span className="font-mono text-xs text-text-muted">{o.apiName}</span>
                  <span className="text-xs text-text-muted">
                    {o.fieldCount} {o.fieldCount === 1 ? 'field' : 'fields'}
                  </span>
                  {!o.isActive && (
                    <span className="rounded-full border border-border-subtle bg-bg-elevated px-2.5 py-1 text-xs text-text-muted">
                      Inactive
                    </span>
                  )}
                  <button
                    aria-label={`Delete ${o.name}`}
                    onClick={() => remove.mutate(o.id)}
                    disabled={remove.isPending}
                    className="ml-auto rounded-xl border border-border-medium p-1.5 text-text-muted hover:text-danger hover:border-danger/20 disabled:opacity-40"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                {open === o.id && <FieldsPanel objectId={o.id} />}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
