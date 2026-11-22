import type { ZodType, z } from 'zod';
import { ValidationError, type ErrorDetail } from '../errors/AppError';

export function toErrorDetails(issues: z.core.$ZodIssue[]): ErrorDetail[] {
  return issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
  }));
}

/**
 * Parse untrusted request input with a zod schema. Throws a ValidationError
 * (rendered as HTTP 400) so controllers only ever see typed, valid data.
 */
export function parseInput<S extends ZodType>(schema: S, input: unknown): z.output<S> {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new ValidationError(toErrorDetails(result.error.issues));
  }
  return result.data;
}
