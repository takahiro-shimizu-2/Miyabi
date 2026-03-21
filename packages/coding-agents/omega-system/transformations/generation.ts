/**
 * θ₂: Generation Transform
 *
 * Mathematical Definition: θ₂: S × W → 𝕋
 *
 * Transforms Strategic Plan and World Space into a Task Set.
 * Generates concrete tasks from strategic objectives and builds the DAG.
 *
 * @module omega-system/transformations/generation
 */

import type { WorldSpace } from '../../types/world';
import type { Task, DAG, AgentType } from '../../types';
import type { StrategicPlan, StrategicObjective } from './understanding';

// ============================================================================
// Task Set Types
// ============================================================================

/**
 * Extended task with generation metadata
 */
export interface GeneratedTask extends Task {
  /** Source objective ID */
  sourceObjectiveId: string;

  /** Estimated token cost */
  estimatedTokens: number;

  /** Required tools */
  requiredTools: string[];

  /** Input artifacts needed */
  inputArtifacts: string[];

  /** Output artifacts produced */
  outputArtifacts: string[];

  /** Subtasks (for decomposition) */
  subtasks?: GeneratedTask[];
}

/**
 * Task Set - Output of θ₂
 *
 * 𝕋 = θ₂(S, W)
 */
export interface TaskSet {
  setId: string;
  createdAt: string;

  /** Source plan */
  sourcePlanId: string;

  /** All generated tasks */
  tasks: GeneratedTask[];

  /** Task dependency graph */
  dag: DAG;

  /** Task groupings */
  groups: TaskGroup[];

  /** Summary statistics */
  summary: {
    totalTasks: number;
    byType: Record<string, number>;
    byPriority: Record<number, number>;
    estimatedTotalDurationMs: number;
    estimatedTotalTokens: number;
    parallelizableTasks: number;
  };

  /** Metadata */
  metadata: {
    generationVersion: string;
    generationTimeMs: number;
  };
}

/**
 * Task grouping for parallel execution
 */
export interface TaskGroup {
  groupId: string;
  name: string;
  tasks: string[]; // task IDs
  canParallelize: boolean;
  estimatedDurationMs: number;
  dependsOn: string[]; // group IDs
}

// ============================================================================
// Task Generation Implementation
// ============================================================================

/**
 * Generate tasks from a strategic objective
 */
function generateTasksFromObjective(
  objective: StrategicObjective,
  _world: WorldSpace,
  _index: number
): GeneratedTask[] {
  const tasks: GeneratedTask[] = [];
  const baseId = `task-${objective.id}-`;

  // Determine task type based on capabilities
  const capabilities = objective.requiredCapabilities;

  // Generate primary task
  const primaryTask: GeneratedTask = {
    id: `${baseId}main`,
    title: objective.description,
    description: `Execute objective: ${objective.description}`,
    type: determineTaskType(capabilities),
    priority: priorityToNumber(objective.priority),
    assignedAgent: determineAgent(capabilities),
    dependencies: [],
    estimatedDuration: estimateDuration(objective.estimatedComplexity),
    status: 'idle',
    sourceObjectiveId: objective.id,
    estimatedTokens: estimateTokens(objective.estimatedComplexity),
    requiredTools: capabilities,
    inputArtifacts: [],
    outputArtifacts: determineOutputArtifacts(capabilities),
  };

  tasks.push(primaryTask);

  // Generate subtasks for complex objectives
  if (objective.estimatedComplexity === 'complex' || objective.estimatedComplexity === 'very-complex') {
    const subtasks = decomposeComplexObjective(objective, primaryTask.id);
    primaryTask.subtasks = subtasks;

    // Add subtasks as dependencies of main task
    for (const subtask of subtasks) {
      subtask.dependencies = [];
      tasks.push(subtask);
    }

    // Main task depends on all subtasks
    primaryTask.dependencies = subtasks.map(st => st.id);
  }

  // Add review task if required
  if (capabilities.includes('code-generation') || capabilities.includes('code-review')) {
    const reviewTask: GeneratedTask = {
      id: `${baseId}review`,
      title: `Review: ${objective.description.slice(0, 30)}...`,
      description: `Quality review for ${objective.description}`,
      type: 'test',
      priority: primaryTask.priority,
      assignedAgent: 'ReviewAgent',
      dependencies: [primaryTask.id],
      estimatedDuration: 5, // 5 minutes
      status: 'idle',
      sourceObjectiveId: objective.id,
      estimatedTokens: 2000,
      requiredTools: ['code-review', 'lint', 'type-check'],
      inputArtifacts: primaryTask.outputArtifacts,
      outputArtifacts: ['quality-report'],
    };
    tasks.push(reviewTask);
  }

  return tasks;
}

