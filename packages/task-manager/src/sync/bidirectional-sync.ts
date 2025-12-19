/**
 * Bidirectional Sync Orchestrator
 * Coordinates Label sync and Projects V2 sync for two-way synchronization
 */

import type {
  ManagedTask,
  TaskState,
  SyncResult,
  SyncItemResult,
  SyncConflict,
  SyncHandler,
  SyncConfig,
  SyncEvent,
} from '../types/index.js';
import { GitHubLabelSync } from './github-label-sync.js';
import { ProjectsV2Sync } from './projects-v2-sync.js';
import { TaskStateMachine } from '../state/task-state-machine.js';

/**
 * Conflict resolution strategy
 */
export type ConflictStrategy = 'local-wins' | 'github-wins' | 'newest-wins' | 'ask';

/**
 * Bidirectional sync options
 */
export interface BidirectionalSyncOptions {
  conflictStrategy: ConflictStrategy;
  syncLabels: boolean;
  syncProjects: boolean;
  statusFieldName: string;
  batchSize: number;
  validateTransitions: boolean;
}

/**
 * Default sync options
 */
const DEFAULT_OPTIONS: BidirectionalSyncOptions = {
  conflictStrategy: 'local-wins',
  syncLabels: true,
  syncProjects: true,
  statusFieldName: 'Status',
  batchSize: 10,
  validateTransitions: true,
};

/**
 * Bidirectional Sync class
 */
export class BidirectionalSync {
  private labelSync: GitHubLabelSync;
  private projectsSync: ProjectsV2Sync;
  private stateMachine: TaskStateMachine;
  private options: BidirectionalSyncOptions;
  private handler?: SyncHandler;
  private eventQueue: SyncEvent[] = [];
  private isProcessing = false;

  constructor(
    config: SyncConfig,
    options: Partial<BidirectionalSyncOptions> = {},
    handler?: SyncHandler
  ) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.handler = handler;
    this.stateMachine = new TaskStateMachine();

    // Create internal handler that wraps user handler
    const internalHandler: SyncHandler = {
      onConflict: async (conflict) => {
        return this.resolveConflict(conflict);
      },
      onSyncStart: (direction) => {
        this.handler?.onSyncStart?.(direction);
      },
      onSyncComplete: (result) => {
        this.handler?.onSyncComplete?.(result);
      },
      onError: (error, taskId) => {
        this.handler?.onError?.(error, taskId);
      },
    };

