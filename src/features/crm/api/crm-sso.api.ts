import { apiClient } from '@/shared/lib/api-client';
import type {
  CreateSsoConfigurationRequest,
  CrmSsoConfigurationDto,
} from '../types/crm-sso.types';

const BASE = '/v1/crm/sso';

export const crmSsoApi = {
  getAll: (): Promise<CrmSsoConfigurationDto[]> =>
    apiClient.get(BASE) as unknown as Promise<CrmSsoConfigurationDto[]>,

  create: (req: CreateSsoConfigurationRequest): Promise<CrmSsoConfigurationDto> =>
    apiClient.post(BASE, req) as unknown as Promise<CrmSsoConfigurationDto>,

  update: (
    id: string,
    req: CreateSsoConfigurationRequest
  ): Promise<CrmSsoConfigurationDto> =>
    apiClient.put(`${BASE}/${id}`, req) as unknown as Promise<CrmSsoConfigurationDto>,

  remove: (id: string): Promise<void> =>
    apiClient.delete(`${BASE}/${id}`) as unknown as Promise<void>,

  /**
   * Stamps `TestedAt` and nothing else.
   *
   * `CrmSsoService.TestConnectionAsync` loads the row, sets the timestamp and
   * saves — it never contacts the identity provider. So this records that
   * someone checked, it does not check. The UI must not render the result as
   * a passing connection test: an admin who sees a green tick and ships SSO
   * on the strength of it has been told something untrue.
   */
  recordTest: (id: string): Promise<void> =>
    apiClient.post(`${BASE}/${id}/test`, {}) as unknown as Promise<void>,
};
