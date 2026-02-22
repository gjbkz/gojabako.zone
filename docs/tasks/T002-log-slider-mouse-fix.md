# T002 LogSlider マウス操作バグ修正

## 背景

`LogSlider` コンポーネントでハンドルをマウス操作した際に挙動がおかしいという報告。

## 原因

`rawValue`（`value` prop）監視の `useEffect` 内で `requestAnimationFrame` を使っていたため、
ユーザーがドラッグ中に親が `value` を更新すると RAF が遅れて発火し、
スライダーが前の位置に戻る（スナップバック）現象が起きていた。

フィードバックループの流れ：
1. ユーザードラッグ → `setRatio(newRatio)` → `onChangeValue` 呼び出し
2. 親が `value` prop を更新 → 2つ目の `useEffect` が RAF をスケジュール
3. ユーザーがさらにドラッグ → `setRatio(nextRatio)`
4. RAF 発火 → ステップ2の古い値で `setRatio` → スライダーが戻る

## 修正内容

`src/components/LogSlider/index.tsx`

- RAF を削除して同期更新に変更
- 関数型 `setRatio` で前の値と比較し、差が `1e-9` 未満（ラウンドトリップ誤差レベル）なら更新しない
- `toLogValue(toLinearValue(ratio))` は数学的に `ratio` と一致するため、
  ユーザードラッグ後に親が反射的に `value` を更新してもフィードバックループが起きない

## テスト

`src/components/LogSlider/index.test.ts` を追加。
- `toLinearValue` / `toLogValue` の境界値テスト
- ラウンドトリップ誤差が `1e-9` 未満であることの確認（修正の前提条件）

テストのため、数学関数を `math.ts` へ切り出し、`index.tsx` から re-export する構成に変更した。

## 結果

全39件パス。
