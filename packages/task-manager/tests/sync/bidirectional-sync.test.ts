/**
 * Bidirectional Sync Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BidirectionalSync } from '../../src/sync/bidirectional-sync.js';
import { createManagedTask } from '../../src/types/task.js';
import type { ManagedTask, SyncConfig } from '../../src/types/index.js';

// Mock Octokit
vi.mock('@octokit/rest', () => ({
  Octokit: vi.fn().mockImplementation(() => ({
    issues: {
      listLabelsForRepo: vi.fn().mockResolvedValue({
        data: [
          { name: 'state:pending', color: 'fbca04' },
        ],
      }),
      get: vi.fn().mockResolvedValue({
        data: {
          number: 123,
          title: 'Test Issue',
          body: 'Test body',
          state: 'open',
          labels: [{ name: 'state:pending' }],
          assignees: [],
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-02T00:00:00Z',
        },
      }),
      setLabels: vi.fn().mockResolvedValue({}),
      createLabel: vi.fn().mockResolvedValue({}),
    },
  })),
}));

// Mock GraphQL
vi.mock('@octokit/graphql', () => ({
  graphql: {
    defaults: vi.fn().mockReturnValue(vi.fn().mockResolvedValue({
      organization: null,
      user: { projectV2: { id: 'project-123' } },
      node: {
        fields: {
          nodes: [
            { id: 'field-1', name: 'Status', dataType: 'SINGLE_SELECT', options: [
              { id: 'opt-1', name: 'Todo' },
              { id: 'opt-2', name: 'In Progress' },
              { id: 'opt-3', name: 'Done' },
            ]},
          ],
        },
      },
      repository: {
        issue: {
          id: 'issue-node-123',
          projectItems: {
            nodes: [{
              id: 'item-123',
              fieldValues: {
                nodes: [{ field: { name: 'Status' }, name: 'Todo' }],
              },
            }],
          },
        },
      },
    })),
  },
}));

describe('BidirectionalSync', () => {
  let sync: BidirectionalSync;
  const config: SyncConfig = {
    github: {
      owner: 'test-owner',
      repo: 'test-repo',
      token: 'test-token',
      projectNumber: 1,
    },
    labelMapping: {},
    fieldMapping: {},
  };

  beforeEach(() => {
    vi.clearAllMocks();
    sync = new BidirectionalSync(config, {
      syncLabels: true,
      syncProjects: false, // Disable projects sync for simpler testing
    });
  });

  describe('constructor', () => {
    it('should create instance with default options', () => {
      const options = sync.getOptions();
      expect(options.conflictStrategy).toBe('local-wins');
      expect(options.syncLabels).toBe(true);
      expect(options.syncProjects).toBe(false);
    });

    it('should allow custom options', () => {
      const customSync = new BidirectionalSync(config, {
        conflictStrategy: 'github-wins',
        batchSize: 5,
      });
      const options = customSync.getOptions();
      expect(options.conflictStrategy).toBe('github-wins');
      expect(options.batchSize).toBe(5);
    });
  });

  describe('push', () => {
    it('should push task state to GitHub', async () => {
      const task = createManagedTask({
        title: 'Test Task',
        description: 'Test description',
        type: 'feature',
      }, 'task-1');
      task.githubIssueNumber = 123;
      task.currentState = 'implementing';

      const result = await sync.push(task);
      expect(result.success).toBe(true);
      expect(result.synced).toBeGreaterThanOrEqual(1);
    });

    it('should handle tasks without GitHub issue', async () => {
      const task = createManagedTask({
        title: 'Test Task',
        description: 'Test description',
        type: 'feature',
      }, 'task-1');

      const result = await sync.push(task);
      // Task without GitHub issue number returns success=false, operation='skip'
      expect(result.failed).toBeGreaterThanOrEqual(1);
    });
  });

  describe('pull', () => {
    it('should pull task state from GitHub', async () => {
      const task = createManagedTask({
        title: 'Test Task',
        description: 'Test description',
        type: 'feature',
      }, 'task-1');
      task.githubIssueNumber = 123;
      task.currentState = 'implementing';

      const result = await sync.pull(task);
      expect(result.labelState).toBe('pending');
    });

    it('should return null for tasks without GitHub issue', async () => {
      const task = createManagedTask({
        title: 'Test Task',
        description: 'Test description',
        type: 'feature',
      }, 'task-1');

      const result = await sync.pull(task);
      expect(result.state).toBeNull();
    });
  });

  describe('sync', () => {
    it('should sync tasks bidirectionally', async () => {
      const tasks: ManagedTask[] = [
        createManagedTask({
          title: 'Task 1',
          description: 'Desc',
          type: 'feature',
        }, 'task-1'),
      ];
      tasks[0].githubIssueNumber = 123;
      tasks[0].currentState = 'implementing';

      const result = await sync.sync(tasks, 'push');
      expect(result.direction).toBe('push');
      expect(result.items.length).toBeGreaterThan(0);
    });

    it('should detect conflicts during pull', async () => {
      const tasks: ManagedTask[] = [
        createManagedTask({
          title: 'Task 1',
          description: 'Desc',
          type: 'feature',
        }, 'task-1'),
      ];
      tasks[0].githubIssueNumber = 123;
      tasks[0].currentState = 'implementing'; // Local state differs from GitHub (pending)

      const result = await sync.sync(tasks, 'bidirectional');
      // Should detect conflict between local 'implementing' and GitHub 'pending'
      expect(result.conflicts.length).toBeGreaterThan(0);
    });
  });

  describe('updateOptions', () => {
    it('should update options', () => {
      sync.updateOptions({ batchSize: 20 });
      expect(sync.getOptions().batchSize).toBe(20);
    });
  });

  describe('getLabelSync', () => {
    it('should return label sync instance', () => {
      const labelSync = sync.getLabelSync();
      expect(labelSync).toBeDefined();
    });
  });

  describe('getStateMachine', () => {
    it('should return state machine instance', () => {
      const stateMachine = sync.getStateMachine();
      expect(stateMachine).toBeDefined();
    });
  });
});
