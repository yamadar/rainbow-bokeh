// ===== パーティクル生成 =====
// 純粋関数。DOM/canvas には触れない。寸法・DPR を引数で受け取る。

import { TAU, BASE_PARTICLE_COUNT, MAX_R_CAP, MAX_R_SHORT_FRACTION } from './config.js';
import { clamp, rand, particleSize } from './helpers.js';

// 画面に合わせたパーティクル個数(密度過多で白飛びするのを防ぐ)
export function particleCount(scale) {
  return Math.round(BASE_PARTICLE_COUNT * clamp(scale * 1.1, 0.55, 1.0));
}

// 最大ボケ径 (px)。画面短辺の約 MAX_R_SHORT_FRACTION、上限 MAX_R_CAP。
export function maxRadiusPx(shortSide) {
  return Math.min(MAX_R_CAP, shortSide * MAX_R_SHORT_FRACTION);
}

// パーティクル配列を生成する。
// W, H はキャンバスのデバイスピクセル寸法、DPR は devicePixelRatio。
export function createParticles({ W, H, DPR, scale, shortSide }) {
  const n = particleCount(scale);
  const maxRpx = maxRadiusPx(shortSide);
  return Array.from({ length: n }, () => {
    const u = Math.random();
    const size = particleSize(u, maxRpx) * DPR;
    return {
      x: rand(0, W),
      y: rand(0, H),
      r: size,
      vx: rand(-0.2, 0.2) * DPR,
      vy: rand(-0.18, 0.18) * DPR,
      ix: 0,
      iy: 0, // 一時的な力(衝撃)
      boost: 0, // 明度ブースト(減衰)
      phase: rand(0, TAU),
      pulseSpeed: rand(0.004, 0.022),
      pulseDepth: rand(0.25, 0.55),
      lightness: rand(70, 82), // 明度ランプ OFF 時のフォールバック
      hueSeed: rand(-1, 1), // 案1: 色相オフセットの個体係数 [-1,1)
      sizeU: u, // 案2: サイズ乱数 (明度ランプの入力)
    };
  });
}
