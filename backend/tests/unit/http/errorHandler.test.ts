import { Prisma } from '@prisma/client';
import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { ConflictError, NotFoundError } from '../../../src/errors/AppError';
import { parseInput } from '../../../src/http/validation';
import { createErrorHandler } from '../../../src/middleware/errorHandler';
import { silentLogger } from '../../helpers/logger';

/** Build a tiny app whose only route throws the given error. */
function appThrowing(error: unknown) {
  const app = express();
  app.use(express.json());
  app.post('/boom', () => {
    throw error;
  });
  app.use(createErrorHandler(silentLogger));
  return app;
}

describe('error handler', () => {
  it('renders AppErrors with their status and code', async () => {
    const res = await request(appThrowing(new NotFoundError('Employee 7 not found'))).post('/boom');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: { code: 'NOT_FOUND', message: 'Employee 7 not found' } });
  });

  it('renders validation errors with field details', async () => {
    let error: unknown;
    try {
      parseInput(z.object({ salary: z.number().positive() }), { salary: -1 });
    } catch (e) {
      error = e;
    }

    const res = await request(appThrowing(error)).post('/boom');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details).toEqual([{ path: 'salary', message: expect.any(String) }]);
  });

  it('maps Prisma unique-constraint violations to 409', async () => {
    const prismaError = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: 'test',
      meta: { target: ['email'] },
    });

    const res = await request(appThrowing(prismaError)).post('/boom');

    expect(res.status).toBe(409);
    expect(res.body.error).toMatchObject({
      code: 'CONFLICT',
      details: [{ path: 'email', message: 'Must be unique' }],
    });
  });

  it('maps Prisma record-not-found to 404', async () => {
    const prismaError = new Prisma.PrismaClientKnownRequestError('Not found', {
      code: 'P2025',
      clientVersion: 'test',
    });

    const res = await request(appThrowing(prismaError)).post('/boom');

    expect(res.status).toBe(404);
  });

  it('returns 400 for malformed JSON bodies', async () => {
    const res = await request(appThrowing(new ConflictError('unused')))
      .post('/boom')
      .set('Content-Type', 'application/json')
      .send('{"broken":');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_JSON');
  });

  it('hides internal error details behind a generic 500', async () => {
    const res = await request(appThrowing(new Error('db password is hunter2'))).post('/boom');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
    });
  });
});
