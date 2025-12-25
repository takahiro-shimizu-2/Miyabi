import type { Workflow } from './types';

/**
 * In-memory workflow storage (replace with database in production)
 * For MVP, we use a simple Map-based storage
 */

const workflows = new Map<string, Workflow>();

export const workflowStorage = {
  /**
   * Create a new workflow
   */
  create(workflow: Workflow): Workflow {
    workflows.set(workflow.id, workflow);
    return workflow;
  },

  /**
   * Get workflow by ID
   */
  get(id: string): Workflow | undefined {
    return workflows.get(id);
  },

  /**
   * List all workflows
   */
  list(): Workflow[] {
    return Array.from(workflows.values()).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  },

  /**
   * Update a workflow
   */
  update(id: string, updates: Partial<Workflow>): Workflow | undefined {
    const existing = workflows.get(id);
    if (!existing) return undefined;

    const updated: Workflow = {
      ...existing,
      ...updates,
      id, // Ensure ID cannot be changed
      updatedAt: new Date().toISOString(),
    };

    workflows.set(id, updated);
    return updated;
  },

  /**
   * Delete a workflow
   */
  delete(id: string): boolean {
    return workflows.delete(id);
  },

  /**
   * Clear all workflows (for testing)
   */
  clear(): void {
    workflows.clear();
  },
};
