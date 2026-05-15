// ===== 純粋ヘルパー =====
// DOM/canvas/window に一切触れない純粋関数のみ。ユニットテスト対象。

import {
  SCALE_REF, S_MIN, S_MAX,
  MIN_PARTICLE_SIZE, SIZE_DIST_EXPONENT,
} from './config.js';

// 値を [lo, hi] にクランプ
export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// [a, b) 範囲の一様乱数
export const rand = (a, b) => a + Math.random() * (b - a);

// 画面短辺から表示スケール S を算出 ([S_MIN, S_MAX] にクランプ)
// 基準: 短辺 SCALE_REF px 以上で S_MAX、未満で線形縮小、最小 S_MIN
export function computeScale(shortSide) {
  return clamp(shortSide / SCALE_REF, S_MIN, S_MAX);
}

// パーティクルのボケ径を算出。
// u は [0,1) の一様乱数。べき分布で小粒子を多く、大粒子を稀に。
// 返り値は DPR 乗算前のピクセル径。
export function particleSize(u, maxRpx) {
  return MIN_PARTICLE_SIZE + Math.pow(u, SIZE_DIST_EXPONENT) * maxRpx;
}
