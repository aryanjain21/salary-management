import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { buildEmployee, insertEmployees } from '../helpers/fixtures';
import { createTestApp } from '../helpers/testApp';

const payload = {
  firstName: 'Priya',
  lastName: 'Sharma',
  email: 'priya.sharma@acme.example',
  jobTitle: 'Software Engineer',
  department: 'Engineering',
  country: 'IN',
  salary: 2_400_000,
  employmentType: 'FULL_TIME',
  hireDate: '2024-04-01',
};

describe('employee write API', () => {
  let ctx: Awaited<ReturnType<typeof createTestApp>>;

  beforeAll(async () => {
    ctx = await createTestApp();
  });
  beforeEach(() => ctx.db.reset());
  afterAll(() => ctx.db.destroy());

  describe('POST /api/v1/employees', () => {
    it('creates an employee with derived currency and next code', async () => {
      await insertEmployees(ctx.db.prisma, [buildEmployee({ employeeCode: 'EMP-00041' })]);

      const res = await request(ctx.app).post('/api/v1/employees').send(payload);

      expect(res.status).toBe(201);
      expect(res.headers.location).toBe(`/api/v1/employees/${res.body.id}`);
      expect(res.body).toMatchObject({
        employeeCode: 'EMP-00042',
        currency: 'INR',
        hireDate: '2024-04-01',
        salaryHistory: [],
      });
    });

    it('returns 400 with field details for invalid input', async () => {
      const res = await request(ctx.app)
        .post('/api/v1/employees')
        .send({ ...payload, salary: -5, email: 'nope' });

      expect(res.status).toBe(400);
      expect(res.body.error.details.map((d: { path: string }) => d.path).sort()).toEqual([
        'email',
        'salary',
      ]);
    });

    it('returns 409 when the email already exists', async () => {
      await request(ctx.app).post('/api/v1/employees').send(payload);

      const res = await request(ctx.app)
        .post('/api/v1/employees')
        .send({ ...payload, email: 'PRIYA.SHARMA@acme.example' });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('CONFLICT');
    });
  });

  describe('PATCH /api/v1/employees/:id', () => {
    it('updates salary and exposes the change in history', async () => {
      const { body: created } = await request(ctx.app).post('/api/v1/employees').send(payload);

      const res = await request(ctx.app)
        .patch(`/api/v1/employees/${created.id}`)
        .send({ salary: 2_700_000, salaryChangeReason: 'Promotion' });

      expect(res.status).toBe(200);
      expect(res.body.salary).toBe(2_700_000);

      const detail = await request(ctx.app).get(`/api/v1/employees/${created.id}`);
      expect(detail.body.salaryHistory).toHaveLength(1);
      expect(detail.body.salaryHistory[0]).toMatchObject({
        oldSalary: 2_400_000,
        newSalary: 2_700_000,
        reason: 'Promotion',
      });
    });

    it('rejects a currency-changing move without a new salary', async () => {
      const { body: created } = await request(ctx.app).post('/api/v1/employees').send(payload);

      const res = await request(ctx.app)
        .patch(`/api/v1/employees/${created.id}`)
        .send({ country: 'GB' });

      expect(res.status).toBe(400);
      expect(res.body.error.details[0].path).toBe('salary');
    });

    it('returns 404 for an unknown employee', async () => {
      const res = await request(ctx.app).patch('/api/v1/employees/999').send({ salary: 1 });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/v1/employees/:id', () => {
    it('deletes the employee and its salary history', async () => {
      const { body: created } = await request(ctx.app).post('/api/v1/employees').send(payload);
      await request(ctx.app).patch(`/api/v1/employees/${created.id}`).send({ salary: 2_500_000 });

      const res = await request(ctx.app).delete(`/api/v1/employees/${created.id}`);

      expect(res.status).toBe(204);
      expect((await request(ctx.app).get(`/api/v1/employees/${created.id}`)).status).toBe(404);
      expect(await ctx.db.prisma.salaryChange.count()).toBe(0);
    });

    it('returns 404 when the employee does not exist', async () => {
      expect((await request(ctx.app).delete('/api/v1/employees/999')).status).toBe(404);
    });
  });
});
