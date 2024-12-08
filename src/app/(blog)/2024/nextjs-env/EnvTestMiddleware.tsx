"use client";
import { isArray, isString } from "@nlib/typing";
import { useEffect, useState } from "react";
import { getCurrentUrl } from "../../../../util/getCurrentUrl";
import { EnvTestData } from "./EnvTestData";

type ResultItem = [string, string | undefined];
const isResultItem = (input: unknown): input is ResultItem => {
	if (isArray(input)) {
		const [key, value] = input;
		return isString(key) && (isString(value) || !value);
	}
	return false;
};

type Result = Array<ResultItem>;
const isResult = (input: unknown): input is Result =>
	isArray(input) && input.every((item) => isResultItem(item));

export const EnvTestMiddleware = () => {
	const [data, setData] = useState<Result>([]);
	useEffect(() => {
		const abc = new AbortController();
		const url = new URL("/envtest", getCurrentUrl());
		fetch(url, { signal: abc.signal })
			.then(async (res) => {
				if (!res.ok) {
					throw new Error(`${res.status} ${res.statusText}`);
				}
				const list = await res.json();
				if (isResult(list)) {
					setData(list);
				} else {
					throw new Error(`InvalidResponse: ${JSON.stringify(list)}`);
				}
			})
			.catch((error) => {
				setData([["Error", `${error}`]]);
			});
		return () => abc.abort();
	}, []);
	return <EnvTestData data={data} columnName="Middleware" />;
};
