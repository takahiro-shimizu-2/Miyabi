/**
 * Human-in-the-Loop Tests - TDD
 *
 * Tests for the approval gate system
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  HumanInTheLoop,
  type ApprovalGate,
  type ApprovalLevel,
  type HumanInTheLoopConfig,
} from '../utils/human-in-the-loop';

// Mock inquirer for non-interactive tests
vi.mock('inquirer', () => ({
  default: {
    prompt: vi.fn(),
  },
}));

describe('Human-in-the-Loop', () => {
  let hitl: HumanInTheLoop;

  beforeEach(() => {
    hitl = new HumanInTheLoop();
  });

  describe('Constructor', () => {
    it('should create with default config', () => {
      const config = hitl.getConfig();

      expect(config.approvalLevel).toBe('critical');
      expect(config.autoApproveRisks).toEqual(['low']);
      expect(config.notifyOnAutoApprove).toBe(true);
      expect(config.timeoutSeconds).toBe(300);
    });

    it('should accept custom config', () => {
      const customHitl = new HumanInTheLoop({
        approvalLevel: 'all',
        timeoutSeconds: 600,
      });

      const config = customHitl.getConfig();

      expect(config.approvalLevel).toBe('all');
      expect(config.timeoutSeconds).toBe(600);
    });
  });

  describe('setConfig', () => {
    it('should update configuration', () => {
      hitl.setConfig({ approvalLevel: 'auto' });

      expect(hitl.getConfig().approvalLevel).toBe('auto');
    });

    it('should merge with existing config', () => {
      hitl.setConfig({ timeoutSeconds: 100 });

      const config = hitl.getConfig();
      expect(config.timeoutSeconds).toBe(100);
      expect(config.approvalLevel).toBe('critical'); // unchanged
    });
  });

  describe('createGate', () => {
    it('should create deploy gate', () => {
      const gate = HumanInTheLoop.createGate('deploy', { env: 'production' });

      expect(gate.action).toBe('Deploy to Production');
      expect(gate.risk).toBe('high');
      expect(gate.details?.env).toBe('production');
      expect(gate.id).toMatch(/^deploy-\d+$/);
    });

    it('should create merge gate', () => {
      const gate = HumanInTheLoop.createGate('merge', { pr: 123 });

      expect(gate.action).toBe('Merge Pull Request');
      expect(gate.risk).toBe('medium');
      expect(gate.suggestedAction).toBe('approve');
    });

    it('should create delete gate with reject suggestion', () => {
      const gate = HumanInTheLoop.createGate('delete');

      expect(gate.action).toBe('Delete Resources');
      expect(gate.risk).toBe('high');
      expect(gate.suggestedAction).toBe('reject');
    });

    it('should create publish gate as critical', () => {
      const gate = HumanInTheLoop.createGate('publish');

      expect(gate.action).toBe('Publish Package');
      expect(gate.risk).toBe('critical');
    });

    it('should create execute gate', () => {
      const gate = HumanInTheLoop.createGate('execute', { command: 'npm install' });

      expect(gate.action).toBe('Execute Command');
      expect(gate.risk).toBe('medium');
    });
  });

  describe('requestApproval - Auto mode', () => {
    beforeEach(() => {
      hitl = new HumanInTheLoop({ approvalLevel: 'auto' });
    });

    it('should auto-approve all gates in auto mode', async () => {
      const gate: ApprovalGate = {
        id: 'test-1',
        action: 'Test Action',
        description: 'Test description',
        risk: 'critical',
      };

      const result = await hitl.requestApproval(gate);

      expect(result.approved).toBe(true);
      expect(result.reason).toContain('Auto-approved');
    });
  });

  describe('requestApproval - Critical mode', () => {
    beforeEach(() => {
      hitl = new HumanInTheLoop({ approvalLevel: 'critical' });
    });

    it('should auto-approve low risk gates', async () => {
      const gate: ApprovalGate = {
        id: 'test-1',
        action: 'Low Risk Action',
        description: 'Test',
        risk: 'low',
      };

      const result = await hitl.requestApproval(gate);

      expect(result.approved).toBe(true);
    });

    it('should auto-approve medium risk gates', async () => {
      const gate: ApprovalGate = {
        id: 'test-1',
        action: 'Medium Risk Action',
        description: 'Test',
        risk: 'medium',
      };

      const result = await hitl.requestApproval(gate);

      expect(result.approved).toBe(true);
    });

    // High and critical risks require interactive approval
    // These would need mocked inquirer responses for full testing
  });

  describe('getHistory', () => {
    it('should track approval history', async () => {
      const gate: ApprovalGate = {
        id: 'test-1',
        action: 'Test',
        description: 'Test',
        risk: 'low',
      };

      await hitl.requestApproval(gate);
      const history = hitl.getHistory();

      expect(history).toHaveLength(1);
      expect(history[0].gate.id).toBe('test-1');
      expect(history[0].result.approved).toBe(true);
    });

    it('should return copy of history', async () => {
      const gate: ApprovalGate = {
        id: 'test-1',
        action: 'Test',
        description: 'Test',
        risk: 'low',
      };

      await hitl.requestApproval(gate);
      const history1 = hitl.getHistory();
      const history2 = hitl.getHistory();

      expect(history1).not.toBe(history2);
      expect(history1).toEqual(history2);
    });
  });

  describe('getSummary', () => {
    it('should return correct summary', async () => {
      hitl = new HumanInTheLoop({ approvalLevel: 'auto' });

      // All auto-approved
      await hitl.requestApproval({ id: '1', action: 'A', description: '', risk: 'low' });
      await hitl.requestApproval({ id: '2', action: 'B', description: '', risk: 'medium' });
      await hitl.requestApproval({ id: '3', action: 'C', description: '', risk: 'high' });

      const summary = hitl.getSummary();

      expect(summary.total).toBe(3);
      expect(summary.approved).toBe(3);
      expect(summary.rejected).toBe(0);
    });

    it('should return zeros for empty history', () => {
      const summary = hitl.getSummary();

      expect(summary.total).toBe(0);
      expect(summary.approved).toBe(0);
      expect(summary.rejected).toBe(0);
    });
  });

  describe('Risk Levels', () => {
    it('should handle all risk levels', () => {
      const risks: ApprovalGate['risk'][] = ['low', 'medium', 'high', 'critical'];

      for (const risk of risks) {
        const gate = HumanInTheLoop.createGate('execute', { risk });
        expect(gate.risk).toBeDefined();
      }
    });
  });

  describe('Approval Levels', () => {
    const levels: ApprovalLevel[] = ['auto', 'critical', 'all'];

    it('should accept all approval levels', () => {
      for (const level of levels) {
        const h = new HumanInTheLoop({ approvalLevel: level });
        expect(h.getConfig().approvalLevel).toBe(level);
      }
    });
  });

  describe('Gate Details', () => {
    it('should preserve custom details', () => {
      const gate = HumanInTheLoop.createGate('deploy', {
        environment: 'production',
        version: '1.0.0',
        deployer: 'CI/CD',
        timestamp: Date.now(),
      });

      expect(gate.details?.environment).toBe('production');
      expect(gate.details?.version).toBe('1.0.0');
      expect(gate.details?.deployer).toBe('CI/CD');
      expect(gate.details?.timestamp).toBeDefined();
    });
  });

  describe('Timestamps', () => {
    it('should record timestamp on approval', async () => {
      const before = new Date();

      await hitl.requestApproval({
        id: 'test',
        action: 'Test',
        description: 'Test',
        risk: 'low',
      });

      const after = new Date();
      const history = hitl.getHistory();

      expect(history[0].result.timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(history[0].result.timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });
});

describe('Edge Cases', () => {
  it('should handle empty gate id', async () => {
    const hitl = new HumanInTheLoop({ approvalLevel: 'auto' });

    const result = await hitl.requestApproval({
      id: '',
      action: 'Test',
      description: 'Test',
      risk: 'low',
    });

    expect(result.approved).toBe(true);
  });

  it('should handle very long descriptions', async () => {
    const hitl = new HumanInTheLoop({ approvalLevel: 'auto' });
    const longDescription = 'A'.repeat(10000);

    const result = await hitl.requestApproval({
      id: 'test',
      action: 'Test',
      description: longDescription,
      risk: 'low',
    });

    expect(result.approved).toBe(true);
  });

  it('should handle unicode in action names', async () => {
    const hitl = new HumanInTheLoop({ approvalLevel: 'auto' });

    const result = await hitl.requestApproval({
      id: 'test',
      action: 'デプロイ確認 🚀',
      description: '本番環境へのデプロイ',
      risk: 'low',
    });

    expect(result.approved).toBe(true);
  });
});