    this.labelSync = new GitHubLabelSync(config, internalHandler);
    this.projectsSync = new ProjectsV2Sync(config, internalHandler);
  }

  /**
   * Initialize both sync services
   */
  async initialize(): Promise<void> {
    if (this.options.syncLabels) {
      await this.labelSync.ensureStateLabels();
    }
    if (this.options.syncProjects) {
      await this.projectsSync.initialize();
    }
  }

  /**
   * Push task state to GitHub (both labels and projects)
   */
  async push(task: ManagedTask): Promise<SyncResult> {
    const startTime = Date.now();
    this.handler?.onSyncStart?.('push');

    const items: SyncItemResult[] = [];
    const conflicts: SyncConflict[] = [];
    let synced = 0;
    let failed = 0;
    let skipped = 0;

    // Push to labels
    if (this.options.syncLabels) {
      const labelResult = await this.labelSync.pushState(task);
      items.push({ ...labelResult, operation: labelResult.operation });

      if (labelResult.success) {
        if (labelResult.operation === 'skip') skipped++;
        else synced++;
      } else {
        failed++;
      }
    }

    // Push to projects
    if (this.options.syncProjects) {
      const projectResult = await this.projectsSync.pushState(
        task,
        this.options.statusFieldName
      );
      items.push({ ...projectResult, operation: projectResult.operation });

      if (projectResult.success) {
        if (projectResult.operation === 'skip') skipped++;
        else synced++;
      } else {
        failed++;
      }
    }

    const result: SyncResult = {
      success: failed === 0,
      direction: 'push',
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
   * Pull task state from GitHub
   */
  async pull(task: ManagedTask): Promise<{
    state: TaskState | null;
    labelState: TaskState | null;
    projectState: TaskState | null;
    conflicts: SyncConflict[];
  }> {
    if (!task.githubIssueNumber) {
      return {
        state: null,
        labelState: null,
        projectState: null,
        conflicts: [],
      };
    }

    const conflicts: SyncConflict[] = [];
    let labelState: TaskState | null = null;
    let projectState: TaskState | null = null;

    // Pull from labels
    if (this.options.syncLabels) {
      const { state } = await this.labelSync.pullState(task.githubIssueNumber);
      labelState = state;
    }

    // Pull from projects
    if (this.options.syncProjects) {
      const { state } = await this.projectsSync.pullState(
        task.githubIssueNumber,
        this.options.statusFieldName
      );
      projectState = state;
    }

    // Check for conflicts between label and project state
    if (labelState && projectState && labelState !== projectState) {
      conflicts.push({
        taskId: task.id,
        field: 'state',
        localValue: labelState,
        githubValue: projectState,
      });
    }

    // Determine final state (labels take priority by default)
    const state = labelState ?? projectState;

    // Check for conflict with local state
    if (state && state !== task.currentState) {
      conflicts.push({
        taskId: task.id,
        field: 'state',
        localValue: task.currentState,
        githubValue: state,
      });
    }

    return { state, labelState, projectState, conflicts };
  }

  /**
   * Sync tasks bidirectionally
   */
  async sync(
    tasks: ManagedTask[],
    direction: 'push' | 'pull' | 'bidirectional' = 'bidirectional'
  ): Promise<SyncResult> {
    const startTime = Date.now();
    this.handler?.onSyncStart?.(direction);

    const items: SyncItemResult[] = [];
    const conflicts: SyncConflict[] = [];
    let synced = 0;
    let failed = 0;
    let skipped = 0;

    // Process in batches
    for (let i = 0; i < tasks.length; i += this.options.batchSize) {
      const batch = tasks.slice(i, i + this.options.batchSize);

      for (const task of batch) {
        try {
          if (direction === 'push' || direction === 'bidirectional') {
            const pushResult = await this.push(task);
            items.push(...pushResult.items);
            conflicts.push(...pushResult.conflicts);
            synced += pushResult.synced;
            failed += pushResult.failed;
            skipped += pushResult.skipped;
          }

          if (direction === 'pull' || direction === 'bidirectional') {
            const pullResult = await this.pull(task);
            conflicts.push(...pullResult.conflicts);

            if (pullResult.state && pullResult.state !== task.currentState) {
              // Validate transition if enabled
              if (this.options.validateTransitions) {
                if (!this.stateMachine.canTransition(task.currentState, pullResult.state)) {
                  conflicts.push({
                    taskId: task.id,
                    field: 'state',
                    localValue: task.currentState,
                    githubValue: pullResult.state,
                    resolutionReason: 'Invalid state transition',
                  });
                  skipped++;
                  continue;
                }
              }

              items.push({
                taskId: task.id,
                success: true,
                operation: 'update',
                issueNumber: task.githubIssueNumber,
              });
              synced++;
            } else {
              skipped++;
            }
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          this.handler?.onError?.(
            error instanceof Error ? error : new Error(errorMessage),
            task.id
          );
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
   * Handle sync event from webhook
   */
  async handleEvent(event: SyncEvent): Promise<void> {
    this.eventQueue.push(event);
    await this.processEventQueue();
  }

  /**
   * Process event queue
   */
  private async processEventQueue(): Promise<void> {
    if (this.isProcessing || this.eventQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      while (this.eventQueue.length > 0) {
        const event = this.eventQueue.shift();
        if (!event) continue;

        // Process based on event type
        switch (event.type) {
          case 'label_changed':
            // Label changed on GitHub - sync to local
            if (event.issueNumber) {
              const { state } = await this.labelSync.pullState(event.issueNumber);
              // Emit state change for handling
              if (state) {
                console.log(`State pulled from labels: ${state} for issue #${event.issueNumber}`);
              }
            }
            break;

          case 'project_item_updated':
            // Project item updated - sync to local
            if (event.issueNumber) {
              const { state } = await this.projectsSync.pullState(
                event.issueNumber,
                this.options.statusFieldName
              );
              if (state) {
                console.log(`State pulled from project: ${state} for issue #${event.issueNumber}`);
              }
            }
            break;

          case 'issue_created':
          case 'issue_updated':
          case 'issue_closed':
            // Handle issue lifecycle events
            console.log(`Issue event: ${event.type} for issue #${event.issueNumber}`);
            break;
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Resolve conflict based on strategy
   */
  private async resolveConflict(conflict: SyncConflict): Promise<'local' | 'github' | 'skip'> {
    switch (this.options.conflictStrategy) {
      case 'local-wins':
        conflict.resolvedTo = 'local';
        conflict.resolvedAt = new Date().toISOString();
        return 'local';

      case 'github-wins':
        conflict.resolvedTo = 'github';
        conflict.resolvedAt = new Date().toISOString();
        return 'github';

      case 'newest-wins':
        // Would need timestamp comparison logic here
        // For now, default to local
        conflict.resolvedTo = 'local';
        conflict.resolvedAt = new Date().toISOString();
        return 'local';

      case 'ask':
        // Delegate to handler if available
        if (this.handler?.onConflict) {
          return this.handler.onConflict(conflict);
        }
        return 'skip';

      default:
        return 'local';
    }
  }

  /**
   * Get label sync instance
   */
  getLabelSync(): GitHubLabelSync {
    return this.labelSync;
  }

  /**
   * Get projects sync instance
   */
  getProjectsSync(): ProjectsV2Sync {
    return this.projectsSync;
  }

  /**
   * Get state machine instance
   */
  getStateMachine(): TaskStateMachine {
    return this.stateMachine;
  }

  /**
   * Update options
   */
  updateOptions(options: Partial<BidirectionalSyncOptions>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * Get current options
   */
  getOptions(): BidirectionalSyncOptions {
    return { ...this.options };
  }
}
