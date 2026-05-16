import { describe, it, expect } from 'vitest';
import { particleCount, maxRadiusPx, createParticles } from './particles.js';
import {
  BASE_PARTICLE_COUNT,
  MAX_R_CAP,
  MAX_R_SHORT_FRACTION,
  MIN_PARTICLE_SIZE,
  S_MIN,
  S_MAX,
} from './config.js';

describe('particleCount', () => {
  it('caps the density at the base count for full scale', () => {
    // scale*1.1 clamps to 1.0, so count = round(BASE)
    expect(particleCount(S_MAX)).toBe(BASE_PARTICLE_COUNT);
    expect(particleCount(2)).toBe(BASE_PARTICLE_COUNT);
  });
  it('floors the density for tiny screens (clamp lower bound 0.55)', () => {
    expect(particleCount(S_MIN)).toBe(Math.round(BASE_PARTICLE_COUNT * 0.55));
    expect(particleCount(0)).toBe(Math.round(BASE_PARTICLE_COUNT * 0.55));
  });
  it('never exceeds the base count', () => {
    for (let s = 0; s <= 2; s += 0.05) {
      expect(particleCount(s)).toBeLessThanOrEqual(BASE_PARTICLE_COUNT);
    }
  });
});

describe('maxRadiusPx', () => {
  it('uses the short-side fraction below the cap', () => {
    expect(maxRadiusPx(400)).toBeCloseTo(400 * MAX_R_SHORT_FRACTION, 10);
  });
  it('caps at MAX_R_CAP for large screens', () => {
    expect(maxRadiusPx(100000)).toBe(MAX_R_CAP);
  });
  it('never exceeds the cap', () => {
    for (let s = 0; s <= 5000; s += 100) {
      expect(maxRadiusPx(s)).toBeLessThanOrEqual(MAX_R_CAP);
    }
  });
});

describe('createParticles', () => {
  it('produces the expected count and well-formed particles', () => {
    const ps = createParticles({ W: 1000, H: 800, DPR: 2, scale: S_MAX, shortSide: 800 });
    expect(ps.length).toBe(particleCount(S_MAX));
    for (const p of ps) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(1000);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThanOrEqual(800);
      // radius = particleSize(u,maxR)*DPR, u in [0,1), DPR=2
      expect(p.r).toBeGreaterThanOrEqual(MIN_PARTICLE_SIZE * 2);
      expect(p.ix).toBe(0);
      expect(p.iy).toBe(0);
      expect(p.boost).toBe(0);
      expect(p.lightness).toBeGreaterThanOrEqual(70);
      expect(p.lightness).toBeLessThan(82);
    }
  });
});
