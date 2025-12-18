/**
 * Ω-System Adapters Tests
 *
 * Tests for Issue → Intent, Context → World, Deliverable → Report adapters.
 */

import { describe, it, expect } from 'vitest';
import { issueToIntent, IssueToIntentAdapter } from '../adapters/issue-to-intent';
import { contextToWorld, ContextToWorldAdapter, createWorldFromEnvironment } from '../adapters/context-to-world';
import { deliverableToReport, summarizeReport, DeliverableToReportAdapter } from '../adapters/deliverable-to-report';
import { OmegaAgentAdapter, createOmegaAdapter, executeWithOmega } from '../adapters/omega-agent-adapter';
import type { Issue } from '../../types';
import type { Deliverable } from '../transformations/integration';

// Test fixtures
const mockIssue: Issue = {
  number: 123,
  title: 'Implement authentication feature',
  body: `## Description
Implement user authentication with OAuth2.

## Tasks
- [ ] Set up OAuth2 provider
- [ ] Create login page
- [ ] Implement token handling

## Acceptance Criteria
- [ ] Users can log in with Google
- [ ] Session is persisted
- [ ] Logout works correctly`,
  labels: ['type:feature', 'priority:P1-High'],
  author: 'testuser',
  assignees: [],
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  state: 'open',
};

const mockDeliverable: Deliverable = {
  deliverableId: 'del-123',
  createdAt: '2024-01-01T00:00:00Z',
  sourceResultSetId: 'rs-123',
  artifacts: {
    code: [{ type: 'code', path: 'src/auth.ts', content: 'export function auth() {}' }],
    tests: [{ type: 'test', path: 'tests/auth.test.ts', content: 'test()' }],
    documentation: [],
    configuration: [],
    reports: [],
  },
  codeChanges: {
    filesCreated: 2,
    filesModified: 0,
    filesDeleted: 0,
    totalLinesAdded: 100,
    totalLinesRemoved: 0,
    languages: ['TypeScript'],
  },
  testResults: {
    totalTests: 10,
    passed: 9,
    failed: 1,
    skipped: 0,
    coveragePercent: 85,
    duration: 5000,
  },
  qualityReport: {
    score: 85,
    grade: 'B',
    issues: [],
    categories: {
      security: { score: 90, issues: [] },
      maintainability: { score: 85, issues: [] },
      performance: { score: 80, issues: [] },
      testCoverage: { score: 85, issues: [] },
    },
    recommendations: ['Add more tests'],
    passesThreshold: true,
    timestamp: '2024-01-01T00:00:00Z',
  },
  documentationUpdates: [],
  commit: {
    message: 'feat: implement authentication',
    files: ['src/auth.ts', 'tests/auth.test.ts'],
    branch: 'feature/auth',
  },
  summary: {
    status: 'ready',
    completeness: 90,
    issues: [],
    recommendations: ['Consider adding integration tests'],
  },
  metadata: {
    integrationVersion: '1.0.0',
    integrationTimeMs: 1500,
  },
};

describe('IssueToIntentAdapter', () => {
  describe('issueToIntent', () => {
    it('should convert issue to intent space', () => {
      const intent = issueToIntent(mockIssue);

      expect(intent).toBeDefined();
      expect(intent.metadata).toBeDefined();
      expect(intent.metadata.intentId).toBe('intent-issue-123');
      expect(intent.metadata.source).toBe('system');
    });

    it('should extract goals from issue body', () => {
      const intent = issueToIntent(mockIssue);

      // Should have primary goal
      expect(intent.goals.primary.main).toBeDefined();
      expect(intent.goals.primary.main.type).toBe('primary');
    });

    it('should determine priority from labels', () => {
      const intent = issueToIntent(mockIssue);

      // P1-High should map to 'high'
      expect(intent.goals.primary.main.priority).toBe('high');
    });

    it('should extract success criteria', () => {
      const intent = issueToIntent(mockIssue);

      // Should have extracted acceptance criteria
      const criteria = intent.goals.primary.main.successCriteria || [];
      expect(criteria.length).toBeGreaterThan(0);
    });

    it('should set quality preferences', () => {
      const intent = issueToIntent(mockIssue);

      expect(intent.preferences.qualityVsSpeed).toBeDefined();
      expect(intent.preferences.qualityVsSpeed.bias).toBe('balanced');
    });

    it('should set code modality', () => {
      const intent = issueToIntent(mockIssue);

      expect(intent.modality.primary).toBe('code');
      expect(intent.modality.code).toBeDefined();
      expect(intent.modality.code?.language).toBe('typescript');
    });
  });

  describe('IssueToIntentAdapter.convert', () => {
    it('should handle empty issue body', () => {
      const emptyBodyIssue: Issue = {
        ...mockIssue,
        body: '',
      };

      const intent = IssueToIntentAdapter.convert(emptyBodyIssue);
      expect(intent.goals.primary.main).toBeDefined();
      expect(intent.goals.primary.main.description).toBe(emptyBodyIssue.title);
    });

    it('should handle issue with security label', () => {
      const securityIssue: Issue = {
        ...mockIssue,
        labels: ['security', 'priority:P0-Critical'],
      };

      const intent = IssueToIntentAdapter.convert(securityIssue);
      expect(intent.preferences.qualityVsSpeed.bias).toBe('quality');
      expect(intent.objectives.constraints.length).toBeGreaterThan(0);
    });

    it('should handle issue with urgent label', () => {
      const urgentIssue: Issue = {
        ...mockIssue,
        labels: ['urgent', 'hotfix'],
      };

      const intent = IssueToIntentAdapter.convert(urgentIssue);
      expect(intent.preferences.qualityVsSpeed.bias).toBe('speed');
    });
  });
});

