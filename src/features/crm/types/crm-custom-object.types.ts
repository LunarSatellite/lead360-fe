/**
 * Tenant-defined objects — the Salesforce-Platform-style escape hatch for
 * modelling something the built-in entities do not cover.
 *
 * Mirrors `CrmCustomObjectController` (`/v1/crm/custom-objects`) and
 * `CrmCustomObjectDtos.cs`.
 *
 * `fieldType` crosses the wire as the enum **name** on the way out
 * (`field.FieldType.ToString()`) and is parsed from a name on the way in
 * (`Enum.Parse<CustomObjectFieldType>`), so it is a string union. An
 * unrecognised name is a 500 from `Enum.Parse`, not a validation error —
 * which is why the form offers a fixed list rather than a free-text box.
 */

export type CustomObjectFieldType =
  | 'Text'
  | 'Number'
  | 'Date'
  | 'Boolean'
  | 'Email'
  | 'Phone'
  | 'Url'
  | 'Select'
  | 'Reference'
  | 'Currency'
  | 'LongText';

export const CUSTOM_OBJECT_FIELD_TYPES: readonly CustomObjectFieldType[] = [
  'Text',
  'LongText',
  'Number',
  'Currency',
  'Date',
  'Boolean',
  'Email',
  'Phone',
  'Url',
  'Select',
  'Reference',
];

/** The two that need more than a name before they mean anything. */
export const FIELD_TYPE_NEEDS_OPTIONS: CustomObjectFieldType = 'Select';
export const FIELD_TYPE_NEEDS_REFERENCE: CustomObjectFieldType = 'Reference';

export interface CrmCustomObjectDefinitionDto {
  id: string;
  name: string;
  apiName: string;
  pluralLabel: string | null;
  description: string | null;
  isActive: boolean;
  allowReports: boolean;
  allowActivities: boolean;
  fieldCount: number;
  createdAt: string;
}

export interface CrmCustomObjectFieldDto {
  id: string;
  objectDefinitionId: string;
  name: string;
  apiName: string;
  fieldType: CustomObjectFieldType;
  isRequired: boolean;
  isUnique: boolean;
  sortOrder: number;
  defaultValue: string | null;
  optionsJson: string | null;
  referencedObjectId: string | null;
}

export interface CrmCustomObjectDetailDto extends CrmCustomObjectDefinitionDto {
  fields: CrmCustomObjectFieldDto[];
}

export interface CreateCustomObjectDefinitionRequest {
  name: string;
  apiName: string;
  pluralLabel?: string | null;
  description?: string | null;
  allowReports?: boolean;
  allowActivities?: boolean;
}

export interface CreateCustomObjectFieldRequest {
  objectDefinitionId: string;
  name: string;
  apiName: string;
  fieldType: CustomObjectFieldType;
  isRequired?: boolean;
  isUnique?: boolean;
  sortOrder?: number;
  defaultValue?: string | null;
  optionsJson?: string | null;
  referencedObjectId?: string | null;
}
