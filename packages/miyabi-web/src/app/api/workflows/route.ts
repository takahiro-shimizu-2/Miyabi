import { NextRequest, NextResponse } from 'next/server';
import { workflowStorage } from '@/lib/workflow-storage';
import { validateWorkflow } from '@/lib/dag-validator';
import type { Workflow } from '@/lib/types';

/**
 * GET /api/workflows - List all workflows
 */
export async function GET() {
  const workflows = workflowStorage.list();
  return NextResponse.json({ workflows });
}

/**
 * POST /api/workflows - Create a new workflow
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, nodes, edges } = body;

    // Validate required fields
    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    // Validate DAG
    const validation = validateWorkflow(nodes || [], edges || []);
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Invalid workflow DAG', details: validation.errors },
        { status: 400 }
      );
    }

    // Create workflow
    const workflow: Workflow = {
      id: crypto.randomUUID(),
      name,
      description,
      nodes: nodes || [],
      edges: edges || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const created = workflowStorage.create(workflow);

    return NextResponse.json({ workflow: created }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}
