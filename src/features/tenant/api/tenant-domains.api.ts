import { apiClient } from '@/shared/lib/api-client';
import type {
  AddTenantDomainRequest,
  TenantDomainCreatedDto,
  TenantDomainDto,
  TenantDomainStatus,
  UploadTenantDomainCertificateRequest,
} from '../types/tenant-domain.types';

const BASE = '/v1/tenant/domains';

export const tenantDomainsApi = {
  list: (): Promise<TenantDomainDto[]> =>
    apiClient.get<TenantDomainDto[]>(BASE) as unknown as Promise<TenantDomainDto[]>,

  add: (request: AddTenantDomainRequest): Promise<TenantDomainCreatedDto> =>
    apiClient.post<TenantDomainCreatedDto>(BASE, request) as unknown as Promise<TenantDomainCreatedDto>,

  remove: (domainId: string): Promise<void> =>
    apiClient.delete<void>(`${BASE}/${domainId}`) as unknown as Promise<void>,

  setStatus: (domainId: string, status: TenantDomainStatus): Promise<void> =>
    apiClient.patch<void>(`${BASE}/${domainId}/status`, { status }) as unknown as Promise<void>,

  uploadCertificate: (
    domainId: string,
    request: UploadTenantDomainCertificateRequest,
  ): Promise<TenantDomainDto> =>
    apiClient.put<TenantDomainDto>(`${BASE}/${domainId}/certificate`, request) as unknown as Promise<TenantDomainDto>,
} as const;
