// ═══════════════════════════════════════════════════════════════
// Business Catalog Feature — Type Definitions (matches Swagger spec)
// ═══════════════════════════════════════════════════════════════

// ─── Enums (const objects, matching backend integer values) ───

/** Matches backend CatalogCategoryType enum: Product=0, Service=1 */
export const CatalogCategoryType = {
  Product: 0,
  Service: 1,
} as const;
export type CatalogCategoryTypeValue = (typeof CatalogCategoryType)[keyof typeof CatalogCategoryType];

export const BusinessType = {
  Ecommerce: 1,
  Healthcare: 2,
  Hospitality: 3,
  Food: 4,
  Education: 5,
  Service: 6,
  RealEstate: 7,
  Other: 99,
} as const;
export type BusinessTypeValue = (typeof BusinessType)[keyof typeof BusinessType];

export const TransactionStatus = {
  Pending: 1,
  Confirmed: 2,
  Cancelled: 3,
  Preparing: 4,
  ReadyForPickup: 5,
} as const;
export type TransactionStatusValue = (typeof TransactionStatus)[keyof typeof TransactionStatus];

// ─── Label & color maps ───

export const BUSINESS_TYPE_LABEL: Record<BusinessTypeValue, string> = {
  1: 'E-commerce / Retail',
  2: 'Healthcare / Clinic',
  3: 'Hospitality / Hotel',
  4: 'Food / Restaurant',
  5: 'Education',
  6: 'Service Provider',
  7: 'Real Estate',
  99: 'Other',
};

export const BUSINESS_TYPE_DESCRIPTION: Record<BusinessTypeValue, string> = {
  1: 'Sell products with cart, quantities, and delivery address.',
  2: 'Capture appointment requests for doctors or providers with time slots.',
  3: 'Take room or stay bookings with check-in and check-out dates.',
  4: 'Take food orders with menu, quantities, and delivery address.',
  5: 'Capture course enrollment interest and inquiries.',
  6: 'Book services with time slots and on-site addresses.',
  7: 'Capture property inquiries with optional viewing requests.',
  99: 'Generic capture — choose the flags that fit your workflow.',
};

export const TRANSACTION_STATUS_LABEL: Record<TransactionStatusValue, string> = {
  1: 'Pending',
  2: 'Confirmed',
  3: 'Cancelled',
  4: 'Preparing',
  5: 'Ready for Pickup',
};

/// <summary>UI color token suffix — used like `bg-${color}-soft` etc. Maps to project semantic colors.</summary>
export const TRANSACTION_STATUS_COLOR: Record<TransactionStatusValue, string> = {
  1: 'warning',
  2: 'success',
  3: 'danger',
  4: 'info',
  5: 'brand',
};

// ─── Business Profile DTOs ───

