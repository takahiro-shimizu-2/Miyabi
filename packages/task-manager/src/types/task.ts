/**
 * Task Manager - Task Types
 * Extended task types with state management and GitHub sync support
 */

/**
 * All possible task states
 */
export type TaskState =
  | 'draft'        // Created but not yet queued
  | 'pending'      // Queued for execution
  | 'analyzing'    // Being analyzed/decomposed
  | 'implementing' // Agent executing
  | 'reviewing'    // Under review
  | 'deploying'    // Being deployed
  | 'done'         // Successfully completed
  | 'blocked'      // Blocked by dependency or issue
  | 'failed'       // Execution failed
  | 'cancelled';   // User cancelled

/**
 * Task types matching the 53-label system
 */
export type TaskType =
  | 'feature'
  | 'bug'
  | 'refactor'
  | 'docs'
  | 'test'
  | 'deployment'
  | 'chore';

/**
 * Agent types that can execute tasks
 */
export type AgentType =
  | 'CoordinatorAgent'
  | 'CodeGenAgent'
  | 'ReviewAgent'
  | 'IssueAgent'
  | 'PRAgent'
  | 'DeploymentAgent'
  | 'TaskManagerAgent';

/**
 * Severity levels for tasks
 */
export type Severity =
  | 'Sev.1-Critical'
  | 'Sev.2-High'
  | 'Sev.3-Medium'
  | 'Sev.4-Low';

/**
 * Priority levels
 */
export type Priority =
  | 'P0-Critical'
  | 'P1-High'
  | 'P2-Medium'
  | 'P3-Low';

/**
 * State transition record
 */
export interface TaskStateTransition {
  from: TaskState;
  to: TaskState;
  timestamp: string;
  triggeredBy: 'user' | 'agent' | 'system' | 'github-webhook';
  reason?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Sync change record for bidirectional sync
 */
export interface SyncChange {
  field: string;
  oldValue: unknown;
  newValue: unknown;
  source: 'local' | 'github';
  timestamp: string;
}

/**
 * Base task interface (compatible with coding-agents Task)
 */
export interface BaseTask {
  id: string;
  title: string;
  description: string;
  type: TaskType;
  priority: number;
  severity?: Severity;
  assignedAgent?: AgentType;
  dependencies: string[];
  estimatedDuration?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Managed task with full state management and sync support
 */
export interface ManagedTask extends BaseTask {
  // State management
  currentState: TaskState;
  stateHistory: TaskStateTransition[];

  // GitHub sync fields
  githubIssueNumber?: number;
  projectItemId?: string;

  // Decomposition metadata
  decomposedFrom?: string;
  decomposedAt?: string;
  decompositionModel?: string;

  // Execution tracking
  retryCount: number;
  lastExecutionError?: string;
  executionWorktreePath?: string;
  startedAt?: string;
  completedAt?: string;

  // Sync metadata
  lastSyncedAt?: string;
  syncVersion: number;
  pendingSyncChanges: SyncChange[];
}

/**
 * Task creation input (subset of ManagedTask)
 */
export interface CreateTaskInput {
  title: string;
  description: string;
  type: TaskType;
  priority?: number;
  severity?: Severity;
  assignedAgent?: AgentType;
  dependencies?: string[];
  estimatedDuration?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Task update input
 */
export interface UpdateTaskInput {
  title?: string;
  description?: string;
  type?: TaskType;
  priority?: number;
  severity?: Severity;
  assignedAgent?: AgentType;
  dependencies?: string[];
  estimatedDuration?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Create a new ManagedTask with defaults
 */
export function createManagedTask(
  input: CreateTaskInput,
  id?: string
): ManagedTask {
  const now = new Date().toISOString();

  return {
    id: id || `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title: input.title,
    description: input.description,
    type: input.type,
    priority: input.priority ?? 50,
    severity: input.severity,
    assignedAgent: input.assignedAgent,
    dependencies: input.dependencies ?? [],
    estimatedDuration: input.estimatedDuration,
    metadata: input.metadata ?? {},
    currentState: 'draft',
    stateHistory: [
      {
        from: 'draft' as TaskState,
        to: 'draft' as TaskState,
        timestamp: now,
        triggeredBy: 'system',
        reason: 'Task created',
      },
    ],
    retryCount: 0,
    syncVersion: 0,
    pendingSyncChanges: [],
  };
}
