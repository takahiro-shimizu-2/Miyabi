/**
 * Task Manager - Type Exports
 */

// Task types
export type {
  TaskState,
  TaskType,
  AgentType,
  Severity,
  Priority,
  TaskStateTransition,
  SyncChange,
  BaseTask,
  ManagedTask,
  CreateTaskInput,
  UpdateTaskInput,
} from './task.js';

export { createManagedTask } from './task.js';

// Configuration types
export type {
  LLMConfig,
  GitHubConfig,
  LabelMapping,
  FieldMapping,
  SyncConfig,
  RetryConfig,
  ExecutionConfig,
  StateConfig,
  LoggingConfig,
  TaskManagerConfig,
} from './config.js';

export {
  DEFAULT_LABEL_MAPPING,
  DEFAULT_FIELD_MAPPING,
  createDefaultConfig,
} from './config.js';

// Decomposition types
export type {
  DecompositionContext,
  DecompositionConstraints,
  DecompositionRequest,
  DAGEdge,
  DAGResult,
  DecompositionWarning,
  DecompositionMetadata,
  DecompositionResult,
  DecompositionValidationResult,
  RawLLMTask,
  DecompositionWarningCode,
} from './decomposition.js';

export { DECOMPOSITION_WARNING_CODES } from './decomposition.js';

// Sync types
export type {
  SyncDirection,
  SyncConflict,
  SyncItemResult,
  SyncResult,
  GitHubIssueInfo,
  ProjectItemInfo,
  SyncSnapshot,
  SyncEvent,
  SyncHandler,
} from './sync.js';

export {
  STATE_TO_LABEL,
  LABEL_TO_STATE,
  getStateFromLabels,
  getLabelForState,
} from './sync.js';
