/**
 * θ₃: Allocation Transform
 *
 * Mathematical Definition: θ₃: 𝕋 × W → A
 *
 * Transforms Task Set and World Space into Agent Allocation.
 * Optimizes task-to-agent assignment for parallel execution.
 *
 * @module omega-system/transformations/allocation
 */

import type { WorldSpace } from '../../types/world';
import type { AgentType } from '../../types';
import type { TaskSet, GeneratedTask } from './generation';

// ============================================================================
// Agent Allocation Types
// ============================================================================

/**
 * Agent capability profile
 */
export interface AgentCapability {
  agentType: AgentType;
  supportedTaskTypes: string[];
  maxConcurrency: number;
  averageTokensPerMinute: number;
  qualityScore: number; // 0-100
  specializations: string[];
}

/**
 * Worker assignment
 */
export interface WorkerAssignment {
  workerId: string;
  agentType: AgentType;
  assignedTasks: string[]; // task IDs
  worktreePath?: string;
  estimatedDurationMs: number;
  estimatedTokens: number;
  priority: number;
}

/**
 * Execution batch for parallel processing
 */
export interface ExecutionBatch {
  batchId: string;
  level: number;
  workers: WorkerAssignment[];
  canExecuteInParallel: boolean;
  estimatedDurationMs: number;
  dependsOn: string[]; // batch IDs
}

/**
 * Agent Allocation - Output of θ₃
 *
 * A = θ₃(𝕋, W)
 */
export interface AgentAllocation {
  allocationId: string;
  createdAt: string;

  /** Source task set */
  sourceTaskSetId: string;

  /** All worker assignments */
  workers: WorkerAssignment[];

  /** Execution batches */
  batches: ExecutionBatch[];

  /** Agent utilization */
  utilization: {
    byAgent: Record<AgentType, {
      taskCount: number;
      estimatedTokens: number;
      estimatedDurationMs: number;
      utilizationPercent: number;
    }>;
    totalWorkers: number;
    activeWorkers: number;
  };

  /** Resource allocation */
  resources: {
    totalEstimatedTokens: number;
    totalEstimatedDurationMs: number;
    maxConcurrency: number;
    worktreesRequired: number;
  };

  /** Optimization metrics */
  optimization: {
    parallelizationFactor: number; // 0-1
    loadBalanceScore: number;      // 0-100
    estimatedEfficiencyGain: number; // percentage
  };

  /** Metadata */
  metadata: {
    allocationVersion: string;
    allocationTimeMs: number;
    strategy: 'greedy' | 'balanced' | 'priority-first';
  };
}

// ============================================================================
// Agent Registry
// ============================================================================

/**
 * Default agent capabilities
 */
const AGENT_CAPABILITIES: AgentCapability[] = [
  {
    agentType: 'CoordinatorAgent',
    supportedTaskTypes: ['feature', 'refactor', 'bug'],
    maxConcurrency: 1,
    averageTokensPerMinute: 5000,
    qualityScore: 95,
    specializations: ['coordination', 'planning', 'decomposition'],
  },
  {
    agentType: 'CodeGenAgent',
    supportedTaskTypes: ['feature', 'refactor', 'bug'],
    maxConcurrency: 3,
    averageTokensPerMinute: 8000,
    qualityScore: 85,
    specializations: ['code-generation', 'implementation'],
  },
  {
    agentType: 'ReviewAgent',
    supportedTaskTypes: ['test', 'refactor'],
    maxConcurrency: 2,
    averageTokensPerMinute: 4000,
    qualityScore: 90,
    specializations: ['code-review', 'quality-assurance', 'security'],
  },
  {
    agentType: 'IssueAgent',
    supportedTaskTypes: ['docs', 'bug'],
    maxConcurrency: 2,
    averageTokensPerMinute: 3000,
    qualityScore: 88,
    specializations: ['issue-analysis', 'labeling'],
  },
  {
    agentType: 'PRAgent',
    supportedTaskTypes: ['feature', 'docs'],
    maxConcurrency: 2,
    averageTokensPerMinute: 3000,
    qualityScore: 92,
    specializations: ['pr-creation', 'commit-messages'],
  },
  {
    agentType: 'DeploymentAgent',
    supportedTaskTypes: ['deployment'],
    maxConcurrency: 1,
    averageTokensPerMinute: 2000,
    qualityScore: 95,
    specializations: ['deployment', 'ci-cd', 'rollback'],
  },
];

// ============================================================================
// Allocation Implementation
// ============================================================================

/**
 * Find best agent for a task
 */
