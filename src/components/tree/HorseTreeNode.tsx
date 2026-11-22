import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Horse } from '../../engine/types';
import { heartsToHp, time100mToBps } from '../../engine/conversions';
import { getHorseImageUrl } from '../../engine/horseImages';
import { Edit2, Trash2 } from 'lucide-react';

export interface HorseNodeData {
  horse: Horse;
  isOptimalSire?: boolean;
  isOptimalDam?: boolean;
  onEditHorse?: (horse: Horse) => void;
  onDeleteHorse?: (id: string) => void;
}

export const HorseTreeNode: React.FC<NodeProps> = ({ data }) => {
  const nodeData = data as unknown as HorseNodeData;
  const { horse, isOptimalSire, isOptimalDam, onEditHorse, onDeleteHorse } = nodeData;

  const hp = heartsToHp(horse.hearts);
  const speedBps = time100mToBps(horse.time100m);
  const isOptimal = isOptimalSire || isOptimalDam;

  return (
    <div
      className={`relative w-72 rounded-xl border transition-colors shadow-lg p-3 bg-zinc-900 ${
        isOptimal
          ? 'border-emerald-500 ring-1 ring-emerald-500'
          : 'border-zinc-800 hover:border-zinc-700'
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-zinc-600 !w-2.5 !h-2.5 !border-zinc-900"
      />

      {/* Horse Visual & Info Header */}
      <div className="flex items-center gap-3 mb-2.5">
        <div className="w-14 h-14 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center overflow-hidden flex-shrink-0">
          <img
            src={getHorseImageUrl(horse.coatColor)}
            alt={horse.coatColor || 'Horse'}
            className="w-12 h-12 object-contain"
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <h4 className="font-semibold text-sm text-zinc-100 truncate">
              {horse.name}
            </h4>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700/60 flex-shrink-0">
              Gen {horse.generation}
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 font-mono truncate mt-0.5">
            {horse.coatColor || 'White'} &bull; {horse.coatPattern || 'None'}
          </p>
          {isOptimal && (
            <span className="inline-block text-[10px] font-mono text-emerald-400 font-medium mt-0.5">
              {isOptimalSire ? 'Optimal Parent A' : 'Optimal Parent B'}
            </span>
          )}
        </div>
      </div>

      {/* Three Core Stats */}
      <div className="grid grid-cols-3 gap-1.5 py-1.5 px-2 rounded-lg bg-zinc-950 border border-zinc-800 text-[11px] font-mono">
        <div>
          <span className="text-[9px] text-zinc-400 block uppercase">Health</span>
          <span className="font-semibold text-zinc-200">{hp} HP</span>
        </div>
        <div>
          <span className="text-[9px] text-zinc-400 block uppercase">Speed</span>
          <span className="font-semibold text-zinc-200">{speedBps} b/s</span>
        </div>
        <div>
          <span className="text-[9px] text-zinc-400 block uppercase">Jump</span>
          <span className="font-semibold text-zinc-200">{horse.jumpHeight}m</span>
        </div>
      </div>

      {/* Action Row */}
      <div className="flex items-center justify-between pt-2 mt-2 border-t border-zinc-800/60 text-[11px]">
        <span className="text-zinc-400 font-mono text-[10px]">
          {horse.hearts} hearts &bull; {horse.time100m}s sprint
        </span>
        <div className="flex items-center gap-1">
          {onEditHorse && (
            <button
              type="button"
              onClick={() => onEditHorse(horse)}
              className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
              title="Edit"
            >
              <Edit2 className="w-3 h-3" />
            </button>
          )}
          {onDeleteHorse && (
            <button
              type="button"
              onClick={() => onDeleteHorse(horse.id)}
              className="p-1 rounded text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 transition"
              title="Delete"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-zinc-600 !w-2.5 !h-2.5 !border-zinc-900"
      />
    </div>
  );
};
