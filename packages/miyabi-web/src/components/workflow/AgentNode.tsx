'use client';

import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { AgentNodeData } from '@/lib/types';

interface AgentNodeProps {
  data: AgentNodeData;
  selected?: boolean;
}

const agentColors: Record<string, string> = {
  coordinator: 'bg-purple-100 border-purple-300',
  codegen: 'bg-blue-100 border-blue-300',
  review: 'bg-green-100 border-green-300',
  issue: 'bg-yellow-100 border-yellow-300',
  pr: 'bg-orange-100 border-orange-300',
  deployment: 'bg-red-100 border-red-300',
  test: 'bg-cyan-100 border-cyan-300',
};

const statusIcons: Record<string, string> = {
  pending: '⏳',
  running: '🔄',
  completed: '✅',
  failed: '❌',
};

function AgentNode({ data, selected }: AgentNodeProps) {
  const colorClass = agentColors[data.agentType] || 'bg-gray-100 border-gray-300';
  const statusIcon = data.status ? statusIcons[data.status] : '';

  return (
    <div
      className={`px-4 py-3 border-2 rounded-lg min-w-[150px] ${colorClass} ${
        selected ? 'ring-2 ring-accent ring-offset-2' : ''
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-gray-400"
      />

      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">🤖</span>
        <span className="font-semibold text-sm">{data.label}</span>
        {statusIcon && <span>{statusIcon}</span>}
      </div>

      <div className="text-xs text-muted capitalize">{data.agentType} Agent</div>

      {data.issueNumber && (
        <div className="mt-2 text-xs bg-white/50 px-2 py-1 rounded">
          Issue #{data.issueNumber}
        </div>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-gray-400"
      />
    </div>
  );
}

export default memo(AgentNode);
