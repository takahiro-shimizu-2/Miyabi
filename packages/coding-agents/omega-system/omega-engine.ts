/**
 * Ω-System Execution Engine
 *
 * Mathematical Definition: Ω: I × W → R
 *
 * The complete execution pipeline composed of 6 transforms:
 * E = θ₆ ∘ θ₅ ∘ θ₄ ∘ θ₃ ∘ θ₂ ∘ θ₁
 *
 * @module omega-system/omega-engine
 */

import type { IntentSpace } from '../types/intent';
import type { WorldSpace } from '../types/world';

// Transform imports
import { understanding, validatePlan, type StrategicPlan } from './transformations/understanding';
import { generation, validateTaskSet, type TaskSet } from './transformations/generation';
import { allocation, validateAllocation, type AgentAllocation } from './transformations/allocation';
import { execution, validateResultSet, type ResultSet } from './transformations/execution';
import { integration, validateDeliverable, type Deliverable } from './transformations/integration';
import { learning, validateKnowledge, type Knowledge } from './transformations/learning';

// ============================================================================
// Engine Types
// ============================================================================

/**
 * Pipeline stage identifier
 */
export type PipelineStage = 'θ₁' | 'θ₂' | 'θ₃' | 'θ₄' | 'θ₅' | 'θ₆';

/**
 * Pipeline state at any point
 */
export interface PipelineState {
  stage: PipelineStage;
  timestamp: string;
  durationMs: number;
  status: 'success' | 'failed' | 'skipped';
  error?: string;
}

/**
 * Full execution trace
 */
export interface ExecutionTrace {
  traceId: string;
  startedAt: string;
  completedAt: string;
  totalDurationMs: number;
  stages: PipelineState[];
  intermediates: {
    plan?: StrategicPlan;
    taskSet?: TaskSet;
    allocation?: AgentAllocation;
    resultSet?: ResultSet;
    deliverable?: Deliverable;
    knowledge?: Knowledge;
  };
}

/**
 * Engine configuration
 */
export interface OmegaEngineConfig {
  /** Enable validation between stages */
  validateBetweenStages: boolean;

  /** Stop on first validation error */
  stopOnValidationError: boolean;

  /** Enable learning stage */
  enableLearning: boolean;

  /** Maximum execution time in ms */
  maxExecutionTimeMs: number;

  /** Retry failed stages */
  retryFailedStages: boolean;

  /** Maximum retries per stage */
  maxRetries: number;

  /** Callback for stage completion */
  onStageComplete?: (stage: PipelineStage, state: PipelineState) => void;

  /** Callback for stage error */
  onStageError?: (stage: PipelineStage, error: Error) => void;
}

/**
 * Default engine configuration
 */
const DEFAULT_CONFIG: OmegaEngineConfig = {
  validateBetweenStages: true,
  stopOnValidationError: false,
  enableLearning: true,
  maxExecutionTimeMs: 600000, // 10 minutes
  retryFailedStages: true,
  maxRetries: 3,
};

/**
 * Omega execution result
 */
export interface OmegaResult {
  success: boolean;
  deliverable?: Deliverable;
  knowledge?: Knowledge;
  trace: ExecutionTrace;
  errors: string[];
}

// ============================================================================
// Omega Engine Class
// ============================================================================

/**
 * Ω-System Execution Engine
 *
 * Orchestrates the 6-stage transformation pipeline:
 * θ₁ → θ₂ → θ₃ → θ₄ → θ₅ → θ₆
 *
 * @example
 * ```typescript
 * const engine = new OmegaEngine();
 * const result = await engine.execute(intent, world);
 * console.log(result.deliverable?.summary.status);
 * ```
 */
export class OmegaEngine {
  private config: OmegaEngineConfig;
  private abortController: AbortController | null = null;

