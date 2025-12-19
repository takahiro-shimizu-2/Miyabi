/**
 * Task Executor
 * Executes managed tasks by delegating to agents
 */

import type {
  ManagedTask,
  TaskState,
  AgentType,
  ExecutionConfig,
} from '../types/index.js';
import { TaskStateMachine } from '../state/task-state-machine.js';

/**
 * Execution result
 */
export interface ExecutionResult {
  taskId: string;
  success: boolean;
  state: TaskState;
  output?: string;
  error?: string;
  durationMs: number;
  agentType: AgentType;
  artifacts?: string[];
}

/**
 * Execution handler for hooks
 */
export interface ExecutionHandler {
  onTaskStart?: (task: ManagedTask) => void | Promise<void>;
  onTaskComplete?: (task: ManagedTask, result: ExecutionResult) => void | Promise<void>;
  onTaskError?: (task: ManagedTask, error: Error) => void | Promise<void>;
  onStateChange?: (task: ManagedTask, from: TaskState, to: TaskState) => void | Promise<void>;
}

/**
 * Agent executor interface - to be implemented by actual agent classes
 */
export interface AgentExecutor {
  agentType: AgentType;
  execute(task: ManagedTask): Promise<ExecutionResult>;
  canExecute(task: ManagedTask): boolean;
}

/**
 * Task Executor class
 */
export class TaskExecutor {
  private stateMachine: TaskStateMachine;
  private config: ExecutionConfig;
  private handler?: ExecutionHandler;
  private agents: Map<AgentType, AgentExecutor> = new Map();
  private runningTasks: Map<string, ManagedTask> = new Map();

  constructor(config: ExecutionConfig, handler?: ExecutionHandler) {
    this.stateMachine = new TaskStateMachine();
    this.config = config;
    this.handler = handler;
  }

  /**
   * Register an agent executor
   */
  registerAgent(executor: AgentExecutor): void {
    this.agents.set(executor.agentType, executor);
  }

  /**
   * Execute a single task
   */
  async execute(task: ManagedTask): Promise<ExecutionResult> {
    const startTime = Date.now();

    // Check if task is already running
    if (this.runningTasks.has(task.id)) {
      return {
        taskId: task.id,
        success: false,
        state: task.currentState,
        error: 'Task is already running',
        durationMs: 0,
        agentType: task.assignedAgent || 'CodeGenAgent',
      };
    }

    try {
      this.runningTasks.set(task.id, task);
      await this.handler?.onTaskStart?.(task);

      // Transition to appropriate state based on agent type
      const targetState = this.getExecutionState(task.assignedAgent || 'CodeGenAgent');
      const canTransition = this.stateMachine.canTransition(task.currentState, targetState);

      if (!canTransition) {
        return {
          taskId: task.id,
          success: false,
          state: task.currentState,
          error: `Cannot transition from ${task.currentState} to ${targetState}`,
          durationMs: Date.now() - startTime,
          agentType: task.assignedAgent || 'CodeGenAgent',
        };
      }

      // Transition to execution state
      const transitionResult = this.stateMachine.applyTransition(
        task,
        targetState,
        'agent',
        'Task execution started'
      );

      if (!transitionResult.valid) {
        return {
          taskId: task.id,
          success: false,
          state: task.currentState,
          error: transitionResult.error,
          durationMs: Date.now() - startTime,
          agentType: task.assignedAgent || 'CodeGenAgent',
        };
      }

      await this.handler?.onStateChange?.(task, task.currentState, targetState);

      // Get agent executor
      const agentType = task.assignedAgent || 'CodeGenAgent';
      const executor = this.agents.get(agentType);

      if (!executor) {
        // Use default execution (no registered agent)
        const result = await this.defaultExecute(task);
        return {
          ...result,
          durationMs: Date.now() - startTime,
        };
      }

      // Check if agent can execute this task
      if (!executor.canExecute(task)) {
        return {
          taskId: task.id,
          success: false,
          state: task.currentState,
          error: `Agent ${agentType} cannot execute this task`,
          durationMs: Date.now() - startTime,
          agentType,
        };
      }

      // Execute via agent
      const result = await this.executeWithRetry(executor, task);

      // Transition based on result
      if (result.success) {
        const doneTransition = this.stateMachine.applyTransition(
          task,
          'done',
          'agent',
          'Task completed successfully'
        );
        if (doneTransition.valid) {
          await this.handler?.onStateChange?.(task, targetState, 'done');
        }
      } else {
        const failedTransition = this.stateMachine.applyTransition(
          task,
          'failed',
          'agent',
          result.error || 'Task failed'
        );
        if (failedTransition.valid) {
          await this.handler?.onStateChange?.(task, targetState, 'failed');
        }
      }

      await this.handler?.onTaskComplete?.(task, result);
      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.handler?.onTaskError?.(task, error instanceof Error ? error : new Error(errorMessage));

      // Transition to failed
      this.stateMachine.applyTransition(task, 'failed', 'system', errorMessage);

      return {
        taskId: task.id,
        success: false,
        state: 'failed',
        error: errorMessage,
        durationMs: Date.now() - startTime,
        agentType: task.assignedAgent || 'CodeGenAgent',
      };

    } finally {
      this.runningTasks.delete(task.id);
    }
  }

