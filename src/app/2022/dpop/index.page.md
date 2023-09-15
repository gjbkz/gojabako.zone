# DPoPのブラウザ実装

ここ3年で3回DPoPを実装していていい感じなのですが、誰かに説明するのに毎度OpenID Connect (OIDC)の仕様やcrypto系のAPIを参照して資料を作っていると時間がかかるので記事を書くことにしました。ただ仕様とかAPIは毎年のように新しくなるので調査はしたほうがいいです。

## DPoPを知る

とりあえず次の仕様と解説は必読です。

- [
  OAuth 2.0 Demonstrating Proof-of-Possession at the Application Layer (DPoP)](https://datatracker.ietf.org/doc/draft-ietf-oauth-dpop/)
- [図解 DPoP (OAuth アクセストークンのセキュリティ向上策の一つ)](https://qiita.com/TakahikoKawasaki/items/34c82fb5c0595b6fc289)

これより良い解説はないんじゃないでしょうか。

ブラウザで動くアプリの場合は次の手順でサーバーにDPoPヘッダー付きリクエストを送ります。

1. ブラウザは公開鍵・秘密鍵の鍵ペアを生成して保管します
1. ブラウザは公開鍵をトークンリクエストに乗せます
   1. 認可サーバーは公開鍵のハッシュ値`jkt`を保管します
   1. ブラウザはアクセストークンをもらいます
1. ブラウザはDPoPヘッダー付きリクエストをリソースサーバーに送ります
   1. ヘッダーに公開鍵、ペイロードにメソッドとエンドポイントのURLを詰めて先の秘密鍵で署名したJWT (DPoP proof JWT) をつくります
   1. `DPoP: <作ったJWT>` というヘッダーを追加してリクエストを送ります
   1. リソースサーバーはアクセストークンとJWTの署名を検証してOKならレスポンスを返します

## DPoPは何を解決しているのか

アクセストークンのみでアクセスを制限している場合はアクセストークンを盗めば持ち主になりすませてしまいますが、DPoPを要求するとアクセストークンだけではなりすましできなくなります。ただし、トークンの持ち主以外がDPoPヘッダーを作れてしまう場合は意味がありません。以下でこの点について考察します。

### アクセストークンの持ち主以外がDPoPヘッダーを作れるか

アクセストークンを盗んだ側の視点で考えてみます。

> **盗:** DPoPヘッダーを要求された。DPoPヘッダーは「ヘッダーに公開鍵、ペイロードにメソッドとエンドポイントのURLを詰めて先の秘密鍵で署名したJWT」 らしい。<br/> > **盗:** ペイロード部分はリクエストのエンドポイント情報なので問題ない。<br/> > **盗:** ヘッダーに詰める公開鍵と署名に使う秘密鍵、つまり鍵ペアが必要だ。<br/> > **盗:** この鍵ペアはアクセストークンの発行に使ったものと同じじゃないといけない。<br/> > **盗:** アクセストークンの持ち主から鍵ペアを盗めればいける。

これで「アクセストークンの持ち主以外がDPoPヘッダーを作れるか」は「アクセストークンの持ち主の鍵ペアを盗めるか」という問題になりました。

### アクセストークンの持ち主の鍵ペアを盗めるか

以下がブラウザで鍵ペアを作るコードの例です。

```typescript
const algorithm: EcKeyGenParams = { name: 'ECDSA', namedCurve: 'P-256' };
const extractable = false;
const keyUsages: Array<KeyUsage> = ['sign'];
const keyPair = await crypto.subtle.generateKey(
  algorithm,
  extractable,
  keyUsages,
);
```

以下で実際に鍵ペアを作れます。それぞれExportKeyもクリックして鍵データの出力を試してみてください。

```js (import)
import { useState, useEffect, useCallback } from 'react';
const generateKeyPair = async () => {
  const algorithm = { name: 'ECDSA', namedCurve: 'P-256' };
  const extractable = false;
  const keyUsages = ['sign'];
  const keyPair = await crypto.subtle.generateKey(
    algorithm,
    extractable,
    keyUsages,
  );
  console.info(keyPair);
  return keyPair;
};
const KeyGenerator = () => {
  const [keyPair, setKeyPair] = useState(null);
  const onSubmit = useCallback((event) => {
    event.preventDefault();
    generateKeyPair().then(setKeyPair).catch(console.error);
  }, []);
  return (
    <form onSubmit={onSubmit}>
      <button type="submit" style={{ justifySelf: 'start' }}>
        鍵ペアを作成する
      </button>
      {keyPair && (
        <>
          <KeyPairView keyPair={keyPair} />
          <p>発行した鍵ペアはJavaScriptコンソールにも表示されています。</p>
        </>
      )}
    </form>
  );
};
const KeyPairView = ({ keyPair }) => (
  <>
    <KeyView name="PublicKey" keyObject={keyPair.publicKey} />
    <KeyView name="PrivateKey" keyObject={keyPair.privateKey} />
  </>
);
const KeyView = ({ name, keyObject: key, extract, noExtract }) => {
  const [jwk, setJwk] = useState(null);
  const extractKey = useCallback(
    (event) => {
      if (event) {
        event.preventDefault();
      }
      crypto.subtle
        .exportKey('jwk', key)
        .then((extracted) => setJwk(JSON.stringify(extracted, null, 2)))
        .catch((error) => setJwk(`${error}`));
    },
    [key],
  );
  useEffect(() => {
    if (extract) {
      extractKey();
    }
  }, [extractKey]);
  const extractButton = !(extract || noExtract);
  return (
    <fieldset>
      <legend>{name}</legend>
      <table>
        <tbody>
          <tr>
            <td>
              <code>algorithm</code>
            </td>
            <td>
              <code>{JSON.stringify(key.algorithm, null, 2)}</code>
            </td>
          </tr>
          <tr>
            <td>
              <code>extractable</code>
            </td>
            <td>
              <code>{`${key.extractable}`}</code>
            </td>
          </tr>
          <tr>
            <td>
              <code>usages</code>
            </td>
            <td>
              <code>{JSON.stringify(key.usages)}</code>
            </td>
          </tr>
        </tbody>
      </table>
      {extractButton && (
        <button
          type="button"
          onClick={extractKey}
          style={{ justifySelf: 'start' }}
        >
          ExportKey
        </button>
      )}
      {jwk && (
        <pre>
          <code>{jwk}</code>
        </pre>
      )}
    </fieldset>
  );
};
```

```jsx (include)
<KeyGenerator />
```

`crypto.subtle.generateKey`の2番目の引数`extractable`を`false`にするとGoogle Chromeでは "InvalidAccessError: key is not extractable" となり出力できません。つまり、`extractable:false`の秘密鍵はアクセストークンの持ち主のブラウザの外に持ち出せません。

### まとめ

Q. アクセストークンの持ち主の鍵ペアを盗めるか？<br/>
A. アクセストークンの持ち主のブラウザの外には盗み出せません。

Q. アクセストークンの持ち主以外がDPoPヘッダーを作れるか？<br/>
A. アクセストークンの持ち主の鍵ペアが持ち出せずブラウザの外では作れません。

ブラウザ側が`extractable:false`を正しく実装していればXSS以外でのアクセストークン悪用を防ぐ効果が期待できます。

## 鍵ペアの保管方法

秘密鍵を`extractable:false`で作ることはわかりましたが、文字列等に変換できないその鍵をどうやってブラウザに保管するかという問題が残っています。少なくともアクセストークンの期限までは鍵ペアを保管しなければなりません。

`localStorage`や`sessionStorage`等の[Storage](https://developer.mozilla.org/en-US/docs/Web/API/Storage)は文字列しか入らないので使えませんが、[IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)はオブジェクトをオブジェクトのまま保管できます。

```js (import)
const openDB = async () =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open('KeyPairTest', 1);
    request.onerror = reject;
    request.onupgradeneeded = () => {
      const db = event.target.result;
      db.createObjectStore('keyPair', { keyPath: 'keyId' });
    };
    request.onsuccess = (event) => {
      resolve(event.target.result);
    };
  });
const storeKeyPair = async (keyId, keyPair) => {
  const db = await openDB();
  await new Promise((resolve, reject) => {
    const transaction = db.transaction(['keyPair'], 'readwrite');
    transaction.onerror = reject;
    transaction.oncomplete = resolve;
    const objectStore = transaction.objectStore('keyPair');
    objectStore.put({ keyId, ...keyPair });
    transaction.commit();
  });
};
const loadKeyPair = async (keyId) => {
  const db = await openDB();
  return await new Promise((resolve, reject) => {
    const transaction = db.transaction(['keyPair'], 'readwrite');
    const objectStore = transaction.objectStore('keyPair');
    const getRequest = objectStore.get(keyId);
    getRequest.onerror = reject;
    getRequest.onsuccess = () => resolve(getRequest.result);
    transaction.commit();
  });
};
const KeyStore = () => {
  const keyId = 'testKeyPair';
  const [keyPair, setKeyPair] = useState(null);
  const onSubmit = useCallback((event) => {
    event.preventDefault();
    generateKeyPair()
      .then(async (keyPair) => {
        await storeKeyPair(keyId, keyPair);
        setKeyPair(keyPair);
      })
      .catch(console.error);
  }, []);
  useEffect(() => {
    loadKeyPair(keyId).then(setKeyPair).catch(console.error);
  }, []);
  return (
    <form onSubmit={onSubmit}>
      <h1>鍵ペアをIndexedDBに保管する</h1>
      <button type="submit" style={{ justifySelf: 'start' }}>
        {keyPair ? '鍵ペアを更新して保管する' : '鍵ペアを作成して保管する'}
      </button>
      {keyPair && (
        <>
          <KeyView name="PublicKey" keyObject={keyPair.publicKey} extract />
          <KeyView name="PrivateKey" keyObject={keyPair.privateKey} noExtract />
          <p>
            IndexedDBのコンソールを開いて鍵ペアが格納されていることを確認してください。また、ページをリロードしても鍵ペアが消えないことを確認してください。
          </p>
        </>
      )}
    </form>
  );
};
```

```jsx (include)
<KeyStore />
```

`keyId: string`が引数にありますが同じ鍵ペアを参照したいので基本的には`app`等の固定値を渡すことになると思います。

```typescript
const openDB = async () =>
  new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('KeyPairTest', 1);
    request.onerror = reject;
    request.onupgradeneeded = () => {
      const db = event.target.result;
      db.createObjectStore('keyPair', { keyPath: 'keyId' });
    };
    request.onsuccess = (event) => {
      resolve(event.target.result);
    };
  });

const storeKeyPair = async (keyId: string, keyPair: CryptoKeyPair) => {
  const db = await openDB();
  await new Promise((resolve, reject) => {
    const transaction = db.transaction(['keyPair'], 'readwrite');
    transaction.onerror = reject;
    transaction.oncomplete = resolve;
    const objectStore = transaction.objectStore('keyPair');
    objectStore.put({ keyId, ...keyPair });
    transaction.commit();
  });
};

const loadKeyPair = async (keyId: string) => {
  const db = await openDB();
  return await new Promise<CryptoKeyPair>((resolve, reject) => {
    const transaction = db.transaction(['keyPair'], 'readonly');
    const objectStore = transaction.objectStore('keyPair');
    const getRequest = objectStore.get(keyId);
    getRequest.onerror = reject;
    getRequest.onsuccess = () => resolve(getRequest.result);
    transaction.commit();
  });
};
```

## まとめ

1. 秘密鍵を`extractable=false`で作ると`crypto.subtle.exportKey`できない
1. `crypto.subtle.exportKey`できないとブラウザの外に鍵を持ち出せない
1. ブラウザの外に鍵を持ち出せないとDPoPヘッダーをブラウザ外で作れない
1. DPoPヘッダーをブラウザ外で作れないとブラウザ外からのなりすましを防げる
1. 秘密鍵はIndexedDBに保管できる

ページそのもののリクエストにDPoPヘッダーはつけられないのでSSRを考えるならcookieにアクセストークンを乗せてSSRはそっちで認証しつつ、Web APIエンドポイントはDPoP必須にするなどが考えられます。

## 参考資料

- [OAuth 2.0 Demonstrating Proof-of-Possession at the Application Layer (DPoP)](https://datatracker.ietf.org/doc/draft-ietf-oauth-dpop/)
- [図解 DPoP (OAuth アクセストークンのセキュリティ向上策の一つ)](https://qiita.com/TakahikoKawasaki/items/34c82fb5c0595b6fc289)
- [SubtleCrypto.generateKey() - Web APIs | MDN](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/generateKey)
- [SubtleCrypto.exportKey() - Web APIs | MDN](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/exportKey)
- [IndexedDB API - Web APIs | MDN](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)