import { http as mock, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { server } from '../test/server';
import { ApiError, cleanParams, http } from './client';

describe('http client', () => {
  it('normalizes API error bodies into ApiError', async () => {
    server.use(
      mock.post('/api/v1/employees', () =>
        HttpResponse.json(
          {
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Request validation failed',
              details: [{ path: 'salary', message: 'Salary must be greater than zero' }],
            },
          },
          { status: 400 },
        ),
      ),
    );

    const error = await http.post('/employees', {}).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 400,
      code: 'VALIDATION_ERROR',
      details: [{ path: 'salary', message: 'Salary must be greater than zero' }],
    });
  });

  it('reports network failures with a friendly message', async () => {
    server.use(mock.get('/api/v1/employees', () => HttpResponse.error()));

    const error = await http.get('/employees').catch((e: unknown) => e);

    expect(error).toMatchObject({ code: 'NETWORK_ERROR', status: null });
    expect((error as ApiError).message).toMatch(/cannot reach the server/i);
  });

  it('falls back to a generic message when the body is not our error shape', async () => {
    server.use(mock.get('/api/v1/meta', () => new HttpResponse('Bad gateway', { status: 502 })));

    const error = await http.get('/meta').catch((e: unknown) => e);

    expect(error).toMatchObject({ status: 502, code: 'UNKNOWN_ERROR' });
  });
});

describe('cleanParams', () => {
  it('drops empty values', () => {
    expect(cleanParams({ page: 1, search: '', country: undefined, sortBy: 'salary' })).toEqual({
      page: 1,
      sortBy: 'salary',
    });
  });
});
