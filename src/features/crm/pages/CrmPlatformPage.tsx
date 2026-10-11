import { useState } from 'react';
import { Calculator, Info, Loader2, Lock, ShieldCheck, Sigma, Trash2 } from 'lucide-react';
import { useProfile } from '@/features/auth/api/auth.queries';
import { UserRole, type UserDto } from '@/features/auth/types/auth.types';
import {
  useCreateFormulaField,
  useCreateRollup,
  useCreateValidationRule,
  useDeleteFormulaField,
  useDeleteRollup,
  useDeleteValidationRule,
  useFormulaFields,
  useRollups,
  useValidationRules,
} from '../api/crm-platform.queries';
import {
  AGGREGATE_FUNCTIONS,
  FORMULA_RETURN_TYPES,
  OPERATOR_LABEL,
  PLATFORM_ENTITY_TYPES,
  RETURN_TYPES_WITH_DECIMALS,
  UNARY_OPERATORS,
  VALIDATION_OPERATORS,
  VALIDATION_SEVERITIES,
  type CrmFormulaFieldDto,
  type CrmRollupSummaryDto,
  type CrmValidationRuleDto,
  type CrmValidationSeverity,
  type FormulaReturnType,
  type ValidationOperator,
} from '../types/crm-platform.types';

const field =
  'rounded-xl bg-bg-input border border-border-subtle px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand';
const primaryBtn =
  'rounded-xl bg-brand text-text-inverted px-4 py-2 text-sm font-bold disabled:opacity-40';
const card = 'rounded-2xl border border-border-subtle bg-bg-card px-5 py-4';

/** API names are identifiers, not labels: letters, digits and underscores. */
const toApiName = (s: string) =>
  s.trim().replace(/[^A-Za-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

type Tab = 'rules' | 'formulas' | 'rollups';

const TABS: { key: Tab; label: string }[] = [
  { key: 'rules', label: 'Validation rules' },
  { key: 'formulas', label: 'Formula fields' },
  { key: 'rollups', label: 'Rollup summaries' },
];

function EntitySelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={field}
    >
      {PLATFORM_ENTITY_TYPES.map((t) => (
        <option key={t} value={t}>
          {t}
        </option>
      ))}
    </select>
  );
}

