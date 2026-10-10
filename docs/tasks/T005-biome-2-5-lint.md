# T005: Biome 2.5.15 アップデートで発生した lint エラーへの対応

## 目的
Renovate の PR #1311（`@biomejs/biome` 2.4.12 → 2.5.15）で `npm run lint` が失敗している。ルールごとに設定調整か修正かを決め、lint を通す。

## 調査結果
- 2.4.12 では 221 ファイル、2.5.15 では 714 ファイルがチェック対象になる。2.5 から `.svg` ファイルが lint 対象に加わったため。
- エラー 494 件・警告 2 件の内訳:

| ルール | 件数 | 対象 |
|---|---|---|
| `lint/a11y/noSvgWithoutTitle` (error) | 493 | `src/svg/fa-6.6.0/brands/*.svg` 492件、`src/svg/rss.svg` 1件 |
| `assist/source/organizeImports` (error) | 1 | `typedef.d.ts` の `declare module "*.svg"` 内、import 直後に空行が必要 |
| `lint/style/noDescendingSpecificity` (warning) | 2 | `src/components/Article/style.module.css` 360行・380行 |

- SVG は Font Awesome から取り込んだアセットで、`@svgr/webpack` で React コンポーネント化して使っている。実際に import しているのは `SiteFooter` の 3 ファイルだけ。リンク側に `title` 属性があるので、アクセシブルネームはリンクで確保できている。
- `noDescendingSpecificity` の 2 件は、KaTeX 内の `& > *`（268行）と `details` 内のセレクタを比較した結果で、対象要素が異なるため実害はない。警告なので lint は失敗しない。

## 実装方針（案）
- A. `biome.json` の `files.includes` に `"!**/*.svg"` を追加して SVG を対象外にする。`typedef.d.ts` は `biome check --write` で空行を入れる。（推奨）
- B. `overrides` で `**/*.svg` だけ `noSvgWithoutTitle` を off にする。フォーマッタなど他のチェックは SVG にも掛かる。
- C. 各 SVG に `<title>` を追加する。外部由来のアセットを書き換えることになり、svgr 経由でツールチップも出るので非推奨。

CSS の警告 2 件は今回は触らない。

A を手元で適用して `npx biome check .` が 0 エラー（警告 2 件のみ）になることを確認済み。

## 経過
- 2026-10-10: 調査・方針案を作成。
- 2026-10-10: A で実施し、PR #1311 のブランチ `renovate/biomejs-biome-2.x` に push。

## 結果
`biome.json` の `files.includes` に `"!**/*.svg"` を追加し、`typedef.d.ts` に空行を追加した。`npm run lint` はエラー 0（警告 2 件）で通る。
