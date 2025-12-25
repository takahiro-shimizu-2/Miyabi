import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWorkflow } from './useWorkflow';
import type { Workflow } from '@/lib/types';

// Mock crypto.randomUUID
vi.stubGlobal('crypto', {
  randomUUID: () => 'test-uuid-123',
});

describe('useWorkflow', () => {
  beforeEach(() => {
    // Reset between tests
  });

  describe('initialization', () => {
    it('should initialize with empty workflow', () => {
      const { result } = renderHook(() => useWorkflow());

      expect(result.current.nodes).toHaveLength(0);
      expect(result.current.edges).toHaveLength(0);
      expect(result.current.workflowName).toBe('New Workflow');
    });

    it('should initialize with provided workflow', () => {
      const initial = {
        name: 'Test Workflow',
        nodes: [{ id: 'node_0', position: { x: 0, y: 0 }, data: {} }],
        edges: [],
      };
      const { result } = renderHook(() => useWorkflow(initial));

      expect(result.current.nodes).toHaveLength(1);
      expect(result.current.workflowName).toBe('Test Workflow');
    });
  });

  describe('addAgentNode', () => {
    it('should add an agent node', () => {
      const { result } = renderHook(() => useWorkflow());

      act(() => {
        result.current.addAgentNode('coordinator');
      });

      expect(result.current.nodes).toHaveLength(1);
      expect(result.current.nodes[0].type).toBe('agent');
      expect(result.current.nodes[0].data.agentType).toBe('coordinator');
      expect(result.current.nodes[0].data.label).toBe('Coordinator Agent');
    });

    it('should add node at custom position', () => {
      const { result } = renderHook(() => useWorkflow());

      act(() => {
        result.current.addAgentNode('codegen', { x: 200, y: 300 });
      });

      expect(result.current.nodes[0].position).toEqual({ x: 200, y: 300 });
    });

    it('should return node id', () => {
      const { result } = renderHook(() => useWorkflow());

      let nodeId: string | undefined;
      act(() => {
        nodeId = result.current.addAgentNode('review');
      });

      expect(nodeId).toBeDefined();
      expect(result.current.nodes[0].id).toBe(nodeId);
    });
  });

  describe('addIssueNode', () => {
    it('should add an issue node', () => {
      const { result } = renderHook(() => useWorkflow());

      act(() => {
        result.current.addIssueNode(123, 'Fix bug');
      });

      expect(result.current.nodes).toHaveLength(1);
      expect(result.current.nodes[0].type).toBe('issue');
      expect(result.current.nodes[0].data.issueNumber).toBe(123);
      expect(result.current.nodes[0].data.title).toBe('Fix bug');
      expect(result.current.nodes[0].data.label).toBe('Issue #123');
    });
  });

  describe('addConditionNode', () => {
    it('should add a condition node', () => {
      const { result } = renderHook(() => useWorkflow());

      act(() => {
        result.current.addConditionNode('status === "success"');
      });

      expect(result.current.nodes).toHaveLength(1);
      expect(result.current.nodes[0].type).toBe('condition');
      expect(result.current.nodes[0].data.condition).toBe('status === "success"');
    });
  });

  describe('deleteNode', () => {
    it('should delete a node', () => {
      const { result } = renderHook(() => useWorkflow());

      act(() => {
        result.current.addAgentNode('coordinator');
        result.current.addAgentNode('codegen');
      });

      expect(result.current.nodes).toHaveLength(2);

      act(() => {
        result.current.deleteNode(result.current.nodes[0].id);
      });

      expect(result.current.nodes).toHaveLength(1);
    });

    it('should delete edges connected to the node', () => {
      const { result } = renderHook(() => useWorkflow());

      let nodeId1: string | undefined;
      let nodeId2: string | undefined;

      act(() => {
        nodeId1 = result.current.addAgentNode('coordinator');
        nodeId2 = result.current.addAgentNode('codegen');
      });

      // Manually add an edge (simulating onConnect)
      act(() => {
        result.current.onConnect({
          source: nodeId1!,
          target: nodeId2!,
          sourceHandle: null,
          targetHandle: null,
        });
      });

      expect(result.current.edges).toHaveLength(1);

      act(() => {
        result.current.deleteNode(nodeId1!);
      });

      expect(result.current.edges).toHaveLength(0);
    });
  });

  describe('updateNodeData', () => {
    it('should update node data', () => {
      const { result } = renderHook(() => useWorkflow());

      act(() => {
        result.current.addAgentNode('coordinator');
      });

      const nodeId = result.current.nodes[0].id;

      act(() => {
        result.current.updateNodeData(nodeId, { status: 'running' });
      });

      expect(result.current.nodes[0].data.status).toBe('running');
    });
  });

  describe('clearWorkflow', () => {
    it('should clear all nodes and edges', () => {
      const { result } = renderHook(() => useWorkflow());

      act(() => {
        result.current.addAgentNode('coordinator');
        result.current.addAgentNode('codegen');
        result.current.addIssueNode(123);
      });

      expect(result.current.nodes).toHaveLength(3);

      act(() => {
        result.current.clearWorkflow();
      });

      expect(result.current.nodes).toHaveLength(0);
      expect(result.current.edges).toHaveLength(0);
    });
  });

  describe('validation', () => {
    it('should validate empty workflow as valid', () => {
      const { result } = renderHook(() => useWorkflow());

      expect(result.current.validation.valid).toBe(true);
    });

    it('should validate workflow with nodes and valid edges', () => {
      const { result } = renderHook(() => useWorkflow());

      let nodeId1: string | undefined;
      let nodeId2: string | undefined;

      act(() => {
        nodeId1 = result.current.addAgentNode('coordinator');
        nodeId2 = result.current.addAgentNode('codegen');
      });

      act(() => {
        result.current.onConnect({
          source: nodeId1!,
          target: nodeId2!,
          sourceHandle: null,
          targetHandle: null,
        });
      });

      expect(result.current.validation.valid).toBe(true);
    });
  });

  describe('onConnect', () => {
    it('should reject connections that create cycles', () => {
      const { result } = renderHook(() => useWorkflow());
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      let nodeId1: string | undefined;
      let nodeId2: string | undefined;

      act(() => {
        nodeId1 = result.current.addAgentNode('coordinator');
        nodeId2 = result.current.addAgentNode('codegen');
      });

      // Add edge from 1 to 2
      act(() => {
        result.current.onConnect({
          source: nodeId1!,
          target: nodeId2!,
          sourceHandle: null,
          targetHandle: null,
        });
      });

      expect(result.current.edges).toHaveLength(1);

      // Try to add edge from 2 to 1 (would create cycle)
      act(() => {
        result.current.onConnect({
          source: nodeId2!,
          target: nodeId1!,
          sourceHandle: null,
          targetHandle: null,
        });
      });

      // Should still only have 1 edge
      expect(result.current.edges).toHaveLength(1);
      expect(consoleSpy).toHaveBeenCalledWith('Connection rejected: would create a cycle');

      consoleSpy.mockRestore();
    });

    it('should reject self-loops', () => {
      const { result } = renderHook(() => useWorkflow());
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      let nodeId: string | undefined;

      act(() => {
        nodeId = result.current.addAgentNode('coordinator');
      });

      // Try to connect node to itself
      act(() => {
        result.current.onConnect({
          source: nodeId!,
          target: nodeId!,
          sourceHandle: null,
          targetHandle: null,
        });
      });

      expect(result.current.edges).toHaveLength(0);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('exportWorkflow', () => {
    it('should export workflow as JSON', () => {
      const { result } = renderHook(() => useWorkflow());

      act(() => {
        result.current.setWorkflowName('Export Test');
        result.current.addAgentNode('coordinator');
        result.current.addAgentNode('codegen');
      });

      let exported: Workflow | undefined;
      act(() => {
        exported = result.current.exportWorkflow();
      });

      expect(exported).toBeDefined();
      expect(exported!.name).toBe('Export Test');
      expect(exported!.nodes).toHaveLength(2);
      expect(exported!.id).toBe('test-uuid-123');
    });
  });

  describe('importWorkflow', () => {
    it('should import workflow from JSON', () => {
      const { result } = renderHook(() => useWorkflow());

      const workflow: Workflow = {
        id: 'import-123',
        name: 'Imported Workflow',
        nodes: [
          { id: 'node_0', position: { x: 0, y: 0 }, data: { label: 'Test' } },
          { id: 'node_1', position: { x: 100, y: 100 }, data: { label: 'Test 2' } },
        ],
        edges: [{ id: 'edge_0', source: 'node_0', target: 'node_1' }],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      act(() => {
        result.current.importWorkflow(workflow);
      });

      expect(result.current.workflowName).toBe('Imported Workflow');
      expect(result.current.nodes).toHaveLength(2);
      expect(result.current.edges).toHaveLength(1);
    });
  });
});
