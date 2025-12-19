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

// Execution
export {
  TaskExecutor,
  WorktreeCoordinator,
  type ExecutionResult,
  type ExecutionHandler,
  type AgentExecutor,
  type WorktreeInfo,
  type WorktreeExecutionResult,
  type WorktreeCoordinatorHandler,
} from './execution/index.js';

// Task Manager
export {
  TaskManager,
  type TaskManagerHandler,
} from './task-manager.js';
