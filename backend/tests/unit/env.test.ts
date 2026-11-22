import { describe, expect, it } from 'vitest';
import { loadEnv } from '../../src/config/env';

describe('loadEnv', () => {
  it('applies defaults when variables are missing', () => {
    const env = loadEnv({});

    expect(env.PORT).toBe(4000);
    expect(env.NODE_ENV).toBe('development');
    expect(env.DATABASE_URL).toBe('file:./dev.db');
  });

  it('coerces PORT from a string', () => {
    expect(loadEnv({ PORT: '8080' }).PORT).toBe(8080);
  });

  it('throws a readable error for invalid values', () => {
    expect(() => loadEnv({ PORT: 'not-a-number' })).toThrow(/Invalid environment configuration/);
  });
});
