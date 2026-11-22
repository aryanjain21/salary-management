import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildEmployee, insertEmployees } from '../helpers/fixtures';
import { createTestApp } from '../helpers/testApp';

describe('insights and meta API', () => {
  let ctx: Awaited<ReturnType<typeof createTestApp>>;

  beforeAll(async () => {
    ctx = await createTestApp();
    await insertEmployees(ctx.db.prisma, [
      buildEmployee({ country: 'IN', salary: 2_000_000 }),
      buildEmployee({ country: 'IN', salary: 3_000_000 }),
      buildEmployee({ country: 'IN', salary: 1_000_000, jobTitle: 'QA Engineer' }),
      buildEmployee({ country: 'US', salary: 100_000 }),
      buildEmployee({ country: 'US', salary: 140_000 }),
      buildEmployee({
        country: 'US',
        salary: 80_000,
        department: 'Sales',
        jobTitle: 'Account Executive',
      }),
    ]);
  });
  afterAll(() => ctx.db.destroy());

  const get = (path: string, query: Record<string, string | number> = {}) =>
    request(ctx.app).get(`/api/v1${path}`).query(query);

  it('GET /insights/summary', async () => {
    const res = await get('/insights/summary');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ headcount: 6, countries: 2, departments: 2 });
  });

  it('GET /insights/by-country', async () => {
    const res = await get('/insights/by-country');

    expect(res.body.map((c: { country: string; median: number }) => [c.country, c.median])).toEqual(
      [
        ['IN', 2_000_000],
        ['US', 100_000],
      ],
    );
  });

  it('GET /insights/by-job-title answers "average pay for a title in a country"', async () => {
    const res = await get('/insights/by-job-title', { country: 'US' });

    expect(res.body.currency).toBe('USD');
    expect(res.body.groups).toEqual([
      expect.objectContaining({ name: 'Software Engineer', headcount: 2, average: 120_000 }),
      expect.objectContaining({ name: 'Account Executive', headcount: 1, average: 80_000 }),
    ]);
  });

  it('GET /insights/by-department filters by country', async () => {
    const res = await get('/insights/by-department', { country: 'IN' });

    expect(res.body).toMatchObject({ country: 'IN', currency: 'INR' });
    expect(res.body.groups).toHaveLength(1);
  });

  it('GET /insights/distribution returns buckets that cover every employee', async () => {
    const res = await get('/insights/distribution', { country: 'IN', buckets: 5 });

    const counted = res.body.buckets.reduce(
      (sum: number, b: { count: number }) => sum + b.count,
      0,
    );
    expect(counted).toBe(3);
  });

  it('rejects invalid insight filters', async () => {
    expect((await get('/insights/distribution', { buckets: 1 })).status).toBe(400);
    expect((await get('/insights/by-job-title', { country: 'ZZ' })).status).toBe(400);
  });

  it('GET /meta returns reference data for filters and forms', async () => {
    const res = await get('/meta');

    expect(res.status).toBe(200);
    expect(res.body.countries).toHaveLength(8);
    expect(res.body.departments).toEqual(['Engineering', 'Sales']);
    expect(res.body.jobTitles).toEqual(['Account Executive', 'QA Engineer', 'Software Engineer']);
    expect(res.body.employmentTypes).toEqual(['FULL_TIME', 'PART_TIME', 'CONTRACT']);
    expect(res.body.currency.ratesAsOf).toBe('2026-01-01');
  });
});
