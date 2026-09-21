import { apiClient } from '@/shared/lib/api-client';
import type { CrmCsatRecordDto, CrmCsatSummaryDto } from '../types/crm-csat.types';

const BASE = '/v1/crm/csat';

export const crmCsatApi = {
  getByContact: (contactId: string): Promise<CrmCsatRecordDto[]> =>
    apiClient.get(`${BASE}/contacts/${contactId}`) as unknown as Promise<CrmCsatRecordDto[]>,

  getTenantSummary: (since?: string): Promise<CrmCsatSummaryDto> =>
    apiClient.get(`${BASE}/summary`, { params: since ? { since } : undefined }) as unknown as Promise<CrmCsatSummaryDto>,
};
