/**
 * In-game unit conversions and attribute calculations for Minecraft horses.
 * Derived from Minecraft Java Edition trajectory and movement equations.
 */

export const MIN_HEALTH_HP = 15.0; // 7.5 hearts
export const MAX_HEALTH_HP = 30.0; // 15.0 hearts

export const MIN_SPEED_ATTR = 0.1125;
export const MAX_SPEED_ATTR = 0.3375;
export const SPEED_FACTOR = 43.17; // speed_bps = speed_attr * 43.17

export const MIN_JUMP_ATTR = 0.4;
export const MAX_JUMP_ATTR = 1.0;

export function heartsToHp(hearts: number): number {
  return Number((hearts * 2).toFixed(1));
}

export function hpToHearts(hp: number): number {
  return Number((hp / 2).toFixed(1));
}

export function time100mToBps(timeSec: number): number {
  if (timeSec <= 0) return 0;
  return Number((100 / timeSec).toFixed(2));
}

export function bpsToTime100m(bps: number): number {
  if (bps <= 0) return 0;
  return Number((100 / bps).toFixed(2));
}

export function bpsToSpeedAttr(bps: number): number {
  return bps / SPEED_FACTOR;
}

export function speedAttrToBps(attr: number): number {
  return Number((attr * SPEED_FACTOR).toFixed(2));
}

export function time100mToSpeedAttr(timeSec: number): number {
  const bps = time100mToBps(timeSec);
  return bpsToSpeedAttr(bps);
}

export function speedAttrToTime100m(attr: number): number {
  const bps = speedAttrToBps(attr);
  return bpsToTime100m(bps);
}

/**
 * Converts internal jump_strength attribute (0.4 to 1.0) into approximate jump height in blocks.
 * Polynomial from Minecraft trajectory physics:
 * y = -0.1817584952*x^3 + 3.689713992*x^2 + 2.128599134*x - 0.343930367
 */
export function jumpAttrToHeight(attr: number): number {
  const x = Math.max(MIN_JUMP_ATTR, Math.min(MAX_JUMP_ATTR, attr));
  const height =
    -0.1817584952 * Math.pow(x, 3) +
    3.689713992 * Math.pow(x, 2) +
    2.128599134 * x -
    0.343930367;
  return Number(Math.max(0, height).toFixed(2));
}

/**
 * Inverts jump height in blocks back to internal jump_strength attribute using bisection.
 */
export function jumpHeightToAttr(targetHeight: number): number {
  const hMin = jumpAttrToHeight(MIN_JUMP_ATTR);
  const hMax = jumpAttrToHeight(MAX_JUMP_ATTR);

  if (targetHeight <= hMin) return MIN_JUMP_ATTR;
  if (targetHeight >= hMax) return MAX_JUMP_ATTR;

  let low = MIN_JUMP_ATTR;
  let high = MAX_JUMP_ATTR;
  for (let i = 0; i < 28; i++) {
    const mid = (low + high) / 2;
    if (jumpAttrToHeight(mid) < targetHeight) {
      low = mid;
    } else {
      high = mid;
    }
  }
  return Number(((low + high) / 2).toFixed(4));
}

/**
 * Normalizes horse metrics into an overall performance rating (0 to 100%).
 */
export function calculateOverallRating(hearts: number, time100m: number, jumpHeight: number): number {
  const hp = heartsToHp(hearts);
  const sAttr = time100mToSpeedAttr(time100m);
  const jAttr = jumpHeightToAttr(jumpHeight);

  const hNorm = Math.max(0, Math.min(1, (hp - MIN_HEALTH_HP) / (MAX_HEALTH_HP - MIN_HEALTH_HP)));
  const sNorm = Math.max(0, Math.min(1, (sAttr - MIN_SPEED_ATTR) / (MAX_SPEED_ATTR - MIN_SPEED_ATTR)));
  const jNorm = Math.max(0, Math.min(1, (jAttr - MIN_JUMP_ATTR) / (MAX_JUMP_ATTR - MIN_JUMP_ATTR)));

  return Number((((hNorm + sNorm + jNorm) / 3) * 100).toFixed(1));
}
