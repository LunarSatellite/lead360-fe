/**
 * Per-user mailbox connections that feed 1:1 email into the CRM.
 *
 * Mirrors `CrmEmailIntegrationController` (`/v1/crm/email-integrations`) and
 * `CrmEmailDtos.cs`.
 *
 * These enums arrive as **numbers**, unlike the GDPR and SSO ones: those DTOs
 * are records that call `.ToString()` on the way out, these are plain classes
 * serialised straight. Typing them as strings here would produce a badge that
 * is silently always blank.
 */

export const EmailProvider = { Gmail: 1, Outlook: 2 } as const;
export type EmailProvider = (typeof EmailProvider)[keyof typeof EmailProvider];

export const EMAIL_PROVIDER_LABEL: Record<EmailProvider, string> = {
  [EmailProvider.Gmail]: 'Gmail',
  [EmailProvider.Outlook]: 'Outlook',
};

export const EmailIntegrationStatus = {
  Active: 1,
  Paused: 2,
  Error: 3,
  Disconnected: 4,
} as const;
export type EmailIntegrationStatus =
  (typeof EmailIntegrationStatus)[keyof typeof EmailIntegrationStatus];

export const EMAIL_STATUS_LABEL: Record<EmailIntegrationStatus, string> = {
  [EmailIntegrationStatus.Active]: 'Active',
  [EmailIntegrationStatus.Paused]: 'Paused',
  [EmailIntegrationStatus.Error]: 'Error',
  [EmailIntegrationStatus.Disconnected]: 'Disconnected',
};

export interface EmailIntegrationSummaryDto {
  id: string;
  userId: string;
  provider: EmailProvider;
  email: string;
  status: EmailIntegrationStatus;
  lastSyncedAt: string | null;
  createdAt: string;
}

export interface EmailConnectUrlDto {
  authUrl: string;
  state: string;
}

export interface EmailSyncResultDto {
  integrationId: string;
  email: string;
  provider: EmailProvider;
  emailsProcessed: number;
  signalsCreated: number;
  skipped: number;
  syncedAt: string;
  error: string | null;
}
