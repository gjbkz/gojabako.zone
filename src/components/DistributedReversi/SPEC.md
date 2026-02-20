# 分散型リバーシ 仕様書

## コア要件

1. **セル間メッセージだけでリバーシが成立すること** — 盤面を管理する中央制御は持たない
2. **盤面の形が自由であること** — セルの追加・削除で任意の形状にできる
3. **メッセージのやり取りが可視化できること** — どのセルが何を送受信しているか見える

旧実装（Recoil）の継承は必須ではない。上記3点が達成できれば再設計して構わない。

---

## ユーザーができること

| 操作 | 内容 |
|---|---|
| セルをクリック | 自分の色を置き、挟まれたセルをひっくり返す |
| ドラッグ | 盤面をスクロール |
| ズームスライダー | 拡大縮小 |
| フルスクリーン | 全画面表示 |
| 「はじめから」 | 全セルを初期状態にリセット |
| 編集モード ON でセルクリック | セルを追加・削除（盤面形状を変更） |
| 開発モード ON | セル間のTX/RXバッファ件数を矢印で表示 |
| 開発モードの遅延スライダー | 送受信の遅延を調整してゲームをスローモーション化 |
| セルを右クリック | セルを選択（Shift/Ctrl/Metaで複数選択） |
| 選択セルのインスペクタ | 選択セルの state・shared・playerCount を手動変更 |

**既知の制約**:
- 本来のリバーシでは「1枚以上ひっくり返せる手」のみ有効だが、中央制御なしにこれを全セルが合意することは困難なため、どこにでも置ける仕様とする。
- 複数のクリックが同時進行した場合、まれにフリップが欠けることがある。分散システムの限界として許容する。

---

## セルの状態

```ts
type DRPlayerId = number;        // 0〜(playerCount-1) のプレイヤーID
type DRCellState = DRPlayerId | "N";  // "N" = 未着手

interface DRSharedState {
  state: DRPlayerId;    // このセルが「次に置く色」（クリックで +1）
  playerCount: number;  // プレイヤー数（デフォルト2）
}

interface DRCell {
  state: DRCellState;       // 確定した色（"N" or プレイヤーID）
  pending: DRPlayerId | null; // ひっくり返り確定待ちの色（null = 待機なし）
  shared: DRSharedState;    // 隣のセルに伝播する共有状態
}
```

**`state` と `shared.state` の違い**:
- `state` = 盤面に表示される確定した色
- `shared.state` = 「次のクリックで何色を置くか」を示す手番情報。隣接セルへ connect で通知される

---

## メッセージの構造

```ts
interface DRMessage {
  id: string;              // 重複排除用ユニークID
  d: [number, number];     // 発信元からの累積変位（セル境界を渡るたびに更新）
  type: DRMessageType;
  mode: DRMessageMode;     // ルーティング方式
  payload: ...;
  ttl?: number;            // 残り転送回数（未指定 = 無制限）
}
```

### メッセージ種別

| type | payload | 方向 | 用途 |
|---|---|---|---|
| `connect` | `DRSharedState` | 単方向 | 隣接セル発見時に自分の shared を通知 |
| `reversi1` | `DRSharedState` | 伝播→ | ひっくり返し探索（要求） |
| `reversi2` | `DRPlayerId \| null` | ←折返し | ひっくり返し確定または不成立（応答）|
| `setShared` | `DRSharedState` | spread | shared を一括変更（デバッグ用） |

---

## ルーティング

### mode（進む方向）

| mode | 転送ルール |
|---|---|
| `"e"/"n"/"w"/"s"` | 指定方向にまっすぐ転送。隣にセルがなければ終端 |
| `"ne"/"nw"/"sw"/"se"` | 斜め方向。`\|dx\| > \|dy\|` なら水平成分の方向へ、`\|dy\| > \|dx\|` なら垂直成分へ、同じなら空きバッファが少ない方へ送る |
| `"spread"` | 来た方向以外の全方向に拡散（フラッドフィル） |

