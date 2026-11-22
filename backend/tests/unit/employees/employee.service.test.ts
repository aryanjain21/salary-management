import { beforeEach, describe, expect, it } from 'vitest';
import { NotFoundError, ValidationError } from '../../../src/errors/AppError';
import type { CreateEmployeeInput } from '../../../src/modules/employees/employee.schema';
import { EmployeeService } from '../../../src/modules/employees/employee.service';
import { InMemoryEmployeeRepository } from '../../helpers/InMemoryEmployeeRepository';

const newHire = (overrides: Partial<CreateEmployeeInput> = {}): CreateEmployeeInput => ({
  firstName: 'Priya',
  lastName: 'Sharma',
  email: 'priya.sharma@acme.example',
  jobTitle: 'Software Engineer',
  department: 'Engineering',
  country: 'IN',
  salary: 2_400_000,
  employmentType: 'FULL_TIME',
  hireDate: new Date('2024-04-01T00:00:00Z'),
  ...overrides,
});

describe('EmployeeService', () => {
  let repo: InMemoryEmployeeRepository;
  let service: EmployeeService;

  beforeEach(() => {
    repo = new InMemoryEmployeeRepository();
    service = new EmployeeService(repo);
  });

  describe('create', () => {
    it('derives currency from country and assigns the next employee code', async () => {
      const created = await service.create(newHire());

      expect(created).toMatchObject({
        employeeCode: 'EMP-00001',
        currency: 'INR',
        salary: 2_400_000,
        salaryHistory: [],
      });
    });
  });

  describe('update', () => {
    it('records a salary change with the reason', async () => {
      const { id } = await service.create(newHire());

      const updated = await service.update(id, {
        salary: 2_700_000,
        salaryChangeReason: 'Annual review',
      });

      expect(updated.salary).toBe(2_700_000);
      expect(updated.salaryHistory).toEqual([
        expect.objectContaining({
          oldSalary: 2_400_000,
          oldCurrency: 'INR',
          newSalary: 2_700_000,
          newCurrency: 'INR',
          reason: 'Annual review',
        }),
      ]);
    });

    it('does not record history when salary is unchanged', async () => {
      const { id } = await service.create(newHire());

      await service.update(id, { jobTitle: 'Senior Software Engineer' });
      const updated = await service.update(id, { salary: 2_400_000 });

      expect(updated.jobTitle).toBe('Senior Software Engineer');
      expect(updated.salaryHistory).toEqual([]);
    });

    it('stores an empty reason as null', async () => {
      const { id } = await service.create(newHire());

      const updated = await service.update(id, { salary: 2_500_000, salaryChangeReason: '' });

      expect(updated.salaryHistory[0]?.reason).toBeNull();
    });

    it('requires a new salary when moving to a country with a different currency', async () => {
      const { id } = await service.create(newHire());

      await expect(service.update(id, { country: 'US' })).rejects.toBeInstanceOf(ValidationError);
      expect((await service.get(id)).country).toBe('IN');
    });

    it('switches currency and records both currencies on relocation', async () => {
      const { id } = await service.create(newHire());

      const updated = await service.update(id, {
        country: 'US',
        salary: 120_000,
        salaryChangeReason: 'Relocated to New York',
      });

      expect(updated).toMatchObject({ country: 'US', currency: 'USD', salary: 120_000 });
      expect(updated.salaryHistory[0]).toMatchObject({
        oldSalary: 2_400_000,
        oldCurrency: 'INR',
        newSalary: 120_000,
        newCurrency: 'USD',
      });
    });
  });

  describe('not found', () => {
    it.each([
      ['get', (s: EmployeeService) => s.get(99)],
      ['update', (s: EmployeeService) => s.update(99, { salary: 1 })],
      ['delete', (s: EmployeeService) => s.delete(99)],
    ])('%s throws NotFoundError for an unknown id', async (_name, call) => {
      await expect(call(service)).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  it('delete removes the employee', async () => {
    const { id } = await service.create(newHire());

    await service.delete(id);

    expect(repo.employees).toHaveLength(0);
  });
});
