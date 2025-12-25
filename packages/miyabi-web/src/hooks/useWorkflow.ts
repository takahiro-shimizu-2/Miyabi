'use client';

import { useState, useCallback, useMemo } from 'react';
import type { Node, Edge, Connection, NodeChange, EdgeChange } from '@xyflow/react';
import { applyNodeChanges, applyEdgeChanges, addEdge } from '@xyflow/react';
import { validateWorkflow, wouldCreateCycle } from '@/lib/dag-validator';
import type { Workflow, ValidationResult, AgentNodeData, IssueNodeData, ConditionNodeData, AgentType } from '@/lib/types';

let nodeId = 0;
const getNodeId = () => `node_${nodeId++}`;

export function useWorkflow(initialWorkflow?: Partial<Workflow>) {
  const [nodes, setNodes] = useState<Node[]>(initialWorkflow?.nodes || []);
  const [edges, setEdges] = useState<Edge[]>(initialWorkflow?.edges || []);
  const [workflowName, setWorkflowName] = useState(initialWorkflow?.name || 'New Workflow');

  // Validation result
  const validation = useMemo<ValidationResult>(
    () => validateWorkflow(nodes, edges),
    [nodes, edges]
  );

  // Node changes handler
  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((nds) => applyNodeChanges(changes, nds));
  }, []);

  // Edge changes handler
  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    setEdges((eds) => applyEdgeChanges(changes, eds));
  }, []);

  // Connection handler with cycle detection
  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;

      // Check if this would create a cycle
      if (wouldCreateCycle(nodes, edges, { source: connection.source, target: connection.target })) {
        console.warn('Connection rejected: would create a cycle');
        return;
      }

      setEdges((eds) => addEdge(connection, eds));
    },
    [nodes, edges]
  );

  // Add agent node
  const addAgentNode = useCallback((agentType: AgentType, position?: { x: number; y: number }) => {
    const id = getNodeId();
    const data: AgentNodeData = {
      label: `${agentType.charAt(0).toUpperCase() + agentType.slice(1)} Agent`,
      agentType,
      status: 'pending',
    };

    const newNode: Node = {
      id,
      type: 'agent',
      position: position || { x: 100 + nodes.length * 50, y: 100 + nodes.length * 50 },
      data,
    };

    setNodes((nds) => [...nds, newNode]);
    return id;
  }, [nodes.length]);

  // Add issue node
  const addIssueNode = useCallback((issueNumber: number, title?: string, position?: { x: number; y: number }) => {
    const id = getNodeId();
    const data: IssueNodeData = {
      label: `Issue #${issueNumber}`,
      issueNumber,
      title,
      status: 'open',
    };

    const newNode: Node = {
      id,
      type: 'issue',
      position: position || { x: 100 + nodes.length * 50, y: 100 + nodes.length * 50 },
      data,
    };

    setNodes((nds) => [...nds, newNode]);
    return id;
  }, [nodes.length]);

  // Add condition node
  const addConditionNode = useCallback((condition: string, position?: { x: number; y: number }) => {
    const id = getNodeId();
    const data: ConditionNodeData = {
      label: 'Condition',
      condition,
      trueLabel: 'Yes',
      falseLabel: 'No',
    };

    const newNode: Node = {
      id,
      type: 'condition',
      position: position || { x: 100 + nodes.length * 50, y: 100 + nodes.length * 50 },
      data,
    };

    setNodes((nds) => [...nds, newNode]);
    return id;
  }, [nodes.length]);

  // Update node data
  const updateNodeData = useCallback(<T extends Record<string, unknown>>(nodeId: string, data: Partial<T>) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...data } }
          : node
      )
    );
  }, []);

  // Delete node
  const deleteNode = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
  }, []);

  // Clear workflow
  const clearWorkflow = useCallback(() => {
    setNodes([]);
    setEdges([]);
    nodeId = 0;
  }, []);

  // Export workflow as JSON
  const exportWorkflow = useCallback((): Workflow => {
    return {
      id: crypto.randomUUID(),
      name: workflowName,
      nodes,
      edges,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }, [nodes, edges, workflowName]);

  // Import workflow from JSON
  const importWorkflow = useCallback((workflow: Workflow) => {
    setWorkflowName(workflow.name);
    setNodes(workflow.nodes);
    setEdges(workflow.edges);

    // Update nodeId counter
    const maxId = Math.max(...workflow.nodes.map((n) => {
      const match = n.id.match(/node_(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    }), 0);
    nodeId = maxId + 1;
  }, []);

  return {
    nodes,
    edges,
    workflowName,
    setWorkflowName,
    validation,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addAgentNode,
    addIssueNode,
    addConditionNode,
    updateNodeData,
    deleteNode,
    clearWorkflow,
    exportWorkflow,
    importWorkflow,
  };
}