  constructor(config: Partial<OmegaEngineConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Execute the complete Ω pipeline
   *
   * Ω: I × W → R
   */
  async execute(
    intent: IntentSpace,
    world: WorldSpace
  ): Promise<OmegaResult> {
    const traceId = `trace-${Date.now()}`;
    const startedAt = new Date().toISOString();
    const startTime = Date.now();
    const stages: PipelineState[] = [];
    const errors: string[] = [];

    // Initialize abort controller
    this.abortController = new AbortController();

    // Set timeout
    const timeoutId = setTimeout(() => {
      this.abortController?.abort();
    }, this.config.maxExecutionTimeMs);

    // Intermediate results
    let plan: StrategicPlan | undefined;
    let taskSet: TaskSet | undefined;
    let alloc: AgentAllocation | undefined;
    let resultSet: ResultSet | undefined;
    let deliverable: Deliverable | undefined;
    let knowledge: Knowledge | undefined;

    try {
      // ═══════════════════════════════════════════════════════════════════════
      // θ₁: Understanding Transform (I × W → S)
      // ═══════════════════════════════════════════════════════════════════════
      const stage1Start = Date.now();
      try {
        plan = await this.executeWithRetry(
          'θ₁',
          () => understanding(intent, world)
        );

        if (this.config.validateBetweenStages) {
          const validation = validatePlan(plan);
          if (!validation.valid) {
            errors.push(...validation.errors);
            if (this.config.stopOnValidationError) {
              throw new Error(`θ₁ validation failed: ${validation.errors.join(', ')}`);
            }
          }
        }

        stages.push(this.createStageState('θ₁', stage1Start, 'success'));
        this.config.onStageComplete?.('θ₁', stages[stages.length - 1]);
      } catch (error) {
        const stageState = this.createStageState('θ₁', stage1Start, 'failed', error);
        stages.push(stageState);
        this.config.onStageError?.('θ₁', error as Error);
        throw error;
      }

      // ═══════════════════════════════════════════════════════════════════════
      // θ₂: Generation Transform (S × W → 𝕋)
      // ═══════════════════════════════════════════════════════════════════════
      const stage2Start = Date.now();
      try {
        taskSet = await this.executeWithRetry(
          'θ₂',
          () => generation(plan!, world)
        );

        if (this.config.validateBetweenStages) {
          const validation = validateTaskSet(taskSet);
          if (!validation.valid) {
            errors.push(...validation.errors);
            if (this.config.stopOnValidationError) {
              throw new Error(`θ₂ validation failed: ${validation.errors.join(', ')}`);
            }
          }
        }

        stages.push(this.createStageState('θ₂', stage2Start, 'success'));
        this.config.onStageComplete?.('θ₂', stages[stages.length - 1]);
      } catch (error) {
        const stageState = this.createStageState('θ₂', stage2Start, 'failed', error);
        stages.push(stageState);
        this.config.onStageError?.('θ₂', error as Error);
        throw error;
      }

      // ═══════════════════════════════════════════════════════════════════════
      // θ₃: Allocation Transform (𝕋 × W → A)
      // ═══════════════════════════════════════════════════════════════════════
      const stage3Start = Date.now();
      try {
        alloc = await this.executeWithRetry(
          'θ₃',
          () => allocation(taskSet!, world)
        );

        if (this.config.validateBetweenStages) {
          const validation = validateAllocation(alloc);
          if (!validation.valid) {
            errors.push(...validation.errors);
            if (this.config.stopOnValidationError) {
              throw new Error(`θ₃ validation failed: ${validation.errors.join(', ')}`);
            }
          }
        }

        stages.push(this.createStageState('θ₃', stage3Start, 'success'));
        this.config.onStageComplete?.('θ₃', stages[stages.length - 1]);
      } catch (error) {
        const stageState = this.createStageState('θ₃', stage3Start, 'failed', error);
        stages.push(stageState);
        this.config.onStageError?.('θ₃', error as Error);
        throw error;
      }

      // ═══════════════════════════════════════════════════════════════════════
      // θ₄: Execution Transform (A → R)
      // ═══════════════════════════════════════════════════════════════════════
      const stage4Start = Date.now();
      try {
        resultSet = await this.executeWithRetry(
          'θ₄',
          () => execution(alloc!)
        );

        if (this.config.validateBetweenStages) {
          const validation = validateResultSet(resultSet);
          if (!validation.valid) {
            errors.push(...validation.errors);
            if (this.config.stopOnValidationError) {
              throw new Error(`θ₄ validation failed: ${validation.errors.join(', ')}`);
            }
          }
        }

        stages.push(this.createStageState('θ₄', stage4Start, 'success'));
        this.config.onStageComplete?.('θ₄', stages[stages.length - 1]);
      } catch (error) {
        const stageState = this.createStageState('θ₄', stage4Start, 'failed', error);
        stages.push(stageState);
        this.config.onStageError?.('θ₄', error as Error);
        throw error;
      }

      // ═══════════════════════════════════════════════════════════════════════
      // θ₅: Integration Transform (R → D)
      // ═══════════════════════════════════════════════════════════════════════
      const stage5Start = Date.now();
      try {
        deliverable = await this.executeWithRetry(
          'θ₅',
          () => integration(resultSet!)
        );

        if (this.config.validateBetweenStages) {
          const validation = validateDeliverable(deliverable);
          if (!validation.valid) {
            errors.push(...validation.errors);
            if (this.config.stopOnValidationError) {
              throw new Error(`θ₅ validation failed: ${validation.errors.join(', ')}`);
            }
          }
        }

        stages.push(this.createStageState('θ₅', stage5Start, 'success'));
        this.config.onStageComplete?.('θ₅', stages[stages.length - 1]);
      } catch (error) {
        const stageState = this.createStageState('θ₅', stage5Start, 'failed', error);
        stages.push(stageState);
        this.config.onStageError?.('θ₅', error as Error);
        throw error;
      }

      // ═══════════════════════════════════════════════════════════════════════
      // θ₆: Learning Transform (D × I × W → K) [Optional]
      // ═══════════════════════════════════════════════════════════════════════
      if (this.config.enableLearning) {
        const stage6Start = Date.now();
        try {
          knowledge = await this.executeWithRetry(
            'θ₆',
            () => learning(deliverable!, intent, world)
          );

          if (this.config.validateBetweenStages) {
            const validation = validateKnowledge(knowledge);
            if (!validation.valid) {
              errors.push(...validation.errors);
              // Learning validation errors are non-fatal
            }
          }

          stages.push(this.createStageState('θ₆', stage6Start, 'success'));
          this.config.onStageComplete?.('θ₆', stages[stages.length - 1]);
        } catch (error) {
          // Learning stage errors are non-fatal
          const stageState = this.createStageState('θ₆', stage6Start, 'failed', error);
          stages.push(stageState);
          this.config.onStageError?.('θ₆', error as Error);
          errors.push(`Learning stage failed: ${(error as Error).message}`);
        }
      } else {
        stages.push({
          stage: 'θ₆',
          timestamp: new Date().toISOString(),
          durationMs: 0,
          status: 'skipped',
        });
      }

      return {
        success: true,
        deliverable,
        knowledge,
        trace: {
          traceId,
          startedAt,
          completedAt: new Date().toISOString(),
          totalDurationMs: Date.now() - startTime,
          stages,
          intermediates: {
            plan,
            taskSet,
            allocation: alloc,
            resultSet,
            deliverable,
            knowledge,
          },
        },
        errors,
      };
    } catch (error) {
      return {
        success: false,
        trace: {
          traceId,
          startedAt,
          completedAt: new Date().toISOString(),
          totalDurationMs: Date.now() - startTime,
          stages,
          intermediates: {
            plan,
            taskSet,
            allocation: alloc,
            resultSet,
            deliverable,
            knowledge,
          },
        },
        errors: [...errors, (error as Error).message],
      };
    } finally {
      clearTimeout(timeoutId);
      this.abortController = null;
    }
  }

  /**
   * Execute a stage with retry logic
   */
  private async executeWithRetry<T>(
    _stage: PipelineStage,
    fn: () => Promise<T>
  ): Promise<T> {
    let lastError: Error | undefined;
    const maxRetries = this.config.retryFailedStages ? this.config.maxRetries : 1;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      if (this.abortController?.signal.aborted) {
        throw new Error('Execution aborted due to timeout');
      }

      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        if (attempt < maxRetries - 1) {
          // Exponential backoff
          await new Promise(resolve =>
            setTimeout(resolve, Math.pow(2, attempt) * 100)
          );
        }
      }
    }

