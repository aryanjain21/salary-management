/**
 * Reference data used to generate realistic seed employees.
 *
 * `baseUsd` is a typical US annual salary for the role; `payFactor` scales it
 * to a country's market. The final local salary also gets a per-person
 * variance so distributions look like real data, not a lookup table.
 */
export interface RoleSpec {
  title: string;
  baseUsd: number;
}

export interface DepartmentSpec {
  name: string;
  weight: number;
  roles: RoleSpec[];
}

export interface CountryProfile {
  code: string;
  weight: number;
  payFactor: number;
}

export const DEPARTMENTS: DepartmentSpec[] = [
  {
    name: 'Engineering',
    weight: 35,
    roles: [
      { title: 'Software Engineer', baseUsd: 120_000 },
      { title: 'Senior Software Engineer', baseUsd: 160_000 },
      { title: 'Staff Engineer', baseUsd: 200_000 },
      { title: 'Engineering Manager', baseUsd: 190_000 },
      { title: 'QA Engineer', baseUsd: 95_000 },
      { title: 'DevOps Engineer', baseUsd: 135_000 },
    ],
  },
  {
    name: 'Product',
    weight: 6,
    roles: [
      { title: 'Product Manager', baseUsd: 140_000 },
      { title: 'Senior Product Manager', baseUsd: 170_000 },
    ],
  },
  {
    name: 'Design',
    weight: 4,
    roles: [
      { title: 'Product Designer', baseUsd: 115_000 },
      { title: 'Design Lead', baseUsd: 150_000 },
    ],
  },
  {
    name: 'Data',
    weight: 6,
    roles: [
      { title: 'Data Analyst', baseUsd: 90_000 },
      { title: 'Data Scientist', baseUsd: 140_000 },
    ],
  },
  {
    name: 'Sales',
    weight: 12,
    roles: [
      { title: 'Account Executive', baseUsd: 85_000 },
      { title: 'Sales Manager', baseUsd: 130_000 },
    ],
  },
  {
    name: 'Marketing',
    weight: 7,
    roles: [
      { title: 'Marketing Specialist', baseUsd: 70_000 },
      { title: 'Marketing Manager', baseUsd: 115_000 },
    ],
  },
  {
    name: 'Customer Support',
    weight: 12,
    roles: [
      { title: 'Support Specialist', baseUsd: 50_000 },
      { title: 'Support Team Lead', baseUsd: 70_000 },
    ],
  },
  {
    name: 'Finance',
    weight: 6,
    roles: [
      { title: 'Accountant', baseUsd: 75_000 },
      { title: 'Financial Analyst', baseUsd: 90_000 },
      { title: 'Finance Manager', baseUsd: 130_000 },
    ],
  },
  {
    name: 'Human Resources',
    weight: 4,
    roles: [
      { title: 'HR Generalist', baseUsd: 65_000 },
      { title: 'HR Manager', baseUsd: 105_000 },
    ],
  },
  {
    name: 'Operations',
    weight: 8,
    roles: [
      { title: 'Operations Coordinator', baseUsd: 55_000 },
      { title: 'Operations Manager', baseUsd: 100_000 },
    ],
  },
];

export const COUNTRY_PROFILES: CountryProfile[] = [
  { code: 'US', weight: 30, payFactor: 1.0 },
  { code: 'IN', weight: 25, payFactor: 0.28 },
  { code: 'GB', weight: 12, payFactor: 0.8 },
  { code: 'DE', weight: 8, payFactor: 0.82 },
  { code: 'CA', weight: 8, payFactor: 0.8 },
  { code: 'BR', weight: 7, payFactor: 0.35 },
  { code: 'AU', weight: 5, payFactor: 0.85 },
  { code: 'SG', weight: 5, payFactor: 0.85 },
];
