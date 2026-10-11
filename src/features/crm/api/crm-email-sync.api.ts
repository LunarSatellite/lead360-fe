import { apiClient } from '@/shared/lib/api-client';
import type {
  EmailConnectUrlDto,
  EmailIntegrationSummaryDto,
  EmailProvider,
  EmailSyncResultDto,
} from '../types/crm-email-sync.types';

const BASE = '/v1/crm/email-integrations';

export const crmEmailSyncApi = {
  list: (): Promise<EmailIntegrationSummaryDto[]> =>
    apiClient.get(BASE) as unknown as Promise<EmailIntegrationSummaryDto[]>,

  /**
   * Asks the server for the provider's consent URL. Nothing is connected until
   * the provider redirects back to `redirectUri` and the callback is handled —
   * `state` ties the two halves together.
   */
  getAuthUrl: (provider: EmailProvider, redirectUri: string): Promise<EmailConnectUrlDto> =>
    apiClient.get(`${BASE}/connect/${provider}`, {
      params: { redirectUri },
    }) as unknown as Promise<EmailConnectUrlDto>,

  disconnect: (id: string): Promise<void> =>
    apiClient.delete(`${BASE}/${id}`) as unknown as Promise<void>,

  /** Incremental sync for one mailbox, on demand rather than waiting for the worker. */
  sync: (id: string): Promise<EmailSyncResultDto> =>
    apiClient.post(`${BASE}/${id}/sync`, {}) as unknown as Promise<EmailSyncResultDto>,
};
