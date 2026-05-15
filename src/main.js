import './style.css';

import { computeScale } from './helpers.js';
import { createParticles } from './particles.js';
import {
  createPointer, pointerDown, pointerMove, pointerUp, updatePointer,
} from './pointer.js';
import {
  spawnRipple, updateInteractions, integrateParticles,
} from './physics.js';
import { drawRipples, drawPointerAura, drawParticle } from './render.js';

(() => {
  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d');
  const DPR = Math.min(window.devicePixelRatio || 1, 2);

  let W, H;
  // 画面サイズスケール - 小画面ほど光・力を小さく
  let S = 1;

  function resize() {
    W = canvas.width = innerWidth * DPR;
    H = canvas.height = innerHeight * DPR;
    canvas.style.width = innerWidth + 'px';
    canvas.style.height = innerHeight + 'px';
    S = computeScale(Math.min(innerWidth, innerHeight));
  }
  resize();
  addEventListener('resize', resize);

  // 画面寸法・スケール・DPR を束ねた環境オブジェクト(物理/描画へ渡す)
  const env = { get W() { return W; }, get H() { return H; }, get S() { return S; }, DPR };

  // ===== パーティクル =====
  const particles = createParticles({
    W, H, DPR, scale: S, shortSide: Math.min(innerWidth, innerHeight),
  });

  // ===== ポインタ状態 =====
  const pointer = createPointer(W, H);
  const MOVE_THRESHOLD = 10 * DPR;

  // ===== 波紋 =====
  const ripples = [];

  // ===== ポインタ入力 =====
  function onDown(e) {
    const isMouse = e.pointerType === 'mouse';
    pointerDown(pointer, e.clientX * DPR, e.clientY * DPR, performance.now(), isMouse);
  }
  function onMove(e) {
    const isMouse = e.pointerType === 'mouse';
    pointerMove(pointer, e.clientX * DPR, e.clientY * DPR, isMouse, MOVE_THRESHOLD);
  }
  function onUp(e) {
    const isMouse = e.pointerType === 'mouse';
    const result = pointerUp(pointer, performance.now(), isMouse);
    if (result && result.tap) {
      spawnRipple(ripples, pointer.x, pointer.y, env);
    } else if (result && result.release) {
      const intensity = result.release.holdIntensity;
      spawnRipple(ripples, pointer.x, pointer.y, env, {
        startRadius: 40 * S * DPR,
        maxRadius: Math.min(W, H) * (0.5 + intensity * 0.3),
        speed: (3 + intensity * 3) * S,
        strength: 1 + intensity * 1.5,
      });
    }
  }
  function onLeave() { pointer.hovering = false; }

  window.addEventListener('pointerdown', onDown);
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
  window.addEventListener('pointercancel', onUp);
  window.addEventListener('pointerleave', onLeave);

  // ===== アニメーションループ =====
  function frame(now) {
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';

    updatePointer(pointer, now);
    updateInteractions(particles, pointer, ripples, env);

    drawRipples(ctx, ripples, env);
    drawPointerAura(ctx, pointer, env);

    integrateParticles(particles, W, H);
    for (const p of particles) {
      drawParticle(ctx, p, DPR);
    }

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
