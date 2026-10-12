/**
 * Validation rules, formula fields and rollup summaries — the
 * Salesforce-Platform-style configuration surface.
 *
 * Mirrors `CrmPlatformControllers.cs` (`/v1/crm/validation-rules`,
 * `/v1/crm/formula-fields`, `/v1/crm/rollups`) and `CrmPlatformDtos.cs`.
 *
 * ## Nothing applies these yet
 *
 * `CrmValidationRuleService`, `CrmFormulaFieldService` and
 * `CrmRollupSummaryService` are create/list/delete and nothing else.
 * `ValidationOperator` and `FormulaReturnType` appear in exactly three files
 * each — the entity, the enum declaration, and that CRUD service — so no
 * code path evaluates a rule before a save, computes a formula, or
 * aggregates a rollup. (`AggregateFunction` has other readers, but they
 * belong to `CrmReportEngineService`, which does not look at these rows.)
 *
 * The pages therefore present these as *definitions recorded for a future
 * engine*, and say so on screen. A page that implied a stored rule rejects
 * bad data would be worse than no page: an admin would add "Close date is
 * required", believe deals are now guarded, and find out otherwise from the
 * data.
 *
 * Enum-valued fields cross the wire as the enum **name** (`.ToString()` out,
 * `Enum.Parse` in), so they are string unions and the forms offer fixed
 * lists — an unrecognised name is a 500 from `Enum.Parse`, not a 400.
 * `aggregateFunction` is the exception: it is a plain `string` column, never
 * parsed, so a typo there is stored verbatim rather than rejected. That is
 * the more reason to pick it from a list.
 */

export type ValidationOperator =
  | 'Equals'
  | 'NotEquals'
  | 'GreaterThan'
  | 'LessThan'
  | 'Contains'
  | 'NotContains'
  | 'StartsWith'
  | 'IsNull'
  | 'IsNotNull'
  | 'Regex';

export const VALIDATION_OPERATORS: readonly ValidationOperator[] = [
  'Equals',
  'NotEquals',
  'GreaterThan',
  'LessThan',
  'Contains',
  'NotContains',
  'StartsWith',
  'IsNull',
  'IsNotNull',
  'Regex',
];

/** The two unary operators — a compare value would be meaningless. */
export const UNARY_OPERATORS: readonly ValidationOperator[] = ['IsNull', 'IsNotNull'];

export const OPERATOR_LABEL: Record<ValidationOperator, string> = {
  Equals: 'is',
  NotEquals: 'is not',
  GreaterThan: 'is greater than',
  LessThan: 'is less than',
  Contains: 'contains',
  NotContains: 'does not contain',
  StartsWith: 'starts with',
  IsNull: 'is empty',
  IsNotNull: 'is not empty',
  Regex: 'matches the pattern',
};

export type CrmValidationSeverity = 'Warning' | 'Error';
export const VALIDATION_SEVERITIES: readonly CrmValidationSeverity[] = ['Error', 'Warning'];

export type FormulaReturnType = 'Text' | 'Number' | 'Date' | 'Boolean' | 'Currency';
export const FORMULA_RETURN_TYPES: readonly FormulaReturnType[] = [
  'Text',
  'Number',
  'Currency',
  'Date',
  'Boolean',
];

/** Only Number and Currency have decimal places to speak of. */
export const RETURN_TYPES_WITH_DECIMALS: readonly FormulaReturnType[] = ['Number', 'Currency'];

/**
 * A free-text column server-side, not an enum. These are the functions the
 * report engine recognises elsewhere in the CRM, so they are the sensible
 * ones to offer.
 */
export type AggregateFunction = 'SUM' | 'COUNT' | 'AVG' | 'MIN' | 'MAX';
export const AGGREGATE_FUNCTIONS: readonly AggregateFunction[] = [
  'SUM',
  'COUNT',
  'AVG',
  'MIN',
  'MAX',
];

/** The entity types these definitions can be hung off. */
export const PLATFORM_ENTITY_TYPES = ['Lead', 'Contact', 'Deal', 'Account', 'Activity'] as const;
export type PlatformEntityType = (typeof PLATFORM_ENTITY_TYPES)[number];

export interface CrmValidationRuleDto {
  id: string;
  name: string;
  description: string | null;
  entityType: string;
  fieldName: string;
  operator: ValidationOperator;
  compareValue: string | null;
  errorMessage: string | null;
  isActive: boolean;
  severity: CrmValidationSeverity;
  createdAt: string;
}

export interface CreateValidationRuleRequest {
  name: string;
  entityType: string;
  fieldName: string;
  operator: ValidationOperator;
  compareValue?: string | null;
  errorMessage?: string | null;
  severity?: CrmValidationSeverity;
  description?: string | null;
}

export interface CrmFormulaFieldDto {
  id: string;
  name: string;
  apiName: string;
  entityType: string;
  expression: string;
  returnType: FormulaReturnType;
  decimalPlaces: number;
  isActive: boolean;
  createdAt: string;
}

export interface CreateFormulaFieldRequest {
  name: string;
  apiName: string;
  entityType: string;
  expression: string;
  returnType?: FormulaReturnType;
  decimalPlaces?: number;
}

export interface CrmRollupSummaryDto {
  id: string;
  name: string;
  parentEntityType: string;
  childEntityType: string;
  childRelationshipField: string;
  aggregateField: string;
  aggregateFunction: string;
  filterCriteriaJson: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface CreateRollupSummaryRequest {
  name: string;
  parentEntityType: string;
  childEntityType: string;
  childRelationshipField: string;
  aggregateField: string;
  aggregateFunction?: string;
  filterCriteriaJson?: string | null;
}
