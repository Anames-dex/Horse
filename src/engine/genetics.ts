import {
  Horse,
  BreedingForecast,
  FoalStatPrediction,
  CoatColor,
  CoatPattern,
} from './types';
import {
  MIN_HEALTH_HP,
  MAX_HEALTH_HP,
  MIN_SPEED_ATTR,
  MAX_SPEED_ATTR,
  MIN_JUMP_ATTR,
  MAX_JUMP_ATTR,
  heartsToHp,
  hpToHearts,
  time100mToSpeedAttr,
  speedAttrToBps,
  speedAttrToTime100m,
  jumpHeightToAttr,
  jumpAttrToHeight,
} from './conversions';

/**
 * Irwin-Hall cumulative distribution function for n=3 uniform random variables U(0,1).
 * Used for closed-form exact probabilities without Monte Carlo noise.
 */
export function irwinHall3Cdf(s: number): number {
  if (s <= 0) return 0;
  if (s >= 3) return 1;
  if (s <= 1) return Math.pow(s, 3) / 6;
  if (s <= 2) return (Math.pow(s, 3) - 3 * Math.pow(s - 1, 3)) / 6;
  return (Math.pow(s, 3) - 3 * Math.pow(s - 1, 3) + 3 * Math.pow(s - 2, 3)) / 6;
}

/**
 * Calculates exact statistical expectations and upside probabilities for a single attribute.
 */
export function calculate120StatPrediction(
  valA: number,
  valB: number,
  minLimit: number,
  maxLimit: number
): FoalStatPrediction {
  const midpoint = (valA + valB) / 2;
  const range = maxLimit - minLimit;
  const spread = Math.abs(valA - valB) + 0.3 * range;

  const bestParent = Math.max(valA, valB);
  const worstParent = Math.min(valA, valB);

  const rawMin = midpoint - 0.5 * spread;
  const rawMax = midpoint + 0.5 * spread;
  const actualMin = Math.max(minLimit, Math.min(maxLimit, rawMin));
  const actualMax = Math.max(minLimit, Math.min(maxLimit, rawMax));
  const mean = Math.max(minLimit, Math.min(maxLimit, midpoint));

  const probExceed = (target: number): number => {
    if (target <= actualMin) return 1;
    if (target >= actualMax) return 0;
    if (spread <= 1e-7) return midpoint >= target ? 1 : 0;

    const reqRoll = (target - midpoint) / spread;
    const reqS = 3 * (reqRoll + 0.5);
    const cdf = irwinHall3Cdf(reqS);
    return Math.max(0, Math.min(1, 1 - cdf));
  };

  return {
    mean: Number(mean.toFixed(4)),
    min: Number(actualMin.toFixed(4)),
    max: Number(actualMax.toFixed(4)),
    probExceedBestParent: Number(probExceed(bestParent).toFixed(4)),
    probExceedWorstParent: Number(probExceed(worstParent).toFixed(4)),
  };
}

export function calculateCoatProbabilities(
  parentA: Horse,
  parentB: Horse
): { colors: Record<string, number>; patterns: Record<string, number> } {
  const allColors: CoatColor[] = [
    'White',
    'Creamy',
    'Chestnut',
    'Brown',
    'Black',
    'Gray',
    'Dark Brown',
  ];
  const allPatterns: CoatPattern[] = [
    'None',
    'White Stockings',
    'Whitefield',
    'White Dots',
    'Black Dots',
  ];

  const colorA = parentA.coatColor || 'White';
  const colorB = parentB.coatColor || 'White';

  const colors: Record<string, number> = {};
  for (const c of allColors) {
    colors[c] = (1 / 9) / allColors.length;
  }
  colors[colorA] = (colors[colorA] || 0) + 4 / 9;
  colors[colorB] = (colors[colorB] || 0) + 4 / 9;

  const patternA = parentA.coatPattern || 'None';
  const patternB = parentB.coatPattern || 'None';

  const patterns: Record<string, number> = {};
  for (const p of allPatterns) {
    patterns[p] = (1 / 9) / allPatterns.length;
  }
  patterns[patternA] = (patterns[patternA] || 0) + 4 / 9;
  patterns[patternB] = (patterns[patternB] || 0) + 4 / 9;

  return { colors, patterns };
}

