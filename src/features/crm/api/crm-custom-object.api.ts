import { apiClient } from '@/shared/lib/api-client';
import type { PagedResult } from '@/shared/types';
import type {
  CreateCustomObjectDefinitionRequest,
  CreateCustomObjectFieldRequest,
  CrmCustomObjectDefinitionDto,
  CrmCustomObjectDetailDto,
  CrmCustomObjectFieldDto,
} from '../types/crm-custom-object.types';

const BASE = '/v1/crm/custom-objects';

export const crmCustomObjectApi = {
  getDefinitions: (
    page = 1,
    pageSize = 50
  ): Promise<PagedResult<CrmCustomObjectDefinitionDto>> =>
    apiClient.get(`${BASE}/definitions`, { params: { page, pageSize } }) as unknown as Promise<
      PagedResult<CrmCustomObjectDefinitionDto>
    >,

  /** The only call that carries the field list — the paged one does not. */
  getDefinition: (id: string): Promise<CrmCustomObjectDetailDto> =>
    apiClient.get(`${BASE}/definitions/${id}`) as unknown as Promise<CrmCustomObjectDetailDto>,

  createDefinition: (
    req: CreateCustomObjectDefinitionRequest
  ): Promise<CrmCustomObjectDefinitionDto> =>
    apiClient.post(`${BASE}/definitions`, req) as unknown as Promise<CrmCustomObjectDefinitionDto>,

  deleteDefinition: (id: string): Promise<void> =>
    apiClient.delete(`${BASE}/definitions/${id}`) as unknown as Promise<void>,

  /**
   * The controller overwrites `objectDefinitionId` from the route, so the two
   * cannot disagree; it is sent anyway because the request record requires it.
   */
  addField: (
    objectDefId: string,
    req: CreateCustomObjectFieldRequest
  ): Promise<CrmCustomObjectFieldDto> =>
    apiClient.post(
      `${BASE}/definitions/${objectDefId}/fields`,
      req
    ) as unknown as Promise<CrmCustomObjectFieldDto>,
};
