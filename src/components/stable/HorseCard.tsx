import React from 'react';
import { Horse } from '../../engine/types';
import {
  heartsToHp,
  time100mToBps,
  calculateOverallRating,
} from '../../engine/conversions';
import { Heart, Zap, ArrowUp, Edit2, Trash2 } from 'lucide-react';

interface HorseCardProps {
  horse: Horse;
  sire?: Horse | null;
  dam?: Horse | null;
  isSelected?: boolean;
  onSelect?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onSelectParent?: (parentId: string) => void;
}

export const HorseCard: React.FC<HorseCardProps> = ({
  horse,
  sire,
  dam,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onSelectParent,
}) => {
  const hp = heartsToHp(horse.hearts);
  const speedBps = time100mToBps(horse.time100m);
  const rating = calculateOverallRating(horse.hearts, horse.time100m, horse.jumpHeight);

  return (
    <div
      onClick={onSelect}
      className={`relative rounded-xl border transition-all duration-200 cursor-pointer overflow-hidden p-4 ${
        isSelected
          ? 'bg-zinc-900/90 border-emerald-500 shadow-lg shadow-emerald-950/30 ring-1 ring-emerald-500/50'
          : 'bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/80'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-base text-zinc-100 tracking-tight">
              {horse.name}
            </h3>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700/60">
              GEN {horse.generation}
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5 font-mono">
            {horse.coatColor || 'Unspecified'} &bull; {horse.coatPattern || 'None'}
          </p>
        </div>

        <div className="text-right">
          <div className="text-xs font-mono font-medium text-emerald-400">
            {rating}% Rating
          </div>
          <div className="w-16 h-1.5 bg-zinc-800 rounded-full mt-1 overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full"
              style={{ width: `${Math.min(100, rating)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-3 gap-2 py-2 px-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800/50 mb-3 text-xs">
        {/* Health */}
        <div className="space-y-0.5">
          <div className="flex items-center gap-1 text-zinc-400">
            <Heart className="w-3.5 h-3.5 text-rose-500" />
            <span className="text-[10px] uppercase font-mono tracking-wider">Health</span>
          </div>
          <div className="font-mono font-semibold text-zinc-100">
            {horse.hearts} <span className="text-[10px] text-zinc-400 font-normal">({hp} HP)</span>
          </div>
        </div>

        {/* Speed */}
        <div className="space-y-0.5">
          <div className="flex items-center gap-1 text-zinc-400">
            <Zap className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-[10px] uppercase font-mono tracking-wider">Speed</span>
          </div>
          <div className="font-mono font-semibold text-zinc-100">
            {speedBps} <span className="text-[10px] text-zinc-400 font-normal">b/s</span>
          </div>
        </div>

        {/* Jump */}
        <div className="space-y-0.5">
          <div className="flex items-center gap-1 text-zinc-400">
            <ArrowUp className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[10px] uppercase font-mono tracking-wider">Jump</span>
          </div>
          <div className="font-mono font-semibold text-zinc-100">
            {horse.jumpHeight} <span className="text-[10px] text-zinc-400 font-normal">m</span>
          </div>
        </div>
      </div>

      {/* Lineage Info */}
      {(sire || dam) && (
        <div className="text-[11px] text-zinc-400 font-mono flex items-center gap-2 mb-3 px-1">
          <span className="text-zinc-400">Pedigree:</span>
          {sire && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectParent?.(sire.id);
              }}
              className="text-zinc-300 hover:text-emerald-400 underline decoration-zinc-700 underline-offset-2"
            >
              Sire: {sire.name}
            </button>
          )}
          {sire && dam && <span className="text-zinc-600">&times;</span>}
          {dam && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectParent?.(dam.id);
              }}
              className="text-zinc-300 hover:text-emerald-400 underline decoration-zinc-700 underline-offset-2"
            >
              Dam: {dam.name}
            </button>
          )}
        </div>
      )}

      {/* Notes if present */}
      {horse.notes && (
        <p className="text-[11px] text-zinc-400 line-clamp-1 italic mb-2 px-1">
          {horse.notes}
        </p>
      )}

      {/* Action Row */}
      <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-zinc-800/60">
        {onEdit && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
            title="Edit Horse"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1.5 rounded-md text-zinc-400 hover:text-rose-400 hover:bg-rose-950/30 transition"
            title="Delete Horse"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
