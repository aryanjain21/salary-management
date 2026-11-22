import { currencyForCountry } from '../../domain/countries';
import { NotFoundError, ValidationError } from '../../errors/AppError';
import {
  toEmployeeDetailDto,
  toEmployeeDto,
  type EmployeeDetailDto,
  type EmployeeDto,
} from './employee.mapper';
import type { CreateEmployeeInput, UpdateEmployeeInput } from './employee.schema';
import type {
  EmployeeRepository,
  EmployeeWithHistory,
  ListEmployeesParams,
  NewSalaryChange,
} from './employee.types';

export interface Paginated<T> {
  data: T[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}

export class EmployeeService {
  constructor(private readonly repo: EmployeeRepository) {}

  async list(params: ListEmployeesParams): Promise<Paginated<EmployeeDto>> {
    const { items, total } = await this.repo.list(params);
    return {
      data: items.map(toEmployeeDto),
      meta: {
        page: params.page,
        pageSize: params.pageSize,
        total,
        totalPages: Math.ceil(total / params.pageSize),
      },
    };
  }

  async get(id: number): Promise<EmployeeDetailDto> {
    return toEmployeeDetailDto(await this.findOrThrow(id));
  }

  async create(input: CreateEmployeeInput): Promise<EmployeeDetailDto> {
    const employee = await this.repo.create({
      ...input,
      currency: currencyForCountry(input.country),
      employeeCode: await this.repo.nextEmployeeCode(),
    });
    return toEmployeeDetailDto({ ...employee, salaryChanges: [] });
  }

  /**
   * Business rules:
   * - Currency always follows country.
   * - Moving to a country with a different currency requires a new salary,
   *   otherwise the old amount would silently be reinterpreted (INR → USD).
   * - Any change to the salary amount or currency is recorded in the history.
   */
  async update(id: number, input: UpdateEmployeeInput): Promise<EmployeeDetailDto> {
    const existing = await this.findOrThrow(id);
    const { salaryChangeReason, ...fields } = input;

    const newCurrency = currencyForCountry(fields.country ?? existing.country);
    const currencyChanged = newCurrency !== existing.currency;

    if (currencyChanged && fields.salary === undefined) {
      throw new ValidationError([
        {
          path: 'salary',
          message: `A new salary in ${newCurrency} is required when moving to a country with a different currency`,
        },
      ]);
    }

    const newSalary = fields.salary ?? existing.salary;
    const salaryChange: NewSalaryChange | undefined =
      newSalary !== existing.salary || currencyChanged
        ? {
            oldSalary: existing.salary,
            oldCurrency: existing.currency,
            newSalary,
            newCurrency,
            reason: salaryChangeReason || null,
          }
        : undefined;

    await this.repo.update(id, { ...fields, currency: newCurrency }, salaryChange);
    return this.get(id);
  }

  async delete(id: number): Promise<void> {
    await this.findOrThrow(id);
    await this.repo.delete(id);
  }

  private async findOrThrow(id: number): Promise<EmployeeWithHistory> {
    const employee = await this.repo.findById(id);
    if (!employee) {
      throw new NotFoundError(`Employee ${id} not found`);
    }
    return employee;
  }
}
