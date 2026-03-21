/**
 * Ω-Agent Adapter
 *
 * Main adapter for integrating existing Agents with Ω-System.
 * Provides seamless bridge between legacy Agent execution and
 * the new SWML-based Ω-System pipeline.
 *
 * @module omega-system/adapters/omega-agent-adapter
 */

import type { Issue, Task, AgentType, DAG } from '../../types';
import type { IntentSpace, Goal, GoalType, GoalPriority } from '../../types/intent';
import type { WorldSpace } from '../../types/world';
import { OmegaEngine, type OmegaResult, type OmegaEngineConfig } from '../omega-engine';
import { issueToIntent } from './issue-to-intent';
import { contextToWorld, type ExecutionContext } from './context-to-world';
import { deliverableToReport, type ExecutionReport } from './deliverable-to-report';

// ============================================================================
// Types
// ============================================================================

/**
 * Agent execution request
 */
export interface AgentExecutionRequest {
  /** Issue to process */
  issue?: Issue;

  /** Tasks to execute (if already decomposed) */
  tasks?: Task[];

  /** Target agent type */
  agentType: AgentType;

  /** Execution context */
  context?: Partial<ExecutionContext>;

  /** Override options */
  options?: {
    /** Skip planning phase */
    skipPlanning?: boolean;
    /** Force sequential execution */
    forceSequential?: boolean;
    /** Enable learning */
    enableLearning?: boolean;
    /** Custom timeout */
    timeoutMs?: number;
  };
}

/**
 * Agent execution response
 */
export interface AgentExecutionResponse {
  /** Success indicator */
  success: boolean;

  /** Execution report */
  report: ExecutionReport;

  /** Raw Ω-System result (for advanced usage) */
  omegaResult?: OmegaResult;

  /** Generated tasks (for CoordinatorAgent) */
  tasks?: Task[];

  /** Generated DAG (for CoordinatorAgent) */
  dag?: DAG;

  /** Execution duration */
  durationMs: number;
}

/**
 * Agent capability mapping
 */
const AGENT_CAPABILITIES: Record<AgentType, string[]> = {
  CoordinatorAgent: ['task-decomposition', 'dag-building', 'orchestration'],
  CodeGenAgent: ['code-generation', 'implementation', 'refactoring'],
  ReviewAgent: ['code-review', 'quality-check', 'security-scan'],
  IssueAgent: ['issue-analysis', 'labeling', 'categorization'],
  PRAgent: ['pr-creation', 'conventional-commits', 'changelog'],
  DeploymentAgent: ['deployment', 'rollback', 'health-check'],
  AutoFixAgent: ['auto-fix', 'lint-fix', 'type-fix'],
  WaterSpiderAgent: ['monitoring', 'health-check', 'session-management'],
};

// ============================================================================
// Ω-Agent Adapter
// ============================================================================

/**
 * Adapter for integrating existing Agents with Ω-System
 *
 * This adapter provides a bridge between the legacy Agent execution model
 * and the new SWML-based Ω-System. It handles:
 * - Converting Issue to IntentSpace
 * - Creating WorldSpace from execution context
 * - Running the Ω-System pipeline
 * - Converting results back to ExecutionReport
 *
 * @example
 * ```typescript
 * const adapter = new OmegaAgentAdapter();
 *
 * const response = await adapter.execute({
 *   issue: myIssue,
 *   agentType: 'CodeGenAgent',
 *   context: { projectRoot: '/path/to/project' },
 * });
 *
 * console.log(response.report.status); // 'success'
 * ```
 */
export class OmegaAgentAdapter {
  private engine: OmegaEngine;

  constructor(config?: Partial<OmegaEngineConfig>) {
    this.engine = new OmegaEngine(config);
  }

