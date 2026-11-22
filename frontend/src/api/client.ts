import axios, { isAxiosError } from 'axios';

export interface ApiErrorDetail {
  path: string;
  message: string;
}

/** A normalized API error. Components never need to inspect axios internals. */
export class ApiError extends Error {
  readonly status: number | null;
  readonly code: string;
  readonly details: ApiErrorDetail[];

  constructor(
    message: string,
    status: number | null,
    code: string,
    details: ApiErrorDetail[] = [],
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

interface ErrorBody {
  error?: { code?: string; message?: string; details?: ApiErrorDetail[] };
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;

  if (isAxiosError<ErrorBody>(error)) {
    if (!error.response) {
      return new ApiError(
        'Cannot reach the server. Check your connection and try again.',
        null,
        'NETWORK_ERROR',
      );
    }
    const body = error.response.data?.error;
    return new ApiError(
      body?.message ?? `Request failed with status ${error.response.status}`,
      error.response.status,
      body?.code ?? 'UNKNOWN_ERROR',
      body?.details ?? [],
    );
  }

  return new ApiError(
    error instanceof Error ? error.message : 'Unexpected error',
    null,
    'UNKNOWN_ERROR',
  );
}

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api/v1',
  timeout: 15_000,
});

http.interceptors.response.use(
  (response) => response,
  (error: unknown) => Promise.reject(toApiError(error)),
);

/** Drop empty values so URLs stay clean (no `?country=&search=`). */
export function cleanParams<T extends object>(params: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''),
  ) as Partial<T>;
}
