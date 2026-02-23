import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { health, type HealthInfo } from '../health';

vi.mock('chalk', () => ({
  default: {
    cyan: { bold: vi.fn((text: string) => text) },
    green: vi.fn((text: string) => text),
    white: vi.fn((text: string) => text),
    gray: vi.fn((text: string) => text),
  },
}));

describe('health command', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('JSON output', () => {
    it('should output valid JSON when --json is passed', async () => {
      await health({ json: true });

      expect(consoleSpy).toHaveBeenCalledTimes(1);

      const output = consoleSpy.mock.calls[0][0];
      const parsed: HealthInfo = JSON.parse(output);

      expect(parsed).toHaveProperty('cli_version');
      expect(parsed).toHaveProperty('node_version');
      expect(parsed).toHaveProperty('os');
      expect(parsed).toHaveProperty('timestamp');
    });

    it('should include correct Node.js version', async () => {
      await health({ json: true });

      const parsed: HealthInfo = JSON.parse(consoleSpy.mock.calls[0][0]);

      expect(parsed.node_version).toBe(process.version);
    });

    it('should include OS information', async () => {
      await health({ json: true });

      const parsed: HealthInfo = JSON.parse(consoleSpy.mock.calls[0][0]);

      expect(parsed.os).toHaveProperty('platform');
      expect(parsed.os).toHaveProperty('release');
      expect(parsed.os).toHaveProperty('arch');
      expect(parsed.os).toHaveProperty('type');
      expect(typeof parsed.os.platform).toBe('string');
    });

    it('should include valid ISO timestamp', async () => {
      await health({ json: true });

      const parsed: HealthInfo = JSON.parse(consoleSpy.mock.calls[0][0]);

      const date = new Date(parsed.timestamp);
      expect(date.toISOString()).toBe(parsed.timestamp);
    });
  });

  describe('human-readable output', () => {
    it('should display health information in readable format', async () => {
      await health({});

      // Should have multiple console.log calls for the formatted output
      expect(consoleSpy.mock.calls.length).toBeGreaterThan(1);
    });
  });
});
