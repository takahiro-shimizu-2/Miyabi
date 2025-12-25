import { describe, it, expect } from 'vitest';
import { validateWorkflow, topologicalSort, wouldCreateCycle } from './dag-validator';
import type { Node, Edge } from '@xyflow/react';

// Helper to create a node
function createNode(id: string): Node {
  return { id, position: { x: 0, y: 0 }, data: {} };
}

// Helper to create an edge
function createEdge(source: string, target: string): Edge {
  return { id: `${source}-${target}`, source, target };
}

describe('validateWorkflow', () => {
  it('should return valid for empty workflow', () => {
    const result = validateWorkflow([], []);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should return valid for single node', () => {
    const nodes = [createNode('a')];
    const result = validateWorkflow(nodes, []);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should return valid for simple linear DAG', () => {
    const nodes = [createNode('a'), createNode('b'), createNode('c')];
    const edges = [createEdge('a', 'b'), createEdge('b', 'c')];
    const result = validateWorkflow(nodes, edges);
    expect(result.valid).toBe(true);
    expect(result.errors.filter((e) => e.type === 'cycle')).toHaveLength(0);
  });

  it('should return valid for diamond-shaped DAG', () => {
    // a -> b -> d
    // a -> c -> d
    const nodes = [
      createNode('a'),
      createNode('b'),
      createNode('c'),
      createNode('d'),
    ];
    const edges = [
      createEdge('a', 'b'),
      createEdge('a', 'c'),
      createEdge('b', 'd'),
      createEdge('c', 'd'),
    ];
    const result = validateWorkflow(nodes, edges);
    expect(result.valid).toBe(true);
  });

  it('should detect simple cycle', () => {
    // a -> b -> a (cycle)
    const nodes = [createNode('a'), createNode('b')];
    const edges = [createEdge('a', 'b'), createEdge('b', 'a')];
    const result = validateWorkflow(nodes, edges);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.type === 'cycle')).toBe(true);
  });

  it('should detect self-loop', () => {
    const nodes = [createNode('a')];
    const edges = [createEdge('a', 'a')];
    const result = validateWorkflow(nodes, edges);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.type === 'cycle')).toBe(true);
  });

  it('should detect cycle in larger graph', () => {
    // a -> b -> c -> d -> b (cycle)
    const nodes = [
      createNode('a'),
      createNode('b'),
      createNode('c'),
      createNode('d'),
    ];
    const edges = [
      createEdge('a', 'b'),
      createEdge('b', 'c'),
      createEdge('c', 'd'),
      createEdge('d', 'b'),
    ];
    const result = validateWorkflow(nodes, edges);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.type === 'cycle')).toBe(true);
  });

  it('should warn about disconnected nodes', () => {
    const nodes = [
      createNode('a'),
      createNode('b'),
      createNode('c'), // disconnected
    ];
    const edges = [createEdge('a', 'b')];
    const result = validateWorkflow(nodes, edges);
    expect(result.valid).toBe(true); // Still valid, just a warning
    expect(result.errors.some((e) => e.type === 'disconnected')).toBe(true);
    expect(result.errors.find((e) => e.type === 'disconnected')?.nodeIds).toContain('c');
  });

  it('should detect invalid edge source', () => {
    const nodes = [createNode('a'), createNode('b')];
    const edges = [createEdge('nonexistent', 'b')];
    const result = validateWorkflow(nodes, edges);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.type === 'invalid_edge')).toBe(true);
  });

  it('should detect invalid edge target', () => {
    const nodes = [createNode('a'), createNode('b')];
    const edges = [createEdge('a', 'nonexistent')];
    const result = validateWorkflow(nodes, edges);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.type === 'invalid_edge')).toBe(true);
  });
});

