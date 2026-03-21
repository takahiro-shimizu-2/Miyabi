/**
 * θ₁: Understanding Transform
 *
 * Mathematical Definition: θ₁: I × W → S
 *
 * Transforms Intent Space and World Space into a Strategic Plan.
 * This is the first stage of the Ω-System execution pipeline.
 *
 * @module omega-system/transformations/understanding
 */

import type { IntentSpace, Goal, GoalPriority } from '../../types/intent';
import type { WorldSpace } from '../../types/world';

// ============================================================================
// Strategic Plan Types
// ============================================================================

/**
 * Strategic objective derived from goals
 */
export interface StrategicObjective {
  id: string;
  sourceGoalId: string;
  description: string;
  priority: GoalPriority;
  estimatedComplexity: 'trivial' | 'simple' | 'moderate' | 'complex' | 'very-complex';
  requiredCapabilities: string[];
  constraints: string[];
  successMetrics: Array<{
    metric: string;
    target: number | string;
    weight: number;
  }>;
}

/**
 * Resource requirements analysis
 */
export interface ResourceRequirements {
  computational: {
    estimatedTokens: number;
    estimatedDurationMs: number;
    parallelizable: boolean;
  };
  human: {
    reviewRequired: boolean;
    approvalRequired: boolean;
    escalationLikelihood: number; // 0-1
  };
  information: {
    requiredContext: string[];
    knowledgeGaps: string[];
  };
}

/**
 * Risk assessment
 */
export interface RiskAssessment {
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  factors: Array<{
    factor: string;
    severity: 'low' | 'medium' | 'high';
    mitigation?: string;
  }>;
  blockers: string[];
  dependencies: string[];
}

/**
 * Strategic Plan - Output of θ₁
 *
 * S = θ₁(I, W)
 */
export interface StrategicPlan {
  planId: string;
  createdAt: string;

  /** Source intent */
  intentSummary: {
    primaryGoal: string;
    goalCount: number;
    preferenceProfile: string;
    outputModality: string;
  };

  /** World context summary */
  worldContext: {
    environment: string;
    availableResources: string[];
    activeConstraints: string[];
  };

  /** Derived objectives */
  objectives: StrategicObjective[];

  /** Resource analysis */
  resources: ResourceRequirements;

  /** Risk assessment */
  risks: RiskAssessment;

  /** Execution strategy */
  strategy: {
    approach: 'sequential' | 'parallel' | 'hybrid';
    phases: Array<{
      phaseId: string;
      name: string;
      objectives: string[]; // objective IDs
      dependsOn: string[];  // phase IDs
    }>;
    estimatedTotalDurationMs: number;
    confidenceLevel: number; // 0-1
  };

  /** Metadata */
  metadata: {
    analysisVersion: string;
    modelUsed?: string;
    analysisTimeMs: number;
  };
}

// ============================================================================
// Understanding Transform Implementation
// ============================================================================

/**
 * Analyze intent to extract strategic objectives
 */
function analyzeIntent(intent: IntentSpace): StrategicObjective[] {
  const objectives: StrategicObjective[] = [];

  // Process primary goals
  if (intent.goals.primary.main) {
    objectives.push(goalToObjective(intent.goals.primary.main, 'primary'));
  }

  for (const goal of intent.goals.primary.supporting) {
    objectives.push(goalToObjective(goal, 'supporting'));
  }

  // Process secondary goals
  for (const goal of intent.goals.secondary.goals) {
    objectives.push(goalToObjective(goal, 'secondary'));
  }

  // Process implicit goals with lower priority
  for (const goal of intent.goals.implicit.inferred) {
    const obj = goalToObjective(goal, 'implicit');
    obj.priority = 'low'; // Implicit goals are lower priority
    objectives.push(obj);
  }

  return objectives;
}

/**
 * Convert a Goal to a StrategicObjective
 */
function goalToObjective(goal: Goal, _source: string): StrategicObjective {
  return {
    id: `obj-${goal.id}`,
    sourceGoalId: goal.id,
    description: goal.description,
    priority: goal.priority,
    estimatedComplexity: estimateComplexity(goal),
    requiredCapabilities: inferCapabilities(goal),
    constraints: goal.successCriteria || [],
    successMetrics: goal.successCriteria?.map((criteria) => ({
      metric: criteria,
      target: 'met',
      weight: 1 / (goal.successCriteria?.length || 1),
    })) || [],
  };
}

/**
 * Estimate complexity from goal description
 */
