import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Horse } from '../../engine/types';
import { heartsToHp, time100mToBps, calculateOverallRating } from '../../engine/conversions';
import { Heart, Zap, ArrowUp } from 'lucide-react';

export interface HorseNodeData {
  horse: Horse;
  isOptimalSire?: boolean;
  isOptimalDam?: boolean;
  onSelectHorse?: (id: string) => void;
}

export const HorseTreeNode: React.FC<NodeProps> = ({ data }) => {
  const nodeData = data as unknown as HorseNodeData;
  const { horse, isOptimalSire, isOptimalDam, onSelectHorse } = nodeData;

  const hp = heartsToHp(horse.hearts);
  const speedBps = time100mToBps(horse.time100m);
  const rating = calculateOverallRating(horse.hearts, horse.time100m, horse.jumpHeight);

  const isOptimal = isOptimalSire || isOptimalDam;

  return (
    <div
      onClick={() => onSelectHorse?.(horse.id)}
      className={`relative w-64 rounded-xl border transition-all duration-200 cursor-pointer shadow-xl p-3.5 backdrop-blur-md ${
        isOptimal
          ? 'bg-zinc-900/95 border-emerald-400 ring-2 ring-emerald-500/80 shadow-emerald-950/60'
          : 'bg-zinc-900/90 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900'
      }`}
    >
      {/* Target handle at top for parent incoming connections */}
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-zinc-600 !w-2.5 !h-2.5 !border-zinc-900"
      />

      {/* Header */}
      <div className="flex items-start justify-between gap-1 mb-2">
        <div className="truncate">
          <div className="flex items-center gap-1.5">
            <h4 className="font-semibold text-sm text-zinc-100 truncate tracking-tight">
              {horse.name}
            </h4>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 border border-zinc-700/60">
              G{horse.generation}
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 font-mono truncate">
            {horse.coatColor || 'White'} &bull; {horse.coatPattern || 'None'}
          </p>
        </div>

        {/* Rating */}
        <div className="text-right flex-shrink-0">
          <span className="text-xs font-mono font-medium text-emerald-400">
            {rating}%
          </span>
        </div>
      </div>

      {/* Stat Grid */}
      <div className="grid grid-cols-3 gap-1.5 py-1.5 px-2 rounded-lg bg-zinc-950/70 border border-zinc-800/60 text-[11px] font-mono">
        {/* Health */}
        <div className="space-y-0.5">
          <div className="flex items-center gap-0.5 text-zinc-400">
            <Heart className="w-3 h-3 text-rose-500" />
            <span className="text-[9px] uppercase">HP</span>
          </div>
          <div className="font-semibold text-zinc-200">{hp}</div>
        </div>

        {/* Speed */}
        <div className="space-y-0.5">
          <div className="flex items-center gap-0.5 text-zinc-400">
            <Zap className="w-3 h-3 text-sky-400" />
            <span className="text-[9px] uppercase">BPS</span>
          </div>
          <div className="font-semibold text-zinc-200">{speedBps}</div>
        </div>

        {/* Jump */}
        <div className="space-y-0.5">
          <div className="flex items-center gap-0.5 text-zinc-400">
            <ArrowUp className="w-3 h-3 text-amber-400" />
            <span className="text-[9px] uppercase">JUMP</span>
          </div>
          <div className="font-semibold text-zinc-200">{horse.jumpHeight}m</div>
        </div>
      </div>

      {/* Optimal Match Tag Badge */}
      {isOptimal && (
        <div className="mt-2 text-center py-0.5 px-2 rounded bg-emerald-950/80 border border-emerald-500/50 text-[10px] font-mono text-emerald-300 font-medium">
          {isOptimalSire ? 'Optimal Parent A' : 'Optimal Parent B'}
        </div>
      )}

      {/* Source handle at bottom for connections to offspring */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-zinc-600 !w-2.5 !h-2.5 !border-zinc-900"
      />
    </div>
  );
};
