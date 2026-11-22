import { describe, expect, it } from 'vitest';
import {
  groupBy,
  histogram,
  mean,
  median,
  niceStep,
  percentile,
  summarize,
} from '../../../src/domain/stats';

describe('mean', () => {
  it('averages values', () => {
    expect(mean([1, 2, 3, 4])).toBe(2.5);
  });

  it('returns null for no values', () => {
    expect(mean([])).toBeNull();
  });
});

describe('median', () => {
  it('takes the middle value of an odd-length list', () => {
    expect(median([9, 1, 5])).toBe(5);
  });

  it('averages the two middle values of an even-length list', () => {
    expect(median([40, 10, 30, 20])).toBe(25);
  });

  it('handles a single value', () => {
    expect(median([7])).toBe(7);
  });

  it('returns null for no values', () => {
    expect(median([])).toBeNull();
  });

  it('does not mutate the input', () => {
    const values = [3, 1, 2];
    median(values);
    expect(values).toEqual([3, 1, 2]);
  });
});

describe('percentile', () => {
  // Expected values match Excel's PERCENTILE.INC
  it.each([
    [0, 10],
    [25, 17.5],
    [50, 25],
    [75, 32.5],
    [100, 40],
  ])('p%i of [10,20,30,40] is %d', (p, expected) => {
    expect(percentile([40, 10, 30, 20], p)).toBe(expected);
  });

  it('rejects out-of-range percentiles', () => {
    expect(() => percentile([1], 101)).toThrow(RangeError);
    expect(() => percentile([1], -1)).toThrow(RangeError);
  });
});

describe('summarize', () => {
  it('computes all statistics together', () => {
    expect(summarize([50, 10, 40, 20, 30])).toEqual({
      count: 5,
      min: 10,
      max: 50,
      mean: 30,
      median: 30,
      p25: 20,
      p75: 40,
      total: 150,
    });
  });

  it('returns nulls and zero totals for an empty list', () => {
    expect(summarize([])).toEqual({
      count: 0,
      min: null,
      max: null,
      mean: null,
      median: null,
      p25: null,
      p75: null,
      total: 0,
    });
  });
});

describe('niceStep', () => {
  it.each([
    [0.7, 1],
    [1.5, 2],
    [2.2, 2.5],
    [3.3, 5],
    [7, 10],
    [12_345, 20_000],
    [23_000, 25_000],
  ])('rounds %d up to %d', (raw, expected) => {
    expect(niceStep(raw)).toBe(expected);
  });

  it('falls back to 1 for zero or negative steps', () => {
    expect(niceStep(0)).toBe(1);
    expect(niceStep(-5)).toBe(1);
  });
});

describe('histogram', () => {
  it('buckets values on nice boundaries and counts every value once', () => {
    const values = [52_000, 58_000, 61_000, 75_000, 99_000, 100_000];

    const buckets = histogram(values, 5);

    expect(buckets.map((b) => b.min)).toEqual([50_000, 60_000, 70_000, 80_000, 90_000, 100_000]);
    expect(buckets.map((b) => b.count)).toEqual([2, 1, 1, 0, 1, 1]);
    expect(buckets.reduce((sum, b) => sum + b.count, 0)).toBe(values.length);
  });

  it('puts identical values into a single bucket', () => {
    expect(histogram([5, 5, 5])).toEqual([{ min: 5, max: 6, count: 3 }]);
  });

  it('returns no buckets for no values', () => {
    expect(histogram([])).toEqual([]);
  });

  it('rejects a non-positive bucket count', () => {
    expect(() => histogram([1, 2], 0)).toThrow(RangeError);
  });
});

describe('groupBy', () => {
  it('groups items and preserves first-seen order', () => {
    const groups = groupBy(['apple', 'avocado', 'banana', 'blueberry', 'cherry'], (s) => s[0]);

    expect([...groups.keys()]).toEqual(['a', 'b', 'c']);
    expect(groups.get('b')).toEqual(['banana', 'blueberry']);
  });
});
