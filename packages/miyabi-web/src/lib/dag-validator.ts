import type { Node, Edge } from '@xyflow/react';
import type { ValidationResult, ValidationError } from './types';

/**
 * DAG Validator for workflow graphs
 * Implements cycle detection and topological sort
 */

interface Graph {
  [nodeId: string]: string[];
}

/**
 * Build adjacency list from edges
 */
function buildGraph(nodes: Node[], edges: Edge[]): Graph {
  const graph: Graph = {};

  // Initialize all nodes
  for (const node of nodes) {
    graph[node.id] = [];
  }

  // Add edges
  for (const edge of edges) {
    if (graph[edge.source]) {
      graph[edge.source].push(edge.target);
    }
  }

  return graph;
}

/**
 * Detect cycles using DFS with coloring
 * White (0) = unvisited, Gray (1) = visiting, Black (2) = visited
 */
function detectCycles(graph: Graph): string[][] {
  const color: Record<string, number> = {};
  const parent: Record<string, string | null> = {};
  const cycles: string[][] = [];

  // Initialize all nodes as white
  for (const nodeId of Object.keys(graph)) {
    color[nodeId] = 0;
    parent[nodeId] = null;
  }

  function dfs(nodeId: string): boolean {
    color[nodeId] = 1; // Gray - visiting

    for (const neighbor of graph[nodeId]) {
      if (color[neighbor] === 1) {
        // Found cycle - reconstruct it
        const cycle: string[] = [neighbor];
        let current = nodeId;
        while (current !== neighbor) {
          cycle.push(current);
          current = parent[current]!;
          if (!current) break;
        }
        cycle.push(neighbor);
        cycles.push(cycle.reverse());
        return true;
      }

      if (color[neighbor] === 0) {
        parent[neighbor] = nodeId;
        if (dfs(neighbor)) {
          return true;
        }
      }
    }

    color[nodeId] = 2; // Black - visited
    return false;
  }

  for (const nodeId of Object.keys(graph)) {
    if (color[nodeId] === 0) {
      dfs(nodeId);
    }
  }

  return cycles;
}

/**
 * Topological sort using Kahn's algorithm
 * Returns sorted node IDs or null if cycle exists
 */
export function topologicalSort(nodes: Node[], edges: Edge[]): string[] | null {
  const graph = buildGraph(nodes, edges);
  const inDegree: Record<string, number> = {};

  // Calculate in-degrees
  for (const nodeId of Object.keys(graph)) {
    inDegree[nodeId] = 0;
  }
  for (const edge of edges) {
    if (inDegree[edge.target] !== undefined) {
      inDegree[edge.target]++;
    }
  }

  // Queue nodes with 0 in-degree
  const queue: string[] = [];
  for (const nodeId of Object.keys(inDegree)) {
    if (inDegree[nodeId] === 0) {
      queue.push(nodeId);
    }
  }

  const sorted: string[] = [];

  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    sorted.push(nodeId);

    for (const neighbor of graph[nodeId]) {
      inDegree[neighbor]--;
      if (inDegree[neighbor] === 0) {
        queue.push(neighbor);
      }
    }
  }

  // If not all nodes are sorted, cycle exists
  if (sorted.length !== Object.keys(graph).length) {
    return null;
  }

  return sorted;
}

/**
 * Find disconnected nodes (nodes with no edges)
 */
function findDisconnectedNodes(nodes: Node[], edges: Edge[]): string[] {
  if (nodes.length === 0) return [];
  if (nodes.length === 1) return []; // Single node is valid

  const connectedNodes = new Set<string>();

  for (const edge of edges) {
    connectedNodes.add(edge.source);
    connectedNodes.add(edge.target);
  }

  return nodes.filter((node) => !connectedNodes.has(node.id)).map((n) => n.id);
}

/**
 * Validate edges reference existing nodes
 */
function validateEdges(nodes: Node[], edges: Edge[]): ValidationError[] {
  const nodeIds = new Set(nodes.map((n) => n.id));
  const errors: ValidationError[] = [];

  for (const edge of edges) {
    if (!nodeIds.has(edge.source)) {
      errors.push({
        type: 'invalid_edge',
        message: `Edge source "${edge.source}" does not exist`,
        nodeIds: [edge.source],
      });
    }
    if (!nodeIds.has(edge.target)) {
      errors.push({
        type: 'invalid_edge',
        message: `Edge target "${edge.target}" does not exist`,
        nodeIds: [edge.target],
      });
    }
  }

  return errors;
}

/**
 * Main validation function
 */
export function validateWorkflow(nodes: Node[], edges: Edge[]): ValidationResult {
  const errors: ValidationError[] = [];

  // Check for empty workflow
  if (nodes.length === 0) {
    return { valid: true, errors: [] };
  }

  // Validate edges
  const edgeErrors = validateEdges(nodes, edges);
  errors.push(...edgeErrors);

  if (edgeErrors.length > 0) {
    return { valid: false, errors };
  }

  // Detect cycles
  const graph = buildGraph(nodes, edges);
  const cycles = detectCycles(graph);

  for (const cycle of cycles) {
    errors.push({
      type: 'cycle',
      message: `Circular dependency detected: ${cycle.join(' → ')}`,
      nodeIds: cycle,
    });
  }

  // Find disconnected nodes (warning, not error)
  const disconnected = findDisconnectedNodes(nodes, edges);
  for (const nodeId of disconnected) {
    errors.push({
      type: 'disconnected',
      message: `Node "${nodeId}" is not connected to any other node`,
      nodeIds: [nodeId],
    });
  }

  return {
    valid: errors.filter((e) => e.type === 'cycle' || e.type === 'invalid_edge').length === 0,
    errors,
  };
}

/**
 * Check if adding an edge would create a cycle
 */
export function wouldCreateCycle(
  nodes: Node[],
  edges: Edge[],
  newEdge: { source: string; target: string }
): boolean {
  const testEdges = [...edges, { ...newEdge, id: 'test' }];
  const result = validateWorkflow(nodes, testEdges as Edge[]);
  return result.errors.some((e) => e.type === 'cycle');
}
