import { describe, it, expect } from 'vitest';
import { createPointer, pointerDown, pointerMove, pointerUp, updatePointer } from './pointer.js';
import { STATE, HOLD_TIME, TAP_MAX_TIME } from './config.js';

describe('createPointer', () => {
  it('starts centered and idle', () => {
    const p = createPointer(800, 600);
    expect(p.x).toBe(400);
    expect(p.y).toBe(300);
    expect(p.state).toBe(STATE.IDLE);
    expect(p.holdIntensity).toBe(0);
  });
});

describe('pointerDown', () => {
  it('moves to PRESS and records the down coords', () => {
    const p = createPointer(800, 600);
    pointerDown(p, 120, 240, 1000, true);
    expect(p.state).toBe(STATE.PRESS);
    expect(p.downX).toBe(120);
    expect(p.downY).toBe(240);
    expect(p.downAt).toBe(1000);
    expect(p.moved).toBe(false);
  });
  it('sets hovering true for touch input only', () => {
    const mouse = createPointer(800, 600);
    pointerDown(mouse, 0, 0, 0, true);
    expect(mouse.hovering).toBe(false);
    const touch = createPointer(800, 600);
    pointerDown(touch, 0, 0, 0, false);
    expect(touch.hovering).toBe(true);
  });
});

describe('pointerMove', () => {
  it('transitions PRESS -> DRAG once movement exceeds the threshold', () => {
    const p = createPointer(800, 600);
    pointerDown(p, 100, 100, 0, true);
    pointerMove(p, 105, 100, true, 10); // dist 5 < 10, stays PRESS
    expect(p.state).toBe(STATE.PRESS);
    pointerMove(p, 100, 115, true, 10); // dist 15 > 10
    expect(p.state).toBe(STATE.DRAG);
    expect(p.moved).toBe(true);
  });
  it('does not change state from IDLE', () => {
    const p = createPointer(800, 600);
    pointerMove(p, 999, 999, true, 10);
    expect(p.state).toBe(STATE.IDLE);
  });
});

describe('pointerUp', () => {
  it('reports a tap for a short, still PRESS release', () => {
    const p = createPointer(800, 600);
    pointerDown(p, 50, 50, 0, true);
    const r = pointerUp(p, TAP_MAX_TIME - 1, true);
    expect(r).toEqual({ tap: true });
    expect(p.state).toBe(STATE.IDLE);
  });
  it('does not report a tap when the press was too long', () => {
    const p = createPointer(800, 600);
    pointerDown(p, 50, 50, 0, true);
    const r = pointerUp(p, TAP_MAX_TIME + 1, true);
    expect(r).toBeNull();
  });
  it('reports a release with hold intensity from HOLD state', () => {
    const p = createPointer(800, 600);
    pointerDown(p, 50, 50, 0, true);
    p.state = STATE.HOLD;
    p.holdIntensity = 0.7;
    const r = pointerUp(p, 5000, true);
    expect(r).toEqual({ release: { holdIntensity: 0.7 } });
    expect(p.holdIntensity).toBe(0);
  });
});

describe('updatePointer', () => {
  it('computes per-frame velocity from last position', () => {
    const p = createPointer(800, 600);
    p.x = 410;
    p.y = 290;
    p.lastX = 400;
    p.lastY = 300;
    updatePointer(p, 0);
    expect(p.vx).toBe(10);
    expect(p.vy).toBe(-10);
    expect(p.lastX).toBe(410);
    expect(p.lastY).toBe(290);
  });
  it('transitions PRESS -> HOLD after HOLD_TIME elapses', () => {
    const p = createPointer(800, 600);
    pointerDown(p, 0, 0, 0, true);
    updatePointer(p, HOLD_TIME - 1);
    expect(p.state).toBe(STATE.PRESS);
    updatePointer(p, HOLD_TIME + 1);
    expect(p.state).toBe(STATE.HOLD);
  });
  it('ramps holdIntensity up while held, never exceeding 1', () => {
    const p = createPointer(800, 600);
    p.state = STATE.HOLD;
    for (let i = 0; i < 500; i++) updatePointer(p, 10000);
    expect(p.holdIntensity).toBe(1);
  });
});
