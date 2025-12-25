/**
 * Example test file (TEMPLATE - not for direct execution)
 *
 * Run tests: npm test
 * Watch mode: npm test -- --watch
 * Coverage: npm test -- --coverage
 *
 * @skip - This is a template file, not meant to be run directly
 */

import { describe, it, expect } from 'vitest';
// Template placeholder: import { hello } from '../src/index';
const hello = () => 'Hello from {{PROJECT_NAME}}!';

describe.skip('{{PROJECT_NAME}}', () => {
  it('should return greeting message', () => {
    const result = hello();
    expect(result).toBe('Hello from {{PROJECT_NAME}}!');
  });

  it('should handle basic math', () => {
    expect(2 + 2).toBe(4);
  });

  it('should validate async operations', async () => {
    const promise = Promise.resolve('success');
    await expect(promise).resolves.toBe('success');
  });
});

describe('Environment', () => {
  it('should have Node.js environment', () => {
    expect(typeof process).toBe('object');
    expect(process.env).toBeDefined();
  });
});
