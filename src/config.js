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
export const MAX_R_CAP = 160; // 最大ボケ径の上限 (px)
export const MAX_R_SHORT_FRACTION = 0.2; // 画面短辺に対する最大ボケ径の割合
export const SIZE_DIST_EXPONENT = 2.4; // サイズ分布のべき指数
export const MIN_PARTICLE_SIZE = 1.2; // 最小ボケ径 (px, DPR 乗算前)

// ===== 配色 (docs/COLOR.md の適用案。実行時に切替可) =====
// 各フラグ = 適用案の ON/OFF。main.js がこの既定値を複製して可変フラグにする。
export const COLOR_FLAGS = {
  hueSpread: true, // 案1: 粒子ごとにアナロガス色相幅を持たせる
  lightnessRamp: true, // 案2: サイズと相関した明度ランプ
  oklch: true, // 案3: グラデーションを OKLCH で出力
  bgHarmony: true, // 案4: 色相幅を圧縮し明度を持ち上げ背景と調和
  hueDrift: true, // 案5: 基準色相を緩やかに周回
};
export const HUE_SPREAD_DEG = 26; // 案1: 基準色相 ± この角度
export const LIGHT_RAMP_MIN = 60; // 案2: 最大粒子の明度 (%)
export const LIGHT_RAMP_MAX = 93; // 案2: 最小粒子の明度 (%)
export const HUE_DRIFT_SPEED = 0.0024; // 案5: 色相回転速度 (deg/ms)
export const BG_HARMONY_HUE_FACTOR = 0.45; // 案4: 色相幅の圧縮率
export const BG_HARMONY_LIGHT_BOOST = 8; // 案4: 明度の持ち上げ (%)