変位 `d` は TX バッファから RX バッファへ渡るたびに `d += DRAdjacentStep[direction]` で加算される。

### 開封条件（isOpenableDRMessage）

セルはメッセージを受け取っても、**「そのメッセージが自分に向けられている」と判断できる時だけ処理（開封）する**。

```
mode "e"  → dy === 0 && dx > 0  （東に進んだ実績があれば開封）
mode "w"  → dy === 0 && dx < 0
mode "n"  → dx === 0 && dy > 0
mode "s"  → dx === 0 && dy < 0
mode "ne" → dx === dy && dx > 0
mode "nw" → dx === -dy && dx < 0
mode "se" → dx === -dy && dx > 0
mode "sw" → dx === dy && dx < 0
mode "spread" → 常に開封
```

これにより、reversi1 は各セルを「プローブ」として通過しながら、
挟まれているかどうかを各セルが自律的に判断できる。

### 重複排除

各セルはグローバルに「処理済みメッセージIDの集合」を持つ。
同じ ID が届いても2度処理しない。非矩形盤面でのループや、spread の多重到達を防ぐ。

---

## ゲームフロー（クリック時）

### セル A をクリック

```
[1] 全8方向に reversi1 を送信
      payload = A の shared（現在の色情報）
      d = [0,0]、TTL = 未設定（無制限）

[2] 同時に setShared を spread で送信
      payload = shared.state + 1 (mod playerCount)（次のプレイヤーに）

[3] A 自身の state を shared.state に更新
    A 自身の shared.state を +1 に更新
```

### reversi1 の処理（各セル）

```
セル B が reversi1(payload) を受信

  ◆ 開封条件を満たす場合:
    ├─ B.state === payload.state（同じ色）
    │    → reversi2（確定）を発信元方向へ送信
    │      payload: payload.state
    │      TTL: chessboardDistance(msg.d)  ← ちょうど A まで届く距離
    │      → reversi1 はここで終端（転送しない）
    │
    └─ B.state !== payload.state（違う色 or 未着手）
         → B.pending = payload.state にセット
         → reversi1 を次のセルへ転送

  ◆ 転送できない（盤端 or TTL切れ）= 終端処理:
    → reversi2（不成立）を発信元方向へ送信
      payload: null
      TTL: chessboardDistance(msg.d)
    → B.pending を null にクリア
```

### reversi2 の処理（各セル）

```
セル B が reversi2(payload) を受信

  → B.state = payload ?? B.state （nullなら変更なし、DRPlayerIdならひっくり返す）
  → B.pending = null
  → reversi2 を発信元方向へ転送（TTL が許す限り）
```

reversi2 は常に転送される。これにより発信元 A に至るまでの全セルで
pending がクリアされ、確定した色への更新が伝播する。

### 発信元方向の計算（getAnswerDirection）

変位 `d = [dx, dy]` から A への方向を逆算する:

```
dx === 0, dy > 0  → "s"（南へ返す）
dx === 0, dy < 0  → "n"
dx > 0, dy === 0  → "w"
dx < 0, dy === 0  → "e"
dx > 0, dy > 0    → "sw"（斜めの場合）
dx > 0, dy < 0    → "nw"
dx < 0, dy > 0    → "se"
dx < 0, dy < 0    → "ne"
dx === 0, dy === 0 → null（発信元 = 自分なので返さない）
```

### connect の処理

```
セル A の TX バッファが初期化された時（隣接セル B が存在する場合）:
  → connect を B に送信（payload = A の shared）

セル B が connect を受信:
  → B.shared = payload に更新
  ※ connect は転送しない（TTL=1 で1ホップのみ）
```

---

## 状態（Jotai atoms）

### アーキテクチャ方針

- グローバルストア（Provider なし）で管理
- `atomFamily` のキー: `DRCellId`（タプル）は `toDRCellId` でキャッシュ済みなので参照等価が成立する
- URL 同期は Provider の `store` で初期値を設定し、`store.sub` + `useEffect` でURLに書き戻す（外部ライブラリなし）

