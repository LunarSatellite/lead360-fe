export const TENANT_DOMAIN_STATUS = {
  Pending: 0,
  Verified: 1,
  Active: 2,
  Failed: 3,
  Disabled: 4,
} as const;

export type TenantDomainStatus =
  (typeof TENANT_DOMAIN_STATUS)[keyof typeof TENANT_DOMAIN_STATUS];

export interface TenantDomainDto {
  id: string;
  tenantId: string;
  domain: string;
  status: TenantDomainStatus;
  verifiedAt: string | null;
  lastVerificationAttemptAt: string | null;
  certExpiresAt: string | null;
  notes: string | null;
  createdAt: string;
}

export interface DnsTxtRecord {
  host: string;
  value: string;
}

export interface TenantDomainCreatedDto {
  domain: TenantDomainDto;
  dnsRecord: DnsTxtRecord;
}

export interface AddTenantDomainRequest {
  domain: string;
}

export interface UploadTenantDomainCertificateRequest {
  certificatePem: string;
  privateKeyPem: string;
}

export function getActiveTenantDomainOrigin(domains: TenantDomainDto[] | undefined): string | null {
  const activeDomain = domains?.find((domain) => domain.status === TENANT_DOMAIN_STATUS.Active);
  return activeDomain ? `https://${activeDomain.domain}` : null;
}
