# T001: Playwright MCPのChromeプロファイル環境セットアップ

## 概要・目的

実装作業中にChromeを直接操作・確認できる環境を整える。
`@playwright/mcp` をMCPサーバーとして設定し、Claude専用のChromeプロファイルを用意する。

- 私（エージェント）がページ操作・スクリーンショット確認などを行える
- ユーザーも同じブラウザウィンドウをリアルタイムで確認できる（`--headed`）
- プロファイルが永続化されるためセッションをまたいで状態が保持される

## 調査結果

### 主なオプション

| オプション | 説明 |
|---|---|
| `--headed` | ブラウザを可視状態で起動 |
| `--browser chrome` | 実際のChromeを使用（Chromiumではなく） |
| `--user-data-dir <path>` | プロファイルを永続化するディレクトリを指定 |
| `--isolated` | セッションをメモリ内に保持（永続化しない） |
| `--storage-state <path>` | ストレージ状態ファイルのパス |

### MCPスコープの選び方

| スコープ | 保存先 | git管理 |
|---|---|---|
| `--scope local` | `~/.claude.json` | ✗（ユーザー固有パスに適切） |
| `--scope project` | `.mcp.json`（プロジェクトルート） | ✓ |

`--user-data-dir` にユーザー固有パスを使うため、`--scope local` を選ぶ。

## セットアップ手順

```bash
# 1. Chromeプロファイル用ディレクトリを作成
mkdir -p ~/.claude/chrome-profile

# 2. Playwright MCPサーバーをlocaleスコープで登録
claude mcp add --scope local playwright -- \
  npx @playwright/mcp@latest \
  --headed \
  --browser chrome \
  --user-data-dir ~/.claude/chrome-profile
```

登録後、`~/.claude.json` の `mcpServers` に以下が追記される：

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": [
        "@playwright/mcp@latest",
        "--headed",
        "--browser",
        "chrome",
        "--user-data-dir",
        "/Users/itok/.claude/chrome-profile"
      ]
    }
  }
}
```

## 現在のステータス

- [x] 調査完了
- [ ] セットアップ実行
- [ ] 動作確認（`browser_navigate` でページ表示）

## 次のアクション

Claude Codeを再起動後、`browser_navigate` ツールで `http://localhost:3000` を開いて動作確認する。