describe('ContextToWorldAdapter', () => {
  describe('contextToWorld', () => {
    it('should convert empty context to world space', () => {
      const world = contextToWorld({});

      expect(world).toBeDefined();
      expect(world.metadata).toBeDefined();
      expect(world.temporal).toBeDefined();
      expect(world.spatial).toBeDefined();
      expect(world.contextual).toBeDefined();
      expect(world.resources).toBeDefined();
      expect(world.environmental).toBeDefined();
    });

    it('should use default values for empty context', () => {
      const world = contextToWorld({});

      expect(world.contextual.domain.primary).toBe('typescript');
      expect(world.environmental.constraints.concurrency.maxWorkers).toBe(3);
    });

    it('should use provided context values', () => {
      const world = contextToWorld({
        repository: {
          owner: 'testowner',
          name: 'testrepo',
          branch: 'main',
          defaultBranch: 'main',
        },
        constraints: {
          maxConcurrency: 5,
        },
      });

      expect(world.metadata.worldName).toBe('testowner/testrepo');
      expect(world.environmental.constraints.concurrency.maxWorkers).toBe(5);
    });

    it('should detect project type from config', () => {
      const world = contextToWorld({
        config: {
          language: 'typescript',
          framework: 'nextjs',
        },
      });

      expect(world.contextual.domain.primary).toBe('nextjs');
    });
  });

  describe('createWorldFromEnvironment', () => {
    it('should create world from current environment', () => {
      const world = createWorldFromEnvironment();

      expect(world).toBeDefined();
      expect(world.temporal.currentTime).toBeDefined();
      expect(world.resources.computational.cpu.available).toBeGreaterThan(0);
    });
  });
});

describe('DeliverableToReportAdapter', () => {
  describe('deliverableToReport', () => {
    it('should convert deliverable to execution report', () => {
      const report = deliverableToReport(mockDeliverable);

      expect(report).toBeDefined();
      expect(report.id).toBe('report-del-123');
      expect(report.status).toBe('success');
    });

    it('should map status correctly', () => {
      const readyDeliverable = { ...mockDeliverable, summary: { ...mockDeliverable.summary, status: 'ready' as const } };
      expect(deliverableToReport(readyDeliverable).status).toBe('success');

      const reviewDeliverable = { ...mockDeliverable, summary: { ...mockDeliverable.summary, status: 'needs-review' as const } };
      expect(deliverableToReport(reviewDeliverable).status).toBe('partial');

      const blockedDeliverable = { ...mockDeliverable, summary: { ...mockDeliverable.summary, status: 'blocked' as const } };
      expect(deliverableToReport(blockedDeliverable).status).toBe('failure');
    });

    it('should extract quality metrics', () => {
      const report = deliverableToReport(mockDeliverable);

      expect(report.quality).toBeDefined();
      expect(report.quality?.score).toBe(85);
      expect(report.quality?.grade).toBe('B');
    });

    it('should extract performance metrics', () => {
      const report = deliverableToReport(mockDeliverable);

      expect(report.performance).toBeDefined();
      expect(report.performance?.durationMs).toBe(1500);
    });

    it('should flatten artifacts', () => {
      const report = deliverableToReport(mockDeliverable);

      expect(report.artifacts.length).toBe(2); // 1 code + 1 test
      expect(report.artifacts[0].type).toBe('code/code');
    });

    it('should extract recommendations', () => {
      const report = deliverableToReport(mockDeliverable);

      expect(report.recommendations).toBeDefined();
      expect(report.recommendations?.length).toBeGreaterThan(0);
    });
  });

  describe('summarizeReport', () => {
    it('should generate markdown summary', () => {
      const report = deliverableToReport(mockDeliverable);
      const summary = summarizeReport(report);

      expect(summary).toContain('## Execution Report');
      expect(summary).toContain('SUCCESS');
      expect(summary).toContain('### Results');
      expect(summary).toContain('### Quality');
    });
  });

  describe('createErrorReport', () => {
    it('should create error report from exception', () => {
      const error = new Error('Test error');
      const report = DeliverableToReportAdapter.createErrorReport(error, 'test');

      expect(report.status).toBe('failure');
      expect(report.summary).toContain('Test error');
      expect(report.messages[0].level).toBe('error');
    });
  });
});