  /**
   * Execute an agent request through Ω-System
   */
  async execute(request: AgentExecutionRequest): Promise<AgentExecutionResponse> {
    const startTime = Date.now();

    try {
      // Build intent space
      const intent = this.buildIntentSpace(request);

      // Build world space
      const world = this.buildWorldSpace(request);

      // Execute through Ω-System
      const omegaResult = await this.engine.execute(intent, world);

      // Convert to execution report
      const report = omegaResult.deliverable
        ? deliverableToReport(omegaResult.deliverable, omegaResult.knowledge)
        : this.createEmptyReport(omegaResult);

      // Extract tasks and DAG for CoordinatorAgent
      let tasks: Task[] | undefined;
      let dag: DAG | undefined;

      if (request.agentType === 'CoordinatorAgent') {
        tasks = this.extractTasks(omegaResult);
        dag = omegaResult.trace.intermediates.taskSet?.dag;
      }

      return {
        success: report.status === 'success',
        report,
        omegaResult,
        tasks,
        dag,
        durationMs: Date.now() - startTime,
      };
    } catch (error) {
      const errorReport = this.createErrorResponse(error as Error, request);
      return {
        success: false,
        report: errorReport,
        durationMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Execute multiple requests in parallel
   */
  async executeParallel(
    requests: AgentExecutionRequest[]
  ): Promise<AgentExecutionResponse[]> {
    return Promise.all(requests.map(req => this.execute(req)));
  }

  /**
   * Execute requests in sequence
   */
  async executeSequential(
    requests: AgentExecutionRequest[]
  ): Promise<AgentExecutionResponse[]> {
    const results: AgentExecutionResponse[] = [];

    for (const request of requests) {
      const result = await this.execute(request);
      results.push(result);

      // Stop on failure if not explicitly continuing
      if (!result.success && !request.options?.skipPlanning) {
        break;
      }
    }

    return results;
  }

  /**
   * Build IntentSpace from request
   */
  private buildIntentSpace(request: AgentExecutionRequest): IntentSpace {
    // If issue provided, convert it
    if (request.issue) {
      const intent = issueToIntent(request.issue);

      // Enhance with agent-specific goals
      this.enhanceIntentForAgent(intent, request.agentType);

      return intent;
    }

    // Otherwise, build from tasks
    return this.buildIntentFromTasks(request.tasks || [], request.agentType);
  }

  /**
   * Build WorldSpace from request
   */
  private buildWorldSpace(request: AgentExecutionRequest): WorldSpace {
    const world = contextToWorld(request.context || {});

    // Apply options as constraints
    if (request.options) {
      if (request.options.forceSequential) {
        world.environmental.constraints.concurrency.maxWorkers = 1;
        world.environmental.constraints.concurrency.maxWorktrees = 1;
      }

      if (request.options.timeoutMs) {
        world.temporal.horizon.maxExecutionTime = request.options.timeoutMs;
      }
    }

    return world;
  }

  /**
   * Enhance intent with agent-specific capabilities
   */
  private enhanceIntentForAgent(intent: IntentSpace, agentType: AgentType): void {
    const capabilities = AGENT_CAPABILITIES[agentType] || [];

    // Add capabilities as implicit goals
    for (const cap of capabilities) {
      const implicitGoal: Goal = {
        id: `implicit-${cap}`,
        type: 'implicit',
        description: `Apply ${cap} capability`,
        priority: 'low',
        measurable: true,
        successCriteria: [`${cap} completed successfully`],
      };
      intent.goals.implicit.inferred.push(implicitGoal);
    }
  }

  /**
   * Build intent from tasks
   */
  private buildIntentFromTasks(tasks: Task[], agentType: AgentType): IntentSpace {
    const primaryTask = tasks[0];
    const supportingTasks = tasks.slice(1, 4);
    const secondaryTasks = tasks.slice(4);

    const createGoal = (t: Task, type: GoalType): Goal => ({
      id: t.id,
      type,
      description: t.title,
      priority: this.numberToPriority(t.priority),
      measurable: true,
      successCriteria: ['Task completed'],
    });

    const defaultGoal: Goal = {
      id: 'default-goal',
      type: 'primary',
      description: `Execute ${agentType}`,
      priority: 'medium',
      measurable: true,
      successCriteria: ['Execution completed'],
    };

    return {
      metadata: {
        intentId: `intent-tasks-${Date.now()}`,
        source: 'agent',
        createdAt: new Date().toISOString(),
        confidence: 0.8,
        version: 1,
      },
      goals: {
        primary: {
          main: primaryTask ? createGoal(primaryTask, 'primary') : defaultGoal,
          supporting: supportingTasks.map(t => createGoal(t, 'secondary')),
        },
        secondary: {
          goals: secondaryTasks.map(t => createGoal(t, 'secondary')),
          priorityOrder: secondaryTasks.map(t => t.id),
        },
        implicit: {
          inferred: [],
          confidence: 0.8,
          source: 'task-analysis',
        },
        allGoals: tasks.map(t => createGoal(t, 'secondary')),
      },
      preferences: {
        qualityVsSpeed: {
          bias: 'balanced',
          qualityThreshold: 70,
          speedMultiplier: 1.0,
          allowDegradation: false,
        },
        costVsPerformance: {
          bias: 'balanced',
          performanceFloor: 70,
          elasticity: 1.0,
        },
        automationVsControl: {
          bias: 'semi-auto',
          approvalRequired: ['deploy'],
          autoApproveThreshold: 80,
        },
        risk: {
          tolerance: 'moderate',
          maxRiskScore: 50,
          requiresReviewAbove: 40,
        },
        customTradeOffs: [],
      },
      objectives: {
        functional: tasks.map((t, i) => ({
          id: `func-${i}`,
          description: t.description || t.title,
          priority: this.numberToPriority(t.priority),
          acceptanceCriteria: ['Task completed'],
          testable: true,
        })),
        nonFunctional: [
          {
            id: 'nfr-quality',
            category: 'maintainability' as const,
            description: 'Maintain code quality',
            metric: 'quality-score',
            target: '80%+',
          },
        ],
        quality: [],
        constraints: [],
      },
      modality: {
        primary: 'code',
        secondary: ['text'],
        code: {
          language: 'typescript',
          style: 'documented',
          includeTests: true,
          includeTypes: true,
        },
        text: {
          format: 'markdown',
          language: 'en',
          tone: 'technical',
        },
      },
    };
  }

  /**
   * Convert priority number to string
   */
  private numberToPriority(priority: number): GoalPriority {
    switch (priority) {
      case 0: return 'critical';
      case 1: return 'high';
      case 2: return 'medium';
      default: return 'low';
    }
  }

  /**
   * Extract tasks from Ω-System result
   */
  private extractTasks(result: OmegaResult): Task[] {
    const taskSet = result.trace.intermediates.taskSet;
    if (!taskSet) {return [];}

    return taskSet.tasks.map(gt => ({
      id: gt.id,
      title: gt.title,
      description: gt.description,
      type: gt.type,
      priority: gt.priority,
      assignedAgent: gt.assignedAgent,
      dependencies: gt.dependencies,
      estimatedDuration: gt.estimatedDuration,
      status: gt.status,
    }));
  }

  /**
   * Create empty report when no deliverable
   */
  private createEmptyReport(result: OmegaResult): ExecutionReport {
    return {
      id: `report-empty-${Date.now()}`,
      status: result.success ? 'success' : 'failure',
      summary: result.success ? 'Execution completed' : `Failed: ${result.errors.join(', ')}`,
      results: {
        tasksCompleted: 0,
        tasksFailed: result.errors.length,
        totalTasks: 0,
        successRate: result.success ? 1 : 0,
      },
      artifacts: [],
      messages: result.errors.map(e => ({
        level: 'error' as const,
        message: e,
      })),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Create error response
   */
  private createErrorResponse(error: Error, request: AgentExecutionRequest): ExecutionReport {
    return {
      id: `error-${Date.now()}`,
      status: 'failure',
      summary: `${request.agentType} execution failed: ${error.message}`,
      results: {
        tasksCompleted: 0,
        tasksFailed: 1,
        totalTasks: 1,
        successRate: 0,
      },
      artifacts: [],
      messages: [
        {
          level: 'error',
          message: error.message,
          context: request.agentType,
        },
      ],
      recommendations: [
        'Check error message and retry',
        'Verify input parameters',
        'Check system resources',
      ],
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Create adapter with default configuration
 */
export function createOmegaAdapter(config?: Partial<OmegaEngineConfig>): OmegaAgentAdapter {
  return new OmegaAgentAdapter(config);
}

/**
 * Execute a single agent request (convenience function)
 */
export async function executeWithOmega(
  request: AgentExecutionRequest
): Promise<AgentExecutionResponse> {
  const adapter = new OmegaAgentAdapter();
  return adapter.execute(request);
}
