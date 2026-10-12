import { apiClient } from '@/shared/lib/api-client';
import type { PagedResult } from '@/shared/types';
import type {
  CreateDataRetentionPolicyRequest,
  CreateDataSubjectRequestRequest,
  CrmDataRetentionPolicyDto,
  CrmDataSubjectRequestDto,
} from '../types/crm-gdpr.types';

const BASE = '/v1/crm/gdpr';

export const crmGdprApi = {
  getSubjectRequests: (
    page = 1,
    pageSize = 20
  ): Promise<PagedResult<CrmDataSubjectRequestDto>> =>
    apiClient.get(`${BASE}/subject-requests`, {
      params: { page, pageSize },
    }) as unknown as Promise<PagedResult<CrmDataSubjectRequestDto>>,

  createSubjectRequest: (
    req: CreateDataSubjectRequestRequest
  ): Promise<CrmDataSubjectRequestDto> =>
    apiClient.post(
      `${BASE}/subject-requests`,
      req
    ) as unknown as Promise<CrmDataSubjectRequestDto>,

  /**
   * Marks the request Completed and stamps who handled it.
   *
   * It does not delete anything: `CrmGdprService.ProcessErasureRequestAsync`
   * sets the status, `CompletedAt`, `HandledByUserId` and a fixed
   * `ResponseNotes`, and saves. The deletion is still a manual job. The UI
   * says so rather than implying the record is gone — a button that claims an
   * erasure it did not perform is worse than no button.
   */
  markErasureProcessed: (id: string): Promise<void> =>
    apiClient.post(
      `${BASE}/subject-requests/${id}/process-erasure`,
      {}
    ) as unknown as Promise<void>,

  getRetentionPolicies: (
    page = 1,
    pageSize = 20
  ): Promise<PagedResult<CrmDataRetentionPolicyDto>> =>
    apiClient.get(`${BASE}/retention-policies`, {
      params: { page, pageSize },
    }) as unknown as Promise<PagedResult<CrmDataRetentionPolicyDto>>,

  createRetentionPolicy: (
    req: CreateDataRetentionPolicyRequest
  ): Promise<CrmDataRetentionPolicyDto> =>
    apiClient.post(
      `${BASE}/retention-policies`,
      req
    ) as unknown as Promise<CrmDataRetentionPolicyDto>,
};
