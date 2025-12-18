/**
 * Ω (Omega) Function Type Definitions (SWML-compliant)
 *
 * Mathematical Definition: Ω: I × W → R
 *
 * The Omega function is the core transformation that maps
 * Intent Space and World Space to Result Space.
 *
 * SWML Axioms:
 * - A0.1 (Existence): ∀ t: ∃! W(t)
 * - A0.2 (Causality): t₁ < t₂ ⟹ W(t₁) ⊢ W(t₂)
 * - A0.3 (Determinism): Ω(I, W) = R
 *
 * @module types/omega
 * @see miyabi_def/SWML_PAPER.pdf
 */

import type { WorldSpace, WorldState } from './world';
import type { IntentSpace } from './intent';
import type { ResultSpace, ResultStatus } from './result';

// ============================================================================
// Omega Function Core Types
// ============================================================================

/**
 * Omega function signature
 *
 * The fundamental transformation: Ω: I × W → R
 */
export type OmegaFunction = (
  intent: IntentSpace,
  world: WorldSpace
) => Promise<ResultSpace>;

/**
 * Synchronous omega function (for simple transformations)
 */
export type OmegaFunctionSync = (
  intent: IntentSpace,
  world: WorldSpace
) => ResultSpace;

/**
 * Omega function with streaming results
 */
export type OmegaFunctionStream = (
  intent: IntentSpace,
  world: WorldSpace
) => AsyncGenerator<Partial<ResultSpace>, ResultSpace, unknown>;

// ============================================================================
// Execution Context
// ============================================================================

/**
 * Execution engine interface
 */
export interface ExecutionEngine {
  /** Engine identifier */
  id: string;

  /** Engine version */
  version: string;

  /** Engine type */
  type: 'claude-code' | 'codex' | 'cursor' | 'custom';

  /** Execute a task */
  execute: (task: ExecutionTask) => Promise<ExecutionResult>;

  /** Check engine health */
  healthCheck: () => Promise<boolean>;

  /** Get engine capabilities */
  capabilities: () => EngineCapabilities;
}

/**
 * Engine capabilities
 */
export interface EngineCapabilities {
  parallel: boolean;
  maxConcurrency: number;
  supportedLanguages: string[];
  supportedTools: string[];
  maxTokens: number;
  streaming: boolean;
}

/**
 * Execution task
 */
export interface ExecutionTask {
  taskId: string;
  type: string;
  input: Record<string, unknown>;
  timeout?: number;
  priority?: number;
}

/**
 * Execution result
 */
export interface ExecutionResult {
  taskId: string;
  status: 'success' | 'failed' | 'timeout' | 'cancelled';
  output: Record<string, unknown>;
  durationMs: number;
  error?: string;
}

/**
 * Omega execution context
 *
 * Contains all information needed to execute the Ω function
 */
export interface OmegaContext {
  /** Intent specification */
  intent: IntentSpace;

  /** World state */
  world: WorldSpace;

  /** Execution engine */
  executionEngine: ExecutionEngine;

  /** Execution options */
  options: OmegaExecutionOptions;

  /** Session tracking */
  session: OmegaSession;
}

/**
 * Omega execution options
 */
export interface OmegaExecutionOptions {
  /** Maximum execution time in milliseconds */
  timeout: number;

  /** Number of retries on failure */
  retries: number;

  /** Dry run mode (no side effects) */
  dryRun: boolean;

  /** Verbose logging */
  verbose: boolean;

  /** Checkpoint interval for long-running tasks */
  checkpointIntervalMs?: number;

  /** Enable parallel execution */
  parallel: boolean;

  /** Maximum concurrent tasks */
  maxConcurrency: number;

  /** Auto-approve below this quality threshold */
  autoApproveThreshold: number;
}

/**
 * Omega session tracking
 */
export interface OmegaSession {
  /** Session ID */
  sessionId: string;

  /** Device identifier */
  deviceId: string;

  /** Start time */
  startedAt: string;

  /** Parent session (for nested executions) */
  parentSessionId?: string;

  /** Execution history */
  history: OmegaExecutionRecord[];
}

// ============================================================================
// Execution Records
// ============================================================================

/**
 * Omega execution record
 */
export interface OmegaExecutionRecord {
  /** Execution ID */
  executionId: string;

  /** Timestamp */
  timestamp: string;

  /** Intent snapshot */
  intentSnapshot: IntentSpace;

  /** World state snapshot */
  worldSnapshot: WorldState;

  /** Result */
  result: ResultSpace;

  /** Duration */
  durationMs: number;

  /** Success flag */
  success: boolean;
}

/**
 * Execution checkpoint for resumption
 */
export interface OmegaCheckpoint {
  /** Checkpoint ID */
  checkpointId: string;

  /** Session ID */
  sessionId: string;

  /** Checkpoint timestamp */
  timestamp: string;

  /** Current progress (0-100) */
  progress: number;

  /** Partial result */
  partialResult: Partial<ResultSpace>;

  /** Remaining tasks */
  remainingTasks: string[];

  /** State for resumption */
  resumptionState: Record<string, unknown>;
}

// ============================================================================
// Omega Operators
// ============================================================================

/**
 * Omega composition: Ω₂ ∘ Ω₁
 *
 * Chains two omega functions where output of first becomes input context for second
 */
export type OmegaComposition = (
  omega1: OmegaFunction,
  omega2: OmegaFunction
) => OmegaFunction;

/**
 * Omega parallel: Ω₁ ∥ Ω₂
 *
 * Executes two omega functions in parallel and merges results
 */
export type OmegaParallel = (
  omega1: OmegaFunction,
  omega2: OmegaFunction,
  merger: ResultMerger
) => OmegaFunction;