export interface BusinessProfile {
  id: string;
  tenantId: string;
  businessType: BusinessTypeValue;
  transactionLabel: string;
  transactionType: string;
  catalogLabel: string;
  itemLabel: string;
  collectsQuantity: boolean;
  collectsTimeSlot: boolean;
  collectsDateRange: boolean;
  collectsMultipleItems: boolean;
  collectsAddress: boolean;
  collectsNotes: boolean;
  slotDurationMins: number | null;
  operationalHoursJson: string | null;
  confirmationMessage: string;
  notifyEmail: string | null;
  notifyPhone: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface BusinessProfileUpsertRequest {
  businessType: BusinessTypeValue;
  transactionLabel: string;
  transactionType: string;
  catalogLabel: string;
  itemLabel: string;
  collectsQuantity: boolean;
  collectsTimeSlot: boolean;
  collectsDateRange: boolean;
  collectsMultipleItems: boolean;
  collectsAddress: boolean;
  collectsNotes: boolean;
  slotDurationMins: number | null;
  operationalHoursJson: string | null;
  confirmationMessage: string;
  notifyEmail: string | null;
  notifyPhone: string | null;
  isActive: boolean;
}

// ─── Category DTOs ───

export interface CatalogCategory {
  id: string;
  tenantId: string;
  parentId: string | null;
  name: string;
  description: string | null;
  color: string | null;
  iconUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  itemCount: number;
  createdAt: string;
  updatedAt: string | null;
  // Per-category behavior overrides (null = inherit from BusinessProfile)
  categoryType: CatalogCategoryTypeValue | null;
  transactionLabel: string | null;
  collectsQuantity: boolean | null;
  collectsTimeSlot: boolean | null;
  collectsAddress: boolean | null;
  collectsDateRange: boolean | null;
  collectsNotes: boolean | null;
  collectsMultipleItems: boolean | null;
}

export interface CatalogCategoryCreateRequest {
  parentId?: string | null;
  name: string;
  description?: string | null;
  color?: string | null;
  iconUrl?: string | null;
  sortOrder?: number;
  isActive?: boolean;
  categoryType?: CatalogCategoryTypeValue | null;
  transactionLabel?: string | null;
  collectsQuantity?: boolean | null;
  collectsTimeSlot?: boolean | null;
  collectsAddress?: boolean | null;
  collectsDateRange?: boolean | null;
  collectsNotes?: boolean | null;
  collectsMultipleItems?: boolean | null;
}

export interface CatalogCategoryUpdateRequest {
  parentId?: string | null;
  name?: string | null;
  description?: string | null;
  color?: string | null;
  iconUrl?: string | null;
  sortOrder?: number | null;
  isActive?: boolean | null;
  categoryType?: CatalogCategoryTypeValue | null;
  transactionLabel?: string | null;
  collectsQuantity?: boolean | null;
  collectsTimeSlot?: boolean | null;
  collectsAddress?: boolean | null;
  collectsDateRange?: boolean | null;
  collectsNotes?: boolean | null;
  collectsMultipleItems?: boolean | null;
}

// ─── Item DTOs ───

export interface CatalogItem {
  id: string;
  tenantId: string;
  categoryId: string;
  categoryName: string | null;
  name: string;
  description: string | null;
  price: number | null;
  currency: string;
  unit: string;
  imageUrl: string | null;
  tags: string | null;
  metadataJson: string | null;
  isAvailable: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string | null;
}

export interface CatalogItemCreateRequest {
  categoryId: string;
  name: string;
  description?: string | null;
  price?: number | null;
  currency?: string;
  unit?: string;
  imageUrl?: string | null;
  tags?: string | null;
  metadataJson?: string | null;
  isAvailable?: boolean;
  sortOrder?: number;
}

export interface CatalogItemUpdateRequest {
  categoryId?: string | null;
  name?: string | null;
  description?: string | null;
  price?: number | null;
  currency?: string | null;
  unit?: string | null;
  imageUrl?: string | null;
  tags?: string | null;
  metadataJson?: string | null;
  isAvailable?: boolean | null;
  sortOrder?: number | null;
}

export interface CatalogItemFilter {
  categoryId?: string | null;
  search?: string | null;
  isAvailable?: boolean | null;
  page?: number;
  pageSize?: number;
}

export type CatalogImportMode = 'CreateOnly' | 'Upsert';
export type CatalogImportAction = 'Invalid' | 'CreateItem' | 'UpdateItem';

export interface CatalogImportRowPreview {
  row: number;
  categoryName: string;
  itemName: string;
  action: CatalogImportAction;
  existingCategoryId: string | null;
  existingItemId: string | null;
  errors: string[];
}

export interface CatalogImportPreviewResult {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  categoriesToCreate: number;
  itemsToCreate: number;
  itemsToUpdate: number;
  categoriesCreated: number;
  itemsCreated: number;
  itemsUpdated: number;
  rows: CatalogImportRowPreview[];
  errors: Array<{ row: number; error: string }>;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}

// ─── Transaction DTOs ───

export interface TransactionItemLine {
  catalogItemId?: string | null;
  name: string;
  quantity: number;
  unitPrice?: number | null;
  currency?: string | null;
  notes?: string | null;
}

export interface CustomerContact {
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  channelType?: string | null;
  channelHandle?: string | null;
}

export interface BusinessTransaction {
  id: string;
  tenantId: string;
  externalId: string;
  transactionType: string;
  status: TransactionStatusValue;
  items: TransactionItemLine[];
  customerContact: CustomerContact;
  requestedAt: string | null;
  requestedUntil: string | null;
  customerNotes: string | null;
  totalAmount: number | null;
  currency: string;
  source: string;
  statusChangedAt: string | null;
  statusNote: string | null;
  lastNotifiedAt: string | null;
  /** Transient — only present right after an action that attempted a customer notification. */
  notificationSent?: boolean | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface TransactionSummary {
  id: string;
  externalId: string;
  transactionType: string;
  status: TransactionStatusValue;
  itemCount: number;
  customerName: string | null;
  customerPhone: string | null;
  requestedAt: string | null;
  totalAmount: number | null;
  currency: string;
  source: string;
  createdAt: string;
}

export interface TransactionFilter {
  status?: TransactionStatusValue | null;
  source?: string | null;
  createdFrom?: string | null;
  createdTo?: string | null;
  search?: string | null;
  page?: number;
  pageSize?: number;
}

export interface TransactionStatusUpdateRequest {
  status: TransactionStatusValue;
  statusNote?: string | null;
  /** Defaults true server-side — automatically messages the customer on their originating channel. */
  notifyCustomer?: boolean;
}

export interface TransactionNotifyRequest {
  /** Overrides the built-in per-status message. Omit to use the default template for the current status. */
  message?: string | null;
}

export interface TransactionManualCreateRequest {
  items: TransactionItemLine[];
  customerContact: CustomerContact;
  requestedAt?: string | null;
  requestedUntil?: string | null;
  customerNotes?: string | null;
}
