/**
 * @miyabi/task-manager
 *
 * LLM-based task decomposition and Linear-like status sync for Miyabi
 */

// Types
export * from './types/index.js';

// State Machine
export {
  TaskStateMachine,
  taskStateMachine,
  type StateTransitionRule,
  type TransitionResult,
} from './state/task-state-machine.js';

// Decomposition
export {
  LLMDecomposer,
  DecompositionValidator,
  SYSTEM_PROMPT,
  buildDecompositionPrompt,
  buildSimplePrompt,
} from './decomposition/index.js';

// Sync
export {
  GitHubLabelSync,
  ProjectsV2Sync,
  BidirectionalSync,
  type ConflictStrategy,
  type BidirectionalSyncOptions,
} from './sync/index.js';

// TODO: Export execution classes when implemented
// export { TaskExecutor } from './execution/task-executor.js';
// export { WorktreeCoordinator } from './execution/worktree-coordinator.js';

// TODO: Export TaskManager when implemented
// export { TaskManager } from './task-manager.js';
