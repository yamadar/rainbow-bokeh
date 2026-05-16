// ===== 物理 / インタラクション更新 =====
// 純粋ロジック。DOM/canvas/window には触れない。
// パーティクル・ポインタ・波紋の配列を引数で受け取り更新する。

import { STATE } from './config.js';

// 波紋を ripples 配列に追加する。
// env: { W, H, S, DPR } 画面寸法・スケール・DPR
export function spawnRipple(ripples, x, y, env, opts = {}) {
  const { W, H, S, DPR } = env;
  ripples.push({
    x,
    y,
    radius: opts.startRadius || 0,
    maxRadius: opts.maxRadius || Math.min(W, H) * 0.55,
    speed: (opts.speed || 4 * S) * DPR,
    life: 1,
    strength: opts.strength || 1,
  });
}

// 引力(長押し): ポインタへパーティクルを集める
export function applyAttraction(particles, pointer, env) {
  const { S, DPR } = env;
  const reach = 320 * S * DPR;
  const reach2 = reach * reach;
  const intensity = pointer.holdIntensity;
  for (const p of particles) {
    const dx = pointer.x - p.x,
      dy = pointer.y - p.y;
    const d2 = dx * dx + dy * dy;
    if (d2 < reach2 && d2 > 1) {
      const d = Math.sqrt(d2);
      const t = 1 - d / reach;
      const force = t * intensity * 0.22;
      p.ix += (dx / d) * force;
      p.iy += (dy / d) * force;
      if (p.boost < t * intensity * 0.55) p.boost = t * intensity * 0.55;
    }
  }
}

// フリック(ドラッグ): ポインタの流れに沿って光を流す
export function applyFlick(particles, pointer, env) {
  const { S, DPR } = env;
  const speed2 = pointer.vx * pointer.vx + pointer.vy * pointer.vy;
  if (speed2 <= 0.3) return;
  const reach = 220 * S * DPR;
  const reach2 = reach * reach;
  for (const p of particles) {
    const dx = p.x - pointer.x,
      dy = p.y - pointer.y;
    const d2 = dx * dx + dy * dy;
    if (d2 < reach2) {
      const t = 1 - Math.sqrt(d2) / reach;
      p.ix += pointer.vx * t * 0.35;
      p.iy += pointer.vy * t * 0.35;
      if (p.boost < t * 0.45) p.boost = t * 0.45;
    }
  }
}

// 波紋の前進・寿命減衰・パーティクルへの押し出しを処理する
export function updateRipples(ripples, particles, env) {
  const { S, DPR } = env;
  for (let i = ripples.length - 1; i >= 0; i--) {
    const r = ripples[i];
    r.radius += r.speed;
    r.life -= 0.011;
    if (r.life <= 0 || r.radius > r.maxRadius) {
      ripples.splice(i, 1);
      continue;
    }
    const thickness = 70 * S * DPR;
    for (const p of particles) {
      const dx = p.x - r.x,
        dy = p.y - r.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const frontDist = Math.abs(dist - r.radius);
      if (frontDist < thickness) {
        const t = 1 - frontDist / thickness;
        const force = t * r.life * 0.9 * r.strength;
        if (dist > 0.5) {
          p.ix += (dx / dist) * force;
          p.iy += (dy / dist) * force;
        }
        const b = t * r.life * 0.75 * r.strength;
        if (p.boost < b) p.boost = b;
      }
    }
  }
}

// フレーム毎のインタラクション総合更新。
// ポインタ速度・状態遷移は updatePointer 側で済んでいる前提。
export function updateInteractions(particles, pointer, ripples, env) {
  if (pointer.state === STATE.HOLD) applyAttraction(particles, pointer, env);
  if (pointer.state === STATE.DRAG) applyFlick(particles, pointer, env);
  updateRipples(ripples, particles, env);
}

// パーティクルの積分(移動・減衰・パルス位相・画面ラップ)
export function integrateParticles(particles, W, H) {
  for (const p of particles) {
    p.x += p.vx + p.ix;
    p.y += p.vy + p.iy;
    p.ix *= 0.93;
    p.iy *= 0.93;
    p.boost *= 0.95;
    p.phase += p.pulseSpeed;

    if (p.x < -p.r) p.x = W + p.r;
    else if (p.x > W + p.r) p.x = -p.r;
    if (p.y < -p.r) p.y = H + p.r;
    else if (p.y > H + p.r) p.y = -p.r;
  }
}
