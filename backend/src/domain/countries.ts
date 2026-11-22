/**
 * Countries ACME employs people in. Currency is derived from the country so an
 * employee's salary can never be recorded in the wrong currency.
 */
export interface Country {
  code: string;
  name: string;
  currency: string;
}

export const COUNTRIES: readonly Country[] = [
  { code: 'US', name: 'United States', currency: 'USD' },
  { code: 'IN', name: 'India', currency: 'INR' },
  { code: 'GB', name: 'United Kingdom', currency: 'GBP' },
  { code: 'DE', name: 'Germany', currency: 'EUR' },
  { code: 'CA', name: 'Canada', currency: 'CAD' },
  { code: 'BR', name: 'Brazil', currency: 'BRL' },
  { code: 'AU', name: 'Australia', currency: 'AUD' },
  { code: 'SG', name: 'Singapore', currency: 'SGD' },
];

export const COUNTRY_CODES = COUNTRIES.map((c) => c.code);

const byCode = new Map(COUNTRIES.map((c) => [c.code, c]));

export function findCountry(code: string): Country | undefined {
  return byCode.get(code.toUpperCase());
}

export function isSupportedCountry(code: string): boolean {
  return byCode.has(code.toUpperCase());
}

export function currencyForCountry(code: string): string {
  const country = findCountry(code);
  if (!country) {
    throw new Error(`Unsupported country: ${code}`);
  }
  return country.currency;
}
