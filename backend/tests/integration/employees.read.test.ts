import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { EmployeeRecord } from '../../src/modules/employees/employee.types';
import { buildEmployee, insertEmployees } from '../helpers/fixtures';
import { createTestApp } from '../helpers/testApp';

describe('employee read API', () => {
  let ctx: Awaited<ReturnType<typeof createTestApp>>;
  let rows: EmployeeRecord[];

  beforeAll(async () => {
    ctx = await createTestApp();
    rows = await insertEmployees(ctx.db.prisma, [
      buildEmployee({ firstName: 'Priya', lastName: 'Sharma', country: 'IN', salary: 2_500_000 }),
      buildEmployee({
        firstName: 'Arjun',
        lastName: 'Mehta',
        country: 'IN',
        salary: 1_800_000,
        jobTitle: 'QA Engineer',
      }),
      buildEmployee({ firstName: 'Alice', lastName: 'Brown', country: 'US', salary: 150_000 }),
      buildEmployee({
        firstName: 'Bob',
        lastName: 'Adams',
        country: 'US',
        salary: 90_000,
        department: 'Sales',
        jobTitle: 'Account Executive',
      }),
      buildEmployee({ firstName: 'Clara', lastName: 'Schmidt', country: 'DE', salary: 80_000 }),
    ]);
  });
  afterAll(() => ctx.db.destroy());

  const list = (query: Record<string, string | number> = {}) =>
    request(ctx.app).get('/api/v1/employees').query(query);

  describe('GET /api/v1/employees', () => {
    it('returns the first page sorted by last name with pagination meta', async () => {
      const res = await list();

      expect(res.status).toBe(200);
      expect(res.body.meta).toEqual({ page: 1, pageSize: 25, total: 5, totalPages: 1 });
      expect(res.body.data.map((e: { lastName: string }) => e.lastName)).toEqual([
        'Adams',
        'Brown',
        'Mehta',
        'Schmidt',
        'Sharma',
      ]);
    });

    it('paginates', async () => {
      const res = await list({ page: 2, pageSize: 2 });

      expect(res.body.meta).toEqual({ page: 2, pageSize: 2, total: 5, totalPages: 3 });
      expect(res.body.data.map((e: { lastName: string }) => e.lastName)).toEqual([
        'Mehta',
        'Schmidt',
      ]);
    });

    it('filters by country (case-insensitive code)', async () => {
      const res = await list({ country: 'in' });

      expect(res.body.meta.total).toBe(2);
      expect(res.body.data.every((e: { country: string }) => e.country === 'IN')).toBe(true);
    });

    it('combines department and job title filters', async () => {
      const res = await list({ department: 'Engineering', jobTitle: 'QA Engineer' });

      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].lastName).toBe('Mehta');
    });

    it('searches across name terms case-insensitively', async () => {
      const res = await list({ search: 'priya SHARMA' });

      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].fullName).toBe('Priya Sharma');
    });

    it('searches by employee code', async () => {
      const res = await list({ search: rows[2]!.employeeCode });

      expect(res.body.data.map((e: { id: number }) => e.id)).toEqual([rows[2]!.id]);
    });

    it('sorts by salary descending', async () => {
      const res = await list({ country: 'US', sortBy: 'salary', sortOrder: 'desc' });

      expect(res.body.data.map((e: { salary: number }) => e.salary)).toEqual([150_000, 90_000]);
    });

    it('includes a USD-converted salary', async () => {
      const res = await list({ search: 'Sharma' });

      expect(res.body.data[0]).toMatchObject({
        currency: 'INR',
        salary: 2_500_000,
        salaryUsd: 29_940,
      });
    });

    it.each([
      [{ pageSize: 101 }, 'pageSize'],
      [{ page: 0 }, 'page'],
      [{ country: 'XX' }, 'country'],
      [{ sortBy: 'password' }, 'sortBy'],
    ])('rejects invalid query %o', async (query, field) => {
      const res = await list(query);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.details[0].path).toBe(field);
    });
  });

  describe('GET /api/v1/employees/:id', () => {
    it('returns the employee with an empty salary history', async () => {
      const res = await request(ctx.app).get(`/api/v1/employees/${rows[0]!.id}`);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        id: rows[0]!.id,
        fullName: 'Priya Sharma',
        hireDate: '2020-01-15',
        salaryHistory: [],
      });
    });

    it('returns 404 for an unknown id', async () => {
      const res = await request(ctx.app).get('/api/v1/employees/999999');

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('returns 400 for a non-numeric id', async () => {
      const res = await request(ctx.app).get('/api/v1/employees/abc');

      expect(res.status).toBe(400);
    });
  });
});
