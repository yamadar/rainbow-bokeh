// ===== 配色ロジック (docs/COLOR.md の適用案を実装) =====
// 純粋関数。DOM/canvas/window に一切触れない。Vitest 対象。

import {
  HUE_SPREAD_DEG,
  LIGHT_RAMP_MIN,
  LIGHT_RAMP_MAX,
  BG_HARMONY_HUE_FACTOR,
  BG_HARMONY_LIGHT_BOOST,
} from './config.js';
import { clamp } from './helpers.js';

// 案1 + 案4: 粒子の色相を算出。
// base は基準色相(deg)、seed は粒子固有の [-1,1)。
// hueSpread が ON のとき基準 ± HUE_SPREAD_DEG に散らす。
// bgHarmony が ON のときは色相幅を圧縮して背景と調和させる。
export function particleHue(flags, base, seed) {
  if (!flags.hueSpread) return ((base % 360) + 360) % 360;
  const spread = HUE_SPREAD_DEG * (flags.bgHarmony ? BG_HARMONY_HUE_FACTOR : 1);
  return (((base + seed * spread) % 360) + 360) % 360;
}

// 案2 + 案4: 粒子の明度(%)を算出。
// sizeU は [0,1) のサイズ乱数(大きいほど大粒子)。
// lightnessRamp が ON のとき大粒子ほど暗く落ち着かせる。
// fallback はランプ OFF 時に使う元の明度。
// bgHarmony が ON のとき全体を高明度側へ持ち上げる。
export function particleLightness(flags, sizeU, fallback) {
  let l = flags.lightnessRamp
    ? LIGHT_RAMP_MAX - clamp(sizeU, 0, 1) * (LIGHT_RAMP_MAX - LIGHT_RAMP_MIN)
    : fallback;
  if (flags.bgHarmony) l += BG_HARMONY_LIGHT_BOOST;
  return clamp(l, 0, 100);
}

// --- HSL -> OKLCH 変換 (Björn Ottosson の OKLab を使用) ---

// HSL(h:deg, s/l:0..1) -> sRGB(0..1)
function hslToRgb(h, s, l) {
  h = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r, g, b;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return [r + m, g + m, b + m];
}

const srgbToLinear = (u) => (u <= 0.04045 ? u / 12.92 : Math.pow((u + 0.055) / 1.055, 2.4));

// HSL(h:deg, s/l:0..1) -> OKLCH { L:0..1, C, H:deg }
export function hslToOklch(h, s, l) {
  let [r, g, b] = hslToRgb(h, clamp(s, 0, 1), clamp(l, 0, 1));
  r = srgbToLinear(r);
  g = srgbToLinear(g);
  b = srgbToLinear(b);
  const lc = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const mc = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const sc = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;
  const l_ = Math.cbrt(lc),
    m_ = Math.cbrt(mc),
    s_ = Math.cbrt(sc);
  const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
  const A = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
  const B = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;
  let H = (Math.atan2(B, A) * 180) / Math.PI;
  if (H < 0) H += 360;
  return { L, C: Math.hypot(A, B), H };
}

// 案3: グラデーションストップの色文字列を返す。
// h:HSL色相(deg)、s,l:HSL彩度/明度(%)、a:アルファ(0..1)。
// oklch が ON なら OKLCH 文字列(知覚均等で補間が濁らない)、OFF なら hsla 文字列。
export function colorStop(flags, h, s, l, a) {
  s = clamp(s, 0, 100);
  l = clamp(l, 0, 100);
  if (!flags.oklch) return `hsla(${h}, ${s}%, ${l}%, ${a})`;
  const { L, C, H } = hslToOklch(h, s / 100, l / 100);
  return `oklch(${L.toFixed(4)} ${C.toFixed(4)} ${H.toFixed(2)} / ${a})`;
}
