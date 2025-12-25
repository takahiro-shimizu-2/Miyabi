import type { Node, Edge } from '@xyflow/react';
import type { Workflow } from './types';

const API_BASE = '/api';

export interface WorkflowCreateInput {
  name: string;
  description?: string;
  nodes: Node[];
  edges: Edge[];
}

export interface WorkflowUpdateInput {
  name?: string;
  description?: string;
  nodes?: Node[];
  edges?: Edge[];
}

/**
 * API client for workflow operations
 */
export const workflowApi = {
  /**
   * List all workflows
   */
  async list(): Promise<Workflow[]> {
    const response = await fetch(`${API_BASE}/workflows`);
    if (!response.ok) {
      throw new Error('Failed to fetch workflows');
    }
    const data = await response.json();
    return data.workflows;
  },

  /**
   * Get a workflow by ID
   */
  async get(id: string): Promise<Workflow> {
    const response = await fetch(`${API_BASE}/workflows/${id}`);
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Workflow not found');
      }
      throw new Error('Failed to fetch workflow');
    }
    const data = await response.json();
    return data.workflow;
  },

  /**
   * Create a new workflow
   */
  async create(input: WorkflowCreateInput): Promise<Workflow> {
    const response = await fetch(`${API_BASE}/workflows`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create workflow');
    }
    const data = await response.json();
    return data.workflow;
  },

  /**
   * Update a workflow
   */
  async update(id: string, input: WorkflowUpdateInput): Promise<Workflow> {
    const response = await fetch(`${API_BASE}/workflows/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update workflow');
    }
    const data = await response.json();
    return data.workflow;
  },

  /**
   * Delete a workflow
   */
  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/workflows/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete workflow');
    }
  },
};
