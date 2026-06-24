// ─── External API credentials ────────────────────────────────────

export type ApiAuthType = 'Bearer' | 'ApiKey' | 'Basic' | 'OAuth2';

export interface ApiCredentialsStatusDto {
  configured: boolean;
  baseUrl: string | null;
  authType: ApiAuthType | null;
  healthStatus: 'Unknown' | 'Healthy' | 'Degraded' | 'Unhealthy' | null;
  lastHealthCheckAt: string | null;
}

export interface SetApiCredentialsRequest {
  baseUrl: string;
  authType: ApiAuthType;
  credentials: Record<string, string>;
}

// ─── Response-body storage ────────────────────────────────────────

export interface ResponseStorageSettingsDto {
  enabled: boolean;
}

export interface SetResponseStorageRequest {
  enabled: boolean;
}
