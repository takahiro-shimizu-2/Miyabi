'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { workflowApi } from '@/lib/api-client';
import type { Workflow } from '@/lib/types';

export default function WorkflowsListPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadWorkflows();
  }, []);

  async function loadWorkflows() {
    try {
      setLoading(true);
      const data = await workflowApi.list();
      setWorkflows(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load workflows');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this workflow?')) return;

    try {
      await workflowApi.delete(id);
      setWorkflows((prev) => prev.filter((w) => w.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete workflow');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Workflows</h1>
            <p className="text-muted">Manage your workflow DAGs</p>
          </div>
          <Link
            href="/dashboard/workflows/create"
            className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-blue-600"
          >
            + Create Workflow
          </Link>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
            {error}
          </div>
        )}

        {workflows.length === 0 ? (
          <div className="text-center py-12 border border-border rounded-lg">
            <p className="text-muted mb-4">No workflows yet</p>
            <Link
              href="/dashboard/workflows/create"
              className="text-accent hover:underline"
            >
              Create your first workflow
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {workflows.map((workflow) => (
              <div
                key={workflow.id}
                className="p-4 border border-border rounded-lg hover:border-accent transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="font-semibold">{workflow.name}</h2>
                    {workflow.description && (
                      <p className="text-sm text-muted mt-1">{workflow.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted">
                      <span>{workflow.nodes.length} nodes</span>
                      <span>{workflow.edges.length} edges</span>
                      <span>Updated {new Date(workflow.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/dashboard/workflows/${workflow.id}`}
                      className="px-3 py-1 text-sm border border-border rounded hover:bg-gray-50"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(workflow.id)}
                      className="px-3 py-1 text-sm border border-red-200 text-red-600 rounded hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
