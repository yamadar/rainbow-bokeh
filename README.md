# Rainbow Bokeh

ゆらめく色の上で光を集めたり吹き飛ばしたりできるインタラクティブ SPA。

## 起動

```bash
npm install        # リポジトリルートで一度だけ
npm run dev -w rainbow-bokeh
```

`http://localhost:5184/` が自動で開きます。

## ビルド

```bash
npm run build -w rainbow-bokeh
```

## 構成

```
rainbow-bokeh/
├── index.html      # マークアップのみ
├── vite.config.js
├── package.json
└── src/
    ├── main.js     # ロジック（style.css を import）
    └── style.css   # スタイル
```
