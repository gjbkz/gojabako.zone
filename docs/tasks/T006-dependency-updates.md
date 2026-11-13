# T006: 依存更新PRの統合と移行対応

## 目的・背景

Renovate の未マージPR #1399、#1404、#1406〜#1411 をまとめて取り込める状態にする。Vercel失敗通知を調査した結果、OpenTelemetry の peer dependency 不整合、Jotai 3 の atomFamily 削除、TypeScript 7 の Compiler API・型宣言変更が判明した。

## 方針

- 既存PRと同じ更新先を使用し、Next.js本体の固定は維持する。
- OpenTelemetry関連を互換性のある世代へまとめ、公開APIからimportする。
- atomFamily は Jotai の移行先パッケージを確認して移行する。
- TypeScriptの型チェック更新と既存Compiler API利用を両立する。
- lockfile を再生成し、npm ci、Lint、型・ユニットテスト、production build を確認する。
- ユーザーから上記調査を受けた対応・統合PR作成の指示あり。今回のPRに必要なcommit/pushについてユーザーの明示的な許可を取得済み。

## 結果

- #1399、#1404、#1406〜#1410 の7件相当を統合。#1406のsdk-logs更新先0.223.1は、#1407相当の3.1.1で置き換える。
- OpenTelemetry API 1.10.0 / SDK・core・resources 3.1.1 / transformer 0.301.1 に統一し、直接importするパッケージを直接依存に追加。JsonLogsSerializerを公開エントリからimportする。
- Jotai 3.0.2とjotai-family 1.1.0へ移行。
- Biome 2.6.6が新たに検査するMarkdown・SCSS・YAMLを整形。E2E workflowのcache設定もwith配下に正規化された。
- pre-pushで使うpage-list生成も実行し、既存mainに対する更新日時情報を再生成。
- npm ci成功、npm test成功（型チェック＋178件）、npm run lint成功（CSSのspecificity警告10件）。
- OpenTelemetry SDKからのJSON生成、HTTPエラー通知、exporterのflush待機を2件の追加テストで検証。
- 外部YouTube取得が環境プロキシのCONNECT 403で失敗するため、通常buildはそこで停止。無視対象.cacheに2動画のメタデータの空オブジェクトを一時配置し、外部メタデータのない場合のフォールバックでproduction build成功。キャッシュはコミットしない。
- そのproductionサーバーをChromiumで確認：/、/2024/multi-cloud、/app/mdx、/app/d-reversi が200。分散型リバーシのセル追加・初期化・削除が動作し、pageerrorは0件。
- 実デプロイ結果は統合PRのチェックで確認する。

## TypeScript 7 の調査結果

7.0.2を導入し、記事解析用の従来Compiler APIをnpm aliasで分離する方法も検証。しかしNext.js 16.1.6内部も従来APIを使い、`next.config.ts`の変換が `Cannot read properties of undefined (reading fileExists)` で失敗する。Next.js本体は既存設定で更新対象外のため、今回はTypeScript 5.9.3を維持し、#1411を残す。aliasも最終変更から除外。
