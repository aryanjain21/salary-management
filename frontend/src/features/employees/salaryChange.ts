import type { SalaryChange } from '../../api/types';

/** Percentage change, only meaningful when the currency stayed the same. */
export function salaryChangePercent(change: SalaryChange): number | null {
  if (change.oldCurrency !== change.newCurrency || change.oldSalary === 0) return null;
  return ((change.newSalary - change.oldSalary) / change.oldSalary) * 100;
}
