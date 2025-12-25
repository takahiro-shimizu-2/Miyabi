import { NextRequest, NextResponse } from 'next/server';
import { workflowStorage } from '@/lib/workflow-storage';
import { validateWorkflow } from '@/lib/dag-validator';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/workflows/:id - Get a workflow by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const workflow = workflowStorage.get(id);

  if (!workflow) {
    return NextResponse.json(
      { error: 'Workflow not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({ workflow });
}

/**
 * PUT /api/workflows/:id - Update a workflow
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  try {
    const body = await request.json();
    const { name, description, nodes, edges } = body;

    // Check if workflow exists
    const existing = workflowStorage.get(id);
    if (!existing) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      );
    }

    // Validate DAG if nodes/edges are provided
    if (nodes || edges) {
      const validation = validateWorkflow(
        nodes || existing.nodes,
        edges || existing.edges
      );
      if (!validation.valid) {
        return NextResponse.json(
          { error: 'Invalid workflow DAG', details: validation.errors },
          { status: 400 }
        );
      }
    }

    // Update workflow
    const updated = workflowStorage.update(id, {
      ...(name && { name }),
      ...(description !== undefined && { description }),
      ...(nodes && { nodes }),
      ...(edges && { edges }),
    });

    return NextResponse.json({ workflow: updated });
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}

/**
 * DELETE /api/workflows/:id - Delete a workflow
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  const deleted = workflowStorage.delete(id);

  if (!deleted) {
    return NextResponse.json(
      { error: 'Workflow not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true });
}
