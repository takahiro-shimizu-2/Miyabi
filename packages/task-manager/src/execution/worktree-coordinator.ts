/**
 * Worktree Coordinator
 * Coordinates parallel task execution using git worktrees
 */

import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import * as path from 'path';
import type {
  ManagedTask,
  AgentType,
  ExecutionConfig,
} from '../types/index.js';
import { TaskStateMachine } from '../state/task-state-machine.js';
import { TaskExecutor, type ExecutionResult, type ExecutionHandler } from './task-executor.js';

/**
 * Worktree info
 */
export interface WorktreeInfo {
  id: string;
  path: string;
  branch: string;
  taskId: string;
  agentType: AgentType;
  status: 'creating' | 'ready' | 'executing' | 'merging' | 'cleanup' | 'done' | 'failed';
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

/**
 * Worktree execution result
 */
export interface WorktreeExecutionResult extends ExecutionResult {
  worktreeInfo: WorktreeInfo;
  merged: boolean;
  mergeConflicts?: string[];
}

/**
 * Worktree coordinator handler
 */
export interface WorktreeCoordinatorHandler extends ExecutionHandler {
  onWorktreeCreate?: (info: WorktreeInfo) => void | Promise<void>;
  onWorktreeMerge?: (info: WorktreeInfo, conflicts: string[]) => void | Promise<void>;
  onWorktreeCleanup?: (info: WorktreeInfo) => void | Promise<void>;
}

/**
 * Worktree Coordinator class
 */
export class WorktreeCoordinator {
  private baseDir: string;
  private worktreesDir: string;
  private stateMachine: TaskStateMachine;
  private executor: TaskExecutor;
  private config: ExecutionConfig;
  private handler?: WorktreeCoordinatorHandler;
  private activeWorktrees: Map<string, WorktreeInfo> = new Map();

  constructor(
    baseDir: string,
    config: ExecutionConfig,
    handler?: WorktreeCoordinatorHandler
  ) {
    this.baseDir = baseDir;
    this.worktreesDir = path.join(baseDir, '.worktrees');
    this.stateMachine = new TaskStateMachine();
    this.config = config;
    this.handler = handler;
    this.executor = new TaskExecutor(config, handler);
  }

  /**
   * Initialize coordinator
   */
  async initialize(): Promise<void> {
    // Ensure worktrees directory exists
    await fs.mkdir(this.worktreesDir, { recursive: true });

    // Clean up stale worktrees
    await this.pruneWorktrees();
  }

  /**
   * Create a worktree for a task
   */
  async createWorktree(task: ManagedTask): Promise<WorktreeInfo> {
    const worktreeId = `task-${task.id}-${Date.now()}`;
    const worktreePath = path.join(this.worktreesDir, worktreeId);
    const branchName = `worktree/${task.id}`;

    const info: WorktreeInfo = {
      id: worktreeId,
      path: worktreePath,
      branch: branchName,
      taskId: task.id,
      agentType: task.assignedAgent || 'CodeGenAgent',
      status: 'creating',
      createdAt: new Date().toISOString(),
    };

    this.activeWorktrees.set(worktreeId, info);

    try {
      // Create new branch from current HEAD
      await this.runGitCommand(['branch', branchName], this.baseDir);

      // Create worktree
      await this.runGitCommand(['worktree', 'add', worktreePath, branchName], this.baseDir);

      // Write execution context
      await this.writeExecutionContext(worktreePath, task, info);

      info.status = 'ready';
      await this.handler?.onWorktreeCreate?.(info);

      return info;

    } catch (error) {
      info.status = 'failed';
      this.activeWorktrees.delete(worktreeId);
      throw error;
    }
  }

