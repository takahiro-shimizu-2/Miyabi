/**
 * Tests for omega-bridge script
 *
 * Tests the lightweight task decomposition and intent generation
 * that omega-bridge provides without requiring built Ω-System packages.
 */

import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
import { resolve } from 'path';

const BRIDGE_PATH = resolve(__dirname, '../omega-bridge.ts');

describe('omega-bridge', () => {
  describe('CLI argument validation', () => {
    it('should fail without --issue', () => {
      try {
        execSync(`npx tsx "${BRIDGE_PATH}" --repo ShunsukeHayashi/Miyabi`, {
          encoding: 'utf-8',
          timeout: 30_000,
        });
        expect.fail('Should have thrown');
      } catch (err: any) {
        const output = JSON.parse(err.stdout?.trim() || '{}');
        expect(output.success).toBe(false);
        expect(output.fallback).toBe(true);
        expect(output.error).toContain('Missing required args');
      }
    });

    it('should fail without --repo', () => {
      try {
        execSync(`npx tsx "${BRIDGE_PATH}" --issue 1`, {
          encoding: 'utf-8',
          timeout: 30_000,
        });
        expect.fail('Should have thrown');
      } catch (err: any) {
        const output = JSON.parse(err.stdout?.trim() || '{}');
        expect(output.success).toBe(false);
        expect(output.fallback).toBe(true);
      }
    });

    it('should show help with --help', () => {
      const output = execSync(`npx tsx "${BRIDGE_PATH}" --help`, {
        encoding: 'utf-8',
        timeout: 30_000,
      });
      expect(output).toContain('Usage: omega-bridge');
      expect(output).toContain('--issue');
      expect(output).toContain('--repo');
    });
  });

  describe('integration (requires gh CLI auth)', () => {
    it('should fetch and decompose a real issue with --dry-run', () => {
      // Use dry-run to skip Ω-System execution
      // This test requires `gh` CLI to be authenticated
      try {
        const raw = execSync(
          `npx tsx "${BRIDGE_PATH}" --issue 271 --repo ShunsukeHayashi/Miyabi --dry-run`,
          { encoding: 'utf-8', timeout: 60_000 }
        );
        const result = JSON.parse(raw.trim());

        expect(result.success).toBe(true);
        expect(result.issue.number).toBe(271);
        expect(result.issue.title).toContain('omega bridge');
        expect(result.tasks).toBeDefined();
        expect(result.tasks.length).toBeGreaterThan(0);
        expect(result.intent).toBeDefined();
        expect(result.intent.intentId).toBe('intent-issue-271');
        expect(result.metadata.bridge).toBe('omega-bridge');
        expect(result.metadata.omegaAvailable).toBe(false); // dry-run
      } catch (err: any) {
        // If gh is not authenticated, skip gracefully
        if (err.message?.includes('gh') || err.message?.includes('auth')) {
          console.warn('Skipping integration test: gh CLI not authenticated');
          return;
        }
        throw err;
      }
    });
  });
});
