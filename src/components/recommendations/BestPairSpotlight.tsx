import React from 'react';
import { OptimalPairRecommendation, Horse } from '../../engine/types';
import { getHorseImageUrl } from '../../engine/horseImages';
import { simulateFoalRoll } from '../../engine/genetics';

interface BestPairSpotlightProps {
  recommendation: OptimalPairRecommendation | null;
  totalHorsesCount: number;
  onSimulateAndAddFoal: (foal: Omit<Horse, 'id' | 'createdAt'>) => void;
}

export const BestPairSpotlight: React.FC<BestPairSpotlightProps> = ({
  recommendation,
  totalHorsesCount,
  onSimulateAndAddFoal,
}) => {
  if (totalHorsesCount < 2 || !recommendation) {
    return null;
  }

  const { parentA, parentB, forecast, generationalRelationship, score } = recommendation;

  const handleBreed = () => {
    const rolled = simulateFoalRoll(parentA, parentB);
    onSimulateAndAddFoal(rolled);
  };

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/95 p-3.5 shadow-xl text-xs font-sans">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-zinc-800 mb-2.5">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-zinc-100">Optimal Pairing</span>
          <span className="text-[11px] font-mono text-zinc-400">
            {generationalRelationship}
          </span>
        </div>
        <div className="font-mono text-[11px] text-emerald-400">
          Match Score: {score}%
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
        {/* Parent A */}
        <div className="flex items-center gap-2.5 p-2 rounded-lg bg-zinc-950 border border-zinc-800/80">
          <img
            src={getHorseImageUrl(parentA.coatColor)}
            alt=""
            className="w-10 h-10 object-contain flex-shrink-0"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="font-medium text-zinc-200 truncate">{parentA.name}</span>
              <span className="text-[10px] font-mono text-zinc-400">Gen {parentA.generation}</span>
            </div>
            <div className="text-[10px] font-mono text-zinc-400">
              {parentA.hearts} hearts &bull; {(100 / parentA.time100m).toFixed(2)} b/s &bull; {parentA.jumpHeight}m
            </div>
          </div>
        </div>

        {/* Parent B */}
        <div className="flex items-center gap-2.5 p-2 rounded-lg bg-zinc-950 border border-zinc-800/80">
          <img
            src={getHorseImageUrl(parentB.coatColor)}
            alt=""
            className="w-10 h-10 object-contain flex-shrink-0"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="font-medium text-zinc-200 truncate">{parentB.name}</span>
              <span className="text-[10px] font-mono text-zinc-400">Gen {parentB.generation}</span>
            </div>
            <div className="text-[10px] font-mono text-zinc-400">
              {parentB.hearts} hearts &bull; {(100 / parentB.time100m).toFixed(2)} b/s &bull; {parentB.jumpHeight}m
            </div>
          </div>
        </div>
      </div>

      {/* Expected Foal & Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-3 font-mono text-[11px]">
          <span className="text-zinc-400">Expected Foal:</span>
          <span className="text-zinc-200 font-semibold">{forecast.expectedHearts} Hearts</span>
          <span className="text-zinc-600">&bull;</span>
          <span className="text-zinc-200 font-semibold">{forecast.expectedSpeedBps} b/s</span>
          <span className="text-zinc-600">&bull;</span>
          <span className="text-zinc-200 font-semibold">{forecast.expectedJumpHeight}m Jump</span>
        </div>

        <button
          type="button"
          onClick={handleBreed}
          className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition text-xs"
        >
          Breed &amp; Add Foal to Tree
        </button>
      </div>
    </div>
  );
};