function findBestAgent(task: GeneratedTask, capabilities: AgentCapability[]): AgentType {
  // If task already has an assigned agent, validate it
  if (task.assignedAgent) {
    const capability = capabilities.find(c => c.agentType === task.assignedAgent);
    if (capability?.supportedTaskTypes.includes(task.type)) {
      return task.assignedAgent;
    }
  }

  // Find agents that support this task type
  const compatibleAgents = capabilities.filter(c =>
    c.supportedTaskTypes.includes(task.type)
  );

  if (compatibleAgents.length === 0) {
    return 'CodeGenAgent'; // Default fallback
  }

  // Score agents based on specialization match
  const scored = compatibleAgents.map(agent => {
    let score = agent.qualityScore;

    // Boost for specialization match
    for (const tool of task.requiredTools) {
      if (agent.specializations.some(s => s.includes(tool) || tool.includes(s))) {
        score += 5;
      }
    }

    return { agent, score };
  });

  // Return highest scoring agent
  scored.sort((a, b) => b.score - a.score);
  return scored[0].agent.agentType;
}

/**
 * Create worker assignments from tasks
 */
function createWorkerAssignments(
  tasks: GeneratedTask[],
  capabilities: AgentCapability[],
  maxWorkers: number
): WorkerAssignment[] {
  const assignments: WorkerAssignment[] = [];
  const agentTaskMap = new Map<AgentType, GeneratedTask[]>();

  // Group tasks by agent
  for (const task of tasks) {
    const agent = findBestAgent(task, capabilities);
    if (!agentTaskMap.has(agent)) {
      agentTaskMap.set(agent, []);
    }
    agentTaskMap.get(agent)!.push(task);
  }

  // Create workers for each agent type
  let workerIndex = 0;
  for (const [agentType, agentTasks] of agentTaskMap) {
    const capability = capabilities.find(c => c.agentType === agentType);
    const maxConcurrency = capability?.maxConcurrency || 1;

    // Distribute tasks among workers
    const workersNeeded = Math.min(
      Math.ceil(agentTasks.length / 3), // Max 3 tasks per worker
      maxConcurrency,
      maxWorkers - assignments.length
    );

    for (let w = 0; w < workersNeeded; w++) {
      const workerTasks = agentTasks.filter((_, i) => i % workersNeeded === w);

      if (workerTasks.length > 0) {
        const assignment: WorkerAssignment = {
          workerId: `worker-${++workerIndex}`,
          agentType,
          assignedTasks: workerTasks.map(t => t.id),
          estimatedDurationMs: workerTasks.reduce(
            (sum, t) => sum + (t.estimatedDuration || 0) * 60000,
            0
          ),
          estimatedTokens: workerTasks.reduce(
            (sum, t) => sum + t.estimatedTokens,
            0
          ),
          priority: Math.min(...workerTasks.map(t => t.priority)),
        };

        assignments.push(assignment);
      }
    }
  }

  return assignments;
}

/**
 * Create execution batches from DAG levels
 */
function createExecutionBatches(
  taskSet: TaskSet,
  workers: WorkerAssignment[]
): ExecutionBatch[] {
  const batches: ExecutionBatch[] = [];
  const taskToWorker = new Map<string, string>();

  // Map tasks to workers
  for (const worker of workers) {
    for (const taskId of worker.assignedTasks) {
      taskToWorker.set(taskId, worker.workerId);
    }
  }

  // Create batches from DAG levels
  for (let level = 0; level < taskSet.dag.levels.length; level++) {
    const levelTasks = taskSet.dag.levels[level];
    const levelWorkers = new Set<string>();

    for (const taskId of levelTasks) {
      const workerId = taskToWorker.get(taskId);
      if (workerId) {
        levelWorkers.add(workerId);
      }
    }

    const batchWorkers = workers.filter(w => levelWorkers.has(w.workerId));
    const maxDuration = Math.max(
      ...batchWorkers.map(w => w.estimatedDurationMs),
      0
    );

    const batch: ExecutionBatch = {
      batchId: `batch-${level + 1}`,
      level,
      workers: batchWorkers,
      canExecuteInParallel: batchWorkers.length > 1,
      estimatedDurationMs: maxDuration,
      dependsOn: level > 0 ? [`batch-${level}`] : [],
    };

    batches.push(batch);
  }

  return batches;
}

/**
 * Calculate utilization metrics
 */
function calculateUtilization(
  workers: WorkerAssignment[],
  capabilities: AgentCapability[]
): AgentAllocation['utilization'] {
  const byAgent: AgentAllocation['utilization']['byAgent'] = {} as any;

  for (const capability of capabilities) {
    const agentWorkers = workers.filter(w => w.agentType === capability.agentType);
    const taskCount = agentWorkers.reduce((sum, w) => sum + w.assignedTasks.length, 0);
    const tokens = agentWorkers.reduce((sum, w) => sum + w.estimatedTokens, 0);
    const duration = agentWorkers.reduce((sum, w) => sum + w.estimatedDurationMs, 0);

    byAgent[capability.agentType] = {
      taskCount,
      estimatedTokens: tokens,
      estimatedDurationMs: duration,
      utilizationPercent: agentWorkers.length > 0
        ? Math.min(100, (agentWorkers.length / capability.maxConcurrency) * 100)
        : 0,
    };
  }

  return {
    byAgent,
    totalWorkers: workers.length,
    activeWorkers: workers.filter(w => w.assignedTasks.length > 0).length,
  };
}

