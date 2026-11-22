import type { PrismaClient } from '@prisma/client';
import type { InsightFilters, InsightsRepository, SalaryRow } from './insights.types';

export class PrismaInsightsRepository implements InsightsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Fetch only the five columns insights need. Filters use the
   * (country, jobTitle), country and department indexes.
   */
  salaryRows(filters: InsightFilters): Promise<SalaryRow[]> {
    return this.prisma.employee.findMany({
      where: {
        ...(filters.country ? { country: filters.country } : {}),
        ...(filters.department ? { department: filters.department } : {}),
        ...(filters.jobTitle ? { jobTitle: filters.jobTitle } : {}),
      },
      select: { country: true, currency: true, department: true, jobTitle: true, salary: true },
    });
  }
}
