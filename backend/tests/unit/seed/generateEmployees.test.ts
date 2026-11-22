import { describe, expect, it } from 'vitest';
import { currencyForCountry, isSupportedCountry } from '../../../src/domain/countries';
import { generateEmployees, slugifyName } from '../../../src/seed/generateEmployees';

describe('generateEmployees', () => {
  const employees = generateEmployees({ count: 2_000 });

  it('generates the requested number of employees', () => {
    expect(employees).toHaveLength(2_000);
  });

  it('is deterministic for the same seed', () => {
    expect(generateEmployees({ count: 50 })).toEqual(generateEmployees({ count: 50 }));
  });

  it('produces different data for a different seed', () => {
    const a = generateEmployees({ count: 20, seed: 1 });
    const b = generateEmployees({ count: 20, seed: 2 });
    expect(a.map((e) => e.email)).not.toEqual(b.map((e) => e.email));
  });

  it('assigns unique employee codes and emails', () => {
    expect(new Set(employees.map((e) => e.employeeCode)).size).toBe(employees.length);
    expect(new Set(employees.map((e) => e.email)).size).toBe(employees.length);
  });

  it('always uses the currency of the employee country', () => {
    for (const e of employees) {
      expect(isSupportedCountry(e.country)).toBe(true);
      expect(e.currency).toBe(currencyForCountry(e.country));
    }
  });

  it('produces positive whole-number salaries', () => {
    for (const e of employees) {
      expect(Number.isInteger(e.salary)).toBe(true);
      expect(e.salary).toBeGreaterThan(0);
    }
  });

  it('never hires after the reference date', () => {
    const referenceDate = new Date('2020-01-01T00:00:00Z');
    const result = generateEmployees({ count: 200, referenceDate });
    for (const e of result) {
      expect(e.hireDate.getTime()).toBeLessThanOrEqual(referenceDate.getTime());
    }
  });

  it('spreads employees across all countries', () => {
    expect(new Set(employees.map((e) => e.country)).size).toBe(8);
  });
});

describe('slugifyName', () => {
  it('strips diacritics and non-letters', () => {
    expect(slugifyName('José')).toBe('jose');
    expect(slugifyName("O'Neil-Smith")).toBe('oneilsmith');
    expect(slugifyName('Müller')).toBe('muller');
  });
});
