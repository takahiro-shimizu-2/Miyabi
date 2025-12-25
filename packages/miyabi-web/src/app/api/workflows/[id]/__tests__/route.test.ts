import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, PUT, DELETE } from '../route';
import { workflowStorage } from '@/lib/workflow-storage';
import type { Workflow } from '@/lib/types';

// Helper to create route params
function createParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

// Helper to create a test workflow
function createTestWorkflow(id: string, name: string): Workflow {
  return {
    id,
    name,
    nodes: [],
    edges: [],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };
}

describe('/api/workflows/[id]', () => {
  beforeEach(() => {
    workflowStorage.clear();
  });

  describe('GET', () => {
    it('should return workflow by ID', async () => {
      workflowStorage.create(createTestWorkflow('test-1', 'Test Workflow'));

      const request = new NextRequest('http://localhost/api/workflows/test-1');
      const response = await GET(request, createParams('test-1'));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.workflow.id).toBe('test-1');
      expect(data.workflow.name).toBe('Test Workflow');
    });

    it('should return 404 for non-existent workflow', async () => {
      const request = new NextRequest('http://localhost/api/workflows/non-existent');
      const response = await GET(request, createParams('non-existent'));
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Workflow not found');
    });
  });

  describe('PUT', () => {
    it('should update workflow name', async () => {
      workflowStorage.create(createTestWorkflow('test-1', 'Original Name'));

      const request = new NextRequest('http://localhost/api/workflows/test-1', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Updated Name' }),
      });
      const response = await PUT(request, createParams('test-1'));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.workflow.name).toBe('Updated Name');
    });

    it('should update workflow description', async () => {
      workflowStorage.create(createTestWorkflow('test-1', 'Test'));

      const request = new NextRequest('http://localhost/api/workflows/test-1', {
        method: 'PUT',
        body: JSON.stringify({ description: 'New description' }),
      });
      const response = await PUT(request, createParams('test-1'));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.workflow.description).toBe('New description');
    });

    it('should update workflow nodes', async () => {
      workflowStorage.create(createTestWorkflow('test-1', 'Test'));

      const newNodes = [
        { id: 'a', position: { x: 0, y: 0 }, data: {} },
        { id: 'b', position: { x: 100, y: 0 }, data: {} },
      ];

      const request = new NextRequest('http://localhost/api/workflows/test-1', {
        method: 'PUT',
        body: JSON.stringify({ nodes: newNodes }),
      });
      const response = await PUT(request, createParams('test-1'));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.workflow.nodes).toHaveLength(2);
    });

    it('should update workflow edges', async () => {
      const workflow = createTestWorkflow('test-1', 'Test');
      workflow.nodes = [
        { id: 'a', position: { x: 0, y: 0 }, data: {} },
        { id: 'b', position: { x: 100, y: 0 }, data: {} },
      ];
      workflowStorage.create(workflow);

      const newEdges = [{ id: 'e1', source: 'a', target: 'b' }];

      const request = new NextRequest('http://localhost/api/workflows/test-1', {
        method: 'PUT',
        body: JSON.stringify({ edges: newEdges }),
      });
      const response = await PUT(request, createParams('test-1'));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.workflow.edges).toHaveLength(1);
    });

    it('should return 404 for non-existent workflow', async () => {
      const request = new NextRequest('http://localhost/api/workflows/non-existent', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Updated' }),
      });
      const response = await PUT(request, createParams('non-existent'));
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Workflow not found');
    });

    it('should return 400 for invalid DAG', async () => {
      workflowStorage.create(createTestWorkflow('test-1', 'Test'));

      const request = new NextRequest('http://localhost/api/workflows/test-1', {
        method: 'PUT',
        body: JSON.stringify({
          nodes: [
            { id: 'a', position: { x: 0, y: 0 }, data: {} },
            { id: 'b', position: { x: 100, y: 0 }, data: {} },
          ],
          edges: [
            { id: 'e1', source: 'a', target: 'b' },
            { id: 'e2', source: 'b', target: 'a' },
          ],
        }),
      });
      const response = await PUT(request, createParams('test-1'));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid workflow DAG');
    });

    it('should return 400 for invalid JSON', async () => {
      workflowStorage.create(createTestWorkflow('test-1', 'Test'));

      const request = new NextRequest('http://localhost/api/workflows/test-1', {
        method: 'PUT',
        body: 'invalid json',
      });
      const response = await PUT(request, createParams('test-1'));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request body');
    });

    it('should validate with existing nodes when only edges updated', async () => {
      const workflow = createTestWorkflow('test-1', 'Test');
      workflow.nodes = [
        { id: 'a', position: { x: 0, y: 0 }, data: {} },
        { id: 'b', position: { x: 100, y: 0 }, data: {} },
      ];
      workflowStorage.create(workflow);

      const request = new NextRequest('http://localhost/api/workflows/test-1', {
        method: 'PUT',
        body: JSON.stringify({
          edges: [{ id: 'e1', source: 'a', target: 'b' }],
        }),
      });
      const response = await PUT(request, createParams('test-1'));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.workflow.edges).toHaveLength(1);
    });

    it('should allow clearing description', async () => {
      const workflow = createTestWorkflow('test-1', 'Test');
      workflow.description = 'Original description';
      workflowStorage.create(workflow);

      const request = new NextRequest('http://localhost/api/workflows/test-1', {
        method: 'PUT',
        body: JSON.stringify({ description: '' }),
      });
      const response = await PUT(request, createParams('test-1'));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.workflow.description).toBe('');
    });
  });

  describe('DELETE', () => {
    it('should delete workflow', async () => {
      workflowStorage.create(createTestWorkflow('test-1', 'Test'));

      const request = new NextRequest('http://localhost/api/workflows/test-1', {
        method: 'DELETE',
      });
      const response = await DELETE(request, createParams('test-1'));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(workflowStorage.get('test-1')).toBeUndefined();
    });

    it('should return 404 for non-existent workflow', async () => {
      const request = new NextRequest('http://localhost/api/workflows/non-existent', {
        method: 'DELETE',
      });
      const response = await DELETE(request, createParams('non-existent'));
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Workflow not found');
    });
  });
});
