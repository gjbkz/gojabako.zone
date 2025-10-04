"use client";
import type { FormEvent } from "react";
import { useCallback, useEffect, useState } from "react";
import { Buttons, PrimaryButton } from "../Button";
import { Form } from "../Form";
import { generateKeyPair, loadKeyPair, storeKeyPair } from "./util.ts";
import { CryptoKeyView } from "./View";

export const CryptoKeyStore = () => {
	const keyId = "testKeyPair";
	const [keyPair, setKeyPair] = useState<CryptoKeyPair | null>(null);
	const onSubmit = useCallback((event: FormEvent) => {
		event.preventDefault();
		generateKeyPair()
			.then(async (newKeyPair) => {
				await storeKeyPair(keyId, newKeyPair);
				setKeyPair(newKeyPair);
			})
			.catch(console.error);
	}, []);
	useEffect(() => {
		loadKeyPair(keyId).then(setKeyPair).catch(console.error);
	}, []);
	return (
		<Form onSubmit={onSubmit}>
			<p>鍵ペアをIndexedDBに保管します。</p>
			<Buttons>
				<PrimaryButton type="submit">
					{keyPair ? "鍵ペアを更新して保管する" : "鍵ペアを作成して保管する"}
				</PrimaryButton>
			</Buttons>
			{keyPair && (
				<>
					<CryptoKeyView name="PublicKey" keyObject={keyPair.publicKey} />
					<CryptoKeyView
						name="PrivateKey"
						keyObject={keyPair.privateKey}
						noExtract
					/>
					<p>
						IndexedDBのコンソールを開いて鍵ペアが格納されていることを確認してください。また、ページをリロードしても鍵ペアが消えないことを確認してください。
					</p>
				</>
			)}
		</Form>
	);
};
