'use client';

import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { ConditionNodeData } from '@/lib/types';

interface ConditionNodeProps {
  data: ConditionNodeData;
  selected?: boolean;
}

function ConditionNode({ data, selected }: ConditionNodeProps) {
  return (
    <div
      className={`px-4 py-3 border-2 rounded-lg min-w-[150px] bg-amber-100 border-amber-300 ${
        selected ? 'ring-2 ring-accent ring-offset-2' : ''
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-gray-400"
      />

      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">❓</span>
        <span className="font-semibold text-sm">{data.label}</span>
      </div>

      <div className="text-xs text-muted font-mono bg-white/50 px-2 py-1 rounded">
        {data.condition}
      </div>

      <div className="flex justify-between mt-2 text-xs">
        <span className="text-green-600">{data.trueLabel || 'Yes'}</span>
        <span className="text-red-600">{data.falseLabel || 'No'}</span>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        id="true"
        className="w-3 h-3 !bg-green-500"
        style={{ left: '25%' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="false"
        className="w-3 h-3 !bg-red-500"
        style={{ left: '75%' }}
      />
    </div>
  );
}

export default memo(ConditionNode);