export function forecastBreeding(parentA: Horse, parentB: Horse): BreedingForecast {
  const hpA = heartsToHp(parentA.hearts);
  const hpB = heartsToHp(parentB.hearts);
  const hPred = calculate120StatPrediction(hpA, hpB, MIN_HEALTH_HP, MAX_HEALTH_HP);

  const speedA = time100mToSpeedAttr(parentA.time100m);
  const speedB = time100mToSpeedAttr(parentB.time100m);
  const sPred = calculate120StatPrediction(speedA, speedB, MIN_SPEED_ATTR, MAX_SPEED_ATTR);

  const jumpA = jumpHeightToAttr(parentA.jumpHeight);
  const jumpB = jumpHeightToAttr(parentB.jumpHeight);
  const jPred = calculate120StatPrediction(jumpA, jumpB, MIN_JUMP_ATTR, MAX_JUMP_ATTR);

  const { colors, patterns } = calculateCoatProbabilities(parentA, parentB);

  return {
    expectedHearts: hpToHearts(hPred.mean),
    expectedHp: Number(hPred.mean.toFixed(1)),
    expectedSpeedBps: speedAttrToBps(sPred.mean),
    expectedTime100m: speedAttrToTime100m(sPred.mean),
    expectedJumpHeight: jumpAttrToHeight(jPred.mean),
    potentialMaxSpeedBps: speedAttrToBps(sPred.max),
    potentialMaxJumpHeight: jumpAttrToHeight(jPred.max),
    potentialMaxHearts: hpToHearts(hPred.max),
    probImproveSpeed: sPred.probExceedBestParent,
    probImproveJump: jPred.probExceedBestParent,
    probImproveHealth: hPred.probExceedBestParent,
    colorProbabilities: colors,
    patternProbabilities: patterns,
  };
}

export function simulateFoalRoll(parentA: Horse, parentB: Horse): Omit<Horse, 'id' | 'createdAt'> {
  const rollStat = (valA: number, valB: number, minL: number, maxL: number): number => {
    const midpoint = (valA + valB) / 2;
    const spread = Math.abs(valA - valB) + 0.3 * (maxL - minL);
    const roll = (Math.random() + Math.random() + Math.random()) / 3 - 0.5;
    return Math.max(minL, Math.min(maxL, midpoint + spread * roll));
  };

  const hp = rollStat(heartsToHp(parentA.hearts), heartsToHp(parentB.hearts), MIN_HEALTH_HP, MAX_HEALTH_HP);
  const speed = rollStat(
    time100mToSpeedAttr(parentA.time100m),
    time100mToSpeedAttr(parentB.time100m),
    MIN_SPEED_ATTR,
    MAX_SPEED_ATTR
  );
  const jump = rollStat(
    jumpHeightToAttr(parentA.jumpHeight),
    jumpHeightToAttr(parentB.jumpHeight),
    MIN_JUMP_ATTR,
    MAX_JUMP_ATTR
  );

  const rColor = Math.random();
  let coatColor = parentA.coatColor;
  if (rColor < 4 / 9) coatColor = parentA.coatColor;
  else if (rColor < 8 / 9) coatColor = parentB.coatColor;
  else {
    const list: CoatColor[] = ['White', 'Creamy', 'Chestnut', 'Brown', 'Black', 'Gray', 'Dark Brown'];
    coatColor = list[Math.floor(Math.random() * list.length)];
  }

  const rPat = Math.random();
  let coatPattern = parentA.coatPattern;
  if (rPat < 4 / 9) coatPattern = parentA.coatPattern;
  else if (rPat < 8 / 9) coatPattern = parentB.coatPattern;
  else {
    const list: CoatPattern[] = ['None', 'White Stockings', 'Whitefield', 'White Dots', 'Black Dots'];
    coatPattern = list[Math.floor(Math.random() * list.length)];
  }

  const nextGen = Math.max(parentA.generation || 0, parentB.generation || 0) + 1;

  return {
    name: `Foal of ${parentA.name} & ${parentB.name}`,
    hearts: hpToHearts(hp),
    time100m: speedAttrToTime100m(speed),
    jumpHeight: jumpAttrToHeight(jump),
    coatColor,
    coatPattern,
    sireId: parentA.id,
    damId: parentB.id,
    generation: nextGen,
    notes: `Bred from ${parentA.name} (Gen ${parentA.generation}) and ${parentB.name} (Gen ${parentB.generation})`,
  };
}
