// ── CRM Feature enum (matches CrmFeature on backend) ──────────────────────
export const CrmFeature = {
  Leads:           1,
  Deals:           2,
  Contacts:        3,
  Accounts:        4,
  Organizations:   5,
  Quotes:          6,
  Proposals:       7,
  Invoices:        8,
  Orders:          9,
  PurchaseOrders:  10,
  GoodsReceipts:   11,
  SupplierInvoices: 12,
  Vendors:         13,
  Returns:         14,
  Deliveries:      15,
  Equipment:       16,
  WorkOrders:      17,
  Support:         18,
  Subscriptions:   19,
  Campaigns:       20,
  Analytics:       21,
  TeamManagement:  22,
  Settings:        23,
} as const;
export type CrmFeatureValue = (typeof CrmFeature)[keyof typeof CrmFeature];

export const CRM_FEATURE_LABEL: Record<CrmFeatureValue, string> = {
  1:  'Leads',
  2:  'Deals',
  3:  'Contacts',
  4:  'Accounts',
  5:  'Organizations',
  6:  'Quotes',
  7:  'Proposals',
  8:  'Invoices',
  9:  'Orders',
  10: 'Purchase Orders',
  11: 'Goods Receipts',
  12: 'Supplier Invoices',
  13: 'Vendors',
  14: 'Returns',
  15: 'Deliveries',
  16: 'Equipment',
  17: 'Work Orders',
  18: 'Support',
  19: 'Subscriptions',
  20: 'Campaigns',
  21: 'Analytics',
  22: 'Team Management',
  23: 'Settings',
};

// Grouped for the permission matrix UI
export const CRM_FEATURE_GROUPS: { label: string; features: CrmFeatureValue[] }[] = [
  { label: 'Sales',        features: [1, 2, 3, 4, 5, 6, 7, 8] },
  { label: 'Operations',   features: [9, 14, 15, 16, 17, 18, 19] },
  { label: 'Procurement',  features: [10, 11, 12, 13] },
  { label: 'Marketing',    features: [20] },
  { label: 'Management',   features: [21, 22, 23] },
];

// ── Territory enums ───────────────────────────────────────────────────────
export const TerritoryRuleField = {
  Country:     1,
  Industry:    2,
  CompanySize: 3,
  DealValue:   4,
  LeadSource:  5,
  City:        6,
  Region:      7,
} as const;
export type TerritoryRuleFieldValue = (typeof TerritoryRuleField)[keyof typeof TerritoryRuleField];

export const TERRITORY_RULE_FIELD_LABEL: Record<TerritoryRuleFieldValue, string> = {
  1: 'Country', 2: 'Industry', 3: 'Company Size', 4: 'Deal Value', 5: 'Lead Source', 6: 'City', 7: 'Region',
};

export const TerritoryRuleOperator = {
  Equals:              1,
  NotEquals:           2,
  Contains:            3,
  StartsWith:          4,
  GreaterThan:         5,
  LessThan:            6,
  GreaterThanOrEquals: 7,
  LessThanOrEquals:    8,
} as const;
export type TerritoryRuleOperatorValue = (typeof TerritoryRuleOperator)[keyof typeof TerritoryRuleOperator];

export const TERRITORY_RULE_OPERATOR_LABEL: Record<TerritoryRuleOperatorValue, string> = {
  1: '=', 2: '≠', 3: 'contains', 4: 'starts with', 5: '>', 6: '<', 7: '≥', 8: '≤',
};

export const TerritoryRuleLogic = { And: 1, Or: 2 } as const;
export type TerritoryRuleLogicValue = (typeof TerritoryRuleLogic)[keyof typeof TerritoryRuleLogic];

// ── DTOs ──────────────────────────────────────────────────────────────────
export interface CrmRolePermissionDto {
  feature:    CrmFeatureValue;
  canView:    boolean;
  canViewAll: boolean;
  canCreate:  boolean;
  canEdit:    boolean;
  canDelete:  boolean;
  canApprove: boolean;
}

export interface CrmRoleDto {
  id:          string;
  name:        string;
  description: string | null;
  isSystem:    boolean;
  isActive:    boolean;
  sortOrder:   number;
  permissions: CrmRolePermissionDto[];
}

export interface CreateCrmRoleRequest  { name: string; description?: string; sortOrder?: number }
export interface UpdateCrmRoleRequest  { name: string; description?: string; isActive: boolean; sortOrder: number }
export interface AssignCrmRoleRequest  { userId: string; roleId: string | null }
export interface UpdateCrmRolePermissionsRequest { permissions: CrmRolePermissionDto[] }

// ── Territory DTOs ────────────────────────────────────────────────────────
export interface SalesTerritoryRuleDto {
  id:        string;
  field:     TerritoryRuleFieldValue;
  operator:  TerritoryRuleOperatorValue;
  value:     string;
  logicGate: TerritoryRuleLogicValue;
  sortOrder: number;
}

export interface SalesTerritoryMemberDto {
  id:              string;
  userId:          string;
  userName:        string;
  userEmail:       string | null;
  roundRobinIndex: number;
  isActive:        boolean;
}

export interface SalesTerritoryDto {
  id:             string;
  name:           string;
  description:    string | null;
  priority:       number;
  isActive:       boolean;
  fallbackPoolId: string | null;
  rules:          SalesTerritoryRuleDto[];
  members:        SalesTerritoryMemberDto[];
}

export interface CreateSalesTerritoryRequest {
  name:           string;
  description?:   string;
  priority:       number;
  fallbackPoolId?: string;
  rules:          SalesTerritoryRuleRequest[];
}

export interface UpdateSalesTerritoryRequest {
  name:           string;
  description?:   string;
  priority:       number;
  isActive:       boolean;
  fallbackPoolId?: string;
}

export interface SalesTerritoryRuleRequest {
  field:     TerritoryRuleFieldValue;
  operator:  TerritoryRuleOperatorValue;
  value:     string;
  logicGate: TerritoryRuleLogicValue;
  sortOrder: number;
}

export interface AddTerritoryMemberRequest { userId: string }
