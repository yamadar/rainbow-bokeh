import { describe, it, expect } from 'vitest';
import { clamp, rand, computeScale, particleSize } from './helpers.js';
import { SCALE_REF, S_MIN, S_MAX, MIN_PARTICLE_SIZE, SIZE_DIST_EXPONENT } from './config.js';

describe('clamp', () => {
  it('returns value unchanged when inside range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });
  it('clamps to lower bound', () => {
    expect(clamp(-3, 0, 10)).toBe(0);
  });
  it('clamps to upper bound', () => {
    expect(clamp(99, 0, 10)).toBe(10);
  });
  it('returns bound exactly at the boundary', () => {
    expect(clamp(0, 0, 10)).toBe(0);
    expect(clamp(10, 0, 10)).toBe(10);
  });
  it('handles negative ranges', () => {
    expect(clamp(-5, -10, -1)).toBe(-5);
    expect(clamp(0, -10, -1)).toBe(-1);
  });
});

describe('rand', () => {
  it('stays within [a, b) for many samples', () => {
    for (let i = 0; i < 2000; i++) {
      const v = rand(2, 7);
      expect(v).toBeGreaterThanOrEqual(2);
      expect(v).toBeLessThan(7);
    }
  });
  it('covers most of the range across many samples', () => {
    let min = Infinity,
      max = -Infinity;
    for (let i = 0; i < 5000; i++) {
      const v = rand(0, 100);
      if (v < min) min = v;
      if (v > max) max = v;
    }
    // with 5000 draws the observed span should fill most of [0,100)
    expect(min).toBeLessThan(5);
    expect(max).toBeGreaterThan(95);
  });
  it('produces the constant a when range is zero-width', () => {
    expect(rand(3, 3)).toBe(3);
  });
});

describe('computeScale', () => {
  it('clamps small screens to S_MIN', () => {
    expect(computeScale(0)).toBe(S_MIN);
    expect(computeScale(100)).toBe(S_MIN);
  });
  it('clamps large screens to S_MAX', () => {
    expect(computeScale(SCALE_REF)).toBe(S_MAX);
    expect(computeScale(SCALE_REF * 3)).toBe(S_MAX);
  });
  it('scales linearly between the bounds', () => {
    // half of SCALE_REF -> 0.5, which is inside [S_MIN, S_MAX]
    expect(computeScale(SCALE_REF / 2)).toBeCloseTo(0.5, 10);
  });
  it('is monotonically non-decreasing in screen size', () => {
    let prev = -Infinity;
    for (let s = 0; s <= 2000; s += 50) {
      const cur = computeScale(s);
      expect(cur).toBeGreaterThanOrEqual(prev);
      prev = cur;
    }
  });
  it('never leaves the [S_MIN, S_MAX] range', () => {
    for (let s = -500; s <= 5000; s += 37) {
      const v = computeScale(s);
      expect(v).toBeGreaterThanOrEqual(S_MIN);
      expect(v).toBeLessThanOrEqual(S_MAX);
    }
  });
});

describe('particleSize', () => {
  const maxR = 160;
  it('returns the minimum size at u = 0', () => {
    expect(particleSize(0, maxR)).toBe(MIN_PARTICLE_SIZE);
  });
  it('returns minimum + maxR at u = 1', () => {
    expect(particleSize(1, maxR)).toBeCloseTo(MIN_PARTICLE_SIZE + maxR, 10);
  });
  it('stays within [min, min+maxR] for all u in [0,1]', () => {
    for (let i = 0; i <= 100; i++) {
      const u = i / 100;
      const size = particleSize(u, maxR);
      expect(size).toBeGreaterThanOrEqual(MIN_PARTICLE_SIZE);
      expect(size).toBeLessThanOrEqual(MIN_PARTICLE_SIZE + maxR);
    }
  });
  it('is monotonically increasing in u', () => {
    let prev = -Infinity;
    for (let i = 0; i <= 100; i++) {
      const size = particleSize(i / 100, maxR);
      expect(size).toBeGreaterThan(prev - 1e-9);
      prev = size;
    }
  });
  it('skews the distribution toward small sizes (power exponent > 1)', () => {
    expect(SIZE_DIST_EXPONENT).toBeGreaterThan(1);
    // at the midpoint u=0.5, a >1 exponent keeps the size below the linear midpoint
    const mid = particleSize(0.5, maxR);
    const linearMid = MIN_PARTICLE_SIZE + maxR * 0.5;
    expect(mid).toBeLessThan(linearMid);
    // sample a uniform u distribution: most particles should be small
    let smallCount = 0;
    const samples = 10000;
    for (let i = 0; i < samples; i++) {
      const size = particleSize(Math.random(), maxR);
      if (size < MIN_PARTICLE_SIZE + maxR * 0.25) smallCount++;
    }
    // u^2.4 < 0.25  =>  u < 0.25^(1/2.4) ≈ 0.561, so ~56% land in the small band
    expect(smallCount / samples).toBeGreaterThan(0.5);
  });
});
