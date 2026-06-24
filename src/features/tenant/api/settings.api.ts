import { apiClient } from '@/shared/lib/api-client';
import type {
  ApiCredentialsStatusDto,
  SetApiCredentialsRequest,
  ResponseStorageSettingsDto,
  SetResponseStorageRequest,
} from '../types/settings.types';

export const settingsApi = {
  // GET /api/v1/settings/api-credentials
  getApiCredentials: (): Promise<ApiCredentialsStatusDto> =>
    apiClient.get<ApiCredentialsStatusDto>('/v1/settings/api-credentials') as unknown as Promise<ApiCredentialsStatusDto>,

  // PUT /api/v1/settings/api-credentials
  setApiCredentials: (data: SetApiCredentialsRequest): Promise<void> =>
    apiClient.put<void>('/v1/settings/api-credentials', data) as unknown as Promise<void>,

  // DELETE /api/v1/settings/api-credentials
  deleteApiCredentials: (): Promise<void> =>
    apiClient.delete<void>('/v1/settings/api-credentials') as unknown as Promise<void>,

  // GET /api/v1/settings/response-storage
  getResponseStorage: (): Promise<ResponseStorageSettingsDto> =>
    apiClient.get<ResponseStorageSettingsDto>('/v1/settings/response-storage') as unknown as Promise<ResponseStorageSettingsDto>,

  // PUT /api/v1/settings/response-storage
  setResponseStorage: (data: SetResponseStorageRequest): Promise<void> =>
    apiClient.put<void>('/v1/settings/response-storage', data) as unknown as Promise<void>,
} as const;
