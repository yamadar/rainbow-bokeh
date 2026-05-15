import './style.css';

(()=>{
  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d');
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  let W, H;
  // 画面サイズスケール - 小画面ほど光・力を小さく
  // 基準: 短辺800px 以上で1.0、それ未満で線形縮小、最小0.35
  let S = 1;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  function resize(){
    W = canvas.width = innerWidth * DPR;
    H = canvas.height = innerHeight * DPR;
    canvas.style.width = innerWidth + 'px';
    canvas.style.height = innerHeight + 'px';
    S = clamp(Math.min(innerWidth, innerHeight) / 800, 0.35, 1.0);
  }
  resize();
  addEventListener('resize', resize);

  const TAU = Math.PI * 2;
  const rand = (a,b) => a + Math.random() * (b - a);
  const BULB_HUE = 34;

  // ===== パーティクル =====
  // 個数も画面に合わせて調整(密度過多で白飛びするのを防ぐ)
  const N = Math.round(220 * clamp(S * 1.1, 0.55, 1.0));
  // 最大ボケ径も画面短辺に依存(短辺の約20%まで)
  const MAX_R_PX = Math.min(160, Math.min(innerWidth, innerHeight) * 0.2);
  const particles = Array.from({length: N}, () => {
    const u = Math.random();
    const size = (1.2 + Math.pow(u, 2.4) * MAX_R_PX) * DPR;
    return {
      x: rand(0, W), y: rand(0, H), r: size,
      vx: rand(-0.2, 0.2) * DPR, vy: rand(-0.18, 0.18) * DPR,
      ix: 0, iy: 0,            // 一時的な力(衝撃)
      boost: 0,                // 明度ブースト(減衰)
      phase: rand(0, TAU),
      pulseSpeed: rand(0.004, 0.022),
      pulseDepth: rand(0.25, 0.55),
      lightness: rand(70, 82),
    };
  });

  // ===== ポインタ状態 =====
  const STATE = { IDLE: 0, PRESS: 1, HOLD: 2, DRAG: 3 };
  const pointer = {
    x: W * 0.5, y: H * 0.5,
    lastX: W * 0.5, lastY: H * 0.5,
    vx: 0, vy: 0,
    state: STATE.IDLE,
    downAt: 0, downX: 0, downY: 0,
    moved: false,
    holdIntensity: 0,
    hovering: false,
  };
  const HOLD_TIME = 380;       // ms
  const TAP_MAX_TIME = 280;    // ms
  const MOVE_THRESHOLD = 10 * DPR;

  // ===== 波紋 =====
  const ripples = [];
  function spawnRipple(x, y, opts = {}) {
    ripples.push({
      x, y,
      radius: opts.startRadius || 0,
      maxRadius: opts.maxRadius || Math.min(W, H) * 0.55,
      speed: (opts.speed || 4 * S) * DPR,
      life: 1,
      strength: opts.strength || 1,
    });
  }

  // ===== ポインタ入力 =====
  function onDown(e) {
    const x = e.clientX * DPR, y = e.clientY * DPR;
    pointer.x = pointer.lastX = pointer.downX = x;
    pointer.y = pointer.lastY = pointer.downY = y;
    pointer.downAt = performance.now();
    pointer.state = STATE.PRESS;
    pointer.moved = false;
    if (e.pointerType !== 'mouse') pointer.hovering = true;
  }
  function onMove(e) {
    pointer.x = e.clientX * DPR;
    pointer.y = e.clientY * DPR;
    if (e.pointerType === 'mouse') pointer.hovering = true;
    if (pointer.state !== STATE.IDLE && !pointer.moved) {
      const dx = pointer.x - pointer.downX, dy = pointer.y - pointer.downY;
      if (dx*dx + dy*dy > MOVE_THRESHOLD * MOVE_THRESHOLD) {
        pointer.moved = true;
        pointer.state = STATE.DRAG;
      }
    }
  }
  function onUp(e) {
    if (pointer.state === STATE.PRESS) {
      const elapsed = performance.now() - pointer.downAt;
      if (elapsed < TAP_MAX_TIME && !pointer.moved) {
        // タップ → 静かな波紋
        spawnRipple(pointer.x, pointer.y);
      }
    } else if (pointer.state === STATE.HOLD) {
      // 長押し解放 → 集めた光が解放
      spawnRipple(pointer.x, pointer.y, {
        startRadius: 40 * S * DPR,
        maxRadius: Math.min(W, H) * (0.5 + pointer.holdIntensity * 0.3),
        speed: (3 + pointer.holdIntensity * 3) * S,
        strength: 1 + pointer.holdIntensity * 1.5,
      });
    }
    pointer.state = STATE.IDLE;
    pointer.holdIntensity = 0;
    if (e.pointerType !== 'mouse') pointer.hovering = false;
  }
  function onLeave() { pointer.hovering = false; }

  window.addEventListener('pointerdown', onDown);
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
  window.addEventListener('pointercancel', onUp);
  window.addEventListener('pointerleave', onLeave);

  // ===== 物理 / インタラクション更新 =====
  function updateInteractions(now) {
    // ポインタ速度算出(フレーム単位)
    pointer.vx = pointer.x - pointer.lastX;
    pointer.vy = pointer.y - pointer.lastY;
    pointer.lastX = pointer.x;
    pointer.lastY = pointer.y;

    // PRESS → HOLD 遷移
    if (pointer.state === STATE.PRESS && now - pointer.downAt > HOLD_TIME) {
      pointer.state = STATE.HOLD;
    }
    // HOLD 強度ランプアップ
    if (pointer.state === STATE.HOLD) {
      pointer.holdIntensity = Math.min(1, pointer.holdIntensity + 0.012);
    }

    // --- 引力(長押し): ポインタへ集まる ---
    if (pointer.state === STATE.HOLD) {
      const reach = 320 * S * DPR;
      const reach2 = reach * reach;
      const intensity = pointer.holdIntensity;
      for (const p of particles) {
        const dx = pointer.x - p.x, dy = pointer.y - p.y;
        const d2 = dx*dx + dy*dy;
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

    // --- フリック(ドラッグ): 流れに沿って光を流す ---
    if (pointer.state === STATE.DRAG) {
      const speed2 = pointer.vx * pointer.vx + pointer.vy * pointer.vy;
      if (speed2 > 0.3) {
        const reach = 220 * S * DPR;
        const reach2 = reach * reach;
        for (const p of particles) {
          const dx = p.x - pointer.x, dy = p.y - pointer.y;
          const d2 = dx*dx + dy*dy;
          if (d2 < reach2) {
            const t = 1 - Math.sqrt(d2) / reach;
            p.ix += pointer.vx * t * 0.35;
            p.iy += pointer.vy * t * 0.35;
            if (p.boost < t * 0.45) p.boost = t * 0.45;
          }
        }
      }
    }

    // --- 波紋 ---
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
        const dx = p.x - r.x, dy = p.y - r.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
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

  // ===== 描画 =====
  function drawRipples() {
    for (const r of ripples) {
      const inner = Math.max(0, r.radius - 80 * S * DPR);
      const outer = r.radius + 50 * S * DPR;
      const g = ctx.createRadialGradient(r.x, r.y, inner, r.x, r.y, outer);
      g.addColorStop(0,   `hsla(${BULB_HUE}, 100%, 70%, 0)`);
      g.addColorStop(0.55,`hsla(${BULB_HUE}, 100%, 88%, ${r.life * 0.42 * r.strength})`);
      g.addColorStop(1,   `hsla(${BULB_HUE}, 100%, 70%, 0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(r.x, r.y, outer, 0, TAU);
      ctx.fill();
    }
  }

  function drawPointerAura() {
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
    g.addColorStop(0,   `hsla(${BULB_HUE}, 100%, 92%, ${baseAlpha})`);
    g.addColorStop(0.4, `hsla(${BULB_HUE}, 100%, 78%, ${baseAlpha * 0.4})`);
    g.addColorStop(1,   `hsla(${BULB_HUE}, 100%, 60%, 0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(pointer.x, pointer.y, radius, 0, TAU);
    ctx.fill();
  }

  function drawParticle(p){
    const h = BULB_HUE;
    const l = p.lightness;
    const flicker = (1 - p.pulseDepth) + p.pulseDepth * (0.5 + 0.5 * Math.sin(p.phase));
    const rPx = p.r / DPR;
    const sizeAtten = Math.min(1.0, 3.4 / Math.sqrt(rPx));
    const baseAlpha = Math.min(1, sizeAtten * flicker * 1.15 * (1 + p.boost * 1.8));

    if (rPx < 2.5) {
      const haloR = p.r * 7;
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, haloR);
      g.addColorStop(0,    `hsla(${h}, 100%, 95%, ${baseAlpha})`);
      g.addColorStop(0.15, `hsla(${h}, 100%, ${l+5}%, ${baseAlpha * 0.5})`);
      g.addColorStop(0.5,  `hsla(${h}, 95%, ${l-5}%, ${baseAlpha * 0.08})`);
      g.addColorStop(1,    `hsla(${h}, 90%, ${l-10}%, 0)`);
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
      g.addColorStop(0,    `hsla(${h}, 100%, ${l+8}%, ${baseAlpha})`);
      g.addColorStop(0.35, `hsla(${h}, 100%, ${l}%, ${baseAlpha * 0.65})`);
      g.addColorStop(0.7,  `hsla(${h}, 95%, ${l-8}%, ${baseAlpha * 0.25})`);
      g.addColorStop(1,    `hsla(${h}, 90%, ${l-15}%, 0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, TAU);
      ctx.fill();
    }
  }

  function frame(now){
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';

    updateInteractions(now);
    drawRipples();
    drawPointerAura();

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

      drawParticle(p);
    }

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
