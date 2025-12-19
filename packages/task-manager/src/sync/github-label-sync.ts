/**
 * GitHub Label Sync
 * Synchronizes task state with GitHub Issue labels
 */

import { Octokit } from '@octokit/rest';
import type {
  ManagedTask,
  TaskState,
  SyncResult,
  SyncItemResult,
  SyncConflict,
  SyncHandler,
  GitHubIssueInfo,
  SyncConfig,
} from '../types/index.js';
import {
  STATE_TO_LABEL,
  LABEL_TO_STATE,
  getStateFromLabels,
  getLabelForState,
} from '../types/sync.js';

/**
 * State label prefix
 */
const STATE_LABEL_PREFIX = 'state:';

/**
 * GitHub Label Sync class
 */
export class GitHubLabelSync {
  private octokit: Octokit;
  private owner: string;
  private repo: string;
  private handler?: SyncHandler;

  constructor(config: SyncConfig, handler?: SyncHandler) {
    this.octokit = new Octokit({ auth: config.github.token });
    this.owner = config.github.owner;
    this.repo = config.github.repo;
    this.handler = handler;
  }

  /**
   * Ensure all state labels exist in the repository
   */
  async ensureStateLabels(): Promise<void> {
    const existingLabels = await this.getExistingLabels();
    const existingLabelNames = new Set(existingLabels.map(l => l.name));

    for (const [state, label] of Object.entries(STATE_TO_LABEL)) {
      if (!existingLabelNames.has(label)) {
        await this.createStateLabel(state as TaskState, label);
      }
    }
  }

  /**
   * Get existing labels from repository
   */
  private async getExistingLabels(): Promise<{ name: string; color: string }[]> {
    const { data } = await this.octokit.issues.listLabelsForRepo({
      owner: this.owner,
      repo: this.repo,
      per_page: 100,
    });
    return data.map(l => ({ name: l.name, color: l.color || '' }));
  }

  /**
   * Create a state label
   */
  private async createStateLabel(state: TaskState, labelName: string): Promise<void> {
    const colors: Record<TaskState, string> = {
      draft: 'e7e7e7',
      pending: 'fbca04',
      analyzing: '0052cc',
      implementing: '5319e7',
      reviewing: 'd93f0b',
      deploying: '006b75',
      done: '0e8a16',
      blocked: 'b60205',
      failed: 'c41018',
      cancelled: 'cccccc',
    };

    try {
      await this.octokit.issues.createLabel({
        owner: this.owner,
        repo: this.repo,
        name: labelName,
        color: colors[state],
        description: `Task state: ${state}`,
      });
    } catch (error: unknown) {
      // Label may already exist
      const err = error as { status?: number };
      if (err.status !== 422) {
        throw error;
      }
    }
  }

