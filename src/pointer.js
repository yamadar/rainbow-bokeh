// ===== ポインタ状態マシン =====
// 純粋ロジック。DOM/イベントには触れない。
// 入力イベント(座標)はハンドラから渡され、ここでは状態遷移のみ扱う。

import { STATE, HOLD_TIME, TAP_MAX_TIME } from './config.js';

// 初期ポインタ状態を生成
export function createPointer(W, H) {
  return {
    x: W * 0.5,
    y: H * 0.5,
    lastX: W * 0.5,
    lastY: H * 0.5,
    vx: 0,
    vy: 0,
    state: STATE.IDLE,
    downAt: 0,
    downX: 0,
    downY: 0,
    moved: false,
    holdIntensity: 0,
    hovering: false,
  };
}

// ポインタダウン: 座標を確定し PRESS へ
export function pointerDown(pointer, x, y, now, isMouse) {
  pointer.x = pointer.lastX = pointer.downX = x;
  pointer.y = pointer.lastY = pointer.downY = y;
  pointer.downAt = now;
  pointer.state = STATE.PRESS;
  pointer.moved = false;
  if (!isMouse) pointer.hovering = true;
}

// ポインタムーブ: 座標更新、移動閾値超過で DRAG へ
export function pointerMove(pointer, x, y, isMouse, moveThreshold) {
  pointer.x = x;
  pointer.y = y;
  if (isMouse) pointer.hovering = true;
  if (pointer.state !== STATE.IDLE && !pointer.moved) {
    const dx = pointer.x - pointer.downX,
      dy = pointer.y - pointer.downY;
    if (dx * dx + dy * dy > moveThreshold * moveThreshold) {
      pointer.moved = true;
      pointer.state = STATE.DRAG;
    }
  }
}

// ポインタアップ: 解放結果を返す(波紋生成判断は呼び出し側)。
// 返り値: { tap: bool } | { release: { holdIntensity } } | null
export function pointerUp(pointer, now, isMouse) {
  let result = null;
  if (pointer.state === STATE.PRESS) {
    const elapsed = now - pointer.downAt;
    if (elapsed < TAP_MAX_TIME && !pointer.moved) {
      result = { tap: true };
    }
  } else if (pointer.state === STATE.HOLD) {
    result = { release: { holdIntensity: pointer.holdIntensity } };
  }
  pointer.state = STATE.IDLE;
  pointer.holdIntensity = 0;
  if (!isMouse) pointer.hovering = false;
  return result;
}

// フレーム毎の状態更新: 速度算出、PRESS→HOLD 遷移、HOLD 強度ランプアップ
export function updatePointer(pointer, now) {
  pointer.vx = pointer.x - pointer.lastX;
  pointer.vy = pointer.y - pointer.lastY;
  pointer.lastX = pointer.x;
  pointer.lastY = pointer.y;

  if (pointer.state === STATE.PRESS && now - pointer.downAt > HOLD_TIME) {
    pointer.state = STATE.HOLD;
  }
  if (pointer.state === STATE.HOLD) {
    pointer.holdIntensity = Math.min(1, pointer.holdIntensity + 0.012);
  }
}
