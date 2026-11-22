import { describe, it, expect } from 'vitest';
import {
  heartsToHp,
  hpToHearts,
  time100mToBps,
  bpsToTime100m,
  jumpAttrToHeight,
  jumpHeightToAttr,
  calculateOverallRating,
} from './conversions';
import { calculate120StatPrediction } from './genetics';
import { findSingleOptimalPair } from './optimizer';
import { Horse } from './types';

describe('Engine Conversions', () => {
  it('converts hearts to HP correctly', () => {
    expect(heartsToHp(7.5)).toBe(15.0);
    expect(heartsToHp(15.0)).toBe(30.0);
    expect(hpToHearts(24.0)).toBe(12.0);
  });

  it('converts 100m time to blocks per second', () => {
    expect(time100mToBps(10.0)).toBe(10.0);
    expect(bpsToTime100m(10.0)).toBe(10.0);
    expect(time100mToBps(8.0)).toBe(12.5);
  });

  it('inverts jump height reliably', () => {
    const originalHeight = 3.5;
    const attr = jumpHeightToAttr(originalHeight);
    const roundtripHeight = jumpAttrToHeight(attr);
    expect(Math.abs(roundtripHeight - originalHeight)).toBeLessThan(0.06);
  });

  it('calculates overall normalized rating', () => {
    const rating = calculateOverallRating(15.0, 6.86, 5.25);
    expect(rating).toBeGreaterThanOrEqual(99.0);
  });
});

describe('Genetics Prediction 1.20+', () => {
  it('computes symmetric midpoint and variance spread', () => {
    const pred = calculate120StatPrediction(20, 24, 15, 30);
    expect(pred.mean).toBe(22);
    expect(pred.min).toBeLessThan(20);
    expect(pred.max).toBeGreaterThan(24);
    expect(pred.probExceedBestParent).toBeGreaterThan(0.05);
    expect(pred.probExceedBestParent).toBeLessThan(0.4);
  });
});

describe('Cross-Generational Optimizer', () => {
  const sampleHorses: Horse[] = [
    {
      id: 'h1',
      name: 'Foundation Sprinter',
      hearts: 12.0,
      time100m: 7.2,
      jumpHeight: 2.5,
      generation: 0,
      createdAt: Date.now(),
    },
    {
      id: 'h2',
      name: 'Foundation Jumper',
      hearts: 11.0,
      time100m: 11.0,
      jumpHeight: 4.8,
      generation: 0,
      createdAt: Date.now(),
    },
    {
      id: 'h3',
      name: 'Gen 1 Hybrid',
      hearts: 13.0,
      time100m: 8.5,
      jumpHeight: 4.0,
      sireId: 'h1',
      damId: 'h2',
      generation: 1,
      createdAt: Date.now(),
    },
  ];

  it('returns strictly a single best pair recommendation considering backcrossing', () => {
    const rec = findSingleOptimalPair(sampleHorses);
    expect(rec).not.toBeNull();
    if (rec) {
      expect(rec.parentA).toBeDefined();
      expect(rec.parentB).toBeDefined();
      expect(rec.score).toBeGreaterThan(0);
      expect(rec.generationalRelationship).toBeDefined();
      // Should recommend pairing high speed with high jump
      const ids = [rec.parentA.id, rec.parentB.id];
      expect(ids).toContain('h1');
    }
  });

  it('returns null if fewer than 2 horses exist', () => {
    expect(findSingleOptimalPair([sampleHorses[0]])).toBeNull();
  });
});
