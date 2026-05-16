import { describe, it, expect } from 'vitest';
import { particleHue, particleLightness, hslToOklch, colorStop } from './color.js';
import {
  HUE_SPREAD_DEG,
  LIGHT_RAMP_MIN,
  LIGHT_RAMP_MAX,
  BG_HARMONY_HUE_FACTOR,
  BG_HARMONY_LIGHT_BOOST,
} from './config.js';

const flags = (o) => ({
  hueSpread: false,
  lightnessRamp: false,
  oklch: false,
  bgHarmony: false,
  hueDrift: false,
  ...o,
});

describe('particleHue', () => {
  it('returns the normalized base hue when hueSpread is off', () => {
    expect(particleHue(flags(), 34, 0.9)).toBe(34);
    expect(particleHue(flags(), 400, 0)).toBe(40);
    expect(particleHue(flags(), -20, 0.5)).toBe(340);
  });
  it('spreads the hue within base ± HUE_SPREAD_DEG when on', () => {
    const f = flags({ hueSpread: true });
    expect(particleHue(f, 100, 0)).toBeCloseTo(100, 10);
    expect(particleHue(f, 100, 1)).toBeCloseTo(100 + HUE_SPREAD_DEG, 10);
    expect(particleHue(f, 100, -1)).toBeCloseTo(100 - HUE_SPREAD_DEG, 10);
  });
  it('compresses the spread when bgHarmony is on', () => {
    const f = flags({ hueSpread: true, bgHarmony: true });
    expect(particleHue(f, 100, 1)).toBeCloseTo(100 + HUE_SPREAD_DEG * BG_HARMONY_HUE_FACTOR, 10);
  });
  it('always returns a hue within [0, 360)', () => {
    const f = flags({ hueSpread: true });
    for (let base = -100; base <= 460; base += 13) {
      for (const seed of [-1, -0.3, 0, 0.7, 1]) {
        const h = particleHue(f, base, seed);
        expect(h).toBeGreaterThanOrEqual(0);
        expect(h).toBeLessThan(360);
      }
    }
  });
});

describe('particleLightness', () => {
  it('returns the fallback unchanged when the ramp is off', () => {
    expect(particleLightness(flags(), 0.5, 75)).toBe(75);
  });
  it('makes large particles darker than small ones when on', () => {
    const f = flags({ lightnessRamp: true });
    expect(particleLightness(f, 0, 0)).toBeCloseTo(LIGHT_RAMP_MAX, 10);
    expect(particleLightness(f, 1, 0)).toBeCloseTo(LIGHT_RAMP_MIN, 10);
    expect(particleLightness(f, 0.2, 0)).toBeGreaterThan(particleLightness(f, 0.8, 0));
  });
  it('lifts lightness by the boost when bgHarmony is on', () => {
    expect(particleLightness(flags({ bgHarmony: true }), 0.5, 70)).toBe(
      70 + BG_HARMONY_LIGHT_BOOST
    );
  });
  it('clamps the result to [0, 100]', () => {
    const f = flags({ lightnessRamp: true, bgHarmony: true });
    expect(particleLightness(f, 0, 0)).toBeLessThanOrEqual(100);
    expect(particleLightness(flags(), 0.5, 250)).toBe(100);
    expect(particleLightness(flags(), 0.5, -50)).toBe(0);
  });
});

describe('hslToOklch', () => {
  it('maps achromatic colors to near-zero chroma', () => {
    expect(hslToOklch(0, 0, 1).C).toBeCloseTo(0, 4);
    expect(hslToOklch(200, 0, 0.5).C).toBeCloseTo(0, 4);
  });
  it('maps white to lightness 1 and black to lightness 0', () => {
    expect(hslToOklch(0, 0, 1).L).toBeCloseTo(1, 3);
    expect(hslToOklch(0, 0, 0).L).toBeCloseTo(0, 3);
  });
  it('matches the known OKLCH value of sRGB red', () => {
    const { L, C, H } = hslToOklch(0, 1, 0.5);
    expect(L).toBeCloseTo(0.628, 2);
    expect(C).toBeCloseTo(0.2577, 2);
    expect(H).toBeCloseTo(29.23, 1);
  });
  it('always returns a hue within [0, 360)', () => {
    for (let h = 0; h < 360; h += 17) {
      const { H } = hslToOklch(h, 1, 0.5);
      expect(H).toBeGreaterThanOrEqual(0);
      expect(H).toBeLessThan(360);
    }
  });
});

describe('colorStop', () => {
  it('emits an hsla() string when oklch is off', () => {
    expect(colorStop(flags(), 34, 100, 70, 0.5)).toBe('hsla(34, 100%, 70%, 0.5)');
  });
  it('clamps saturation and lightness in the hsla output', () => {
    expect(colorStop(flags(), 34, 150, -10, 1)).toBe('hsla(34, 100%, 0%, 1)');
  });
  it('emits an oklch() string when oklch is on', () => {
    expect(colorStop(flags({ oklch: true }), 34, 100, 70, 0.5)).toMatch(
      /^oklch\([\d.]+ [\d.]+ [\d.]+ \/ 0\.5\)$/
    );
  });
});
