/**
 * Task Manager - Decomposition Types
 * Types for LLM-based task decomposition
 */

import type { ManagedTask, TaskType, AgentType } from './task.js';

/**
 * Context for decomposition
 */
export interface DecompositionContext {
  projectDescription?: string;
  existingTasks?: ManagedTask[];
  relatedIssues?: number[];
  codebaseContext?: {
    languages: string[];
    frameworks: string[];
    architecture: string;
    keyFiles?: string[];
  };
  previousDecompositions?: DecompositionResult[];
}

/**
 * Constraints for decomposition
 */
export interface DecompositionConstraints {
  maxTasks?: number;
  maxDepth?: number;
  preferredAgents?: AgentType[];
  excludeTypes?: TaskType[];
  estimatedTotalDurationMinutes?: number;
  requireTests?: boolean;
  requireReview?: boolean;
}

/**
 * Decomposition request
 */
export interface DecompositionRequest {
  prompt: string;
  context?: DecompositionContext;
  constraints?: DecompositionConstraints;
  outputFormat?: 'tasks' | 'dag' | 'full';
}

/**
 * DAG edge representation
 */
export interface DAGEdge {
  from: string;
  to: string;
  type: 'depends-on' | 'blocks';
}

/**
 * DAG result from decomposition
 */
export interface DAGResult {
  nodes: ManagedTask[];
  edges: DAGEdge[];
  levels: string[][];
  criticalPath: string[];
  estimatedDurationMinutes: number;
}

/**
 * Decomposition warning
 */
export interface DecompositionWarning {
  code: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
  affectedTaskIds?: string[];
}

/**
 * Decomposition metadata
 */
export interface DecompositionMetadata {
  model: string;
  tokenUsage: {
    input: number;
    output: number;
  };
  processingTimeMs: number;
  confidence: number;
}

/**
 * Complete decomposition result
 */
export interface DecompositionResult {
  id: string;
  originalPrompt: string;
  tasks: ManagedTask[];
  dag: DAGResult;
  metadata: DecompositionMetadata;
  warnings: DecompositionWarning[];
  createdAt: string;
}

/**
 * Validation result for decomposition
 */
export interface DecompositionValidationResult {
  valid: boolean;
  errors: DecompositionWarning[];
  warnings: DecompositionWarning[];
  suggestions: string[];
}

/**
 * Raw task from LLM response (before normalization)
 */
export interface RawLLMTask {
  id?: string;
  title: string;
  description?: string;
  type?: string;
  priority?: number;
  dependencies?: string[];
  estimatedDuration?: number;
  estimated_duration?: number;
  assignedAgent?: string;
  assigned_agent?: string;
}

/**
 * Decomposition warning codes
 */
export const DECOMPOSITION_WARNING_CODES = {
  CIRCULAR_DEPENDENCY: 'CIRCULAR_DEPENDENCY',
  MISSING_DEPENDENCY: 'MISSING_DEPENDENCY',
  DUPLICATE_TASK_ID: 'DUPLICATE_TASK_ID',
  INVALID_TASK_TYPE: 'INVALID_TASK_TYPE',
  INVALID_AGENT_TYPE: 'INVALID_AGENT_TYPE',
  TOO_MANY_TASKS: 'TOO_MANY_TASKS',
  NO_TASKS_GENERATED: 'NO_TASKS_GENERATED',
  LOW_CONFIDENCE: 'LOW_CONFIDENCE',
  PARSE_ERROR: 'PARSE_ERROR',
} as const;

export type DecompositionWarningCode =
  (typeof DECOMPOSITION_WARNING_CODES)[keyof typeof DECOMPOSITION_WARNING_CODES];