describe('topologicalSort', () => {
  it('should return empty array for empty graph', () => {
    const result = topologicalSort([], []);
    expect(result).toEqual([]);
  });

  it('should return single node for single node graph', () => {
    const nodes = [createNode('a')];
    const result = topologicalSort(nodes, []);
    expect(result).toEqual(['a']);
  });

  it('should return correct order for linear chain', () => {
    const nodes = [createNode('a'), createNode('b'), createNode('c')];
    const edges = [createEdge('a', 'b'), createEdge('b', 'c')];
    const result = topologicalSort(nodes, edges);
    expect(result).not.toBeNull();
    expect(result!.indexOf('a')).toBeLessThan(result!.indexOf('b'));
    expect(result!.indexOf('b')).toBeLessThan(result!.indexOf('c'));
  });

  it('should return correct order for diamond graph', () => {
    const nodes = [
      createNode('a'),
      createNode('b'),
      createNode('c'),
      createNode('d'),
    ];
    const edges = [
      createEdge('a', 'b'),
      createEdge('a', 'c'),
      createEdge('b', 'd'),
      createEdge('c', 'd'),
    ];
    const result = topologicalSort(nodes, edges);
    expect(result).not.toBeNull();
    expect(result!.indexOf('a')).toBeLessThan(result!.indexOf('b'));
    expect(result!.indexOf('a')).toBeLessThan(result!.indexOf('c'));
    expect(result!.indexOf('b')).toBeLessThan(result!.indexOf('d'));
    expect(result!.indexOf('c')).toBeLessThan(result!.indexOf('d'));
  });

  it('should return null for graph with cycle', () => {
    const nodes = [createNode('a'), createNode('b')];
    const edges = [createEdge('a', 'b'), createEdge('b', 'a')];
    const result = topologicalSort(nodes, edges);
    expect(result).toBeNull();
  });

  it('should handle disconnected components', () => {
    const nodes = [
      createNode('a'),
      createNode('b'),
      createNode('c'),
      createNode('d'),
    ];
    // Two separate chains: a->b and c->d
    const edges = [createEdge('a', 'b'), createEdge('c', 'd')];
    const result = topologicalSort(nodes, edges);
    expect(result).not.toBeNull();
    expect(result).toHaveLength(4);
    expect(result!.indexOf('a')).toBeLessThan(result!.indexOf('b'));
    expect(result!.indexOf('c')).toBeLessThan(result!.indexOf('d'));
  });
});

describe('wouldCreateCycle', () => {
  it('should return false for valid new edge', () => {
    const nodes = [createNode('a'), createNode('b'), createNode('c')];
    const edges = [createEdge('a', 'b')];
    const result = wouldCreateCycle(nodes, edges, { source: 'b', target: 'c' });
    expect(result).toBe(false);
  });

  it('should return true for edge that creates cycle', () => {
    const nodes = [createNode('a'), createNode('b')];
    const edges = [createEdge('a', 'b')];
    const result = wouldCreateCycle(nodes, edges, { source: 'b', target: 'a' });
    expect(result).toBe(true);
  });

  it('should return true for self-loop', () => {
    const nodes = [createNode('a')];
    const edges: Edge[] = [];
    const result = wouldCreateCycle(nodes, edges, { source: 'a', target: 'a' });
    expect(result).toBe(true);
  });

  it('should return true for edge completing a longer cycle', () => {
    const nodes = [
      createNode('a'),
      createNode('b'),
      createNode('c'),
    ];
    const edges = [createEdge('a', 'b'), createEdge('b', 'c')];
    const result = wouldCreateCycle(nodes, edges, { source: 'c', target: 'a' });
    expect(result).toBe(true);
  });

  it('should return false for parallel edge in DAG', () => {
    // Adding a second edge from a to c in a diamond is still valid
    const nodes = [
      createNode('a'),
      createNode('b'),
      createNode('c'),
    ];
    const edges = [createEdge('a', 'b'), createEdge('b', 'c')];
    const result = wouldCreateCycle(nodes, edges, { source: 'a', target: 'c' });
    expect(result).toBe(false);
  });
});
