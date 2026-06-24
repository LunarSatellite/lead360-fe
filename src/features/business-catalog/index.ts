// ═══════════════════════════════════════════════════════════════
// Business Catalog Feature — Public API (barrel)
// ═══════════════════════════════════════════════════════════════

export { BusinessCatalogPage } from './pages/BusinessCatalogPage';
export { BusinessProfileForm } from './components/BusinessProfileForm';
export { CategoryListSection } from './components/CategoryListSection';
export { ItemListSection } from './components/ItemListSection';
export { TransactionListSection } from './components/TransactionListSection';
export { TransactionDetailDialog } from './components/TransactionDetailDialog';

export type {
  BusinessProfile,
  BusinessProfileUpsertRequest,
  BusinessTypeValue,
  CatalogCategory,
  CatalogItem,
  BusinessTransaction,
  TransactionSummary,
  TransactionStatusValue,
} from './types/business-catalog.types';

export {
  BusinessType,
  TransactionStatus,
  BUSINESS_TYPE_LABEL,
  BUSINESS_TYPE_DESCRIPTION,
  TRANSACTION_STATUS_LABEL,
  TRANSACTION_STATUS_COLOR,
} from './types/business-catalog.types';

export {
  businessCatalogKeys,
  useBusinessProfile,
  useUpsertBusinessProfile,
  useCategories,
  useItems,
  useTransactions,
  useTransaction,
  useCreateManualTransaction,
  useUpdateTransactionStatus,
} from './api/business-catalog.queries';
