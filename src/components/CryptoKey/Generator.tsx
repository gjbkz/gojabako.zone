"use client";
import type { FormEvent } from "react";
import { useCallback, useEffect, useState } from "react";
import { Buttons, PrimaryButton } from "../Button";
import { Form } from "../Form";
import { generateKeyPair } from "./util.ts";
import { CryptoKeyView } from "./View";

export const CryptoKeyGenerator = () => {
	const [error, setError] = useState<Error | null>(null);
	const [keyPair, setKeyPair] = useState<CryptoKeyPair | null>(null);
	const onSubmit = useCallback((event?: FormEvent) => {
		event?.preventDefault();
		generateKeyPair().then(setKeyPair).catch(setError);
	}, []);
	useEffect(() => {
		onSubmit();
	}, [onSubmit]);
	return (
		<Form onSubmit={onSubmit}>
			<Buttons>
				<PrimaryButton type="submit">鍵ペアを作成する</PrimaryButton>
			</Buttons>
			{keyPair && (
				<>
					<CryptoKeyView name="PublicKey" keyObject={keyPair.publicKey}>
						<p>PublicKeyはエクスポートできます。</p>
					</CryptoKeyView>
					<CryptoKeyView name="PrivateKey" keyObject={keyPair.privateKey}>
						<p>PrivateKeyはエクスポートできません。エラーになります。</p>
					</CryptoKeyView>
				</>
			)}
			{error && (
				<>
					<h3>エラー</h3>
					<p>{error.message}</p>
				</>
			)}
		</Form>
	);
};
