import type {
  EmployeeChanges,
  EmployeeRecord,
  EmployeeRepository,
  EmployeeWithHistory,
  ListEmployeesParams,
  NewEmployee,
  NewSalaryChange,
  SalaryChangeRecord,
} from '../../src/modules/employees/employee.types';

/**
 * Minimal in-memory stand-in for the Prisma repository, so service business
 * rules can be unit tested without a database. Uses a fixed clock.
 */
export class InMemoryEmployeeRepository implements EmployeeRepository {
  readonly employees: EmployeeRecord[] = [];
  readonly salaryChanges: SalaryChangeRecord[] = [];
  private nextId = 1;
  private nextChangeId = 1;

  constructor(private readonly now: () => Date = () => new Date('2026-01-01T00:00:00Z')) {}

  async list(params: ListEmployeesParams) {
    const matches = this.employees.filter(
      (e) =>
        (!params.country || e.country === params.country) &&
        (!params.department || e.department === params.department) &&
        (!params.jobTitle || e.jobTitle === params.jobTitle),
    );
    const start = (params.page - 1) * params.pageSize;
    return { items: matches.slice(start, start + params.pageSize), total: matches.length };
  }

  async findById(id: number): Promise<EmployeeWithHistory | null> {
    const employee = this.employees.find((e) => e.id === id);
    if (!employee) return null;
    return {
      ...employee,
      salaryChanges: this.salaryChanges.filter((c) => c.employeeId === id).reverse(),
    };
  }

  async create(data: NewEmployee): Promise<EmployeeRecord> {
    const record: EmployeeRecord = {
      ...data,
      id: this.nextId++,
      createdAt: this.now(),
      updatedAt: this.now(),
    };
    this.employees.push(record);
    return record;
  }

  async update(id: number, changes: EmployeeChanges, salaryChange?: NewSalaryChange) {
    const index = this.employees.findIndex((e) => e.id === id);
    const current = this.employees[index];
    if (!current) throw new Error(`Employee ${id} not found`);

    const updated: EmployeeRecord = { ...current, ...changes, updatedAt: this.now() };
    this.employees[index] = updated;
    if (salaryChange) {
      this.salaryChanges.push({
        ...salaryChange,
        id: this.nextChangeId++,
        employeeId: id,
        changedAt: this.now(),
      });
    }
    return updated;
  }

  async delete(id: number): Promise<void> {
    const index = this.employees.findIndex((e) => e.id === id);
    if (index >= 0) this.employees.splice(index, 1);
  }

  async nextEmployeeCode(): Promise<string> {
    return `EMP-${String(this.employees.length + 1).padStart(5, '0')}`;
  }
}
