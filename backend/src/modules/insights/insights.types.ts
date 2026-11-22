/** The narrow projection of an employee that pay insights are computed from. */
export interface SalaryRow {
  country: string;
  currency: string;
  department: string;
  jobTitle: string;
  salary: number;
}

export interface InsightFilters {
  country?: string;
  department?: string;
  jobTitle?: string;
}

export interface InsightsRepository {
  salaryRows(filters: InsightFilters): Promise<SalaryRow[]>;
}

/** Rounded descriptive statistics for one group of salaries. */
export interface PayStats {
  headcount: number;
  min: number | null;
  max: number | null;
  average: number | null;
  median: number | null;
  p25: number | null;
  p75: number | null;
}
