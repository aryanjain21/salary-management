import {
  Faker,
  base,
  de,
  en,
  en_AU,
  en_CA,
  en_GB,
  en_IN,
  en_US,
  pt_BR,
  type LocaleDefinition,
} from '@faker-js/faker';
import { currencyForCountry } from '../domain/countries';
import { fromUsd } from '../domain/currency';
import type { EmploymentType } from '../domain/employment';
import { COUNTRY_PROFILES, DEPARTMENTS } from './catalog';

export interface SeedEmployee {
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  jobTitle: string;
  department: string;
  country: string;
  currency: string;
  salary: number;
  employmentType: EmploymentType;
  hireDate: Date;
}

export interface GenerateOptions {
  count: number;
  seed?: number;
  /** Latest possible hire date. Injected so output never depends on "now". */
  referenceDate?: Date;
}

const EARLIEST_HIRE = new Date('2012-01-01T00:00:00Z');
const DEFAULT_REFERENCE_DATE = new Date('2026-06-30T00:00:00Z');
const EMAIL_DOMAIN = 'acme.example';

const NAME_LOCALES: Record<string, LocaleDefinition[]> = {
  US: [en_US, en, base],
  IN: [en_IN, en, base],
  GB: [en_GB, en, base],
  DE: [de, en, base],
  CA: [en_CA, en, base],
  BR: [pt_BR, en, base],
  AU: [en_AU, en, base],
  SG: [en, base],
};

/** Lowercase ASCII slug for building email addresses from localized names. */
export function slugifyName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z]/g, '');
}

function roundToNearest(value: number, step: number): number {
  return Math.round(value / step) * step;
}

/**
 * Deterministically generate `count` employees. The same options always
 * produce the same output, which keeps demos and tests reproducible.
 */
export function generateEmployees({
  count,
  seed = 42,
  referenceDate = DEFAULT_REFERENCE_DATE,
}: GenerateOptions): SeedEmployee[] {
  const rng = new Faker({ locale: [en, base], seed });

  const nameFakers = new Map(
    Object.entries(NAME_LOCALES).map(([code, locale]) => [code, new Faker({ locale, seed })]),
  );

  const countryChoices = COUNTRY_PROFILES.map((p) => ({ weight: p.weight, value: p }));
  const departmentChoices = DEPARTMENTS.map((d) => ({ weight: d.weight, value: d }));
  const employmentChoices: { weight: number; value: EmploymentType }[] = [
    { weight: 88, value: 'FULL_TIME' },
    { weight: 5, value: 'PART_TIME' },
    { weight: 7, value: 'CONTRACT' },
  ];

  const employees: SeedEmployee[] = [];

  for (let i = 0; i < count; i++) {
    const profile = rng.helpers.weightedArrayElement(countryChoices);
    const department = rng.helpers.weightedArrayElement(departmentChoices);
    const role = rng.helpers.arrayElement(department.roles);
    const employmentType = rng.helpers.weightedArrayElement(employmentChoices);

    const names = nameFakers.get(profile.code) ?? rng;
    const firstName = names.person.firstName();
    const lastName = names.person.lastName();

    const currency = currencyForCountry(profile.code);
    const variance = rng.number.float({ min: 0.85, max: 1.25, fractionDigits: 3 });
    const timeFactor = employmentType === 'PART_TIME' ? 0.5 : 1;
    const salaryUsd = role.baseUsd * profile.payFactor * variance * timeFactor;
    const salary = roundToNearest(fromUsd(salaryUsd, currency), 100);

    const hireDate = rng.date.between({ from: EARLIEST_HIRE, to: referenceDate });
    hireDate.setUTCHours(0, 0, 0, 0);

    const sequence = i + 1;
    const localPart = [slugifyName(firstName), slugifyName(lastName)].filter(Boolean).join('.');

    employees.push({
      employeeCode: `EMP-${String(sequence).padStart(5, '0')}`,
      firstName,
      lastName,
      email: `${localPart || 'employee'}.${sequence}@${EMAIL_DOMAIN}`,
      jobTitle: role.title,
      department: department.name,
      country: profile.code,
      currency,
      salary,
      employmentType,
      hireDate,
    });
  }

  return employees;
}
