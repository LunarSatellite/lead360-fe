/**
 * Tenant SSO configurations.
 *
 * Mirrors `CrmSsoController` / `CrmAdminDtos.cs`. `Provider` crosses the wire
 * as the enum *name* (`s.Provider.ToString()`), so it is a string union here.
 *
 * Note what the response does not carry: `clientSecret` and `x509Certificate`
 * are accepted on create and update and never returned, which is correct and
 * means the edit form cannot pre-fill them — leaving a secret field blank on
 * edit has to mean "keep the stored one".
 */

/** `SsoProvider` in `CrmEnums.cs`. */
export type SsoProvider =
  | 'AzureAD'
  | 'Okta'
  | 'GoogleWorkspace'
  | 'Saml2'
  | 'OpenIdConnect';

export const SSO_PROVIDERS: readonly SsoProvider[] = [
  'AzureAD',
  'Okta',
  'GoogleWorkspace',
  'Saml2',
  'OpenIdConnect',
];

export const SSO_PROVIDER_LABEL: Record<SsoProvider, string> = {
  AzureAD: 'Microsoft Entra ID (Azure AD)',
  Okta: 'Okta',
  GoogleWorkspace: 'Google Workspace',
  Saml2: 'SAML 2.0',
  OpenIdConnect: 'OpenID Connect',
};

/** SAML takes a metadata URL and a certificate; the OIDC family takes a client. */
export const IS_SAML: Record<SsoProvider, boolean> = {
  AzureAD: false,
  Okta: false,
  GoogleWorkspace: false,
  Saml2: true,
  OpenIdConnect: false,
};

export interface CrmSsoConfigurationDto {
  id: string;
  name: string;
  provider: SsoProvider;
  clientId: string | null;
  authorityUrl: string | null;
  metadataUrl: string | null;
  isActive: boolean;
  enforceForAllUsers: boolean;
  testedAt: string | null;
  createdAt: string;
}

export interface CreateSsoConfigurationRequest {
  name: string;
  provider: SsoProvider;
  clientId?: string | null;
  clientSecret?: string | null;
  authorityUrl?: string | null;
  metadataUrl?: string | null;
  x509Certificate?: string | null;
  claimsMappingJson?: string | null;
  enforceForAllUsers?: boolean;
}