function estimateComplexity(goal: Goal): StrategicObjective['estimatedComplexity'] {
  const desc = goal.description.toLowerCase();

  // Simple heuristics based on keywords
  if (desc.includes('refactor') || desc.includes('redesign') || desc.includes('migrate')) {
    return 'complex';
  }
  if (desc.includes('implement') || desc.includes('create') || desc.includes('build')) {
    return 'moderate';
  }
  if (desc.includes('fix') || desc.includes('update') || desc.includes('add')) {
    return 'simple';
  }
  if (desc.includes('typo') || desc.includes('comment') || desc.includes('rename')) {
    return 'trivial';
  }

  return 'moderate'; // Default
}

/**
 * Infer required capabilities from goal
 */
function inferCapabilities(goal: Goal): string[] {
  const capabilities: string[] = [];
  const desc = goal.description.toLowerCase();

  if (desc.includes('code') || desc.includes('implement') || desc.includes('function')) {
    capabilities.push('code-generation');
  }
  if (desc.includes('test') || desc.includes('coverage')) {
    capabilities.push('test-generation');
  }
  if (desc.includes('review') || desc.includes('quality')) {
    capabilities.push('code-review');
  }
  if (desc.includes('document') || desc.includes('readme') || desc.includes('doc')) {
    capabilities.push('documentation');
  }
  if (desc.includes('deploy') || desc.includes('release')) {
    capabilities.push('deployment');
  }
  if (desc.includes('security') || desc.includes('vulnerability')) {
    capabilities.push('security-scan');
  }

  return capabilities.length > 0 ? capabilities : ['general'];
}

/**
 * Analyze world context for resource availability
 */
function analyzeWorld(world: WorldSpace): ResourceRequirements {
  return {
    computational: {
      estimatedTokens: 10000, // Base estimate
      estimatedDurationMs: 60000, // 1 minute base
      parallelizable: world.environmental.constraints.concurrency.maxWorkers > 1,
    },
    human: {
      reviewRequired: world.contextual.system.architecture.patterns.includes('code-review'),
      approvalRequired: world.environmental.constraints.security.requiresReview,
      escalationLikelihood: 0.1, // 10% base
    },
    information: {
      requiredContext: [
        world.contextual.domain.primary,
        ...world.contextual.domain.subDomains.slice(0, 3),
      ],
      knowledgeGaps: [],
    },
  };
}

/**
 * Assess risks based on intent and world
 */
function assessRisks(
  _intent: IntentSpace,
  world: WorldSpace,
  objectives: StrategicObjective[]
): RiskAssessment {
  const factors: RiskAssessment['factors'] = [];
  const blockers: string[] = [];
  const dependencies: string[] = [];

  // Check complexity risk
  const complexObjectives = objectives.filter(
    o => o.estimatedComplexity === 'complex' || o.estimatedComplexity === 'very-complex'
  );
  if (complexObjectives.length > 0) {
    factors.push({
      factor: `${complexObjectives.length} complex objectives`,
      severity: complexObjectives.length > 2 ? 'high' : 'medium',
      mitigation: 'Break down into smaller tasks',
    });
  }

  // Check resource constraints
  if (world.environmental.load.cpuUtilization > 80) {
    factors.push({
      factor: 'High CPU utilization',
      severity: 'medium',
      mitigation: 'Reduce concurrency or wait for resources',
    });
  }

  // Check time constraints
  const businessHours = world.temporal.constraints.businessHours;
  if (businessHours) {
    factors.push({
      factor: 'Business hours constraint',
      severity: 'low',
      mitigation: 'Schedule within allowed window',
    });
  }

  // Determine overall risk
  const highRiskCount = factors.filter(f => f.severity === 'high').length;
  const mediumRiskCount = factors.filter(f => f.severity === 'medium').length;

  let overallRisk: RiskAssessment['overallRisk'] = 'low';
  if (highRiskCount > 1 || blockers.length > 0) {
    overallRisk = 'critical';
  } else if (highRiskCount === 1 || mediumRiskCount > 2) {
    overallRisk = 'high';
  } else if (mediumRiskCount > 0) {
    overallRisk = 'medium';
  }

  return { overallRisk, factors, blockers, dependencies };
}

/**
 * Determine execution strategy
 */
