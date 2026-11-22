import { NotFoundError } from '../../errors/AppError';
import {
  toEmployeeDetailDto,
  toEmployeeDto,
  type EmployeeDetailDto,
  type EmployeeDto,
} from './employee.mapper';
import type { EmployeeRepository, ListEmployeesParams } from './employee.types';

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
    const employee = await this.repo.findById(id);
    if (!employee) {
      throw new NotFoundError(`Employee ${id} not found`);
    }
    return toEmployeeDetailDto(employee);
  }
}