    throw lastError instanceof Error ? lastError : new Error(String(lastError));
  }

  /**
   * Create a pipeline state object
   */
  private createStageState(
    stage: PipelineStage,
    startTime: number,
    status: 'success' | 'failed' | 'skipped',
    error?: unknown
  ): PipelineState {
    return {
      stage,
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - startTime,
      status,
      error: error ? (error as Error).message : undefined,
    };
  }

  /**
   * Abort a running execution
   */
  abort(): void {
    this.abortController?.abort();
  }

  /**
   * Check if engine is currently executing
   */
  isExecuting(): boolean {
    return this.abortController !== null;
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Execute Ω pipeline with default configuration
 *
 * @example
 * ```typescript
 * const result = await omega(intent, world);
 * ```
 */
export async function omega(
  intent: IntentSpace,
  world: WorldSpace,
  config?: Partial<OmegaEngineConfig>
): Promise<OmegaResult> {
  const engine = new OmegaEngine(config);
  return engine.execute(intent, world);
}

/**
 * Execute Ω pipeline without learning stage
 *
 * @example
 * ```typescript
 * const result = await omegaWithoutLearning(intent, world);
 * ```
 */
export async function omegaWithoutLearning(
  intent: IntentSpace,
  world: WorldSpace
): Promise<OmegaResult> {
  return omega(intent, world, { enableLearning: false });
}

/**
 * Execute Ω pipeline with strict validation
 *
 * @example
 * ```typescript
 * const result = await omegaStrict(intent, world);
 * ```
 */
export async function omegaStrict(
  intent: IntentSpace,
  world: WorldSpace
): Promise<OmegaResult> {
  return omega(intent, world, {
    validateBetweenStages: true,
    stopOnValidationError: true,
  });
}

// ============================================================================
// Re-exports
// ============================================================================

// Functions
export {
  understanding,
  validatePlan,
  generation,
  validateTaskSet,
  allocation,
  validateAllocation,
  execution,
  validateResultSet,
  integration,
  validateDeliverable,
  learning,
  validateKnowledge,
};

// Types
export type { StrategicPlan } from './transformations/understanding';
export type { TaskSet } from './transformations/generation';
export type { AgentAllocation } from './transformations/allocation';
export type { ResultSet } from './transformations/execution';
export type { Deliverable } from './transformations/integration';
export type { Knowledge } from './transformations/learning';