function determineStrategy(
  objectives: StrategicObjective[],
  resources: ResourceRequirements,
  risks: RiskAssessment
): StrategicPlan['strategy'] {
  // Determine approach based on objectives and resources
  let approach: 'sequential' | 'parallel' | 'hybrid' = 'sequential';

  if (resources.computational.parallelizable && objectives.length > 1) {
    // Check if objectives have dependencies
    const hasDependencies = objectives.some(o => o.constraints.length > 0);
    approach = hasDependencies ? 'hybrid' : 'parallel';
  }

  // Create phases
  const phases: StrategicPlan['strategy']['phases'] = [];

  if (approach === 'sequential') {
    // One phase per objective
    objectives.forEach((obj, idx) => {
      phases.push({
        phaseId: `phase-${idx + 1}`,
        name: `Execute ${obj.description.slice(0, 30)}...`,
        objectives: [obj.id],
        dependsOn: idx > 0 ? [`phase-${idx}`] : [],
      });
    });
  } else if (approach === 'parallel') {
    // Single phase with all objectives
    phases.push({
      phaseId: 'phase-1',
      name: 'Parallel execution',
      objectives: objectives.map(o => o.id),
      dependsOn: [],
    });
  } else {
    // Hybrid: group by complexity
    const simple = objectives.filter(o =>
      o.estimatedComplexity === 'trivial' || o.estimatedComplexity === 'simple'
    );
    const complex = objectives.filter(o =>
      o.estimatedComplexity !== 'trivial' && o.estimatedComplexity !== 'simple'
    );

    if (simple.length > 0) {
      phases.push({
        phaseId: 'phase-1',
        name: 'Quick wins (parallel)',
        objectives: simple.map(o => o.id),
        dependsOn: [],
      });
    }

    if (complex.length > 0) {
      phases.push({
        phaseId: 'phase-2',
        name: 'Complex tasks',
        objectives: complex.map(o => o.id),
        dependsOn: simple.length > 0 ? ['phase-1'] : [],
      });
    }
  }

  // Estimate duration
  const baseDurationPerObjective = 60000; // 1 minute
  const complexityMultiplier: Record<string, number> = {
    'trivial': 0.25,
    'simple': 0.5,
    'moderate': 1,
    'complex': 2,
    'very-complex': 4,
  };

  let totalDuration = 0;
  for (const obj of objectives) {
    totalDuration += baseDurationPerObjective * (complexityMultiplier[obj.estimatedComplexity] || 1);
  }

  // Adjust for parallelism
  if (approach === 'parallel') {
    totalDuration = totalDuration / Math.min(objectives.length, 3);
  }

  return {
    approach,
    phases,
    estimatedTotalDurationMs: Math.round(totalDuration),
    confidenceLevel: risks.overallRisk === 'low' ? 0.9 :
                     risks.overallRisk === 'medium' ? 0.7 :
                     risks.overallRisk === 'high' ? 0.5 : 0.3,
  };
}

// ============================================================================
// Main Transform Function
// ============================================================================

/**
 * θ₁: Understanding Transform
 *
 * Transforms Intent Space (I) and World Space (W) into Strategic Plan (S)
 *
 * @param intent - The intent space specification
 * @param world - The world space context
 * @returns Strategic plan for execution
 *
 * @example
 * ```typescript
 * const plan = await understanding(intent, world);
 * console.log(plan.strategy.approach); // 'parallel'
 * ```
 */
export function understanding(
  intent: IntentSpace,
  world: WorldSpace
): StrategicPlan {
  const startTime = Date.now();

  // Analyze intent to extract objectives
  const objectives = analyzeIntent(intent);

  // Analyze world for resources
  const resources = analyzeWorld(world);

  // Assess risks
  const risks = assessRisks(intent, world, objectives);

  // Determine execution strategy
  const strategy = determineStrategy(objectives, resources, risks);

  // Build strategic plan
  const plan: StrategicPlan = {
    planId: `plan-${Date.now()}`,
    createdAt: new Date().toISOString(),

    intentSummary: {
      primaryGoal: intent.goals.primary.main?.description || 'No primary goal',
      goalCount: intent.goals.allGoals.length,
      preferenceProfile: intent.preferences.qualityVsSpeed.bias,
      outputModality: intent.modality.primary,
    },

    worldContext: {
      environment: world.contextual.system.projectType,
      availableResources: [
        `${world.resources.computational.cpu.available} CPU cores`,
        `${world.resources.computational.memory.available}MB RAM`,
        `${world.resources.human.developers} developers`,
      ],
      activeConstraints: [
        world.temporal.constraints.businessHours,
        `Max ${world.environmental.constraints.concurrency.maxWorkers} workers`,
      ].filter(Boolean),
    },

    objectives,
    resources,
    risks,
    strategy,

    metadata: {
      analysisVersion: '1.0.0',
      analysisTimeMs: Date.now() - startTime,
    },
  };

  return plan;
}

/**
 * Validate a strategic plan
 */
export function validatePlan(plan: StrategicPlan): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (plan.objectives.length === 0) {
    errors.push('No objectives defined');
  }

  if (plan.strategy.phases.length === 0) {
    errors.push('No execution phases defined');
  }

  if (plan.risks.blockers.length > 0) {
    errors.push(`Blockers present: ${plan.risks.blockers.join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
