import { describe, expect, it } from 'vitest';
import { currencyForCountry, findCountry, isSupportedCountry } from '../../../src/domain/countries';
import { fromUsd, toUsd } from '../../../src/domain/currency';

describe('toUsd / fromUsd', () => {
  it('is the identity for USD', () => {
    expect(toUsd(100_000, 'USD')).toBe(100_000);
    expect(fromUsd(100_000, 'USD')).toBe(100_000);
  });

  it('converts using the reference rate and rounds to whole units', () => {
    expect(toUsd(835_000, 'INR')).toBe(10_000);
    expect(fromUsd(10_000, 'EUR')).toBe(9_200);
    expect(toUsd(1_000, 'GBP')).toBe(1_266);
  });

  it('rejects unknown currencies', () => {
    expect(() => toUsd(1, 'XYZ')).toThrow(/No reference rate/);
    expect(() => fromUsd(1, 'XYZ')).toThrow(/No reference rate/);
  });
});

describe('countries', () => {
  it('derives currency from country code, case-insensitively', () => {
    expect(currencyForCountry('IN')).toBe('INR');
    expect(currencyForCountry('de')).toBe('EUR');
  });

  it('reports unsupported countries', () => {
    expect(isSupportedCountry('FR')).toBe(false);
    expect(findCountry('FR')).toBeUndefined();
    expect(() => currencyForCountry('FR')).toThrow(/Unsupported country/);
  });
});
