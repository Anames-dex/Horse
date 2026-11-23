import {
  Horse,
  OptimalPairRecommendation,
  ULTIMATE_HORSE_GOAL,
} from './types';
import { forecastBreeding } from './genetics';
import {
  time100mToSpeedAttr,
  jumpHeightToAttr,
  MIN_HEALTH_HP,
  MIN_SPEED_ATTR,
  MIN_JUMP_ATTR,
} from './conversions';

/**
 * Determines the genealogical relationship between two horses across generations.
 */
export function getGenerationalRelationship(
  horseA: Horse,
  horseB: Horse,
  horseMap: Map<string, Horse>
): string {
  // Check direct parent-offspring backcross
  if (horseB.sireId === horseA.id || horseB.damId === horseA.id) {
    return `Direct Backcross: Parent (Gen ${horseA.generation}) × Offspring (Gen ${horseB.generation})`;
  }
  if (horseA.sireId === horseB.id || horseA.damId === horseB.id) {
    return `Direct Backcross: Offspring (Gen ${horseA.generation}) × Parent (Gen ${horseB.generation})`;
  }

  // Check grandparent backcross
  const isGrandparent = (grand: Horse, child: Horse): boolean => {
    const sire = child.sireId ? horseMap.get(child.sireId) : null;
    const dam = child.damId ? horseMap.get(child.damId) : null;
    if (sire && (sire.sireId === grand.id || sire.damId === grand.id)) return true;
    if (dam && (dam.sireId === grand.id || dam.damId === grand.id)) return true;
    return false;
  };

  if (isGrandparent(horseA, horseB)) {
    return `Grandparent Backcross: Gen ${horseA.generation} × Gen ${horseB.generation}`;
  }
  if (isGrandparent(horseB, horseA)) {
    return `Grandparent Backcross: Gen ${horseA.generation} × Gen ${horseB.generation}`;
  }

  // Check sibling / half-sibling
  if (
    (horseA.sireId && horseA.sireId === horseB.sireId) ||
    (horseA.damId && horseA.damId === horseB.damId)
  ) {
    return `Sibling Cross: Gen ${horseA.generation} × Gen ${horseB.generation}`;
  }

  // Cross-generational cross
  if (horseA.generation !== horseB.generation) {
    return `Cross-Generational: Gen ${horseA.generation} × Gen ${horseB.generation}`;
  }

  // Same generation
  if (horseA.generation === 0 && horseB.generation === 0) {
    return 'Foundation Stock Cross (Gen 0 × Gen 0)';
  }

  return `Inter-lineage Cross (Gen ${horseA.generation} × Gen ${horseB.generation})`;
}

/**
 * Evaluates all possible pairings across the entire stable (including all previous generations)
 * and returns strictly the single optimal pair to breed toward the hardcoded Ultimate Goal.
 */
export function findSingleOptimalPair(horses: Horse[]): OptimalPairRecommendation | null {
  if (horses.length < 2) {
    return null;
  }

  const horseMap = new Map<string, Horse>(horses.map((h) => [h.id, h]));

  let bestRecommendation: OptimalPairRecommendation | null = null;
  let highestScore = -Infinity;

  // Evaluate every combination across all available generations
  for (let i = 0; i < horses.length; i++) {
    for (let j = i + 1; j < horses.length; j++) {
      const parentA = horses[i];
      const parentB = horses[j];

      const forecast = forecastBreeding(parentA, parentB);

      // Normalize expected foal metrics to the hardcoded ultimate goal limits [0.0, 1.0]
      const foalHpNorm = (forecast.expectedHp - MIN_HEALTH_HP) / (ULTIMATE_HORSE_GOAL.hp - MIN_HEALTH_HP);
      const foalSpeedNorm =
        (time100mToSpeedAttr(forecast.expectedTime100m) - MIN_SPEED_ATTR) /
        (ULTIMATE_HORSE_GOAL.speedAttr - MIN_SPEED_ATTR);
      const foalJumpNorm =
        (jumpHeightToAttr(forecast.expectedJumpHeight) - MIN_JUMP_ATTR) /
        (ULTIMATE_HORSE_GOAL.jumpAttr - MIN_JUMP_ATTR);

      // Calculate distance to ultimate goal (0 is perfect)
      const distanceToGoal = Math.sqrt(
        Math.pow(1 - foalHpNorm, 2) +
        Math.pow(1 - foalSpeedNorm, 2) +
        Math.pow(1 - foalJumpNorm, 2)
      ) / Math.sqrt(3);

      // Upside potential bonus from 1.20+ spread mechanics
      const upsideBonus =
        (forecast.probImproveSpeed +
          forecast.probImproveJump +
          forecast.probImproveHealth) / 3;

      // Score: 100 is maximum match towards the goal
      const score = Math.max(0, Math.min(100, (1 - distanceToGoal) * 85 + upsideBonus * 15));

      if (Number.isFinite(score) && score > highestScore) {
        highestScore = score;

        const relationship = getGenerationalRelationship(parentA, parentB, horseMap);

        // Synthesize strategic rationale
        let rationale = '';
        if (forecast.expectedSpeedBps >= 13.0 && forecast.expectedJumpHeight >= 4.0) {
          rationale = 'Near-perfect dual mobility cross approaching target speed and jump ceiling.';
        } else if (forecast.expectedSpeedBps >= 12.5) {
          rationale = 'High-velocity pairing with top expected movement speed towards target 14.57 b/s.';
        } else if (forecast.expectedJumpHeight >= 4.2) {
          rationale = 'High-clearance pairing targeting jump threshold exceeding 4.5 blocks.';
        } else {
          rationale = 'Optimal balanced progression pairing to improve overall lineage attributes.';
        }

        bestRecommendation = {
          parentA,
          parentB,
          generationalRelationship: relationship,
          distanceToGoalReduction: Number(((1 - distanceToGoal) * 100).toFixed(1)),
          score: Number(score.toFixed(1)),
          forecast,
          strategicRationale: rationale,
        };
      }
    }
  }

  return bestRecommendation;
}
