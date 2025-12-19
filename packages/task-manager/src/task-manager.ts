/**
 * Task Manager
 * Main entry point for LLM-based task decomposition and execution
 */

import type {
  ManagedTask,
  TaskState,
  TaskManagerConfig,
  DecompositionRequest,
  DecompositionResult,
  SyncResult,
  SyncHandler,
} from './types/index.js';
import { createManagedTask } from './types/index.js';
import { TaskStateMachine } from './state/task-state-machine.js';
import { LLMDecomposer } from './decomposition/llm-decomposer.js';
import { DecompositionValidator } from './decomposition/decomposition-validator.js';
import { BidirectionalSync, type BidirectionalSyncOptions } from './sync/bidirectional-sync.js';
import { TaskExecutor, type ExecutionResult, type ExecutionHandler } from './execution/task-executor.js';
import { WorktreeCoordinator } from './execution/worktree-coordinator.js';

/**
 * Task Manager handler
 */
export interface TaskManagerHandler extends ExecutionHandler, SyncHandler {
  onDecomposition?: (result: DecompositionResult) => void | Promise<void>;
  onTaskCreated?: (task: ManagedTask) => void | Promise<void>;
}

/**
 * Task Manager class
 */
export class TaskManager {
  private config: TaskManagerConfig;
  private stateMachine: TaskStateMachine;
  private decomposer: LLMDecomposer;
  private validator: DecompositionValidator;
  private sync: BidirectionalSync;
  private executor: TaskExecutor;
  private worktreeCoordinator?: WorktreeCoordinator;
  private handler?: TaskManagerHandler;
  private tasks: Map<string, ManagedTask> = new Map();

  constructor(config: TaskManagerConfig, handler?: TaskManagerHandler) {
    this.config = config;
    this.handler = handler;

    // Initialize components
    this.stateMachine = new TaskStateMachine();
    this.decomposer = new LLMDecomposer(config.llm);
    this.validator = new DecompositionValidator();
    this.sync = new BidirectionalSync(config.sync, {
      syncLabels: true,
      syncProjects: !!config.sync.github.projectNumber,
    }, handler);
    this.executor = new TaskExecutor(config.execution, handler);

    // Initialize worktree coordinator if enabled
    if (config.execution.useWorktrees && config.execution.worktreeBasePath) {
      this.worktreeCoordinator = new WorktreeCoordinator(
        config.execution.worktreeBasePath,
        config.execution,
        handler
      );
    }
  }

  /**
   * Initialize the task manager
   */
  async initialize(): Promise<void> {
    await this.sync.initialize();

    if (this.worktreeCoordinator) {
      await this.worktreeCoordinator.initialize();
    }
  }

  /**
   * Decompose a prompt into tasks
   */
  async decompose(request: DecompositionRequest): Promise<DecompositionResult> {
    const result = await this.decomposer.decompose(request);

    // Store tasks
    for (const task of result.tasks) {
      this.tasks.set(task.id, task);
      await this.handler?.onTaskCreated?.(task);
    }

    await this.handler?.onDecomposition?.(result);
    return result;
  }

  /**
   * Create a single task
   */
  createTask(
    input: {
      title: string;
      description: string;
      type: 'feature' | 'bug' | 'refactor' | 'docs' | 'test' | 'deployment' | 'chore';
      priority?: number;
      dependencies?: string[];
      estimatedDuration?: number;
      assignedAgent?: string;
    },
    id?: string
  ): ManagedTask {
    const task = createManagedTask({
      ...input,
      priority: input.priority ?? 50,
      dependencies: input.dependencies ?? [],
      estimatedDuration: input.estimatedDuration ?? 30,
      assignedAgent: input.assignedAgent as ManagedTask['assignedAgent'],
    }, id);

    this.tasks.set(task.id, task);
    this.handler?.onTaskCreated?.(task);
    return task;
  }

  /**
   * Get a task by ID
   */
  getTask(id: string): ManagedTask | undefined {
    return this.tasks.get(id);
  }

  /**
   * Get all tasks
   */
  getTasks(): ManagedTask[] {
    return Array.from(this.tasks.values());
  }

  /**
   * Get tasks by state
   */
  getTasksByState(state: TaskState): ManagedTask[] {
    return this.getTasks().filter(t => t.currentState === state);
  }

  /**
   * Update task state
   */
  updateTaskState(
    taskId: string,
    state: TaskState,
    triggeredBy: 'user' | 'agent' | 'system' | 'github-webhook',
    reason?: string
  ): boolean {
    const task = this.tasks.get(taskId);
    if (!task) return false;

    const result = this.stateMachine.applyTransition(task, state, triggeredBy, reason);
    return result.valid;
  }

  /**
   * Execute a single task
   */
  async executeTask(taskId: string): Promise<ExecutionResult> {
    const task = this.tasks.get(taskId);
    if (!task) {
      return {
        taskId,
        success: false,
        state: 'failed',
        error: 'Task not found',
        durationMs: 0,
        agentType: 'CodeGenAgent',
      };
    }

    if (this.worktreeCoordinator) {
      return this.worktreeCoordinator.executeInWorktree(task);
    }

    return this.executor.execute(task);
  }