function RowShell({
  children,
  onDelete,
  deleteLabel,
  pending,
}: {
  children: React.ReactNode;
  onDelete: () => void;
  deleteLabel: string;
  pending: boolean;
}) {
  return (
    <li className="py-3 flex items-start gap-3 flex-wrap">
      <div className="flex-1 min-w-[220px]">{children}</div>
      <button
        aria-label={deleteLabel}
        onClick={onDelete}
        disabled={pending}
        className="rounded-xl border border-border-medium p-1.5 text-text-muted hover:text-danger-light hover:border-danger/20 disabled:opacity-40"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </li>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-text-muted text-center py-12">{children}</p>;
}

function Spinner() {
  return (
    <div className="flex justify-center py-12 text-text-muted">
      <Loader2 className="w-6 h-6 animate-spin" />
    </div>
  );
}

function ValidationRulesTab() {
  const { data, isLoading } = useValidationRules();
  const create = useCreateValidationRule();
  const remove = useDeleteValidationRule();

  const [name, setName] = useState('');
  const [entityType, setEntityType] = useState<string>('Deal');
  const [fieldName, setFieldName] = useState('');
  const [operator, setOperator] = useState<ValidationOperator>('IsNotNull');
  const [compareValue, setCompareValue] = useState('');
  const [severity, setSeverity] = useState<CrmValidationSeverity>('Error');
  const [errorMessage, setErrorMessage] = useState('');

  const unary = UNARY_OPERATORS.includes(operator);
  const canSubmit = !!name.trim() && !!fieldName.trim() && (unary || !!compareValue.trim());

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    create.mutate(
      {
        name: name.trim(),
        entityType,
        fieldName: fieldName.trim(),
        operator,
        compareValue: unary ? null : compareValue.trim(),
        severity,
        errorMessage: errorMessage.trim() || null,
      },
      {
        onSuccess: () => {
          setName('');
          setFieldName('');
          setCompareValue('');
          setErrorMessage('');
        },
      }
    );
  };

  const rows = (data?.items ?? []) as CrmValidationRuleDto[];

  return (
    <div className="space-y-5">
      <form onSubmit={submit} className={`${card} space-y-3`}>
        <h2 className="text-sm font-semibold text-text-primary">Record a rule</h2>
        <div className="flex flex-wrap gap-3">
          <input
            aria-label="Rule name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Close date is required"
            className={`flex-1 min-w-[180px] ${field}`}
          />
          <EntitySelect label="Entity type" value={entityType} onChange={setEntityType} />
        </div>
        <div className="flex flex-wrap gap-3 items-start">
          <input
            aria-label="Field name"
            value={fieldName}
            onChange={(e) => setFieldName(e.target.value)}
            placeholder="CloseDate"
            className={`flex-1 min-w-[140px] font-mono ${field}`}
          />
          <select
            aria-label="Operator"
            value={operator}
            onChange={(e) => setOperator(e.target.value as ValidationOperator)}
            className={field}
          >
            {VALIDATION_OPERATORS.map((o) => (
              <option key={o} value={o}>
                {OPERATOR_LABEL[o]}
              </option>
            ))}
          </select>
          {!unary && (
            <input
              aria-label="Compare value"
              value={compareValue}
              onChange={(e) => setCompareValue(e.target.value)}
              placeholder="Value to compare against"
              className={`flex-1 min-w-[140px] ${field}`}
            />
          )}
          <select
            aria-label="Severity"
            value={severity}
            onChange={(e) => setSeverity(e.target.value as CrmValidationSeverity)}
            className={field}
          >
            {VALIDATION_SEVERITIES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap gap-3">
          <input
            aria-label="Message"
            value={errorMessage}
            onChange={(e) => setErrorMessage(e.target.value)}
            placeholder="Message to show when the rule is broken"
            className={`flex-1 min-w-[220px] ${field}`}
          />
          <button type="submit" disabled={create.isPending || !canSubmit} className={primaryBtn}>
            Record rule
          </button>
        </div>
      </form>

      <div className={card}>
        {isLoading ? (
          <Spinner />
        ) : rows.length === 0 ? (
          <Empty>No rules recorded.</Empty>
        ) : (
          <ul className="divide-y divide-border-subtle">
            {rows.map((r) => (
              <RowShell
                key={r.id}
                deleteLabel={`Delete ${r.name}`}
                onDelete={() => remove.mutate(r.id)}
                pending={remove.isPending}
              >
                <p className="text-sm text-text-primary font-medium">{r.name}</p>
                <p className="text-xs text-text-muted mt-0.5">
                  <span className="text-text-secondary">{r.entityType}</span>
                  {' · '}
                  <span className="font-mono">{r.fieldName}</span>{' '}
                  {OPERATOR_LABEL[r.operator] ?? r.operator}
                  {r.compareValue ? ` ${r.compareValue}` : ''}
                </p>
                <p className="mt-1 flex items-center gap-2 flex-wrap">
                  <span
                    className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${
                      r.severity === 'Error'
                        ? 'text-danger-light bg-danger-soft border-danger/20'
                        : 'text-warning bg-warning-soft border-warning/20'
                    }`}
                  >
                    {r.severity}
                  </span>
                  {r.errorMessage && (
                    <span className="text-xs text-text-muted italic">{r.errorMessage}</span>
                  )}
                </p>
              </RowShell>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function FormulaFieldsTab() {
  const { data, isLoading } = useFormulaFields();
  const create = useCreateFormulaField();
  const remove = useDeleteFormulaField();

  const [name, setName] = useState('');
  const [entityType, setEntityType] = useState<string>('Deal');
  const [expression, setExpression] = useState('');
  const [returnType, setReturnType] = useState<FormulaReturnType>('Number');
  const [decimalPlaces, setDecimalPlaces] = useState(2);

  const showDecimals = RETURN_TYPES_WITH_DECIMALS.includes(returnType);
  const apiName = toApiName(name);
  const canSubmit = !!apiName && !!expression.trim();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    create.mutate(
      {
        name: name.trim(),
        apiName,
        entityType,
        expression: expression.trim(),
        returnType,
        decimalPlaces: showDecimals ? decimalPlaces : 0,
      },
      {
        onSuccess: () => {
          setName('');
          setExpression('');
        },
      }
    );
  };

  const rows = (data?.items ?? []) as CrmFormulaFieldDto[];

  return (
    <div className="space-y-5">
      <form onSubmit={submit} className={`${card} space-y-3`}>
        <h2 className="text-sm font-semibold text-text-primary">Record a formula</h2>
        <div className="flex flex-wrap gap-3">
          <input
            aria-label="Formula name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Weighted amount"
            className={`flex-1 min-w-[180px] ${field}`}
          />
          <EntitySelect label="Entity type" value={entityType} onChange={setEntityType} />
          <select
            aria-label="Return type"
            value={returnType}
            onChange={(e) => setReturnType(e.target.value as FormulaReturnType)}
            className={field}
          >
            {FORMULA_RETURN_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          {showDecimals && (
            <input
              aria-label="Decimal places"
              type="number"
              min={0}
              max={8}
              value={decimalPlaces}
              onChange={(e) => setDecimalPlaces(Number(e.target.value))}
              className={`w-24 ${field}`}
            />
          )}
        </div>
        <input
          aria-label="Expression"
          value={expression}
          onChange={(e) => setExpression(e.target.value)}
          placeholder="Amount * Probability / 100"
          className={`w-full font-mono ${field}`}
        />
        <div className="flex flex-wrap gap-3 items-center">
          <button type="submit" disabled={create.isPending || !canSubmit} className={primaryBtn}>
            Record formula
          </button>
          {name.trim() && (
            <p className="text-xs text-text-muted">
              API name: <span className="font-mono text-text-secondary">{apiName}</span>
            </p>
          )}
        </div>
        {/* The expression is stored as an opaque string. There is no parser on
            either side, so nothing checks the syntax and nothing reports a bad
            one — it is simply never run. */}
        <p className="text-xs text-text-muted" data-testid="formula-expression-unchecked">
          The expression is stored as written. Nothing parses it, so a typo is
          recorded rather than reported.
        </p>
      </form>

      <div className={card}>
        {isLoading ? (
          <Spinner />
        ) : rows.length === 0 ? (
          <Empty>No formula fields recorded.</Empty>
        ) : (
          <ul className="divide-y divide-border-subtle">
            {rows.map((f) => (
              <RowShell
                key={f.id}
                deleteLabel={`Delete ${f.name}`}
                onDelete={() => remove.mutate(f.id)}
                pending={remove.isPending}
              >
                <p className="text-sm text-text-primary font-medium">
                  {f.name}{' '}
                  <span className="font-mono text-xs text-text-muted">{f.apiName}</span>
                </p>
                <p className="text-xs text-text-muted mt-0.5">
                  <span className="text-text-secondary">{f.entityType}</span>
                  {' · returns '}
                  {f.returnType}
                  {RETURN_TYPES_WITH_DECIMALS.includes(f.returnType)
                    ? ` (${f.decimalPlaces} dp)`
                    : ''}
                </p>
                <p className="mt-1 font-mono text-xs text-text-secondary break-all">
                  {f.expression}
                </p>
              </RowShell>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function RollupsTab() {
  const { data, isLoading } = useRollups();
  const create = useCreateRollup();
  const remove = useDeleteRollup();

  const [name, setName] = useState('');
  const [parentEntityType, setParent] = useState<string>('Account');
  const [childEntityType, setChild] = useState<string>('Deal');
  const [relationshipField, setRelationshipField] = useState('');
  const [aggregateField, setAggregateField] = useState('');
  const [aggregateFunction, setAggregateFunction] = useState<string>('SUM');

  // COUNT needs no column to add up; every other function does.
  const needsField = aggregateFunction !== 'COUNT';
  const canSubmit =
    !!name.trim() && !!relationshipField.trim() && (!needsField || !!aggregateField.trim());

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    create.mutate(
      {
        name: name.trim(),
        parentEntityType,
        childEntityType,
        childRelationshipField: relationshipField.trim(),
        // The column is required server-side, so COUNT sends the key it counts.
        aggregateField: needsField ? aggregateField.trim() : 'Id',
        aggregateFunction,
      },
      {
        onSuccess: () => {
          setName('');
          setRelationshipField('');
          setAggregateField('');
        },
      }
    );
  };

  const rows = (data?.items ?? []) as CrmRollupSummaryDto[];

  return (
    <div className="space-y-5">
      <form onSubmit={submit} className={`${card} space-y-3`}>
        <h2 className="text-sm font-semibold text-text-primary">Record a rollup</h2>
        <div className="flex flex-wrap gap-3">
          <input
            aria-label="Rollup name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Total open pipeline"
            className={`flex-1 min-w-[180px] ${field}`}
          />
          <select
            aria-label="Aggregate function"
            value={aggregateFunction}
            onChange={(e) => setAggregateFunction(e.target.value)}
            className={field}
          >
            {AGGREGATE_FUNCTIONS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <span className="text-xs text-text-muted">On</span>
          <EntitySelect label="Parent entity type" value={parentEntityType} onChange={setParent} />
          <span className="text-xs text-text-muted">from its</span>
          <EntitySelect label="Child entity type" value={childEntityType} onChange={setChild} />
          <span className="text-xs text-text-muted">linked by</span>
          <input
            aria-label="Relationship field"
            value={relationshipField}
            onChange={(e) => setRelationshipField(e.target.value)}
            placeholder="AccountId"
            className={`flex-1 min-w-[140px] font-mono ${field}`}
          />
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          {needsField && (
            <input
              aria-label="Aggregate field"
              value={aggregateField}
              onChange={(e) => setAggregateField(e.target.value)}
              placeholder="Amount"
              className={`flex-1 min-w-[140px] font-mono ${field}`}
            />
          )}
          <button type="submit" disabled={create.isPending || !canSubmit} className={primaryBtn}>
            Record rollup
          </button>
        </div>
      </form>

      <div className={card}>
        {isLoading ? (
          <Spinner />
        ) : rows.length === 0 ? (
          <Empty>No rollup summaries recorded.</Empty>
        ) : (
          <ul className="divide-y divide-border-subtle">
            {rows.map((r) => (
              <RowShell
                key={r.id}
                deleteLabel={`Delete ${r.name}`}
                onDelete={() => remove.mutate(r.id)}
                pending={remove.isPending}
              >
                <p className="text-sm text-text-primary font-medium">{r.name}</p>
                <p className="text-xs text-text-muted mt-0.5">
                  {r.aggregateFunction}
                  {' of '}
                  <span className="font-mono text-text-secondary">
                    {r.childEntityType}.{r.aggregateField}
                  </span>
                  {' onto '}
                  <span className="text-text-secondary">{r.parentEntityType}</span>
                  {', linked by '}
                  <span className="font-mono">{r.childRelationshipField}</span>
                </p>
              </RowShell>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

const TAB_ICON: Record<Tab, typeof ShieldCheck> = {
  rules: ShieldCheck,
  formulas: Calculator,
  rollups: Sigma,
};

export function Component() {
  const { data: profile } = useProfile();
  const role = (profile as UserDto | undefined)?.role;
  const isManager = role === UserRole.Owner || role === UserRole.Admin;
  const [tab, setTab] = useState<Tab>('rules');

  if (profile && !isManager) {
    return (
      <div className="py-16 text-center">
        <Lock className="w-8 h-8 text-text-muted mx-auto mb-3" />
        <h1 className="text-lg font-bold text-text-primary">Restricted</h1>
        <p className="text-sm text-text-muted mt-1">
          Platform configuration changes the shape of the workspace, so Owners and
          Admins only.
        </p>
      </div>
    );
  }

  const Icon = TAB_ICON[tab];

  return (
    <div className="py-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-brand-soft border border-border-glow flex items-center justify-center">
          <Icon className="w-6 h-6 text-brand" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-text-primary">Platform configuration</h1>
          <p className="text-sm text-text-muted">
            Validation rules, formula fields and rollup summaries for your records.
          </p>
        </div>
      </div>

      {/* The three services behind this page are create/list/delete and nothing
          more: no code path evaluates a rule on save, computes a formula, or
          aggregates a rollup. Saying so here is the whole point of the page —
          without it an admin would record "Close date is required", believe
          deals are guarded, and learn otherwise from the data. */}
      <div
        className="rounded-2xl border border-warning/20 bg-warning-soft px-5 py-4 flex gap-3"
        data-testid="platform-not-enforced-notice"
      >
        <Info className="w-5 h-5 text-warning shrink-0 mt-0.5" />
        <div className="text-sm text-text-secondary">
          <p className="font-semibold text-text-primary">
            These definitions are recorded, not yet applied.
          </p>
          <p className="mt-1">
            Nothing in the platform evaluates them today: a validation rule will not
            stop a save, a formula field is not computed onto any record, and a
            rollup is not totalled onto its parent. Use this page to capture the
            configuration you want — it takes effect when the engine that reads it
            ships.
          </p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap border-b border-border-subtle">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            aria-current={tab === t.key ? 'page' : undefined}
            className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px ${
              tab === t.key
                ? 'border-brand text-text-primary'
                : 'border-transparent text-text-muted hover:text-text-secondary'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'rules' && <ValidationRulesTab />}
      {tab === 'formulas' && <FormulaFieldsTab />}
      {tab === 'rollups' && <RollupsTab />}
    </div>
  );
}
