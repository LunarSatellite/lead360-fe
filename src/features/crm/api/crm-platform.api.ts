import { apiClient } from '@/shared/lib/api-client';
import type { PagedResult } from '@/shared/types';
import type {
  CreateFormulaFieldRequest,
  CreateRollupSummaryRequest,
  CreateValidationRuleRequest,
  CrmFormulaFieldDto,
  CrmRollupSummaryDto,
  CrmValidationRuleDto,
} from '../types/crm-platform.types';

export const crmValidationRuleApi = {
  list: (
    entityType?: string,
    page = 1,
    pageSize = 50
  ): Promise<PagedResult<CrmValidationRuleDto>> =>
    apiClient.get('/v1/crm/validation-rules', {
      params: { entityType, page, pageSize },
    }) as unknown as Promise<PagedResult<CrmValidationRuleDto>>,

  create: (req: CreateValidationRuleRequest): Promise<CrmValidationRuleDto> =>
    apiClient.post('/v1/crm/validation-rules', req) as unknown as Promise<CrmValidationRuleDto>,

  remove: (id: string): Promise<void> =>
    apiClient.delete(`/v1/crm/validation-rules/${id}`) as unknown as Promise<void>,
};

export const crmFormulaFieldApi = {
  list: (
    entityType?: string,
    page = 1,
    pageSize = 50
  ): Promise<PagedResult<CrmFormulaFieldDto>> =>
    apiClient.get('/v1/crm/formula-fields', {
      params: { entityType, page, pageSize },
    }) as unknown as Promise<PagedResult<CrmFormulaFieldDto>>,

  create: (req: CreateFormulaFieldRequest): Promise<CrmFormulaFieldDto> =>
    apiClient.post('/v1/crm/formula-fields', req) as unknown as Promise<CrmFormulaFieldDto>,

  remove: (id: string): Promise<void> =>
    apiClient.delete(`/v1/crm/formula-fields/${id}`) as unknown as Promise<void>,
};

export const crmRollupApi = {
  /** No entityType filter on this one — the controller does not take one. */
  list: (page = 1, pageSize = 50): Promise<PagedResult<CrmRollupSummaryDto>> =>
    apiClient.get('/v1/crm/rollups', {
      params: { page, pageSize },
    }) as unknown as Promise<PagedResult<CrmRollupSummaryDto>>,

  create: (req: CreateRollupSummaryRequest): Promise<CrmRollupSummaryDto> =>
    apiClient.post('/v1/crm/rollups', req) as unknown as Promise<CrmRollupSummaryDto>,

  remove: (id: string): Promise<void> =>
    apiClient.delete(`/v1/crm/rollups/${id}`) as unknown as Promise<void>,
};
