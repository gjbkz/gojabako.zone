# disabledなフォーム要素はsubmitされない

Reactだとたいていの`<form>`でsubmitをpreventDefaultするので意識しないのですが、Next.jsは[API Routes](https://nextjs.org/docs/api-routes/introduction)があるので`<form>`のactionでそこに繋ぐことがあります。

このときユーザーに操作させない要素をdisabledにすることがあるのですが、操作を無効にする以外のdisabled属性の作用についてよく知らなかったのでその実験をしました。

## disabledなフォーム要素

`<input>`の値を保護しようとしてdisabledを設定すると、値が足らずサーバーがBadRequestを返すようになりました。足りていない値を確認するとdisabledを設定した要素のvalueでした。

```js (import)
import { useState, useEffect } from 'react';
const Query = () => {
  const [query, setQuery] = useState('なし');
  useEffect(() => {
    if (typeof location !== 'undefined') {
      setQuery(location.search);
    }
  }, []);
  return <code>{query}</code>;
};
```

```jsx (include)
<form id="form1" action="#form1" method="GET">
  <h1>disabledなinputのあるフォーム</h1>
  <p>
    このページにGETするので送信するとアドレスバーのクエリ文字列で値を確認できます。おそらく
    <code>{'?v1-1=value1&v1-2=value2'}</code>になるはずです。
  </p>
  <p>
    現在のクエリ文字列: <Query />
  </p>
  <label htmlFor="v1-1">
    <code>{'<input name="v1-1" type="text"/>'}</code>
  </label>
  <input id="v1-1" name="v1-1" type="text" defaultValue="value1" />
  <label htmlFor="v1-2">
    <code>{'<input name="v1-2" type="text" readonly/>'}</code>
  </label>
  <input id="v1-2" name="v1-2" type="text" defaultValue="value2" readOnly />
  <label htmlFor="v1-3">
    <code>{'<input name="v1-3" type="text" disabled/>'}</code>
  </label>
  <input id="v1-3" name="v1-3" type="text" defaultValue="value3" disabled />
  <button type="submit">送信</button>
</form>
```

いつもfetchで送っていたので気がつかなかったのですが、disabledな要素の値はフォームの送信に含まれません。

## disabledなfieldset

フォームの要素は`<fieldset>`でグループにできます。この`<fieldset>`にはdisabledが指定できます。先の結果から予想するとdisabledにするとそのグループの値は送信されないでしょう。確認してみます。

```jsx (include)
<form id="form2" action="#form2" method="GET">
  <h1>disabledなfieldsetのあるフォーム</h1>
  <p>
    このページにGETするので送信するとアドレスバーのクエリ文字列で値を確認できます。
  </p>
  <p>
    現在のクエリ文字列: <Query />
  </p>
  <fieldset>
    <legend>
      <code>{'<fieldset>'}</code>
    </legend>
    <label htmlFor="v2-1">
      <code>{'<input name="v2-1" type="text"/>'}</code>
    </label>
    <input id="v2-1" name="v2-1" type="text" defaultValue="value1" />
    <label htmlFor="v2-2">
      <code>{'<input name="v2-2" type="text"/>'}</code>
    </label>
    <input id="v2-2" name="v2-2" type="text" defaultValue="value2" />
  </fieldset>
  <fieldset readOnly>
    <legend>
      <code>{'<fieldset readonly>'}</code>
    </legend>
    <label htmlFor="v2-3">
      <code>{'<input name="v2-3" type="text"/>'}</code>
    </label>
    <input id="v2-3" name="v2-3" type="text" defaultValue="value3" />
    <label htmlFor="v2-4">
      <code>{'<input name="v2-4" type="text"/>'}</code>
    </label>
    <input id="v2-4" name="v2-4" type="text" defaultValue="value4" />
  </fieldset>
  <fieldset disabled>
    <legend>
      <code>{'<fieldset disabled>'}</code>
    </legend>
    <label htmlFor="v2-5">
      <code>{'<input name="v2-5" type="text"/>'}</code>
    </label>
    <input id="v2-5" name="v2-5" type="text" defaultValue="value5" />
    <label htmlFor="v2-6">
      <code>{'<input name="v2-6" type="text"/>'}</code>
    </label>
    <input id="v2-6" name="v2-6" type="text" defaultValue="value6" />
  </fieldset>
  <button type="submit">送信</button>
</form>
```

3つ目の`<fieldset>`の中の`v2-5`と`v2-6`は送信されません。disabledな`<fieldset>`の中の値は送信されません。readonlyは送信されます。

## disabledの使い所

例えば「_Q2で **いいえ** と答えた方は入力してください_」のように文脈で無効である場合にはdisabledを使い、送信中の値の保護であればreadonly[^1]を使うようにしています。

[^1]: readonlyは`<input type="submit"/>`に使えないなどの条件があります。参考: [HTML 属性: readonly - HTML: HyperText Markup Language | MDN](https://developer.mozilla.org/ja/docs/Web/HTML/Attributes/readonly)