/**
 * Determine task type from capabilities
 */
function determineTaskType(capabilities: string[]): Task['type'] {
  if (capabilities.includes('deployment')) {return 'deployment';}
  if (capabilities.includes('test-generation')) {return 'test';}
  if (capabilities.includes('documentation')) {return 'docs';}
  if (capabilities.includes('code-generation')) {return 'feature';}
  if (capabilities.includes('code-review')) {return 'refactor';}
  return 'feature';
}

/**
 * Determine best agent for capabilities
 */
function determineAgent(capabilities: string[]): AgentType {
  if (capabilities.includes('deployment')) {return 'DeploymentAgent';}
  if (capabilities.includes('code-review')) {return 'ReviewAgent';}
  if (capabilities.includes('code-generation')) {return 'CodeGenAgent';}
  return 'CodeGenAgent';
}

/**
 * Convert priority string to number
 */
function priorityToNumber(priority: string): number {
  const map: Record<string, number> = {
    'critical': 0,
    'high': 1,
    'medium': 2,
    'low': 3,
  };
  return map[priority] ?? 2;
}

/**
 * Estimate duration based on complexity
 */
function estimateDuration(complexity: string): number {
  const map: Record<string, number> = {
    'trivial': 2,
    'simple': 5,
    'moderate': 15,
    'complex': 30,
    'very-complex': 60,
  };
  return map[complexity] ?? 15;
}

/**
 * Estimate token usage based on complexity
 */
function estimateTokens(complexity: string): number {
  const map: Record<string, number> = {
    'trivial': 1000,
    'simple': 3000,
    'moderate': 8000,
    'complex': 15000,
    'very-complex': 30000,
  };
  return map[complexity] ?? 8000;
}

/**
 * Determine output artifacts from capabilities
 */
function determineOutputArtifacts(capabilities: string[]): string[] {
  const artifacts: string[] = [];

  if (capabilities.includes('code-generation')) {
    artifacts.push('code-files', 'type-definitions');
  }
  if (capabilities.includes('test-generation')) {
    artifacts.push('test-files', 'coverage-report');
  }
  if (capabilities.includes('documentation')) {
    artifacts.push('documentation');
  }
  if (capabilities.includes('deployment')) {
    artifacts.push('deployment-manifest', 'deployment-url');
  }

  return artifacts.length > 0 ? artifacts : ['generic-output'];
}

/**
 * Decompose complex objective into subtasks
 */
function decomposeComplexObjective(
  objective: StrategicObjective,
  parentId: string
): GeneratedTask[] {
  const subtasks: GeneratedTask[] = [];

  // Standard decomposition pattern
  const phases = [
    { name: 'Analysis', type: 'refactor' as const, tokens: 3000, duration: 5 },
    { name: 'Implementation', type: 'feature' as const, tokens: 10000, duration: 20 },
    { name: 'Testing', type: 'test' as const, tokens: 5000, duration: 10 },
  ];

  for (let i = 0; i < phases.length; i++) {
    const phase = phases[i];
    subtasks.push({
      id: `${parentId}-sub-${i + 1}`,
      title: `${phase.name}: ${objective.description.slice(0, 20)}...`,
      description: `${phase.name} phase for ${objective.description}`,
      type: phase.type,
      priority: priorityToNumber(objective.priority),
      assignedAgent: phase.type === 'test' ? 'ReviewAgent' : 'CodeGenAgent',
      dependencies: i > 0 ? [`${parentId}-sub-${i}`] : [],
      estimatedDuration: phase.duration,
      status: 'idle',
      sourceObjectiveId: objective.id,
      estimatedTokens: phase.tokens,
      requiredTools: objective.requiredCapabilities,
      inputArtifacts: i > 0 ? [`output-${i}`] : [],
      outputArtifacts: [`output-${i + 1}`],
    });
  }

  return subtasks;
}

/**
 * Build DAG from tasks
 */
function buildDAG(tasks: GeneratedTask[]): DAG {
  const nodes = tasks.map(t => ({
    id: t.id,
    title: t.title,
    description: t.description,
    type: t.type,
    priority: t.priority,
    assignedAgent: t.assignedAgent,
    dependencies: t.dependencies,
    estimatedDuration: t.estimatedDuration,
    status: t.status,
  }));

  const edges: DAG['edges'] = [];
  for (const task of tasks) {
    for (const dep of task.dependencies) {
      edges.push({ from: dep, to: task.id });
    }
  }

  // Topological sort for levels
  const levels = topologicalSort(tasks);

  return { nodes, edges, levels };
}

/**
 * Topological sort to determine execution levels
 */
