'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ReactFlow,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import AgentNode from '@/components/workflow/AgentNode';
import IssueNode from '@/components/workflow/IssueNode';
import ConditionNode from '@/components/workflow/ConditionNode';
import { useWorkflow } from '@/hooks/useWorkflow';
import { workflowApi } from '@/lib/api-client';
import type { AgentType } from '@/lib/types';

const nodeTypes = {
  agent: AgentNode,
  issue: IssueNode,
  condition: ConditionNode,
};

const agentTypes: AgentType[] = [
  'coordinator',
  'codegen',
  'review',
  'issue',
  'pr',
  'deployment',
  'test',
];

export default function WorkflowCreatePage() {
  const router = useRouter();
  const {
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
    clearWorkflow,
  } = useWorkflow();

  const [showAddPanel, setShowAddPanel] = useState(false);
  const [issueNumber, setIssueNumber] = useState('');
  const [saving, setSaving] = useState(false);

  const handleAddAgent = useCallback((type: AgentType) => {
    addAgentNode(type);
    setShowAddPanel(false);
  }, [addAgentNode]);

  const handleAddIssue = useCallback(() => {
    const num = parseInt(issueNumber, 10);
    if (!isNaN(num) && num > 0) {
      addIssueNode(num);
      setIssueNumber('');
      setShowAddPanel(false);
    }
  }, [addIssueNode, issueNumber]);

  const handleAddCondition = useCallback(() => {
    addConditionNode('status === "success"');
    setShowAddPanel(false);
  }, [addConditionNode]);

  const handleSave = useCallback(async () => {
    if (saving) return;

    setSaving(true);
    try {
      const workflow = await workflowApi.create({
        name: workflowName,
        nodes,
        edges,
      });
      router.push(`/dashboard/workflows/${workflow.id}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save workflow');
    } finally {
      setSaving(false);
    }
  }, [saving, workflowName, nodes, edges, router]);

  return (
    <div className="h-screen w-screen flex flex-col">
      {/* Header */}
      <header className="h-14 border-b border-border bg-white flex items-center px-4 gap-4">
        <Link href="/dashboard/workflows" className="text-muted hover:text-foreground">
          &larr;
        </Link>
        <input
          type="text"
          value={workflowName}
          onChange={(e) => setWorkflowName(e.target.value)}
          className="text-lg font-semibold bg-transparent border-none outline-none"
        />
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          {!validation.valid && (
            <span className="text-sm text-red-500">
              {validation.errors.filter((e) => e.type === 'cycle').length} cycle error(s)
            </span>
          )}
          {validation.errors.filter((e) => e.type === 'disconnected').length > 0 && (
            <span className="text-sm text-amber-500">
              {validation.errors.filter((e) => e.type === 'disconnected').length} disconnected node(s)
            </span>
          )}
        </div>
        <button
          onClick={clearWorkflow}
          className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-gray-50"
        >
          Clear
        </button>
        <button
          onClick={handleSave}
          disabled={!validation.valid || saving}
          className="px-3 py-1.5 text-sm bg-accent text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </header>

      {/* Editor */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          className="bg-background"
        >
          <Controls />
          <MiniMap
            nodeColor={(node) => {
              switch (node.type) {
                case 'agent':
                  return '#3b82f6';
                case 'issue':
                  return '#22c55e';
                case 'condition':
                  return '#f59e0b';
                default:
                  return '#737373';
              }
            }}
          />
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} />

          {/* Add Node Panel */}
          <Panel position="top-left" className="bg-white border border-border rounded-lg shadow-sm p-2">
            <button
              onClick={() => setShowAddPanel(!showAddPanel)}
              className="px-3 py-1.5 text-sm font-medium bg-accent text-white rounded-lg hover:bg-blue-600"
            >
              + Add Node
            </button>

            {showAddPanel && (
              <div className="absolute top-12 left-0 bg-white border border-border rounded-lg shadow-lg p-4 min-w-[250px] z-10">
                <div className="mb-4">
                  <h3 className="text-sm font-semibold mb-2">Agent Nodes</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {agentTypes.map((type) => (
                      <button
                        key={type}
                        onClick={() => handleAddAgent(type)}
                        className="px-2 py-1.5 text-xs border border-border rounded hover:bg-gray-50 capitalize"
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <h3 className="text-sm font-semibold mb-2">Issue Node</h3>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Issue #"
                      value={issueNumber}
                      onChange={(e) => setIssueNumber(e.target.value)}
                      className="flex-1 px-2 py-1 text-sm border border-border rounded"
                    />
                    <button
                      onClick={handleAddIssue}
                      className="px-3 py-1 text-xs border border-border rounded hover:bg-gray-50"
                    >
                      Add
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold mb-2">Condition Node</h3>
                  <button
                    onClick={handleAddCondition}
                    className="w-full px-2 py-1.5 text-xs border border-border rounded hover:bg-gray-50"
                  >
                    Add Condition
                  </button>
                </div>
              </div>
            )}
          </Panel>
        </ReactFlow>

        {/* Validation Errors */}
        {validation.errors.length > 0 && (
          <div className="absolute bottom-4 left-4 bg-white border border-border rounded-lg shadow-lg p-4 max-w-md">
            <h3 className="text-sm font-semibold mb-2">Validation Issues</h3>
            <ul className="text-xs space-y-1">
              {validation.errors.map((error, i) => (
                <li
                  key={i}
                  className={`flex items-center gap-2 ${
                    error.type === 'cycle' ? 'text-red-600' : 'text-amber-600'
                  }`}
                >
                  <span>{error.type === 'cycle' ? '❌' : '⚠️'}</span>
                  <span>{error.message}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
