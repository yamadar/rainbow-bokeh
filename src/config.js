// ===== 定数 / 設定 =====
// 純粋な定数のみ。DOM/canvas には一切触れない。

export const TAU = Math.PI * 2;
export const BULB_HUE = 34;

// ポインタ状態マシン
export const STATE = { IDLE: 0, PRESS: 1, HOLD: 2, DRAG: 3 };

// タイミング (ms)
export const HOLD_TIME = 380;
export const TAP_MAX_TIME = 280;

// 画面サイズスケール S の範囲 (短辺 / SCALE_REF px、min..max にクランプ)
export const SCALE_REF = 800;
export const S_MIN = 0.35;
export const S_MAX = 1.0;

// パーティクル
export const BASE_PARTICLE_COUNT = 220;
export const MAX_R_CAP = 160;          // 最大ボケ径の上限 (px)
export const MAX_R_SHORT_FRACTION = 0.2; // 画面短辺に対する最大ボケ径の割合
export const SIZE_DIST_EXPONENT = 2.4;   // サイズ分布のべき指数
export const MIN_PARTICLE_SIZE = 1.2;    // 最小ボケ径 (px, DPR 乗算前)
