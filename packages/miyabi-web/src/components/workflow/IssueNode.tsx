'use client';

import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { IssueNodeData } from '@/lib/types';

interface IssueNodeProps {
  data: IssueNodeData;
  selected?: boolean;
}

function IssueNode({ data, selected }: IssueNodeProps) {
  const statusColor = data.status === 'open' ? 'bg-green-100 border-green-300' : 'bg-gray-100 border-gray-300';

  return (
    <div
      className={`px-4 py-3 border-2 rounded-lg min-w-[150px] ${statusColor} ${
        selected ? 'ring-2 ring-accent ring-offset-2' : ''
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-gray-400"
      />

      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">📋</span>
        <span className="font-semibold text-sm">{data.label}</span>
      </div>

      <div className="text-xs text-muted">
        Issue #{data.issueNumber}
        {data.status && ` • ${data.status}`}
      </div>

      {data.title && (
        <div className="mt-2 text-xs bg-white/50 px-2 py-1 rounded truncate max-w-[200px]">
          {data.title}
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

export default memo(IssueNode);
