/**
 * Task State Machine Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  TaskStateMachine,
  taskStateMachine,
} from '../../src/state/task-state-machine.js';
import { createManagedTask } from '../../src/types/task.js';
import type { TaskState, ManagedTask } from '../../src/types/task.js';

describe('TaskStateMachine', () => {
  let stateMachine: TaskStateMachine;

  beforeEach(() => {
    stateMachine = new TaskStateMachine();
  });

  describe('canTransition', () => {
    it('should allow valid transitions from draft', () => {
      expect(stateMachine.canTransition('draft', 'pending')).toBe(true);
      expect(stateMachine.canTransition('draft', 'cancelled')).toBe(true);
    });

    it('should reject invalid transitions from draft', () => {
      expect(stateMachine.canTransition('draft', 'implementing')).toBe(false);
      expect(stateMachine.canTransition('draft', 'done')).toBe(false);
    });

    it('should allow valid workflow transitions', () => {
      expect(stateMachine.canTransition('pending', 'analyzing')).toBe(true);
      expect(stateMachine.canTransition('analyzing', 'implementing')).toBe(true);
      expect(stateMachine.canTransition('implementing', 'reviewing')).toBe(true);
      expect(stateMachine.canTransition('reviewing', 'done')).toBe(true);
    });

    it('should allow blocked and failed states', () => {
      expect(stateMachine.canTransition('pending', 'blocked')).toBe(true);
      expect(stateMachine.canTransition('analyzing', 'failed')).toBe(true);
      expect(stateMachine.canTransition('implementing', 'failed')).toBe(true);
    });

    it('should allow recovery from blocked and failed', () => {
      expect(stateMachine.canTransition('blocked', 'pending')).toBe(true);
      expect(stateMachine.canTransition('failed', 'pending')).toBe(true);
    });
  });

  describe('getValidTransitions', () => {
    it('should return all valid transitions from a state', () => {
      const fromDraft = stateMachine.getValidTransitions('draft');
      expect(fromDraft).toContain('pending');
      expect(fromDraft).toContain('cancelled');
      expect(fromDraft).not.toContain('done');
    });

    it('should return empty array for done state', () => {
      const fromDone = stateMachine.getValidTransitions('done');
      expect(fromDone).toContain('pending'); // Can reopen
    });
  });

  describe('transition', () => {
    it('should return valid result for allowed transition', () => {
      const result = stateMachine.transition('draft', 'pending');
      expect(result.valid).toBe(true);
      expect(result.from).toBe('draft');
      expect(result.to).toBe('pending');
      expect(result.rule).toBeDefined();
    });

    it('should return invalid result with error for disallowed transition', () => {
      const result = stateMachine.transition('draft', 'done');
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('Invalid transition');
    });
  });

  describe('applyTransition', () => {
    it('should update task state and history', () => {
      const task = createManagedTask({
        title: 'Test Task',
        description: 'Test description',
        type: 'feature',
      });

      const result = stateMachine.applyTransition(
        task,
        'pending',
        'system',
        'Starting task'
      );

      expect(result.valid).toBe(true);
      expect(result.task).toBeDefined();
      expect(result.task!.currentState).toBe('pending');
      expect(result.task!.stateHistory.length).toBe(2);
      expect(result.task!.stateHistory[1].from).toBe('draft');
      expect(result.task!.stateHistory[1].to).toBe('pending');
      expect(result.task!.stateHistory[1].triggeredBy).toBe('system');
      expect(result.task!.stateHistory[1].reason).toBe('Starting task');
    });

    it('should set startedAt when entering implementing', () => {
      const task = createManagedTask({
        title: 'Test Task',
        description: 'Test description',
        type: 'feature',
      });

      // Move through workflow
      let result = stateMachine.applyTransition(task, 'pending', 'system');
      result = stateMachine.applyTransition(result.task!, 'analyzing', 'agent');
      result = stateMachine.applyTransition(result.task!, 'implementing', 'agent');

      expect(result.task!.startedAt).toBeDefined();
    });

    it('should set completedAt when entering terminal state', () => {
      const task = createManagedTask({
        title: 'Test Task',
        description: 'Test description',
        type: 'feature',
      });

      // Move to done
      let result = stateMachine.applyTransition(task, 'pending', 'system');
      result = stateMachine.applyTransition(result.task!, 'analyzing', 'agent');
      result = stateMachine.applyTransition(result.task!, 'implementing', 'agent');
      result = stateMachine.applyTransition(result.task!, 'reviewing', 'agent');
      result = stateMachine.applyTransition(result.task!, 'done', 'agent');

      expect(result.task!.completedAt).toBeDefined();
    });

    it('should reject invalid transitions', () => {
      const task = createManagedTask({
        title: 'Test Task',
        description: 'Test description',
        type: 'feature',
      });

      const result = stateMachine.applyTransition(task, 'done', 'system');

      expect(result.valid).toBe(false);
      expect(result.task).toBeUndefined();
    });
  });

  describe('state categorization', () => {
    it('should identify terminal states', () => {
      expect(stateMachine.isTerminalState('done')).toBe(true);
      expect(stateMachine.isTerminalState('cancelled')).toBe(true);
      expect(stateMachine.isTerminalState('implementing')).toBe(false);
    });

    it('should identify failed states', () => {
      expect(stateMachine.isFailedState('failed')).toBe(true);
      expect(stateMachine.isFailedState('done')).toBe(false);
    });

    it('should identify blocked states', () => {
      expect(stateMachine.isBlockedState('blocked')).toBe(true);
      expect(stateMachine.isBlockedState('pending')).toBe(false);
    });

    it('should identify active states', () => {
      expect(stateMachine.isActiveState('analyzing')).toBe(true);
      expect(stateMachine.isActiveState('implementing')).toBe(true);
      expect(stateMachine.isActiveState('reviewing')).toBe(true);
      expect(stateMachine.isActiveState('pending')).toBe(false);
    });

    it('should categorize states correctly', () => {
      expect(stateMachine.getStateCategory('draft')).toBe('initial');
      expect(stateMachine.getStateCategory('pending')).toBe('initial');
      expect(stateMachine.getStateCategory('analyzing')).toBe('active');
      expect(stateMachine.getStateCategory('implementing')).toBe('active');
      expect(stateMachine.getStateCategory('reviewing')).toBe('review');
      expect(stateMachine.getStateCategory('done')).toBe('terminal');
      expect(stateMachine.getStateCategory('failed')).toBe('error');
    });
  });

  describe('getNextLogicalState', () => {
    it('should return the next logical workflow state', () => {
      expect(stateMachine.getNextLogicalState('draft')).toBe('pending');
      expect(stateMachine.getNextLogicalState('pending')).toBe('analyzing');
      expect(stateMachine.getNextLogicalState('analyzing')).toBe('implementing');
      expect(stateMachine.getNextLogicalState('implementing')).toBe('reviewing');
      expect(stateMachine.getNextLogicalState('reviewing')).toBe('done');
    });

    it('should return null for terminal states', () => {
      expect(stateMachine.getNextLogicalState('done')).toBe(null);
      expect(stateMachine.getNextLogicalState('cancelled')).toBe(null);
    });

    it('should return pending for recovery states', () => {
      expect(stateMachine.getNextLogicalState('blocked')).toBe('pending');
      expect(stateMachine.getNextLogicalState('failed')).toBe('pending');
    });
  });

  describe('singleton instance', () => {
    it('should export a singleton instance', () => {
      expect(taskStateMachine).toBeInstanceOf(TaskStateMachine);
    });
  });
});