  /**
   * Write execution context files
   */
  private async writeExecutionContext(
    worktreePath: string,
    task: ManagedTask,
    info: WorktreeInfo
  ): Promise<void> {
    // Write .agent-context.json
    const context = {
      agentType: info.agentType,
      agentStatus: 'pending',
      task: {
        id: task.id,
        title: task.title,
        description: task.description,
        type: task.type,
        priority: task.priority,
        dependencies: task.dependencies,
      },
      worktreeInfo: {
        id: info.id,
        path: info.path,
        branch: info.branch,
      },
      createdAt: info.createdAt,
    };

    await fs.writeFile(
      path.join(worktreePath, '.agent-context.json'),
      JSON.stringify(context, null, 2)
    );

    // Write EXECUTION_CONTEXT.md
    const markdown = `# Execution Context

## Task Information
- **ID**: ${task.id}
- **Title**: ${task.title}
- **Type**: ${task.type}
- **Priority**: ${task.priority}

## Description
${task.description}

## Agent
- **Type**: ${info.agentType}
- **Status**: pending

## Worktree
- **ID**: ${info.id}
- **Branch**: ${info.branch}
- **Path**: ${info.path}

## Dependencies
${task.dependencies.length > 0 ? task.dependencies.map(d => `- ${d}`).join('\n') : 'None'}

---
Generated at: ${info.createdAt}
`;

    await fs.writeFile(
      path.join(worktreePath, 'EXECUTION_CONTEXT.md'),
      markdown
    );
  }