  /**
   * Push task state to GitHub Issue labels
   */
  async pushState(task: ManagedTask): Promise<SyncItemResult> {
    if (!task.githubIssueNumber) {
      return {
        taskId: task.id,
        success: false,
        operation: 'skip',
        error: 'Task has no associated GitHub issue',
      };
    }

    try {
      // Get current labels
      const { data: issue } = await this.octokit.issues.get({
        owner: this.owner,
        repo: this.repo,
        issue_number: task.githubIssueNumber,
      });

      const currentLabels = issue.labels
        .map(l => (typeof l === 'string' ? l : l.name || ''))
        .filter(Boolean);

      // Find current state label
      const currentStateLabel = currentLabels.find(l => l.startsWith(STATE_LABEL_PREFIX));
      const newStateLabel = getLabelForState(task.currentState);

      // Check for conflict
      if (currentStateLabel && currentStateLabel !== newStateLabel) {
        const currentState = getStateFromLabels([currentStateLabel]);
        if (currentState) {
          const conflict: SyncConflict = {
            taskId: task.id,
            field: 'state',
            localValue: task.currentState,
            githubValue: currentState,
          };

          if (this.handler?.onConflict) {
            const resolution = await this.handler.onConflict(conflict);
            if (resolution === 'github') {
              return {
                taskId: task.id,
                success: true,
                operation: 'skip',
                issueNumber: task.githubIssueNumber,
              };
            } else if (resolution === 'skip') {
              return {
                taskId: task.id,
                success: true,
                operation: 'skip',
                issueNumber: task.githubIssueNumber,
              };
            }
          }
        }
      }

      // Remove old state labels and add new one
      const updatedLabels = currentLabels.filter(l => !l.startsWith(STATE_LABEL_PREFIX));
      updatedLabels.push(newStateLabel);

      await this.octokit.issues.setLabels({
        owner: this.owner,
        repo: this.repo,
        issue_number: task.githubIssueNumber,
        labels: updatedLabels,
      });

      return {
        taskId: task.id,
        success: true,
        operation: 'update',
        issueNumber: task.githubIssueNumber,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.handler?.onError?.(error instanceof Error ? error : new Error(errorMessage), task.id);
      return {
        taskId: task.id,
        success: false,
        operation: 'update',
        error: errorMessage,
      };
    }
  }

  /**
   * Pull state from GitHub Issue labels
   */
  async pullState(issueNumber: number): Promise<{ state: TaskState | null; labels: string[] }> {
    const { data: issue } = await this.octokit.issues.get({
      owner: this.owner,
      repo: this.repo,
      issue_number: issueNumber,
    });

    const labels = issue.labels
      .map(l => (typeof l === 'string' ? l : l.name || ''))
      .filter(Boolean);

    const state = getStateFromLabels(labels);
    return { state, labels };
  }

  /**
   * Get GitHub issue info
   */
  async getIssueInfo(issueNumber: number): Promise<GitHubIssueInfo> {
    const { data: issue } = await this.octokit.issues.get({
      owner: this.owner,
      repo: this.repo,
      issue_number: issueNumber,
    });

    return {
      number: issue.number,
      title: issue.title,
      body: issue.body || '',
      state: issue.state as 'open' | 'closed',
      labels: issue.labels
        .map(l => (typeof l === 'string' ? l : l.name || ''))
        .filter(Boolean),
      assignees: issue.assignees?.map(a => a.login) || [],
      createdAt: issue.created_at,
      updatedAt: issue.updated_at,
      closedAt: issue.closed_at ?? undefined,
    };
  }

  /**
   * Sync multiple tasks
   */
  async syncTasks(tasks: ManagedTask[], direction: 'push' | 'pull'): Promise<SyncResult> {
    const startTime = Date.now();
    this.handler?.onSyncStart?.(direction);

    const items: SyncItemResult[] = [];
    const conflicts: SyncConflict[] = [];
    let synced = 0;
    let failed = 0;
    let skipped = 0;

    for (const task of tasks) {
      if (direction === 'push') {
        const result = await this.pushState(task);
        items.push(result);

        if (result.success) {
          if (result.operation === 'skip') {
            skipped++;
          } else {
            synced++;
          }
        } else {
          failed++;
        }
      } else {
        // Pull - requires task to have githubIssueNumber
        if (!task.githubIssueNumber) {
          items.push({
            taskId: task.id,
            success: false,
            operation: 'skip',
            error: 'No GitHub issue number',
          });
          skipped++;
          continue;
        }

        try {
          const { state } = await this.pullState(task.githubIssueNumber);
          if (state && state !== task.currentState) {
            conflicts.push({
              taskId: task.id,
              field: 'state',
              localValue: task.currentState,
              githubValue: state,
            });
          }
          items.push({
            taskId: task.id,
            success: true,
            operation: 'update',
            issueNumber: task.githubIssueNumber,
          });
          synced++;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          items.push({
            taskId: task.id,
            success: false,
            operation: 'update',
            error: errorMessage,
          });
          failed++;
        }
      }
    }

    const result: SyncResult = {
      success: failed === 0,
      direction,
      synced,
      failed,
      skipped,
      items,
      conflicts,
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - startTime,
    };

    this.handler?.onSyncComplete?.(result);
    return result;
  }

  /**
   * Add labels to an issue
   */
  async addLabels(issueNumber: number, labels: string[]): Promise<void> {
    await this.octokit.issues.addLabels({
      owner: this.owner,
      repo: this.repo,
      issue_number: issueNumber,
      labels,
    });
  }

  /**
   * Remove labels from an issue
   */
  async removeLabels(issueNumber: number, labels: string[]): Promise<void> {
    for (const label of labels) {
      try {
        await this.octokit.issues.removeLabel({
          owner: this.owner,
          repo: this.repo,
          issue_number: issueNumber,
          name: label,
        });
      } catch {
        // Label may not exist, ignore
      }
    }
  }

  /**
   * Get all state labels that exist in a label list
   */
  getStateLabelsFromList(labels: string[]): string[] {
    return labels.filter(l => l.startsWith(STATE_LABEL_PREFIX));
  }

  /**
   * Validate state transition via labels
   */
  isValidLabelTransition(fromLabels: string[], toLabel: string): boolean {
    const fromState = getStateFromLabels(fromLabels);
    const toState = LABEL_TO_STATE[toLabel];

    if (!fromState || !toState) {
      return false;
    }

    // Basic transition rules - delegate to state machine for full validation
    const validTransitions: Record<TaskState, TaskState[]> = {
      draft: ['pending', 'cancelled'],
      pending: ['analyzing', 'blocked', 'cancelled'],
      analyzing: ['implementing', 'pending', 'blocked', 'failed'],
      implementing: ['reviewing', 'blocked', 'failed'],
      reviewing: ['implementing', 'deploying', 'done', 'failed'],
      deploying: ['done', 'failed', 'reviewing'],
      done: [],
      blocked: ['pending', 'cancelled'],
      failed: ['pending', 'cancelled'],
      cancelled: [],
    };

    return validTransitions[fromState]?.includes(toState) ?? false;
  }
}
