import type { EmploymentType } from '../api/types';

const moneyFormatters = new Map<string, Intl.NumberFormat>();

/** Format a whole-unit amount, e.g. formatMoney(2400000, 'INR') → "₹2,400,000". */
export function formatMoney(
  amount: number | null | undefined,
  currency: string,
  { compact = false }: { compact?: boolean } = {},
): string {
  if (amount === null || amount === undefined) return '—';
  const key = `${currency}:${compact}`;
  let formatter = moneyFormatters.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      notation: compact ? 'compact' : 'standard',
      maximumFractionDigits: compact ? 1 : 0,
    });
    moneyFormatters.set(key, formatter);
  }
  return formatter.format(amount);
}

const numberFormatter = new Intl.NumberFormat('en-US');

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
});

/** Format a YYYY-MM-DD date or ISO timestamp, e.g. "Apr 1, 2024". */
export function formatDate(value: string): string {
  const date = new Date(value.length === 10 ? `${value}T00:00:00Z` : value);
  return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date);
}

const EMPLOYMENT_LABELS: Record<EmploymentType, string> = {
  FULL_TIME: 'Full-time',
  PART_TIME: 'Part-time',
  CONTRACT: 'Contract',
};

export function employmentTypeLabel(type: EmploymentType): string {
  return EMPLOYMENT_LABELS[type] ?? type;
}
