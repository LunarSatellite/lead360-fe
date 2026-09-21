import { ApiError } from '@/shared/lib/api-client';

export interface NormalizedApiError {
  /** Human-readable headline message, always present. */
  message: string;
  /** Backend error code, if any (e.g. for branching on Conflict). */
  errorCode?: string;
  /** HTTP status, if known. */
  status?: number;
  /** Field/detail-level errors the backend returned. */
  errors: string[];
}

/**
 * The single, typed way to read an error in any mutation/query handler.
 * Replaces the ~50 ad-hoc `(err as any)?.response?.data?.message` extractions.
 *
 *   onError: (err) => { const { message, errors } = getApiError(err); ... }
 */
export function getApiError(err: unknown, fallback = 'Something went wrong.'): NormalizedApiError {
  if (err instanceof ApiError) {
    return {
      message: err.message || fallback,
      errorCode: err.errorCode,
      status: err.status,
      errors: err.errors ?? [],
    };
  }
  if (err instanceof Error) {
    return { message: err.message || fallback, errors: [] };
  }
  if (typeof err === 'string' && err.trim()) {
    return { message: err, errors: [] };
  }
  return { message: fallback, errors: [] };
}

/** True when the error is a 409 Conflict (e.g. the duplicate-contact guard). */
export function isConflict(err: unknown): boolean {
  return err instanceof ApiError && err.status === 409;
}