  /**
   * Execute multiple tasks
   */
  async executeTasks(
    taskIds: string[],
    options: { parallel?: boolean; concurrency?: number } = {}
  ): Promise<ExecutionResult[]> {
    const tasks = taskIds
      .map(id => this.tasks.get(id))
      .filter((t): t is ManagedTask => t !== undefined);

    if (this.worktreeCoordinator && options.parallel) {
      return this.worktreeCoordinator.executeParallel(
        tasks,
        options.concurrency ?? 3
      );
    }

    if (options.parallel) {
      return this.executor.executeParallel(tasks, options.concurrency ?? 3);
    }

    return this.executor.executeSequence(tasks);
  }

  /**
   * Execute tasks based on DAG order
   */
  async executeByDAG(result: DecompositionResult): Promise<ExecutionResult[]> {
    const allResults: ExecutionResult[] = [];

    for (const level of result.dag.levels) {
      const tasks = level
        .map(id => this.tasks.get(id))
        .filter((t): t is ManagedTask => t !== undefined);

      // Execute level in parallel
      const results = await this.executeTasks(
        tasks.map(t => t.id),
        { parallel: true, concurrency: this.config.execution.maxConcurrency }
      );

      allResults.push(...results);

      // Check for failures
      if (this.config.execution.stopOnFailure && results.some(r => !r.success)) {
        break;
      }
    }

    return allResults;
  }

  /**
   * Sync tasks with GitHub
   */
  async syncTasks(direction: 'push' | 'pull' | 'bidirectional' = 'bidirectional'): Promise<SyncResult> {
    const tasks = this.getTasks();
    return this.sync.sync(tasks, direction);
  }

  /**
   * Link task to GitHub issue
   */
  linkTaskToIssue(taskId: string, issueNumber: number): boolean {
    const task = this.tasks.get(taskId);
    if (!task) return false;

    task.githubIssueNumber = issueNumber;
    task.syncVersion++;
    return true;
  }

  /**
   * Get decomposition statistics
   */
  getDecompositionStats(): {
    totalTasks: number;
    byState: Record<TaskState, number>;
    byType: Record<string, number>;
    byAgent: Record<string, number>;
  } {
    const tasks = this.getTasks();

    const byState = {} as Record<TaskState, number>;
    const byType = {} as Record<string, number>;
    const byAgent = {} as Record<string, number>;

    for (const task of tasks) {
      byState[task.currentState] = (byState[task.currentState] || 0) + 1;
      byType[task.type] = (byType[task.type] || 0) + 1;
      if (task.assignedAgent) {
        byAgent[task.assignedAgent] = (byAgent[task.assignedAgent] || 0) + 1;
      }
    }

    return {
      totalTasks: tasks.length,
      byState,
      byType,
      byAgent,
    };
  }

  /**
   * Validate tasks
   */
  validateTasks(): { valid: boolean; errors: string[]; warnings: string[] } {
    const tasks = this.getTasks();
    const result = this.validator.validate(tasks);

    return {
      valid: result.valid,
      errors: result.errors.map(e => e.message),
      warnings: result.warnings.map(w => w.message),
    };
  }

  /**
   * Cancel a running task
   */
  cancelTask(taskId: string): boolean {
    return this.executor.cancel(taskId);
  }

  /**
   * Get running tasks
   */
  getRunningTasks(): ManagedTask[] {
    return this.executor.getRunningTasks();
  }

  /**
   * Get state machine
   */
  getStateMachine(): TaskStateMachine {
    return this.stateMachine;
  }

  /**
   * Get decomposer
   */
  getDecomposer(): LLMDecomposer {
    return this.decomposer;
  }

  /**
   * Get sync
   */
  getSync(): BidirectionalSync {
    return this.sync;
  }

  /**
   * Get executor
   */
  getExecutor(): TaskExecutor {
    return this.executor;
  }

  /**
   * Get worktree coordinator
   */
  getWorktreeCoordinator(): WorktreeCoordinator | undefined {
    return this.worktreeCoordinator;
  }

  /**
   * Update sync options
   */
  updateSyncOptions(options: Partial<BidirectionalSyncOptions>): void {
    this.sync.updateOptions(options);
  }

  /**
   * Get config
   */
  getConfig(): TaskManagerConfig {
    return { ...this.config };
  }

  /**
   * Clear all tasks
   */
  clearTasks(): void {
    this.tasks.clear();
  }

  /**
   * Remove a task
   */
  removeTask(taskId: string): boolean {
    return this.tasks.delete(taskId);
  }

  /**
   * Import tasks
   */
  importTasks(tasks: ManagedTask[]): void {
    for (const task of tasks) {
      this.tasks.set(task.id, task);
    }
  }

  /**
   * Export tasks
   */
  exportTasks(): ManagedTask[] {
    return this.getTasks();
  }
}
