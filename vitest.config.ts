import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@miyabi/coding-agents': path.resolve(__dirname, 'packages/coding-agents'),
      '@miyabi/shared-utils': path.resolve(__dirname, 'packages/shared-utils/src'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 30000, // 30 seconds for agent tests
    // Exclude Playwright E2E tests from Vitest
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/tests/e2e/**',
      '**/.{idea,git,cache,output,temp,worktrees}/**',
      '**/.worktrees/**', // Exclude worktree directories
      '**/*.spec.ts', // Playwright uses .spec.ts
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.test.ts',
        '**/*.config.ts',
      ],
    },
    // Use workspace projects for monorepo support
    // Each package uses its own vitest.config.ts
    projects: [
      // Root tests (node environment)
      {
        resolve: {
          alias: {
            '@miyabi/coding-agents': path.resolve(__dirname, 'packages/coding-agents'),
            '@miyabi/shared-utils': path.resolve(__dirname, 'packages/shared-utils/src'),
          },
        },
        test: {
          name: 'root',
          globals: true,
          environment: 'node',
          testTimeout: 30000,
          include: [
            'tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts}',
            'agents/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts}',
            '.claude/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts}',
          ],
          exclude: [
            '**/node_modules/**',
            '**/dist/**',
            '**/tests/e2e/**',
            '**/*.spec.ts',
            'packages/**',
          ],
        },
      },
      // Package-specific configs
      'packages/cli',
      'packages/mcp-bundle',
      'packages/task-manager',
      'packages/miyabi-web',
    ],
  },
});
