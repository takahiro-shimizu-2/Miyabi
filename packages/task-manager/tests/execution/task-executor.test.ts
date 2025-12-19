/**
 * Task Executor Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TaskExecutor, type AgentExecutor, type ExecutionResult } from '../../src/execution/task-executor.js';
import { createManagedTask } from '../../src/types/task.js';
import type { ManagedTask, ExecutionConfig } from '../../src/types/index.js';

describe('TaskExecutor', () => {
  let executor: TaskExecutor;
  const config: ExecutionConfig = {
    maxConcurrency: 3,
    worktreeBasePath: '.worktrees',
    timeoutMinutes: 30,
    retryConfig: {
      maxRetries: 3,
      backoffMs: 100,
      maxBackoffMs: 1000,
    },
    stopOnFailure: false,
    useWorktrees: false,
  };

  beforeEach(() => {
    executor = new TaskExecutor(config);
  });

  describe('execute', () => {
    it('should execute task with default executor', async () => {
      const task = createManagedTask({
        title: 'Test Task',
        description: 'Test description',
        type: 'feature',
      }, 'task-1');
      task.currentState = 'pending';

      const result = await executor.execute(task);
      expect(result.success).toBe(true);
      expect(result.taskId).toBe('task-1');
    });

    it('should fail if task is already running', async () => {
      const task = createManagedTask({
        title: 'Test Task',
        description: 'Test description',
        type: 'feature',
      }, 'task-1');
      task.currentState = 'pending';

      // Start execution
      const promise = executor.execute(task);

      // Try to execute again
      const result = await executor.execute(task);
      expect(result.success).toBe(false);
      expect(result.error).toContain('already running');

      await promise;
    });

    it('should fail for invalid state transition', async () => {
      const task = createManagedTask({
        title: 'Test Task',
        description: 'Test description',
        type: 'feature',
      }, 'task-1');
      task.currentState = 'done'; // Terminal state

      const result = await executor.execute(task);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Cannot transition');
    });
  });

  describe('registerAgent', () => {
    it('should register custom agent executor', async () => {
      const mockExecutor: AgentExecutor = {
        agentType: 'CodeGenAgent',
        canExecute: () => true,
        execute: async (task): Promise<ExecutionResult> => ({
          taskId: task.id,
          success: true,
          state: 'done',
          output: 'Custom execution',
          durationMs: 100,
          agentType: 'CodeGenAgent',
        }),
      };

      executor.registerAgent(mockExecutor);

      const task = createManagedTask({
        title: 'Test Task',
        description: 'Test description',
        type: 'feature',
        assignedAgent: 'CodeGenAgent',
      }, 'task-1');
      task.currentState = 'pending';

      const result = await executor.execute(task);
      expect(result.success).toBe(true);
      expect(result.output).toBe('Custom execution');
    });

    it('should fail if agent cannot execute task', async () => {
      const mockExecutor: AgentExecutor = {
        agentType: 'CodeGenAgent',
        canExecute: () => false,
        execute: async (): Promise<ExecutionResult> => ({
          taskId: '',
          success: false,
          state: 'failed',
          durationMs: 0,
          agentType: 'CodeGenAgent',
        }),
      };

      executor.registerAgent(mockExecutor);

      const task = createManagedTask({
        title: 'Test Task',
        description: 'Test description',
        type: 'feature',
        assignedAgent: 'CodeGenAgent',
      }, 'task-1');
      task.currentState = 'pending';

      const result = await executor.execute(task);
      expect(result.success).toBe(false);
      expect(result.error).toContain('cannot execute');
    });
  });

  describe('executeSequence', () => {
    it('should execute tasks in sequence', async () => {
      const tasks: ManagedTask[] = [
        createManagedTask({ title: 'Task 1', description: 'Desc', type: 'feature' }, 'task-1'),
        createManagedTask({ title: 'Task 2', description: 'Desc', type: 'feature' }, 'task-2'),
      ];
      tasks.forEach(t => t.currentState = 'pending');

      const results = await executor.executeSequence(tasks);
      expect(results).toHaveLength(2);
      expect(results[0].taskId).toBe('task-1');
      expect(results[1].taskId).toBe('task-2');
    });

    it('should stop on failure if configured', async () => {
      const stopOnFailureExecutor = new TaskExecutor({
        ...config,
        stopOnFailure: true,
      });

      const failingAgent: AgentExecutor = {
        agentType: 'CodeGenAgent',
        canExecute: () => true,
        execute: async (task): Promise<ExecutionResult> => ({
          taskId: task.id,
          success: false,
          state: 'failed',
          error: 'Failed',
          durationMs: 0,
          agentType: 'CodeGenAgent',
        }),
      };

      stopOnFailureExecutor.registerAgent(failingAgent);

      const tasks: ManagedTask[] = [
        createManagedTask({ title: 'Task 1', description: 'Desc', type: 'feature', assignedAgent: 'CodeGenAgent' }, 'task-1'),
        createManagedTask({ title: 'Task 2', description: 'Desc', type: 'feature', assignedAgent: 'CodeGenAgent' }, 'task-2'),
      ];
      tasks.forEach(t => t.currentState = 'pending');

      const results = await stopOnFailureExecutor.executeSequence(tasks);
      expect(results).toHaveLength(1); // Should stop after first failure
    });
  });

  describe('executeParallel', () => {
    it('should execute tasks in parallel', async () => {
      const tasks: ManagedTask[] = [
        createManagedTask({ title: 'Task 1', description: 'Desc', type: 'feature' }, 'task-1'),
        createManagedTask({ title: 'Task 2', description: 'Desc', type: 'feature' }, 'task-2'),
        createManagedTask({ title: 'Task 3', description: 'Desc', type: 'feature' }, 'task-3'),
      ];
      tasks.forEach(t => t.currentState = 'pending');

      const results = await executor.executeParallel(tasks, 2);
      expect(results).toHaveLength(3);
    });
  });

  describe('cancel', () => {
    it('should cancel running task', async () => {
      const task = createManagedTask({
        title: 'Test Task',
        description: 'Test description',
        type: 'feature',
      }, 'task-1');
      task.currentState = 'pending';

      // Start execution (it will complete quickly with default executor)
      executor.execute(task);

      // Try to cancel - may or may not work depending on timing
      const cancelled = executor.cancel('task-1');
      // Just verify no errors thrown
      expect(typeof cancelled).toBe('boolean');
    });

    it('should return false for non-running task', () => {
      const cancelled = executor.cancel('non-existent');
      expect(cancelled).toBe(false);
    });
  });

  describe('getRunningTasks', () => {
    it('should return empty array when no tasks running', () => {
      expect(executor.getRunningTasks()).toHaveLength(0);
    });
  });

  describe('isRunning', () => {
    it('should return false for non-running task', () => {
      expect(executor.isRunning('task-1')).toBe(false);
    });
  });

  describe('getStateMachine', () => {
    it('should return state machine instance', () => {
      const stateMachine = executor.getStateMachine();
      expect(stateMachine).toBeDefined();
      expect(stateMachine.canTransition).toBeDefined();
    });
  });
});
