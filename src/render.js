// ===== 描画 =====
// canvas 2D context を使う。main.js からのみ import される(テスト対象外)。
// 配色は color.js のロジックに委譲し、colorCtx で実行時フラグと基準色相を受ける。
// colorCtx = { flags, hue }  (docs/COLOR.md 参照)

import { TAU, STATE } from './config.js';
import { particleHue, particleLightness, colorStop } from './color.js';

// 波紋のグラデーションリングを描画
export function drawRipples(ctx, ripples, env, colorCtx) {
  const { S, DPR } = env;
  const { flags, hue } = colorCtx;
  for (const r of ripples) {
    const inner = Math.max(0, r.radius - 80 * S * DPR);
    const outer = r.radius + 50 * S * DPR;
    const g = ctx.createRadialGradient(r.x, r.y, inner, r.x, r.y, outer);
    g.addColorStop(0, colorStop(flags, hue, 100, 70, 0));
    g.addColorStop(0.55, colorStop(flags, hue, 100, 88, r.life * 0.42 * r.strength));
    g.addColorStop(1, colorStop(flags, hue, 100, 70, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(r.x, r.y, outer, 0, TAU);
    ctx.fill();
  }
}

// ポインタ周辺のオーラを描画
export function drawPointerAura(ctx, pointer, env, colorCtx) {
  const { S, DPR } = env;
  const { flags, hue } = colorCtx;
  if (!pointer.hovering && pointer.state === STATE.IDLE) return;
  let baseAlpha = 0.12;
  let radius = 90 * S * DPR;
  if (pointer.state === STATE.PRESS || pointer.state === STATE.HOLD) {
    baseAlpha = 0.18 + pointer.holdIntensity * 0.45;
    radius = (90 + pointer.holdIntensity * 220) * S * DPR;
  } else if (pointer.state === STATE.DRAG) {
    baseAlpha = 0.28;
    radius = 140 * S * DPR;
  }
  const g = ctx.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, radius);
  g.addColorStop(0, colorStop(flags, hue, 100, 92, baseAlpha));
  g.addColorStop(0.4, colorStop(flags, hue, 100, 78, baseAlpha * 0.4));
  g.addColorStop(1, colorStop(flags, hue, 100, 60, 0));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(pointer.x, pointer.y, radius, 0, TAU);
  ctx.fill();
}

// 単一パーティクルを描画
export function drawParticle(ctx, p, DPR, colorCtx) {
  const { flags, hue } = colorCtx;
  const h = particleHue(flags, hue, p.hueSeed);
  const l = particleLightness(flags, p.sizeU, p.lightness);
  const flicker = 1 - p.pulseDepth + p.pulseDepth * (0.5 + 0.5 * Math.sin(p.phase));
  const rPx = p.r / DPR;
  const sizeAtten = Math.min(1.0, 3.4 / Math.sqrt(rPx));
  const baseAlpha = Math.min(1, sizeAtten * flicker * 1.15 * (1 + p.boost * 1.8));

  if (rPx < 2.5) {
    const haloR = p.r * 7;
    const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, haloR);
    g.addColorStop(0, colorStop(flags, h, 100, 95, baseAlpha));
    g.addColorStop(0.15, colorStop(flags, h, 100, l + 5, baseAlpha * 0.5));
    g.addColorStop(0.5, colorStop(flags, h, 95, l - 5, baseAlpha * 0.08));
    g.addColorStop(1, colorStop(flags, h, 90, l - 10, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(p.x, p.y, haloR, 0, TAU);
    ctx.fill();
    ctx.fillStyle = `rgba(255,245,220,${Math.min(1, baseAlpha)})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r * 0.9, 0, TAU);
    ctx.fill();
  } else {
    const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
    g.addColorStop(0, colorStop(flags, h, 100, l + 8, baseAlpha));
    g.addColorStop(0.35, colorStop(flags, h, 100, l, baseAlpha * 0.65));
    g.addColorStop(0.7, colorStop(flags, h, 95, l - 8, baseAlpha * 0.25));
    g.addColorStop(1, colorStop(flags, h, 90, l - 15, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, TAU);
    ctx.fill();
  }
}
