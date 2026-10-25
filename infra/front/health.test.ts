import * as assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";

const require = createRequire(import.meta.url);
const { readUnhealthy, writeUnhealthy, findUnhealthy } = require("./health.js");
const functionCode = readFileSync(
	new URL("function.js", import.meta.url),
	"utf8",
);

test("function.js の unhealthyOriginIds を読み書きできる", () => {
	assert.deepEqual(readUnhealthy(functionCode), []);
	const updated = writeUnhealthy(functionCode, ["vercel", "aws"]);
	assert.deepEqual(readUnhealthy(updated), ["vercel", "aws"]);
	assert.equal(
		updated.replace(/^const unhealthyOriginIds = .*$/m, ""),
		functionCode.replace(/^const unhealthyOriginIds = .*$/m, ""),
	);
});

test("/health が失敗し続けたデプロイ先だけを落ちているとみなす", async () => {
	const calls = new Map<string, number>();
	const fakeFetch = async (url: string) => {
		calls.set(url, (calls.get(url) ?? 0) + 1);
		if (url.includes("down")) {
			throw new Error("connect timeout");
		}
		if (url.includes("flaky") && calls.get(url) === 1) {
			return { ok: false };
		}
		return { ok: true };
	};
	const unhealthy = await findUnhealthy(
		[
			{ id: "a", domain: "up.example.com" },
			{ id: "b", domain: "down.example.com" },
			{ id: "c", domain: "flaky.example.com" },
		],
		fakeFetch,
	);
	assert.deepEqual(unhealthy, ["b"]);
	assert.equal(calls.get("https://down.example.com/health"), 2);
});
