export type ErrorCode =
  'VALIDATION_ERROR' | 'INVALID_JSON' | 'NOT_FOUND' | 'CONFLICT' | 'INTERNAL_ERROR';

export interface ErrorDetail {
  path: string;
  message: string;
}

/** An error that is safe to show to API clients. */
export class AppError extends Error {
  constructor(
    readonly status: number,
    readonly code: ErrorCode,
    message: string,
    readonly details?: ErrorDetail[],
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class ValidationError extends AppError {
  constructor(details: ErrorDetail[], message = 'Request validation failed') {
    super(400, 'VALIDATION_ERROR', message, details);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(404, 'NOT_FOUND', message);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: ErrorDetail[]) {
    super(409, 'CONFLICT', message, details);
  }
}
