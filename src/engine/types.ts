export type CoatColor =
  | 'White'
  | 'Creamy'
  | 'Chestnut'
  | 'Brown'
  | 'Black'
  | 'Gray'
  | 'Dark Brown';

export type CoatPattern =
  | 'None'
  | 'White Stockings'
  | 'Whitefield'
  | 'White Dots'
  | 'Black Dots';

export interface Horse {
  id: string;
  name: string;
  hearts: number; // 7.5 to 15.0
  time100m: number; // seconds to run 100 blocks
  jumpHeight: number; // blocks cleared (1.0 to 5.25)
  coatColor?: CoatColor;
  coatPattern?: CoatPattern;
  sireId?: string | null; // Father
  damId?: string | null;  // Mother
  generation: number;     // 0 for foundation/wild stock, n+1 for bred
  notes?: string;
  createdAt: number;
}

export interface HorseAttributes {
  hp: number;
  speedBps: number;
  speedAttr: number;
  jumpAttr: number;
  overallRating: number;
}

export interface OptimalGoal {
  hearts: number;
  hp: number;
  speedBps: number;
  speedAttr: number;
  time100m: number;
  jumpHeight: number;
  jumpAttr: number;
}

export const ULTIMATE_HORSE_GOAL: OptimalGoal = {
  hearts: 15.0,
  hp: 30.0,
  speedBps: 14.57,
  speedAttr: 0.3375,
  time100m: 6.86,
  jumpHeight: 5.25,
  jumpAttr: 1.0,
};

export interface FoalStatPrediction {
  mean: number;
  min: number;
  max: number;
  probExceedBestParent: number;
  probExceedWorstParent: number;
}

export interface BreedingForecast {
  expectedHearts: number;
  expectedHp: number;
  expectedSpeedBps: number;
  expectedTime100m: number;
  expectedJumpHeight: number;
  potentialMaxSpeedBps: number;
  potentialMaxJumpHeight: number;
  potentialMaxHearts: number;
  probImproveSpeed: number;
  probImproveJump: number;
  probImproveHealth: number;
  colorProbabilities: Record<string, number>;
  patternProbabilities: Record<string, number>;
}

export interface OptimalPairRecommendation {
  parentA: Horse;
  parentB: Horse;
  generationalRelationship: string;
  distanceToGoalReduction: number;
  score: number; // 0 to 100 match score
  forecast: BreedingForecast;
  strategicRationale: string;
}
