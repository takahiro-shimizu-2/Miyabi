import type { Node, Edge } from '@xyflow/react';

// Workflow node types
export type WorkflowNodeType = 'agent' | 'issue' | 'condition';

// Agent types from Miyabi
export type AgentType =
  | 'coordinator'
  | 'codegen'
  | 'review'
  | 'issue'
  | 'pr'
  | 'deployment'
  | 'test';

// Node data types with index signature for React Flow compatibility
export interface AgentNodeData extends Record<string, unknown> {
  label: string;
  agentType: AgentType;
  issueNumber?: number;
  status?: 'pending' | 'running' | 'completed' | 'failed';
}

export interface IssueNodeData extends Record<string, unknown> {
  label: string;
  issueNumber: number;
  title?: string;
  status?: 'open' | 'closed';
}

export interface ConditionNodeData extends Record<string, unknown> {
  label: string;
  condition: string;
  trueLabel?: string;
  falseLabel?: string;
}

// Combined node data type
export type WorkflowNodeData = AgentNodeData | IssueNodeData | ConditionNodeData;

// Workflow types - use base Node type for serialization
export interface Workflow {
  id: string;
  name: string;
  description?: string;
  nodes: Node[];
  edges: Edge[];
  createdAt: string;
  updatedAt: string;
}

// Validation result
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  type: 'cycle' | 'disconnected' | 'invalid_edge' | 'missing_agent';
  message: string;
  nodeIds?: string[];
}
