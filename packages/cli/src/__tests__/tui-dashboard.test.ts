/**
 * TUI Dashboard Tests - TDD
 *
 * Tests for the Terminal User Interface Dashboard
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createDashboardState,
  addAgent,
  updateAgentStatus,
  addLog,
  calculateOverallProgress,
  getAgentDisplayName,
  renderDashboard,
  clearHumanApproval,
  requestHumanApproval,
  type DashboardState,
  type AgentStatus,
  AGENT_DISPLAY_NAMES,
} from '../utils/tui-dashboard';

describe('TUI Dashboard', () => {
  let state: DashboardState;

  beforeEach(() => {
    state = createDashboardState('Test Dashboard');
  });

  describe('createDashboardState', () => {
    it('should create initial state with title', () => {
      expect(state.title).toBe('Test Dashboard');
      expect(state.agents).toEqual([]);
      expect(state.currentPhase).toBe('Initializing');
      expect(state.overallProgress).toBe(0);
      expect(state.logs).toEqual([]);
    });

    it('should not have human approval by default', () => {
      expect(state.humanApprovalRequired).toBeUndefined();
    });
  });

  describe('addAgent', () => {
    it('should add agent to state', () => {
      const agent: AgentStatus = {
        name: 'codegen',
        displayName: 'つくるん (Builder)',
        status: 'idle',
      };

      addAgent(state, agent);

      expect(state.agents).toHaveLength(1);
      expect(state.agents[0].name).toBe('codegen');
      expect(state.agents[0].status).toBe('idle');
    });

    it('should add multiple agents', () => {
      addAgent(state, { name: 'codegen', displayName: 'Builder', status: 'idle' });
      addAgent(state, { name: 'review', displayName: 'Reviewer', status: 'idle' });
      addAgent(state, { name: 'deploy', displayName: 'Deployer', status: 'idle' });

      expect(state.agents).toHaveLength(3);
    });
  });

  describe('updateAgentStatus', () => {
    beforeEach(() => {
      addAgent(state, { name: 'codegen', displayName: 'Builder', status: 'idle' });
    });

    it('should update agent status', () => {
      updateAgentStatus(state, 'codegen', { status: 'running' });

      expect(state.agents[0].status).toBe('running');
    });

    it('should update agent progress', () => {
      updateAgentStatus(state, 'codegen', { status: 'running', progress: 50 });

      expect(state.agents[0].progress).toBe(50);
    });

    it('should update agent message', () => {
      updateAgentStatus(state, 'codegen', { message: 'Processing...' });

      expect(state.agents[0].message).toBe('Processing...');
    });

    it('should set start and end times', () => {
      const startTime = new Date();
      updateAgentStatus(state, 'codegen', { startTime });

      expect(state.agents[0].startTime).toBe(startTime);

      const endTime = new Date();
      updateAgentStatus(state, 'codegen', { endTime });

      expect(state.agents[0].endTime).toBe(endTime);
    });

    it('should not update non-existent agent', () => {
      updateAgentStatus(state, 'nonexistent', { status: 'running' });

      // Should not throw, just do nothing
      expect(state.agents[0].status).toBe('idle');
    });
  });

  describe('addLog', () => {
    it('should add log entry with timestamp', () => {
      addLog(state, 'Test message');

      expect(state.logs).toHaveLength(1);
      expect(state.logs[0]).toContain('Test message');
    });

    it('should keep only last 100 logs', () => {
      for (let i = 0; i < 150; i++) {
        addLog(state, `Log ${i}`);
      }

      expect(state.logs).toHaveLength(100);
      expect(state.logs[0]).toContain('Log 50');
      expect(state.logs[99]).toContain('Log 149');
    });
  });

  describe('calculateOverallProgress', () => {
    it('should return 0 for no agents', () => {
      expect(calculateOverallProgress(state)).toBe(0);
    });

    it('should calculate progress for completed agents', () => {
      addAgent(state, { name: 'a', displayName: 'A', status: 'completed' });
      addAgent(state, { name: 'b', displayName: 'B', status: 'completed' });

      expect(calculateOverallProgress(state)).toBe(100);
    });

    it('should calculate progress for running agents', () => {
      addAgent(state, { name: 'a', displayName: 'A', status: 'completed' });
      addAgent(state, { name: 'b', displayName: 'B', status: 'running', progress: 50 });

      expect(calculateOverallProgress(state)).toBe(75); // (100 + 50) / 2
    });

    it('should handle failed agents as 0 progress', () => {
      addAgent(state, { name: 'a', displayName: 'A', status: 'completed' });
      addAgent(state, { name: 'b', displayName: 'B', status: 'failed' });

      expect(calculateOverallProgress(state)).toBe(50); // (100 + 0) / 2
    });

    it('should handle idle agents as 0 progress', () => {
      addAgent(state, { name: 'a', displayName: 'A', status: 'idle' });
      addAgent(state, { name: 'b', displayName: 'B', status: 'idle' });

      expect(calculateOverallProgress(state)).toBe(0);
    });
  });

  describe('getAgentDisplayName', () => {
    it('should return Japanese character name for known agents', () => {
      expect(getAgentDisplayName('coordinator')).toBe('しきるん (Coordinator)');
      expect(getAgentDisplayName('codegen')).toBe('つくるん (Builder)');
      expect(getAgentDisplayName('review')).toBe('めだまん (Reviewer)');
      expect(getAgentDisplayName('issue')).toBe('みつけるん (Analyzer)');
      expect(getAgentDisplayName('pr')).toBe('まとめるん (Packager)');
      expect(getAgentDisplayName('deploy')).toBe('はこぶん (Deployer)');
      expect(getAgentDisplayName('test')).toBe('ためすん (Tester)');
    });

    it('should return original name for unknown agents', () => {
      expect(getAgentDisplayName('unknown-agent')).toBe('unknown-agent');
    });

    it('should be case-insensitive', () => {
      expect(getAgentDisplayName('CODEGEN')).toBe('つくるん (Builder)');
      expect(getAgentDisplayName('CodeGen')).toBe('つくるん (Builder)');
    });
  });

  describe('Human Approval', () => {
    it('should request human approval', () => {
      requestHumanApproval(
        state,
        'Deploy to Production',
        'This will deploy changes to production',
        ['Approve', 'Reject', 'Review']
      );

      expect(state.humanApprovalRequired).toBeDefined();
      expect(state.humanApprovalRequired?.action).toBe('Deploy to Production');
      expect(state.humanApprovalRequired?.description).toBe('This will deploy changes to production');
      expect(state.humanApprovalRequired?.options).toHaveLength(3);
    });

    it('should clear human approval', () => {
      requestHumanApproval(state, 'Test', 'Test desc', ['Yes', 'No']);
      clearHumanApproval(state);

      expect(state.humanApprovalRequired).toBeUndefined();
    });
  });

  describe('renderDashboard', () => {
    it('should render dashboard string', () => {
      addAgent(state, { name: 'codegen', displayName: 'Builder', status: 'running', progress: 50 });
      addLog(state, 'Test log');

      const output = renderDashboard(state);

      expect(output).toContain('Test Dashboard');
      expect(output).toContain('Builder');
      expect(output).toContain('RUNNING');
    });

    it('should render human approval section when needed', () => {
      requestHumanApproval(state, 'Deploy', 'Deploy to prod', ['Yes', 'No']);

      const output = renderDashboard(state);

      expect(output).toContain('Human Approval Required');
      expect(output).toContain('Deploy');
    });

    it('should render progress bar', () => {
      state.overallProgress = 50;

      const output = renderDashboard(state);

      expect(output).toContain('50%');
    });
  });

  describe('AGENT_DISPLAY_NAMES', () => {
    it('should have all 7 coding agents', () => {
      const expectedAgents = ['coordinator', 'codegen', 'review', 'issue', 'pr', 'deploy', 'test'];

      for (const agent of expectedAgents) {
        expect(AGENT_DISPLAY_NAMES[agent]).toBeDefined();
      }
    });
  });
});
