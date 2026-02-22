# T003 d-reversi 拡大率ガタつき修正

## 背景

`/app/d-reversi` で拡大率（ズーム）が無操作でもガタガタ変動する。

## 原因

`LogSlider` の 2 つの `useEffect` が制御モード時に競合して無限ループを起こしていた。

- 第1 effect（`ratio` 変化 → `onChangeValue` 呼び出し）
- 第2 effect（`rawValue` 変化 → `setRatio`）

マウント時に `ratio` が `defaultValue`（幾何平均）から初期化され、実際の `rawValue`（zoom=80）とズレるため、両 effect が互いに値を修正し続ける。

## 修正

`useEffect` を廃止し、React のベストプラクティスに従って再実装（`src/components/LogSlider/index.tsx`）。

- 制御モード: `ratio` をレンダー時に `rawValue` から直接導出（state 不使用）
- 非制御モード: `internalRatio` state を保持
- `onChangeValue` はイベントハンドラ内で呼び出す（effect は使わない）

## 結果

テスト 39 件パス。`useEffect` ゼロ。振動ループの根本解決。
