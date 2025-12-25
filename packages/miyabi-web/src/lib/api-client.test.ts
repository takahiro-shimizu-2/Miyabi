import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { workflowApi } from './api-client';
import type { Workflow } from './types';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Sample workflow data
const sampleWorkflow: Workflow = {
  id: 'test-123',
  name: 'Test Workflow',
  description: 'A test workflow',
  nodes: [{ id: 'a', position: { x: 0, y: 0 }, data: {} }],
  edges: [],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

describe('workflowApi', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('list', () => {
    it('should fetch all workflows', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ workflows: [sampleWorkflow] }),
      });

      const result = await workflowApi.list();

      expect(mockFetch).toHaveBeenCalledWith('/api/workflows');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('test-123');
    });

    it('should throw error on failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await expect(workflowApi.list()).rejects.toThrow('Failed to fetch workflows');
    });
  });

  describe('get', () => {
    it('should fetch a workflow by ID', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ workflow: sampleWorkflow }),
      });

      const result = await workflowApi.get('test-123');

      expect(mockFetch).toHaveBeenCalledWith('/api/workflows/test-123');
      expect(result.id).toBe('test-123');
      expect(result.name).toBe('Test Workflow');
    });

    it('should throw error when workflow not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      await expect(workflowApi.get('nonexistent')).rejects.toThrow('Workflow not found');
    });

    it('should throw generic error on other failures', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await expect(workflowApi.get('test-123')).rejects.toThrow('Failed to fetch workflow');
    });
  });

  describe('create', () => {
    it('should create a new workflow', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ workflow: sampleWorkflow }),
      });

      const input = {
        name: 'Test Workflow',
        nodes: [{ id: 'a', position: { x: 0, y: 0 }, data: {} }],
        edges: [],
      };

      const result = await workflowApi.create(input);

      expect(mockFetch).toHaveBeenCalledWith('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      expect(result.id).toBe('test-123');
    });

    it('should throw error with message from server', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Workflow name is required' }),
      });

      await expect(workflowApi.create({ name: '', nodes: [], edges: [] }))
        .rejects.toThrow('Workflow name is required');
    });

    it('should throw generic error if no error message', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({}),
      });

      await expect(workflowApi.create({ name: 'test', nodes: [], edges: [] }))
        .rejects.toThrow('Failed to create workflow');
    });
  });

  describe('update', () => {
    it('should update a workflow', async () => {
      const updatedWorkflow = { ...sampleWorkflow, name: 'Updated Name' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ workflow: updatedWorkflow }),
      });

      const result = await workflowApi.update('test-123', { name: 'Updated Name' });

      expect(mockFetch).toHaveBeenCalledWith('/api/workflows/test-123', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Updated Name' }),
      });
      expect(result.name).toBe('Updated Name');
    });

    it('should throw error with message from server', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Invalid update data' }),
      });

      await expect(workflowApi.update('test-123', {}))
        .rejects.toThrow('Invalid update data');
    });
  });

  describe('delete', () => {
    it('should delete a workflow', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
      });

      await expect(workflowApi.delete('test-123')).resolves.toBeUndefined();

      expect(mockFetch).toHaveBeenCalledWith('/api/workflows/test-123', {
        method: 'DELETE',
      });
    });

    it('should throw error on failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await expect(workflowApi.delete('test-123')).rejects.toThrow('Failed to delete workflow');
    });
  });
});
