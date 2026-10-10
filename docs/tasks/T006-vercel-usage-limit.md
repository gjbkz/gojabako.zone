# T006: Vercel の利用上限警告への対策

## 目的
Vercel から「Approaching your limits: Upgrade now to avoid service disruption」が届いた。原因を特定し、アップグレードせずに収まるよう対策する。

## 調査結果
- Hobby プランでは利用量の指標（リクエスト数・関数実行など）は API から取れない（Observability Plus が必要）。デプロイ履歴は取れた。
- 2026-10-10 時点で、直近 100 デプロイが 10/5〜10/10 の 6 日間に収まっていた。preview 92 件・production 8 件で、`renovate/*` ブランチが 86 件。10/10 だけで 58 件。
- main が進むたびに Renovate が開いている約 12 本の PR を全部リベースし、そのたびにプレビューが再ビルドされていた。共有プリセット `github>nlibjs/renovate-config` が `:automergeMinor` を含み、`rebaseWhen` の既定値 `auto` は automerge が有効なブランチを常に最新に保つため。

## 対応
`package.json` の Renovate 設定を変更する。
- `rebaseWhen: "conflicted"`: 競合したときだけリベースする。
- `group:allNonMajor`: major 以外の更新を 1 本の PR にまとめる。
- `schedule: ["before 9am on monday"]`（`Asia/Tokyo`）: PR の作成・更新を週 1 回にする。脆弱性対応の PR はスケジュールの影響を受けない（Renovate の既定）。

## 今後
- PR プレビューは将来 Cloudflare だけで動かし、Vercel は main のデプロイのみにする方針（T007）。それが根本対策で、今回の変更はそれまでのつなぎ。
- `src/proxy.ts` に `matcher` を付けて静的アセットで proxy を起動しない案もあるが、`proxy.ts` は移行で無くなる予定なので見送り。

## 経過
- 2026-10-10: Vercel のデプロイ履歴から原因を Renovate のリベースと特定。Renovate 設定を変更する PR を作成。
