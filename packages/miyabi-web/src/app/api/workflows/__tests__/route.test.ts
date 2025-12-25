import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '../route';
import { workflowStorage } from '@/lib/workflow-storage';

// Mock crypto.randomUUID
vi.stubGlobal('crypto', {
  randomUUID: () => 'test-uuid-123',
});

describe('/api/workflows', () => {
  beforeEach(() => {
    workflowStorage.clear();
  });

  describe('GET', () => {
    it('should return empty array when no workflows', async () => {
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.workflows).toEqual([]);
    });

    it('should return all workflows', async () => {
      workflowStorage.create({
        id: 'test-1',
        name: 'Workflow 1',
        nodes: [],
        edges: [],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      });
      workflowStorage.create({
        id: 'test-2',
        name: 'Workflow 2',
        nodes: [],
        edges: [],
        createdAt: '2024-01-02T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.workflows).toHaveLength(2);
    });
  });

  describe('POST', () => {
    it('should create a new workflow', async () => {
      const request = new NextRequest('http://localhost/api/workflows', {
        method: 'POST',
        body: JSON.stringify({
          name: 'New Workflow',
          nodes: [],
          edges: [],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.workflow.name).toBe('New Workflow');
      expect(data.workflow.id).toBe('test-uuid-123');
    });

    it('should return 400 when name is missing', async () => {
      const request = new NextRequest('http://localhost/api/workflows', {
        method: 'POST',
        body: JSON.stringify({
          nodes: [],
          edges: [],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Name is required');
    });

    it('should return 400 when name is not a string', async () => {
      const request = new NextRequest('http://localhost/api/workflows', {
        method: 'POST',
        body: JSON.stringify({
          name: 123,
          nodes: [],
          edges: [],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Name is required');
    });

    it('should return 400 for invalid DAG with cycle', async () => {
      const request = new NextRequest('http://localhost/api/workflows', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Cyclic Workflow',
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

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid workflow DAG');
      expect(data.details).toBeDefined();
    });

    it('should create workflow with valid DAG', async () => {
      const request = new NextRequest('http://localhost/api/workflows', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Valid Workflow',
          nodes: [
            { id: 'a', position: { x: 0, y: 0 }, data: {} },
            { id: 'b', position: { x: 100, y: 0 }, data: {} },
          ],
          edges: [{ id: 'e1', source: 'a', target: 'b' }],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.workflow.nodes).toHaveLength(2);
      expect(data.workflow.edges).toHaveLength(1);
    });

    it('should create workflow with description', async () => {
      const request = new NextRequest('http://localhost/api/workflows', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Described Workflow',
          description: 'A workflow with description',
          nodes: [],
          edges: [],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.workflow.description).toBe('A workflow with description');
    });

    it('should return 400 for invalid JSON', async () => {
      const request = new NextRequest('http://localhost/api/workflows', {
        method: 'POST',
        body: 'invalid json',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request body');
    });

    it('should create workflow with empty nodes/edges when not provided', async () => {
      const request = new NextRequest('http://localhost/api/workflows', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Minimal Workflow',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.workflow.nodes).toEqual([]);
      expect(data.workflow.edges).toEqual([]);
    });
  });
});
