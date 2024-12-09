"use client";
import { useCallback, useState } from "react";
import { hasWindow } from "../../../../util/env";
import { listEnvTestEntries } from "../../../../util/testEnv";
import { EnvTestEnvName } from "./EnvTestEnvName";
import style from "./style.module.scss";

interface EnvTestResult {
	columnName: string;
	data: Map<string, string | undefined>;
}

interface EnvTestTableProps {
	id: string;
}

export const EnvTestTable = ({ id }: EnvTestTableProps) => {
	const [result, setResult] = useState<Array<EnvTestResult>>([
		{ columnName: "Middleware", data: new Map() },
		{ columnName: "SSR", data: new Map() },
		{ columnName: "API Route", data: new Map() },
		{ columnName: "Client", data: new Map() },
	]);
	const getResult = useCallback(() => setResult([...listEnvTestResult()]), []);
	return (
		<>
			<figure id={id} data-type="table">
				<figcaption>
					<span />
					<a href={`#${id}`} className="fragment-ref">
						#{id}
					</a>
				</figcaption>
				<div className={style.wrapper}>
					<table className={style.table}>
						<thead>
							<tr>
								<th className={style.firstColumn}>
									環境変数名
									<button
										type="button"
										onClick={getResult}
										className={style.button}
									>
										更新
									</button>
								</th>
								{result.map((c) => (
									<th key={c.columnName}>{c.columnName}</th>
								))}
							</tr>
						</thead>
						<tbody>
							{[...listEnvTestEntries()].map(([envName], i) => (
								<tr key={envName}>
									<EnvTestEnvName name={envName} index={i} />
									{result.map((c) => (
										<td key={c.columnName} className={style.center}>
											{c.data.get(envName) ?? ""}
										</td>
									))}
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</figure>
			<details>
				<summary>Markdown</summary>
				<pre className={style.md}>
					{[...serializeToMarkdown(result)].join("\n")}
				</pre>
			</details>
			<details>
				<summary>JSON</summary>
				<pre className={style.md}>
					{JSON.stringify(
						(() => {
							const keys = [...listEnvTestEntries()].map(([key]) => key);
							const output: Record<string, string> = {};
							for (const { columnName, data } of result) {
								output[columnName] = keys
									.map((key) => data.get(key) ?? "")
									.join(",");
							}
							return output;
						})(),
					)}
				</pre>
			</details>
		</>
	);
};

const listEnvTestResult = function* (): Generator<EnvTestResult> {
	if (hasWindow) {
		for (const pre of document.querySelectorAll(`.${style.data}`)) {
			if (pre instanceof HTMLElement) {
				const columnName = pre.dataset.columnName;
				if (columnName) {
					yield { columnName, data: new Map(parseData(pre.textContent ?? "")) };
				}
			}
		}
	}
};

const parseData = function* (data: string): Generator<[string, string]> {
	const Delimiter = "=";
	for (const line of data.split("\n")) {
		const delimiterIndex = line.indexOf(Delimiter);
		if (0 < delimiterIndex) {
			const key = line.slice(0, delimiterIndex).trim();
			const value = line.slice(delimiterIndex + Delimiter.length).trim();
			yield [key, value];
		}
	}
};

const serializeToMarkdown = function* (
	result: Array<EnvTestResult>,
): Generator<string> {
	yield `|環境変数名|${result.map((c) => c.columnName).join("|")}|`;
	yield `|---|${result.map(() => ":---:").join("|")}|`;
	for (const [key] of listEnvTestEntries()) {
		const values = result.map((c) => c.data.get(key) ?? "");
		yield `|\`${key}\`|${values.join("|")}|`;
	}
};
