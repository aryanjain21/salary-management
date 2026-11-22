/**
 * Fixed reference exchange rates, expressed as units of local currency per 1 USD.
 *
 * These are illustrative reference rates for comparing pay across countries,
 * not for payroll. They are fixed so that insights are deterministic and
 * testable; the UI shows `RATES_AS_OF` next to any USD-converted figure.
 */
export const RATES_AS_OF = '2026-01-01';

export const USD_RATES: Readonly<Record<string, number>> = {
  USD: 1,
  INR: 83.5,
  GBP: 0.79,
  EUR: 0.92,
  CAD: 1.36,
  BRL: 5.0,
  AUD: 1.52,
  SGD: 1.34,
};

function rateFor(currency: string): number {
  const rate = USD_RATES[currency];
  if (rate === undefined) {
    throw new Error(`No reference rate for currency: ${currency}`);
  }
  return rate;
}

/** Convert an amount in `currency` to USD, rounded to the nearest whole dollar. */
export function toUsd(amount: number, currency: string): number {
  return Math.round(amount / rateFor(currency));
}

/** Convert a USD amount into `currency`, rounded to the nearest whole unit. */
export function fromUsd(amountUsd: number, currency: string): number {
  return Math.round(amountUsd * rateFor(currency));
}
