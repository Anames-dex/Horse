import React from 'react';
import { OptimalPairRecommendation, ULTIMATE_HORSE_GOAL, Horse } from '../../engine/types';
import { Heart, Zap, ArrowUp, Sparkles, CheckCircle2 } from 'lucide-react';
import { simulateFoalRoll } from '../../engine/genetics';

interface BestPairSpotlightProps {
  recommendation: OptimalPairRecommendation | null;
  totalHorsesCount: number;
  onSimulateAndAddFoal: (foal: Omit<Horse, 'id' | 'createdAt'>) => void;
  onSelectHorse: (id: string) => void;
}

export const BestPairSpotlight: React.FC<BestPairSpotlightProps> = ({
  recommendation,
  totalHorsesCount,
  onSimulateAndAddFoal,
  onSelectHorse,
}) => {
  if (totalHorsesCount < 2) {
    return (
      <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-center">
        <h3 className="font-semibold text-sm text-zinc-300">
          Selective Breeding Engine Inactive
        </h3>
        <p className="text-xs text-zinc-500 mt-1">
          Register at least two foundation horses to calculate the single optimal breeding pair across generations.
        </p>
      </div>
    );
  }

  if (!recommendation) return null;

  const { parentA, parentB, forecast, generationalRelationship, score, strategicRationale } =
    recommendation;

  const handleSimulate = () => {
    const rolledFoal = simulateFoalRoll(parentA, parentB);
    onSimulateAndAddFoal(rolledFoal);
  };

  return (
    <div className="rounded-2xl bg-zinc-900/90 border border-emerald-500/40 p-5 shadow-2xl shadow-emerald-950/20 backdrop-blur-md relative overflow-hidden">
      {/* Decorative top gradient bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-sky-500 to-emerald-400" />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-400 font-mono text-[11px] font-semibold tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5" /> Optimal Pairing
            </span>
            <span className="text-xs font-mono text-zinc-400">
              {generationalRelationship}
            </span>
          </div>
          <h2 className="text-base font-semibold text-zinc-100 tracking-tight mt-1">
            {parentA.name} &times; {parentB.name}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
              Goal Proximity Score
            </div>
            <div className="text-lg font-mono font-bold text-emerald-400">
              {score}%
            </div>
          </div>
        </div>
      </div>

      {/* Strategic Rationale */}
      <div className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800/80 mb-4 text-xs text-zinc-300">
        <span className="font-semibold text-emerald-400">Analysis: </span>
        {strategicRationale}
      </div>

      {/* Parents Side-by-Side Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        {/* Parent A */}
        <div
          onClick={() => onSelectHorse(parentA.id)}
          className="p-3.5 rounded-xl bg-zinc-950/50 border border-zinc-800 hover:border-zinc-700 cursor-pointer transition"
        >
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-semibold text-zinc-200">{parentA.name}</span>
            <span className="font-mono text-[10px] text-zinc-400 px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800">
              GEN {parentA.generation}
            </span>
          </div>
          <div className="text-[11px] font-mono text-zinc-400 space-y-0.5">
            <div>Health: {parentA.hearts} hearts ({(parentA.hearts * 2).toFixed(1)} HP)</div>
            <div>Speed: {(100 / parentA.time100m).toFixed(2)} b/s ({parentA.time100m}s sprint)</div>
            <div>Jump: {parentA.jumpHeight}m clearance</div>
          </div>
        </div>

        {/* Parent B */}
        <div
          onClick={() => onSelectHorse(parentB.id)}
          className="p-3.5 rounded-xl bg-zinc-950/50 border border-zinc-800 hover:border-zinc-700 cursor-pointer transition"
        >
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-semibold text-zinc-200">{parentB.name}</span>
            <span className="font-mono text-[10px] text-zinc-400 px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800">
              GEN {parentB.generation}
            </span>
          </div>
          <div className="text-[11px] font-mono text-zinc-400 space-y-0.5">
            <div>Health: {parentB.hearts} hearts ({(parentB.hearts * 2).toFixed(1)} HP)</div>
            <div>Speed: {(100 / parentB.time100m).toFixed(2)} b/s ({parentB.time100m}s sprint)</div>
            <div>Jump: {parentB.jumpHeight}m clearance</div>
          </div>
        </div>
      </div>

      {/* Expected Foal Predictions Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3.5 rounded-xl bg-zinc-950/90 border border-zinc-800 mb-4 text-xs font-mono">
        {/* Health */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-zinc-400">
            <Heart className="w-3.5 h-3.5 text-rose-500" />
            <span className="text-[10px] uppercase tracking-wider">Expected Health</span>
          </div>
          <div className="text-sm font-semibold text-zinc-100">
            {forecast.expectedHearts} Hearts
          </div>
          <div className="text-[10px] text-zinc-400">
            {(forecast.probImproveHealth * 100).toFixed(1)}% chance &gt; best parent
          </div>
        </div>

        {/* Speed */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-zinc-400">
            <Zap className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-[10px] uppercase tracking-wider">Expected Speed</span>
          </div>
          <div className="text-sm font-semibold text-zinc-100">
            {forecast.expectedSpeedBps} b/s
          </div>
          <div className="text-[10px] text-sky-400">
            {(forecast.probImproveSpeed * 100).toFixed(1)}% chance &gt; best parent (Max: {forecast.potentialMaxSpeedBps})
          </div>
        </div>

        {/* Jump */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-zinc-400">
            <ArrowUp className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[10px] uppercase tracking-wider">Expected Jump</span>
          </div>
          <div className="text-sm font-semibold text-zinc-100">
            {forecast.expectedJumpHeight}m
          </div>
          <div className="text-[10px] text-amber-400">
            {(forecast.probImproveJump * 100).toFixed(1)}% chance &gt; best parent (Max: {forecast.potentialMaxJumpHeight}m)
          </div>
        </div>
      </div>

      {/* Target Benchmark Comparison Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-zinc-800/80 text-xs">
        <div className="text-zinc-400 font-mono text-[11px]">
          Target Goal: {ULTIMATE_HORSE_GOAL.hearts} Hearts &bull; {ULTIMATE_HORSE_GOAL.speedBps} b/s &bull; {ULTIMATE_HORSE_GOAL.jumpHeight}m Jump
        </div>

        <button
          type="button"
          onClick={handleSimulate}
          className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-950/40"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Simulate Breeding &amp; Register Foal</span>
        </button>
      </div>
    </div>
  );
};
