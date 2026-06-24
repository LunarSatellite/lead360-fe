import { apiClient } from '@/shared/lib/api-client';

const BASE = '/v1/video-conferencing';

export type VideoProvider = 1 | 2 | 3 | 4 | 5; // Zoom=1, GoogleMeet=2, Teams=3, Webex=4, GoToMeeting=5

export const PROVIDER_LABELS: Record<VideoProvider, string> = {
  1: 'Zoom',
  2: 'Google Meet',
  3: 'Microsoft Teams',
  4: 'Webex',
  5: 'GoToMeeting',
};

export interface VideoConferencingIntegrationDto {
  id: string;
  provider: VideoProvider;
  providerName: string;
  isActive: boolean;
  providerEmail?: string;
  providerAccountName?: string;
  hasValidToken: boolean;
  totalMeetingsCreated: number;
  lastUsedAt?: string;
  connectedAt: string;
}

export interface VideoConferencingStatusDto {
  connected: VideoConferencingIntegrationDto[];
  /** Configured by platform + not yet connected — show Connect button. */
  available: VideoProvider[];
  /** ClientId not set in appsettings — show disabled/unavailable state. */
  notConfigured: VideoProvider[];
  defaultProvider?: VideoProvider;
}

// The response interceptor in api-client.ts unwraps ServiceResult<T> and plain responses,
// so each call resolves to the payload type directly (not AxiosResponse<T>).
export const videoConferencingApi = {
  getStatus: (): Promise<VideoConferencingStatusDto> =>
    apiClient.get(`${BASE}/status`) as any,

  getAuthorizationUrl: (provider: VideoProvider, redirectUri: string): Promise<{ authorizationUrl: string }> =>
    apiClient.get(`${BASE}/connect/${provider}`, { params: { redirectUri } }) as any,

  disconnect: (provider: VideoProvider): Promise<void> =>
    apiClient.delete(`${BASE}/${provider}`) as any,

  setDefault: (provider: VideoProvider): Promise<void> =>
    apiClient.put(`${BASE}/${provider}/default`) as any,
} as const;