describe('OmegaAgentAdapter', () => {
  describe('constructor', () => {
    it('should create adapter with default config', () => {
      const adapter = new OmegaAgentAdapter();
      expect(adapter).toBeDefined();
    });

    it('should create adapter with custom config', () => {
      const adapter = new OmegaAgentAdapter({
        enableLearning: false,
        maxExecutionTimeMs: 60000,
      });
      expect(adapter).toBeDefined();
    });
  });

  describe('createOmegaAdapter', () => {
    it('should create adapter via factory function', () => {
      const adapter = createOmegaAdapter();
      expect(adapter).toBeInstanceOf(OmegaAgentAdapter);
    });
  });

  describe('execute', () => {
    it('should execute with issue input', async () => {
      const adapter = new OmegaAgentAdapter();

      const response = await adapter.execute({
        issue: mockIssue,
        agentType: 'CodeGenAgent',
      });

      expect(response).toBeDefined();
      expect(response.report).toBeDefined();
      expect(response.durationMs).toBeGreaterThan(0);
    });

    it('should execute with tasks input', async () => {
      const adapter = new OmegaAgentAdapter();

      const response = await adapter.execute({
        tasks: [
          {
            id: 'task-1',
            title: 'Test task',
            description: 'A test task',
            type: 'feature',
            priority: 1,
            dependencies: [],
          },
        ],
        agentType: 'CodeGenAgent',
      });

      expect(response).toBeDefined();
      expect(response.report).toBeDefined();
    });

    it('should return tasks for CoordinatorAgent', async () => {
      const adapter = new OmegaAgentAdapter();

      const response = await adapter.execute({
        issue: mockIssue,
        agentType: 'CoordinatorAgent',
      });

      expect(response).toBeDefined();
      // CoordinatorAgent should extract tasks
      if (response.success) {
        expect(response.tasks).toBeDefined();
      }
    });
  });

  describe('executeParallel', () => {
    it('should execute multiple requests in parallel', async () => {
      const adapter = new OmegaAgentAdapter();

      const requests = [
        { issue: mockIssue, agentType: 'CodeGenAgent' as const },
        { issue: mockIssue, agentType: 'ReviewAgent' as const },
      ];

      const responses = await adapter.executeParallel(requests);

      expect(responses.length).toBe(2);
      expect(responses[0].report).toBeDefined();
      expect(responses[1].report).toBeDefined();
    });
  });

  describe('executeSequential', () => {
    it('should execute requests in sequence', async () => {
      const adapter = new OmegaAgentAdapter();

      const requests = [
        { issue: mockIssue, agentType: 'CodeGenAgent' as const },
        { issue: mockIssue, agentType: 'ReviewAgent' as const },
      ];

      const responses = await adapter.executeSequential(requests);

      expect(responses.length).toBeGreaterThan(0);
    });
  });

  describe('executeWithOmega', () => {
    it('should execute via convenience function', async () => {
      const response = await executeWithOmega({
        issue: mockIssue,
        agentType: 'CodeGenAgent',
      });

      expect(response).toBeDefined();
      expect(response.report).toBeDefined();
    });
  });
});