  /**
   * Execute with retry logic
   */
  private async executeWithRetry(
    executor: AgentExecutor,
    task: ManagedTask
  ): Promise<ExecutionResult> {
    let lastError: Error | undefined;
    const maxRetries = this.config.retryConfig?.maxRetries ?? 3;
    const baseDelay = this.config.retryConfig?.backoffMs ?? 1000;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await executor.execute(task);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');

        if (attempt < maxRetries) {
          // Exponential backoff
          const delay = baseDelay * Math.pow(2, attempt);
          await this.sleep(delay);
        }
      }
    }

    return {
      taskId: task.id,
      success: false,
      state: task.currentState,
      error: lastError?.message || 'Max retries exceeded',
      durationMs: 0,
      agentType: executor.agentType,
    };
  }

  /**
   * Default execution (no agent registered)
   */
  private async defaultExecute(task: ManagedTask): Promise<ExecutionResult> {
    // Simulate execution - in real use, this would delegate to Claude Code
    return {
      taskId: task.id,
      success: true,
      state: 'done',
      output: `Task ${task.id} executed with default executor`,
      durationMs: 0,
      agentType: task.assignedAgent || 'CodeGenAgent',
    };
  }

  /**
   * Execute multiple tasks in sequence
   */
  async executeSequence(tasks: ManagedTask[]): Promise<ExecutionResult[]> {
    const results: ExecutionResult[] = [];

    for (const task of tasks) {
      const result = await this.execute(task);
      results.push(result);

      // Stop on failure if configured
      if (!result.success && this.config.stopOnFailure) {
        break;
      }
    }

    return results;
  }

  /**
   * Execute multiple tasks in parallel
   */
  async executeParallel(
    tasks: ManagedTask[],
    concurrency: number = 3
  ): Promise<ExecutionResult[]> {
    const results: ExecutionResult[] = [];
    const queue = [...tasks];
    const running: Promise<void>[] = [];

    const processNext = async (): Promise<void> => {
      const task = queue.shift();
      if (!task) return;

      const result = await this.execute(task);
      results.push(result);

      if (queue.length > 0 && (!this.config.stopOnFailure || result.success)) {
        await processNext();
      }
    };

    // Start initial batch
    const initialBatch = Math.min(concurrency, tasks.length);
    for (let i = 0; i < initialBatch; i++) {
      running.push(processNext());
    }

    await Promise.all(running);
    return results;
  }

  /**
   * Get execution state based on agent type
   */
  private getExecutionState(agentType: AgentType): TaskState {
    switch (agentType) {
      case 'ReviewAgent':
        return 'reviewing';
      case 'DeploymentAgent':
        return 'deploying';
      case 'IssueAgent':
      case 'CoordinatorAgent':
        return 'analyzing';
      default:
        return 'implementing';
    }
  }

  /**
   * Cancel a running task
   */
  cancel(taskId: string): boolean {
    const task = this.runningTasks.get(taskId);
    if (!task) {
      return false;
    }

    this.stateMachine.applyTransition(task, 'cancelled', 'user', 'Cancelled by user');
    this.runningTasks.delete(taskId);
    return true;
  }

  /**
   * Get running tasks
   */
  getRunningTasks(): ManagedTask[] {
    return Array.from(this.runningTasks.values());
  }

  /**
   * Check if a task is running
   */
  isRunning(taskId: string): boolean {
    return this.runningTasks.has(taskId);
  }

  /**
   * Get state machine
   */
  getStateMachine(): TaskStateMachine {
    return this.stateMachine;
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
