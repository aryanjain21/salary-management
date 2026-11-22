import { describe, expect, it } from 'vitest';
import { employmentTypeLabel, formatDate, formatMoney, formatNumber } from './format';

describe('formatMoney', () => {
  it('formats whole amounts with the currency symbol', () => {
    expect(formatMoney(2_400_000, 'INR')).toBe('₹2,400,000');
    expect(formatMoney(120_000, 'USD')).toBe('$120,000');
    expect(formatMoney(85_000, 'EUR')).toBe('€85,000');
  });

  it('supports compact notation for charts and cards', () => {
    expect(formatMoney(1_250_000, 'USD', { compact: true })).toBe('$1.3M');
  });

  it('renders missing values as a dash', () => {
    expect(formatMoney(null, 'USD')).toBe('—');
  });
});

describe('formatDate', () => {
  it('formats calendar dates without timezone drift', () => {
    expect(formatDate('2024-04-01')).toBe('Apr 1, 2024');
  });

  it('formats ISO timestamps', () => {
    expect(formatDate('2026-01-15T23:30:00.000Z')).toBe('Jan 15, 2026');
  });

  it('returns unparseable input unchanged', () => {
    expect(formatDate('not a date')).toBe('not a date');
  });
});

describe('formatNumber / employmentTypeLabel', () => {
  it('formats numbers and labels', () => {
    expect(formatNumber(10_000)).toBe('10,000');
    expect(employmentTypeLabel('PART_TIME')).toBe('Part-time');
  });
});