/**
 * Calculate optimization metrics
 */
function calculateOptimization(
  workers: WorkerAssignment[],
  batches: ExecutionBatch[],
  taskSet: TaskSet
): AgentAllocation['optimization'] {
  // Parallelization factor: how much work can run in parallel
  const parallelBatches = batches.filter(b => b.canExecuteInParallel).length;
  const parallelizationFactor = batches.length > 0
    ? parallelBatches / batches.length
    : 0;

  // Load balance: how evenly tasks are distributed
  const taskCounts = workers.map(w => w.assignedTasks.length);
  const avgTasks = taskCounts.reduce((a, b) => a + b, 0) / taskCounts.length || 0;
  const variance = taskCounts.reduce((sum, count) =>
    sum + Math.pow(count - avgTasks, 2), 0
  ) / taskCounts.length || 0;
  const loadBalanceScore = Math.max(0, 100 - variance * 10);

  // Efficiency gain from parallelization
  const sequentialTime = taskSet.summary.estimatedTotalDurationMs;
  const parallelTime = batches.reduce((sum, b) => sum + b.estimatedDurationMs, 0);
  const efficiencyGain = sequentialTime > 0
    ? ((sequentialTime - parallelTime) / sequentialTime) * 100
    : 0;

  return {
    parallelizationFactor,
    loadBalanceScore,
    estimatedEfficiencyGain: Math.max(0, efficiencyGain),
  };
}

// ============================================================================
// Main Transform Function
// ============================================================================

/**
 * θ₃: Allocation Transform
 *
 * Transforms Task Set (𝕋) and World Space (W) into Agent Allocation (A)
 *
 * @param taskSet - The task set from θ₂
 * @param world - The world space context
 * @returns Agent allocation for execution
 *
 * @example
 * ```typescript
 * const allocation = await allocation(taskSet, world);
 * console.log(allocation.optimization.parallelizationFactor); // 0.75
 * ```
 */
export function allocation(
  taskSet: TaskSet,
  world: WorldSpace
): AgentAllocation {
  const startTime = Date.now();

  // Get resource constraints
  const maxWorkers = world.environmental.constraints.concurrency.maxWorkers;
  const maxWorktrees = world.environmental.constraints.concurrency.maxWorktrees;

  // Create worker assignments
  const workers = createWorkerAssignments(
    taskSet.tasks,
    AGENT_CAPABILITIES,
    maxWorkers
  );

  // Assign worktree paths
  for (let i = 0; i < workers.length && i < maxWorktrees; i++) {
    workers[i].worktreePath = `.worktrees/worker-${i + 1}`;
  }

  // Create execution batches
  const batches = createExecutionBatches(taskSet, workers);

  // Calculate utilization
  const utilization = calculateUtilization(workers, AGENT_CAPABILITIES);

  // Calculate optimization metrics
  const optimization = calculateOptimization(workers, batches, taskSet);

  // Calculate resources
  const resources = {
    totalEstimatedTokens: workers.reduce((sum, w) => sum + w.estimatedTokens, 0),
    totalEstimatedDurationMs: batches.reduce((sum, b) => sum + b.estimatedDurationMs, 0),
    maxConcurrency: Math.max(...batches.map(b => b.workers.length), 0),
    worktreesRequired: workers.filter(w => w.worktreePath).length,
  };

  const allocationResult: AgentAllocation = {
    allocationId: `alloc-${Date.now()}`,
    createdAt: new Date().toISOString(),
    sourceTaskSetId: taskSet.setId,
    workers,
    batches,
    utilization,
    resources,
    optimization,
    metadata: {
      allocationVersion: '1.0.0',
      allocationTimeMs: Date.now() - startTime,
      strategy: 'balanced',
    },
  };

  return allocationResult;
}

/**
 * Validate an allocation
 */
export function validateAllocation(alloc: AgentAllocation): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (alloc.workers.length === 0) {
    errors.push('No workers assigned');
  }

  if (alloc.batches.length === 0) {
    errors.push('No execution batches created');
  }

  // Check for duplicate assignments
  const allTasks = alloc.workers.flatMap(w => w.assignedTasks);
  const duplicates = allTasks.filter(
    (t, i) => allTasks.indexOf(t) !== i
  );

  if (duplicates.length > 0) {
    errors.push(`Duplicate task assignments: ${duplicates.join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
