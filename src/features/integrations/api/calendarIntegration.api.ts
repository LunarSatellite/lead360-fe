import { apiClient } from '@/shared/lib/api-client';

const BASE = '/v1/calendar';

export interface CalendarIntegrationDto {
  id: string;
  isActive: boolean;
  connectedEmail?: string;
  hasValidToken: boolean;
  connectedAt: string;
}

export interface CalendarIntegrationStatusDto {
  isConnected: boolean;
  integration?: CalendarIntegrationDto;
}

export const calendarIntegrationApi = {
  getStatus: (): Promise<CalendarIntegrationStatusDto> =>
    apiClient.get(`${BASE}/status`) as any,

  getAuthorizationUrl: (redirectUri: string): Promise<{ authorizationUrl: string }> =>
    apiClient.get(`${BASE}/connect`, { params: { redirectUri } }) as any,

  disconnect: (): Promise<void> =>
    apiClient.delete(`${BASE}`) as any,
} as const;
