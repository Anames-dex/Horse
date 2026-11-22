import React from 'react';
import { Horse } from '../../engine/types';
import { heartsToHp, time100mToBps } from '../../engine/conversions';
import { getHorseImageUrl } from '../../engine/horseImages';
import { Edit2, Trash2 } from 'lucide-react';

interface HorseCardProps {
  horse: Horse;
  sire?: Horse | null;
  dam?: Horse | null;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const HorseCard: React.FC<HorseCardProps> = ({
  horse,
  sire,
  dam,
  onEdit,
  onDelete,
}) => {
  const hp = heartsToHp(horse.hearts);
  const speedBps = time100mToBps(horse.time100m);

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-3.5 text-xs font-sans">
      <div className="flex items-center gap-3 mb-2.5">
        <div className="w-12 h-12 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center overflow-hidden flex-shrink-0">
          <img
            src={getHorseImageUrl(horse.coatColor)}
            alt=""
            className="w-10 h-10 object-contain"
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm text-zinc-100 truncate">{horse.name}</h4>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700/60">
              Gen {horse.generation}
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 font-mono truncate">
            {horse.coatColor || 'White'} &bull; {horse.coatPattern || 'None'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1.5 py-1.5 px-2 rounded-lg bg-zinc-950 border border-zinc-800 font-mono text-[11px] mb-2.5">
        <div>
          <span className="text-[9px] text-zinc-400 uppercase block">Health</span>
          <span className="font-semibold text-zinc-200">{hp} HP</span>
        </div>
        <div>
          <span className="text-[9px] text-zinc-400 uppercase block">Speed</span>
          <span className="font-semibold text-zinc-200">{speedBps} b/s</span>
        </div>
        <div>
          <span className="text-[9px] text-zinc-400 uppercase block">Jump</span>
          <span className="font-semibold text-zinc-200">{horse.jumpHeight}m</span>
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-zinc-800/60 text-zinc-400 font-mono">
        <div>
          {sire && dam ? (
            <span>{sire.name} &times; {dam.name}</span>
          ) : (
            <span>Foundation Wild</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
              title="Edit"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="p-1 rounded text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 transition"
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
