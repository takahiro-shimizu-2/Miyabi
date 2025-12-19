/**
 * GitHub Label Sync Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GitHubLabelSync } from '../../src/sync/github-label-sync.js';
import { createManagedTask } from '../../src/types/task.js';
import type { ManagedTask, SyncConfig } from '../../src/types/index.js';

// Mock Octokit
vi.mock('@octokit/rest', () => ({
  Octokit: vi.fn().mockImplementation(() => ({
    issues: {
      listLabelsForRepo: vi.fn().mockResolvedValue({
        data: [
          { name: 'state:pending', color: 'fbca04' },
          { name: 'state:done', color: '0e8a16' },
          { name: 'bug', color: 'd73a4a' },
        ],
      }),
      get: vi.fn().mockResolvedValue({
        data: {
          number: 123,
          title: 'Test Issue',
          body: 'Test body',
          state: 'open',
          labels: [{ name: 'state:pending' }, { name: 'bug' }],
          assignees: [{ login: 'user1' }],
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-02T00:00:00Z',
        },
      }),
      setLabels: vi.fn().mockResolvedValue({}),
      createLabel: vi.fn().mockResolvedValue({}),
      addLabels: vi.fn().mockResolvedValue({}),
      removeLabel: vi.fn().mockResolvedValue({}),
    },
  })),
}));

describe('GitHubLabelSync', () => {
  let labelSync: GitHubLabelSync;
  const config: SyncConfig = {
    github: {
      owner: 'test-owner',
      repo: 'test-repo',
      token: 'test-token',
    },
    labelMapping: {
      pending: 'state:pending',
      done: 'state:done',
    },
    fieldMapping: {},
  };

  beforeEach(() => {
    vi.clearAllMocks();
    labelSync = new GitHubLabelSync(config);
  });

  describe('ensureStateLabels', () => {
    it('should create missing state labels', async () => {
      await labelSync.ensureStateLabels();
      // Should not throw
    });
  });

  describe('pullState', () => {
    it('should pull state from GitHub labels', async () => {
      const result = await labelSync.pullState(123);
      expect(result.state).toBe('pending');
      expect(result.labels).toContain('state:pending');
      expect(result.labels).toContain('bug');
    });
  });

  describe('pushState', () => {
    it('should push state to GitHub labels', async () => {
      const task = createManagedTask({
        title: 'Test Task',
        description: 'Test description',
        type: 'feature',
      }, 'task-1');
      task.githubIssueNumber = 123;
      task.currentState = 'implementing';

      const result = await labelSync.pushState(task);
      expect(result.success).toBe(true);
      expect(result.operation).toBe('update');
    });

    it('should skip if task has no GitHub issue number', async () => {
      const task = createManagedTask({
        title: 'Test Task',
        description: 'Test description',
        type: 'feature',
      }, 'task-1');

      const result = await labelSync.pushState(task);
      expect(result.success).toBe(false);
      expect(result.operation).toBe('skip');
    });
  });

  describe('getIssueInfo', () => {
    it('should get issue info from GitHub', async () => {
      const info = await labelSync.getIssueInfo(123);
      expect(info.number).toBe(123);
      expect(info.title).toBe('Test Issue');
      expect(info.labels).toContain('state:pending');
    });
  });

  describe('syncTasks', () => {
    it('should sync multiple tasks (push)', async () => {
      const tasks: ManagedTask[] = [
        createManagedTask({
          title: 'Task 1',
          description: 'Desc',
          type: 'feature',
        }, 'task-1'),
        createManagedTask({
          title: 'Task 2',
          description: 'Desc',
          type: 'feature',
        }, 'task-2'),
      ];
      tasks[0].githubIssueNumber = 123;
      tasks[0].currentState = 'implementing';

      const result = await labelSync.syncTasks(tasks, 'push');
      expect(result.synced).toBe(1);
      expect(result.failed).toBe(1); // task-2 has no issue number, so it fails
    });

    it('should sync multiple tasks (pull)', async () => {
      const tasks: ManagedTask[] = [
        createManagedTask({
          title: 'Task 1',
          description: 'Desc',
          type: 'feature',
        }, 'task-1'),
      ];
      tasks[0].githubIssueNumber = 123;
      tasks[0].currentState = 'implementing';

      const result = await labelSync.syncTasks(tasks, 'pull');
      expect(result.synced).toBe(1);
      expect(result.conflicts.length).toBeGreaterThan(0); // Local is 'implementing', GitHub is 'pending'
    });
  });

  describe('getStateLabelsFromList', () => {
    it('should filter state labels from list', () => {
      const labels = ['state:pending', 'bug', 'state:done', 'feature'];
      const stateLabels = labelSync.getStateLabelsFromList(labels);
      expect(stateLabels).toHaveLength(2);
      expect(stateLabels).toContain('state:pending');
      expect(stateLabels).toContain('state:done');
    });
  });

  describe('isValidLabelTransition', () => {
    it('should validate valid transitions', () => {
      expect(labelSync.isValidLabelTransition(['state:pending'], 'state:analyzing')).toBe(true);
      expect(labelSync.isValidLabelTransition(['state:implementing'], 'state:reviewing')).toBe(true);
    });

    it('should reject invalid transitions', () => {
      expect(labelSync.isValidLabelTransition(['state:done'], 'state:pending')).toBe(false);
      expect(labelSync.isValidLabelTransition(['state:pending'], 'state:done')).toBe(false);
    });
  });
});