### Atom 一覧

| atom | 型 | URL同期 | 説明 |
|---|---|---|---|
| `cellAtom(cellId)` | `DRCell \| null` | — | セルごとの状態（atomFamily） |
| `messageBufferAtom(bufferId)` | `DRMessage[]` | — | TX/RX バッファ（atomFamily） |
| `cellListAtom` | `Set<DRCellId>` | `?c=...` | 存在するセルID一覧 |
| `editModeAtom` | `boolean` | — | 編集モード |
| `devModeAtom` | `boolean` | `?dev=1` | 開発モード |
| `txDelayMsAtom` | `number` | `?txd=N` | 送信遅延 ms（デフォルト 20） |
| `rxDelayMsAtom` | `number` | `?rxd=N` | 受信遅延 ms（デフォルト 20） |
| `viewportAtom` | `XYWHZ` | — | ビューポート座標・ズーム |
| `selectedCellsAtom` | `Set<DRCellId>` | — | 右クリック選択中のセルID |
| `pointerPositionAtom` | `[x,y] \| null` | — | マウス座標（px） |
| `draggingAtom` | `AbortController \| null` | — | ドラッグ中フラグ |

### 派生 Atom

| atom | 型 | 説明 |
|---|---|---|
| `viewBoxAtom` | `string` | SVG `viewBox` 属性値（ドラッグ補正込み） |
| `zoomAtom` | `{ z, cx?, cy? }` | ズーム操作（読み書き） |
| `pointeredCellAtom` | `DRCellId \| null` | マウス下のセルID |
| `selectedCellInfoAtom` | `{ map, maxPlayerCount }` | 選択セルの詳細 |

### atomFamily のクリーンアップ

セルが削除された際、`cellAtom` と関連する `messageBufferAtom`（8バッファ）をメモリから解放する:

```ts
cellAtom.setShouldRemove((createdAt, cellId) => !store.get(cellListAtom).has(cellId));
```

---

## ファイル構成（Jotai 実装後）

```
src/components/DistributedReversi/
  index.tsx          # ルートコンポーネント（Provider・URL同期・初期化）
  Board.tsx          # SVG 盤面（ドラッグ・クリック・セル配置）
  Cell.tsx           # セル描画 + TX/RX 可視化（devMode 時）
  Menu.tsx           # コントロールパネル
  CellInspector.tsx  # 選択セル操作パネル（Messenger は削除済み）
  Selector.tsx       # 汎用 <select>（状態管理なし）
  cellList.ts        # セル配置のエンコード/デコード（状態管理なし）
  util.ts            # 型定義・ゲームロジック純関数（状態管理なし）
  jotai.app.ts       # atom 定義（cellAtom, messageBufferAtom 等）
  jotai.send.ts      # メッセージルーティング関数（sendDRMessage, forwardDRMessage）
  useOnConnection.ts # TX バッファ初期化時に connect を送信するフック
  useOnPressCell.ts  # セルクリック時に reversi1 + setShared を送信するフック
  useRx.ts           # RX バッファを delayMs 後に処理するフック
  useTx.ts           # TX バッファを delayMs 後に送信するフック

src/util/jotai/
  callback.ts        # JotaiSelectorOpts 型 + toJotaiSelectorOpts ヘルパー
```

### `JotaiSelectorOpts` の設計

`jotai.send.ts` と `useRx.ts` の関数群は、複数の atom を読み書きする処理を `useAtomCallback` の外に切り出すため、`{ get, set }` を引数で受け取るパターンを維持する:

```ts
// src/util/jotai/callback.ts
import type { Getter, Setter } from "jotai";
export interface JotaiSelectorOpts {
  get: Getter;
  set: Setter;
}
```

`useAtomCallback` の `(get, set) => ...` コールバックがそのまま `JotaiSelectorOpts` として渡せる。