function topologicalSort(tasks: GeneratedTask[]): string[][] {
  const inDegree = new Map<string, number>();
  const levels: string[][] = [];

  // Initialize in-degree
  for (const task of tasks) {
    inDegree.set(task.id, task.dependencies.length);
  }

  // Find all tasks with no dependencies
  let currentLevel = tasks
    .filter(t => t.dependencies.length === 0)
    .map(t => t.id);

  while (currentLevel.length > 0) {
    levels.push(currentLevel);

    const nextLevel: string[] = [];
    for (const taskId of currentLevel) {
      // Reduce in-degree of dependent tasks
      for (const task of tasks) {
        if (task.dependencies.includes(taskId)) {
          const newDegree = (inDegree.get(task.id) || 0) - 1;
          inDegree.set(task.id, newDegree);
          if (newDegree === 0) {
            nextLevel.push(task.id);
          }
        }
      }
    }
    currentLevel = nextLevel;
  }

  return levels;
}

/**
 * Group tasks for parallel execution
 */
function groupTasks(tasks: GeneratedTask[], dag: DAG): TaskGroup[] {
  const groups: TaskGroup[] = [];

  // Group by DAG level
  for (let i = 0; i < dag.levels.length; i++) {
    const levelTasks = dag.levels[i];
    const levelTaskObjects = tasks.filter(t => levelTasks.includes(t.id));

    const group: TaskGroup = {
      groupId: `group-${i + 1}`,
      name: `Level ${i + 1}`,
      tasks: levelTasks,
      canParallelize: levelTasks.length > 1,
      estimatedDurationMs: Math.max(
        ...levelTaskObjects.map(t => (t.estimatedDuration || 0) * 60000)
      ),
      dependsOn: i > 0 ? [`group-${i}`] : [],
    };

    groups.push(group);
  }

  return groups;
}

// ============================================================================
// Main Transform Function
// ============================================================================

/**
 * θ₂: Generation Transform
 *
 * Transforms Strategic Plan (S) and World Space (W) into Task Set (𝕋)
 *
 * @param plan - The strategic plan from θ₁
 * @param world - The world space context
 * @returns Task set for allocation
 *
 * @example
 * ```typescript
 * const taskSet = await generation(plan, world);
 * console.log(taskSet.summary.totalTasks); // 15
 * ```
 */
export function generation(
  plan: StrategicPlan,
  world: WorldSpace
): TaskSet {
  const startTime = Date.now();

  // Generate tasks from each objective
  const allTasks: GeneratedTask[] = [];

  for (let i = 0; i < plan.objectives.length; i++) {
    const objective = plan.objectives[i];
    const tasks = generateTasksFromObjective(objective, world, i);
    allTasks.push(...tasks);
  }

  // Build DAG
  const dag = buildDAG(allTasks);

  // Group tasks
  const groups = groupTasks(allTasks, dag);

  // Calculate summary
  const byType: Record<string, number> = {};
  const byPriority: Record<number, number> = {};
  let totalDuration = 0;
  let totalTokens = 0;
  let parallelizable = 0;

  for (const task of allTasks) {
    byType[task.type] = (byType[task.type] || 0) + 1;
    byPriority[task.priority] = (byPriority[task.priority] || 0) + 1;
    totalDuration += (task.estimatedDuration || 0) * 60000;
    totalTokens += task.estimatedTokens;
    if (task.dependencies.length === 0) {parallelizable++;}
  }

  const taskSet: TaskSet = {
    setId: `taskset-${Date.now()}`,
    createdAt: new Date().toISOString(),
    sourcePlanId: plan.planId,
    tasks: allTasks,
    dag,
    groups,
    summary: {
      totalTasks: allTasks.length,
      byType,
      byPriority,
      estimatedTotalDurationMs: totalDuration,
      estimatedTotalTokens: totalTokens,
      parallelizableTasks: parallelizable,
    },
    metadata: {
      generationVersion: '1.0.0',
      generationTimeMs: Date.now() - startTime,
    },
  };

  return taskSet;
}

/**
 * Validate a task set
 */
export function validateTaskSet(taskSet: TaskSet): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (taskSet.tasks.length === 0) {
    errors.push('No tasks generated');
  }

  // Check for cycles in DAG
  if (taskSet.dag.levels.length === 0 && taskSet.tasks.length > 0) {
    errors.push('Possible circular dependency detected');
  }

  // Check all dependencies exist
  const taskIds = new Set(taskSet.tasks.map(t => t.id));
  for (const task of taskSet.tasks) {
    for (const dep of task.dependencies) {
      if (!taskIds.has(dep)) {
        errors.push(`Task ${task.id} depends on non-existent task ${dep}`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
