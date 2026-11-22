import { Prisma } from '@prisma/client';
import type { ErrorRequestHandler, RequestHandler } from 'express';
import type { Logger } from 'pino';
import { AppError, ConflictError, NotFoundError } from '../errors/AppError';

/** Translate known infrastructure errors into client-safe AppErrors. */
function toAppError(err: unknown): AppError | undefined {
  if (err instanceof AppError) return err;

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const target = (err.meta?.target as string[] | string | undefined) ?? 'field';
      const fields = Array.isArray(target) ? target : [target];
      return new ConflictError(
        `A record with this ${fields.join(', ')} already exists`,
        fields.map((path) => ({ path, message: 'Must be unique' })),
      );
    }
    if (err.code === 'P2025') {
      return new NotFoundError('Record not found');
    }
  }

  // express.json() raises this for malformed request bodies
  if (
    typeof err === 'object' &&
    err !== null &&
    (err as { type?: string }).type === 'entity.parse.failed'
  ) {
    return new AppError(400, 'INVALID_JSON', 'Request body is not valid JSON');
  }

  return undefined;
}

export function createErrorHandler(logger: Logger): ErrorRequestHandler {
  return (err, _req, res, _next) => {
    const appError = toAppError(err);

    if (!appError) {
      logger.error({ err }, 'Unhandled error');
      res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } });
      return;
    }

    res.status(appError.status).json({
      error: {
        code: appError.code,
        message: appError.message,
        ...(appError.details ? { details: appError.details } : {}),
      },
    });
  };
}

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(new NotFoundError(`Route ${req.method} ${req.path} not found`));
};
