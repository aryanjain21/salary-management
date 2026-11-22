import type { Prisma, PrismaClient } from '@prisma/client';
import type {
  EmployeeChanges,
  EmployeeFilters,
  EmployeeRecord,
  EmployeeRepository,
  EmployeeWithHistory,
  ListEmployeesParams,
  NewEmployee,
  NewSalaryChange,
} from './employee.types';

const CODE_PREFIX = 'EMP-';
const CODE_DIGITS = 5;

/**
 * Each whitespace-separated search term must match at least one of the
 * searchable columns, so "priya sharma" finds Priya Sharma. SQLite's LIKE
 * (used by Prisma's `contains`) is case-insensitive for ASCII.
 */
export function buildEmployeeWhere(filters: EmployeeFilters): Prisma.EmployeeWhereInput {
  const terms = filters.search?.trim().split(/\s+/).filter(Boolean) ?? [];

  return {
    ...(filters.country ? { country: filters.country } : {}),
    ...(filters.department ? { department: filters.department } : {}),
    ...(filters.jobTitle ? { jobTitle: filters.jobTitle } : {}),
    ...(terms.length > 0
      ? {
          AND: terms.map((term) => ({
            OR: [
              { firstName: { contains: term } },
              { lastName: { contains: term } },
              { email: { contains: term } },
              { employeeCode: { contains: term } },
            ],
          })),
        }
      : {}),
  };
}

export class PrismaEmployeeRepository implements EmployeeRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async list(params: ListEmployeesParams): Promise<{ items: EmployeeRecord[]; total: number }> {
    const where = buildEmployeeWhere(params);
    const [items, total] = await this.prisma.$transaction([
      this.prisma.employee.findMany({
        where,
        // Secondary sort on id keeps pagination stable when values tie.
        orderBy: [{ [params.sortBy]: params.sortOrder }, { id: 'asc' }],
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
      }),
      this.prisma.employee.count({ where }),
    ]);
    return { items, total };
  }

  findById(id: number): Promise<EmployeeWithHistory | null> {
    return this.prisma.employee.findUnique({
      where: { id },
      include: { salaryChanges: { orderBy: [{ changedAt: 'desc' }, { id: 'desc' }] } },
    });
  }

  create(data: NewEmployee): Promise<EmployeeRecord> {
    return this.prisma.employee.create({ data });
  }

  async update(
    id: number,
    changes: EmployeeChanges,
    salaryChange?: NewSalaryChange,
  ): Promise<EmployeeRecord> {
    return this.prisma.$transaction(async (tx) => {
      const employee = await tx.employee.update({ where: { id }, data: changes });
      if (salaryChange) {
        await tx.salaryChange.create({ data: { ...salaryChange, employeeId: id } });
      }
      return employee;
    });
  }

  async delete(id: number): Promise<void> {
    await this.prisma.employee.delete({ where: { id } });
  }

  async nextEmployeeCode(): Promise<string> {
    // Codes are zero-padded, so lexical order equals numeric order.
    const last = await this.prisma.employee.findFirst({
      where: { employeeCode: { startsWith: CODE_PREFIX } },
      orderBy: { employeeCode: 'desc' },
      select: { employeeCode: true },
    });
    const lastNumber = last ? Number(last.employeeCode.slice(CODE_PREFIX.length)) : 0;
    return `${CODE_PREFIX}${String(lastNumber + 1).padStart(CODE_DIGITS, '0')}`;
  }
}
