/**
 * Task Manager - Sync Types
 * Types for GitHub synchronization
 */

import type { ManagedTask, TaskState } from './task.js';

/**
 * Sync direction
 */
export type SyncDirection = 'push' | 'pull' | 'bidirectional';

/**
 * Sync conflict
 */
export interface SyncConflict {
  taskId: string;
  field: string;
  localValue: unknown;
  githubValue: unknown;
  resolvedTo?: 'local' | 'github';
  resolvedAt?: string;
  resolutionReason?: string;
}

/**
 * Individual sync item result
 */
export interface SyncItemResult {
  taskId: string;
  success: boolean;
  operation: 'create' | 'update' | 'delete' | 'skip';
  error?: string;
  issueNumber?: number;
  projectItemId?: string;
}

/**
 * Overall sync result
 */
export interface SyncResult {
  success: boolean;
  direction: SyncDirection;
  synced: number;
  failed: number;
  skipped: number;
  items: SyncItemResult[];
  conflicts: SyncConflict[];
  timestamp: string;
  durationMs: number;
}

/**
 * GitHub issue representation for sync
 */
export interface GitHubIssueInfo {
  number: number;
  title: string;
  body: string;
  state: 'open' | 'closed';
  labels: string[];
  assignees: string[];
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
}

/**
 * Projects V2 item representation
 */
export interface ProjectItemInfo {
  id: string;
  contentId: string;
  fieldValues: Record<string, string | number | null>;
}

/**
 * Sync state snapshot
 */
export interface SyncSnapshot {
  tasks: Map<string, ManagedTask>;
  lastSyncAt: string;
  syncVersion: number;
}

/**
 * Sync event for webhooks
 */
export interface SyncEvent {
  type: 'issue_created' | 'issue_updated' | 'issue_closed' | 'label_changed' | 'project_item_updated';
  issueNumber?: number;
  taskId?: string;
  changes: Record<string, { from: unknown; to: unknown }>;
  timestamp: string;
  source: 'github' | 'local';
}

/**
 * Sync handler interface
 */
export interface SyncHandler {
  onConflict?: (conflict: SyncConflict) => Promise<'local' | 'github' | 'skip'>;
  onSyncStart?: (direction: SyncDirection) => void;
  onSyncComplete?: (result: SyncResult) => void;
  onError?: (error: Error, taskId?: string) => void;
}

/**
 * State to label mapping
 */
export const STATE_TO_LABEL: Record<TaskState, string> = {
  'draft': 'state:draft',
  'pending': 'state:pending',
  'analyzing': 'state:analyzing',
  'implementing': 'state:implementing',
  'reviewing': 'state:reviewing',
  'deploying': 'state:deploying',
  'done': 'state:done',
  'blocked': 'state:blocked',
  'failed': 'state:failed',
  'cancelled': 'state:cancelled',
};

/**
 * Label to state mapping (reverse)
 */
export const LABEL_TO_STATE: Record<string, TaskState> = Object.entries(
  STATE_TO_LABEL
).reduce(
  (acc, [state, label]) => {
    acc[label] = state as TaskState;
    return acc;
  },
  {} as Record<string, TaskState>
);

/**
 * Get state from labels
 */
export function getStateFromLabels(labels: string[]): TaskState | null {
  for (const label of labels) {
    if (label in LABEL_TO_STATE) {
      return LABEL_TO_STATE[label];
    }
  }
  return null;
}

/**
 * Get label for state
 */
export function getLabelForState(state: TaskState): string {
  return STATE_TO_LABEL[state];
}
