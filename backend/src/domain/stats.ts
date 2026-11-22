/**
 * Pure statistics helpers. Kept free of I/O so the maths behind every
 * insight can be unit tested exhaustively.
 */

export interface Summary {
  count: number;
  min: number | null;
  max: number | null;
  mean: number | null;
  median: number | null;
  p25: number | null;
  p75: number | null;
  total: number;
}

export interface HistogramBucket {
  /** Inclusive lower bound */
  min: number;
  /** Exclusive upper bound (inclusive for the last bucket) */
  max: number;
  count: number;
}

const ascending = (a: number, b: number) => a - b;

export function mean(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * Percentile using linear interpolation between closest ranks (the same
 * definition as Excel's PERCENTILE.INC), so HR can cross-check in a sheet.
 * `sorted` must be in ascending order.
 */
export function percentileOfSorted(sorted: readonly number[], p: number): number | null {
  if (p < 0 || p > 100) throw new RangeError(`Percentile must be between 0 and 100, got ${p}`);
  if (sorted.length === 0) return null;

  const rank = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(rank);
  const upper = Math.ceil(rank);
  const lowerValue = sorted[lower]!;
  const upperValue = sorted[upper]!;
  return lowerValue + (upperValue - lowerValue) * (rank - lower);
}

export function percentile(values: readonly number[], p: number): number | null {
  return percentileOfSorted([...values].sort(ascending), p);
}

export function median(values: readonly number[]): number | null {
  return percentile(values, 50);
}

/** All the descriptive statistics an insight needs, from a single sort. */
export function summarize(values: readonly number[]): Summary {
  const sorted = [...values].sort(ascending);
  const total = sorted.reduce((sum, v) => sum + v, 0);
  return {
    count: sorted.length,
    min: sorted[0] ?? null,
    max: sorted[sorted.length - 1] ?? null,
    mean: sorted.length ? total / sorted.length : null,
    median: percentileOfSorted(sorted, 50),
    p25: percentileOfSorted(sorted, 25),
    p75: percentileOfSorted(sorted, 75),
    total,
  };
}

/** Round a raw step up to a "nice" human-friendly number: 1, 2, 2.5 or 5 × 10^n. */
export function niceStep(rawStep: number): number {
  if (!(rawStep > 0)) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const residual = rawStep / magnitude;
  const nice =
    residual <= 1 ? 1 : residual <= 2 ? 2 : residual <= 2.5 ? 2.5 : residual <= 5 ? 5 : 10;
  return nice * magnitude;
}

/**
 * Bucket values into roughly `targetBuckets` equal-width ranges with nice
 * boundaries (e.g. 50,000–60,000), which read well on a chart axis.
 */
export function histogram(values: readonly number[], targetBuckets = 10): HistogramBucket[] {
  if (values.length === 0) return [];
  if (!Number.isInteger(targetBuckets) || targetBuckets < 1) {
    throw new RangeError(`targetBuckets must be a positive integer, got ${targetBuckets}`);
  }

  let min = Infinity;
  let max = -Infinity;
  for (const v of values) {
    if (v < min) min = v;
    if (v > max) max = v;
  }

  const step = niceStep((max - min) / targetBuckets);
  const start = Math.floor(min / step) * step;
  const bucketCount = Math.max(1, Math.floor((max - start) / step) + 1);

  const buckets: HistogramBucket[] = Array.from({ length: bucketCount }, (_, i) => ({
    min: start + i * step,
    max: start + (i + 1) * step,
    count: 0,
  }));

  for (const v of values) {
    const index = Math.min(Math.floor((v - start) / step), bucketCount - 1);
    buckets[index]!.count += 1;
  }

  return buckets;
}

/** Group items by a key, preserving first-seen order. */
export function groupBy<T, K>(items: readonly T[], key: (item: T) => K): Map<K, T[]> {
  const groups = new Map<K, T[]>();
  for (const item of items) {
    const k = key(item);
    const group = groups.get(k);
    if (group) group.push(item);
    else groups.set(k, [item]);
  }
  return groups;
}
