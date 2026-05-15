# rainbow-bokeh — アーキテクチャ

ゆらめく色の上で、ポインタ操作により光粒子を集約 / 拡散させるインタラクティブ SPA。Vite 6 / vanilla JS。
`index.html`（マークアップ）→ `src/main.js`（`./style.css` を import）。

## モジュール構成（`src/`）

| ファイル | 役割 | 主な export |
| --- | --- | --- |
| `config.js` | 定数 | `TAU` `BULB_HUE` `STATE` `HOLD_TIME` `TAP_MAX_TIME` `SCALE_*` `*_PARTICLE_*` 等 |
| `helpers.js` | **純粋** | `clamp` `rand` `computeScale` `particleSize` |
| `particles.js` | **純粋**な粒子生成 | `particleCount` `maxRadiusPx` `createParticles` |
| `pointer.js` | **純粋**なポインタ状態機械 | `createPointer` `pointerDown/Move/Up` `updatePointer` |
| `physics.js` | **純粋**な物理更新 | `spawnRipple` `applyAttraction` `applyFlick` `updateRipples` `updateInteractions` `integrateParticles` |
| `render.js` | canvas 描画（`ctx` を引数で受ける） | `drawRipples` `drawPointerAura` `drawParticle` |
| `main.js` | 薄いエントリ（イベント配線・rAF ループ） | — |

## テスト

- `helpers.test.js`(18) `particles.test.js`(7) `pointer.test.js`(11) — 計 36 件。

## 注意点

- 状態機械 `STATE = { IDLE, PRESS, HOLD, DRAG }`。タップ / 長押し / ドラッグを区別。
- 純粋モジュールは `render.js` 以外すべて。`render.js` も import 時 DOM 非依存。

## コマンド

`npm install`（初回）/ `npm run dev` / `npm test` / `npm run build` / `npm run format`