/**
 * Omega conditional: Ω₁ ? Ω₂ : Ω₃
 *
 * Chooses omega function based on predicate
 */
export type OmegaConditional = (
  predicate: (intent: IntentSpace, world: WorldSpace) => boolean,
  omegaTrue: OmegaFunction,
  omegaFalse: OmegaFunction
) => OmegaFunction;

/**
 * Result merger for parallel execution
 */
export type ResultMerger = (
  result1: ResultSpace,
  result2: ResultSpace
) => ResultSpace;

// ============================================================================
// Omega Transformers
// ============================================================================

/**
 * Intent transformer: I → I'
 */
export type IntentTransformer = (intent: IntentSpace) => IntentSpace;

/**
 * World transformer: W → W'
 */
export type WorldTransformer = (world: WorldSpace) => WorldSpace;

/**
 * Result transformer: R → R'
 */
export type ResultTransformer = (result: ResultSpace) => ResultSpace;

/**
 * Pre-processor: Transform inputs before Ω execution
 */
export interface OmegaPreProcessor {
  name: string;
  intentTransform?: IntentTransformer;
  worldTransform?: WorldTransformer;
}

/**
 * Post-processor: Transform outputs after Ω execution
 */
export interface OmegaPostProcessor {
  name: string;
  resultTransform: ResultTransformer;
  condition?: (result: ResultSpace) => boolean;
}

// ============================================================================
// Omega Execution Pipeline
// ============================================================================

/**
 * Pipeline stage
 */
export interface OmegaPipelineStage {
  name: string;
  omega: OmegaFunction;
  preProcessors: OmegaPreProcessor[];
  postProcessors: OmegaPostProcessor[];
  errorHandler?: OmegaErrorHandler;
}

/**
 * Error handler
 */
export type OmegaErrorHandler = (
  error: Error,
  context: OmegaContext
) => Promise<ResultSpace | null>;

/**
 * Omega pipeline
 */
export interface OmegaPipeline {
  /** Pipeline ID */
  id: string;

  /** Pipeline name */
  name: string;

  /** Pipeline stages */
  stages: OmegaPipelineStage[];

  /** Execute the pipeline */
  execute: (
    intent: IntentSpace,
    world: WorldSpace
  ) => Promise<ResultSpace>;

  /** Add a stage */
  addStage: (stage: OmegaPipelineStage) => void;

  /** Remove a stage */
  removeStage: (stageName: string) => void;
}

// ============================================================================
// Omega Factory
// ============================================================================

/**
 * Omega function factory configuration
 */
export interface OmegaFactoryConfig {
  /** Default execution options */
  defaultOptions: Partial<OmegaExecutionOptions>;

  /** Available engines */
  engines: ExecutionEngine[];

  /** Pre-processors to apply to all executions */
  globalPreProcessors: OmegaPreProcessor[];

  /** Post-processors to apply to all executions */
  globalPostProcessors: OmegaPostProcessor[];

  /** Global error handler */
  globalErrorHandler?: OmegaErrorHandler;
}

/**
 * Omega function factory
 */
export interface OmegaFactory {
  /** Create a new omega function */
  create: (config?: Partial<OmegaFactoryConfig>) => OmegaFunction;

  /** Create a pipeline */
  createPipeline: (stages: OmegaPipelineStage[]) => OmegaPipeline;

  /** Compose omega functions */
  compose: OmegaComposition;

  /** Parallelize omega functions */
  parallel: OmegaParallel;

  /** Create conditional omega */
  conditional: OmegaConditional;
}

// ============================================================================
// Omega Metrics
// ============================================================================

/**
 * Omega execution metrics
 */
export interface OmegaMetrics {
  /** Total executions */
  totalExecutions: number;

  /** Successful executions */
  successfulExecutions: number;

  /** Failed executions */
  failedExecutions: number;

  /** Average duration (ms) */
  averageDurationMs: number;

  /** P95 duration (ms) */
  p95DurationMs: number;

  /** P99 duration (ms) */
  p99DurationMs: number;

  /** Average quality score */
  averageQualityScore: number;

  /** Token usage */
  tokenUsage: {
    total: number;
    input: number;
    output: number;
  };

  /** Cost */
  totalCost: number;

  /** By status */
  byStatus: Record<ResultStatus, number>;

  /** By agent type */
  byAgentType: Record<string, number>;
}

/**
 * Metrics collector
 */
export interface OmegaMetricsCollector {
  /** Record an execution */
  record: (record: OmegaExecutionRecord) => void;

  /** Get current metrics */
  getMetrics: () => OmegaMetrics;

  /** Reset metrics */
  reset: () => void;

  /** Export metrics */
  export: (format: 'json' | 'prometheus') => string;
}

// ============================================================================
// Default Implementations
// ============================================================================

/**
 * Default omega execution options
 */
export const DEFAULT_OMEGA_OPTIONS: OmegaExecutionOptions = {
  timeout: 300000,        // 5 minutes
  retries: 2,
  dryRun: false,
  verbose: false,
  parallel: true,
  maxConcurrency: 3,
  autoApproveThreshold: 80,
};

/**
 * Create a simple omega function from a handler
 */
export function createOmegaFunction(
  handler: (intent: IntentSpace, world: WorldSpace) => Promise<ResultSpace>
): OmegaFunction {
  return handler;
}

/**
 * Compose two omega functions
 */
export function composeOmega(
  omega1: OmegaFunction,
  omega2: OmegaFunction
): OmegaFunction {
  return async (intent: IntentSpace, world: WorldSpace): Promise<ResultSpace> => {
    // Execute first omega (result can be used to modify intent/world for omega2)
    await omega1(intent, world);
    // In a full implementation, result would modify intent/world for omega2
    return omega2(intent, world);
  };
}