  /**
   * Execute task in worktree
   */
  async executeInWorktree(task: ManagedTask): Promise<WorktreeExecutionResult> {
    const startTime = Date.now();
    let worktreeInfo: WorktreeInfo;

    try {
      // Create worktree
      worktreeInfo = await this.createWorktree(task);
      worktreeInfo.status = 'executing';
      worktreeInfo.startedAt = new Date().toISOString();

      // Execute task
      const result = await this.executor.execute(task);

      if (result.success) {
        // Commit changes if any
        await this.commitChanges(worktreeInfo, task);

        // Attempt merge
        const mergeResult = await this.mergeWorktree(worktreeInfo);

        worktreeInfo.completedAt = new Date().toISOString();
        worktreeInfo.status = mergeResult.success ? 'done' : 'failed';

        return {
          ...result,
          worktreeInfo,
          merged: mergeResult.success,
          mergeConflicts: mergeResult.conflicts,
          durationMs: Date.now() - startTime,
        };
      } else {
        worktreeInfo.status = 'failed';
        worktreeInfo.completedAt = new Date().toISOString();

        return {
          ...result,
          worktreeInfo,
          merged: false,
          durationMs: Date.now() - startTime,
        };
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Get worktree info if created
      const existingInfo = Array.from(this.activeWorktrees.values())
        .find(w => w.taskId === task.id);

      if (existingInfo) {
        existingInfo.status = 'failed';
        existingInfo.completedAt = new Date().toISOString();
      }

      return {
        taskId: task.id,
        success: false,
        state: 'failed',
        error: errorMessage,
        durationMs: Date.now() - startTime,
        agentType: task.assignedAgent || 'CodeGenAgent',
        worktreeInfo: existingInfo || {
          id: `failed-${task.id}`,
          path: '',
          branch: '',
          taskId: task.id,
          agentType: task.assignedAgent || 'CodeGenAgent',
          status: 'failed',
          createdAt: new Date().toISOString(),
        },
        merged: false,
      };
    }
  }

  /**
   * Commit changes in worktree
   */
  private async commitChanges(info: WorktreeInfo, task: ManagedTask): Promise<boolean> {
    try {
      // Check for changes
      const status = await this.runGitCommand(['status', '--porcelain'], info.path);
      if (!status.trim()) {
        return false; // No changes
      }

      // Add all changes
      await this.runGitCommand(['add', '-A'], info.path);

      // Commit
      const message = `feat(${task.type}): ${task.title}

Task ID: ${task.id}
Agent: ${info.agentType}

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>`;

      await this.runGitCommand(['commit', '-m', message], info.path);
      return true;

    } catch {
      return false;
    }
  }

  /**
   * Merge worktree back to main branch
   */
  async mergeWorktree(info: WorktreeInfo): Promise<{ success: boolean; conflicts: string[] }> {
    info.status = 'merging';

    try {
      // Push worktree branch
      await this.runGitCommand(['push', '-u', 'origin', info.branch], info.path);

      // Checkout main and merge
      await this.runGitCommand(['checkout', 'main'], this.baseDir);
      await this.runGitCommand(['pull', 'origin', 'main'], this.baseDir);

      try {
        await this.runGitCommand(['merge', info.branch, '--no-ff', '-m', `Merge ${info.branch}`], this.baseDir);
        await this.handler?.onWorktreeMerge?.(info, []);
        return { success: true, conflicts: [] };

      } catch (mergeError) {
        // Check for conflicts
        const status = await this.runGitCommand(['status', '--porcelain'], this.baseDir);
        const conflicts = status
          .split('\n')
          .filter(line => line.startsWith('UU') || line.startsWith('AA'))
          .map(line => line.slice(3).trim());

        if (conflicts.length > 0) {
          // Abort merge
          await this.runGitCommand(['merge', '--abort'], this.baseDir);
          await this.handler?.onWorktreeMerge?.(info, conflicts);
          return { success: false, conflicts };
        }

        throw mergeError;
      }

    } catch {
      return { success: false, conflicts: [] };
    }
  }

  /**
   * Cleanup worktree
   */
  async cleanupWorktree(info: WorktreeInfo): Promise<void> {
    info.status = 'cleanup';

    try {
      // Remove worktree
      await this.runGitCommand(['worktree', 'remove', info.path, '--force'], this.baseDir);

      // Delete branch
      await this.runGitCommand(['branch', '-D', info.branch], this.baseDir);

      this.activeWorktrees.delete(info.id);
      await this.handler?.onWorktreeCleanup?.(info);

    } catch {
      // Worktree may already be removed
    }
  }

  /**
   * Execute multiple tasks in parallel worktrees
   */
  async executeParallel(
    tasks: ManagedTask[],
    concurrency: number = 3
  ): Promise<WorktreeExecutionResult[]> {
    const results: WorktreeExecutionResult[] = [];
    const queue = [...tasks];
    const running: Promise<void>[] = [];

    const processNext = async (): Promise<void> => {
      const task = queue.shift();
      if (!task) return;

      const result = await this.executeInWorktree(task);
      results.push(result);

      // Cleanup worktree
      if (result.worktreeInfo) {
        await this.cleanupWorktree(result.worktreeInfo);
      }

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
   * Prune stale worktrees
   */
  async pruneWorktrees(): Promise<void> {
    try {
      await this.runGitCommand(['worktree', 'prune'], this.baseDir);
    } catch {
      // Ignore errors
    }
  }

  /**
   * List active worktrees
   */
  async listWorktrees(): Promise<WorktreeInfo[]> {
    return Array.from(this.activeWorktrees.values());
  }

  /**
   * Get worktree by ID
   */
  getWorktree(id: string): WorktreeInfo | undefined {
    return this.activeWorktrees.get(id);
  }

  /**
   * Get worktrees by task ID
   */
  getWorktreesByTask(taskId: string): WorktreeInfo[] {
    return Array.from(this.activeWorktrees.values())
      .filter(w => w.taskId === taskId);
  }

  /**
   * Run git command
   */
  private runGitCommand(args: string[], cwd: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const proc = spawn('git', args, { cwd });
      let stdout = '';
      let stderr = '';

      proc.stdout?.on('data', data => {
        stdout += data.toString();
      });

      proc.stderr?.on('data', data => {
        stderr += data.toString();
      });

      proc.on('close', code => {
        if (code === 0) {
          resolve(stdout);
        } else {
          reject(new Error(stderr || `Git command failed with code ${code}`));
        }
      });

      proc.on('error', reject);
    });
  }

  /**
   * Get executor
   */
  getExecutor(): TaskExecutor {
    return this.executor;
  }

  /**
   * Get state machine
   */
  getStateMachine(): TaskStateMachine {
    return this.stateMachine;
  }
}
