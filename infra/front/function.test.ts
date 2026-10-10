import * as assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import * as vm from "node:vm";

interface OriginGroup {
	originIds: Array<{ originId: string }>;
	failoverCriteria: { statusCodes: Array<number> };
}

// CloudFront Functions の import 文を外し、cf を差し替えて handler を取り出す。
const loadHandler = () => {
	const source = readFileSync(new URL("function.js", import.meta.url), "utf8");
	const groups: Array<OriginGroup> = [];
	const context = vm.createContext({
		cf: { createRequestOriginGroup: (g: OriginGroup) => groups.push(g) },
	});
	vm.runInContext(
		`${source.replace(/^import cf from "cloudfront";/m, "")}\nglobalThis.handler = handler;`,
		context,
	);
	const handler = context.handler as (event: unknown) => {
		statusCode?: number;
		headers?: Record<string, { value: string }>;
		body?: { data: string };
		uri?: string;
	};
	return { handler, groups };
};

const createEvent = (uri: string, ip = "192.0.2.1") => ({
	viewer: { ip },
	request: { method: "GET", uri, headers: {} },
});

test("/health に 200 を返す", () => {
	const { handler } = loadHandler();
	const res = handler(createEvent("/health"));
	assert.equal(res.statusCode, 200);
	assert.equal(res.body?.data, "OK");
});

test("ボット向けのパスに 403 を返す", () => {
	const { handler, groups } = loadHandler();
	for (const uri of [
		"/index.php",
		"/wp-login.php",
		"/wp-admin/",
		"/.env",
		"/.git/config",
		"/backup.zip",
		"/phpinfo",
	]) {
		assert.equal(handler(createEvent(uri)).statusCode, 403, uri);
	}
	assert.equal(groups.length, 0);
});

test("/favicon.ico を /icon にリダイレクトする", () => {
	const { handler } = loadHandler();
	const res = handler(createEvent("/favicon.ico"));
	assert.equal(res.statusCode, 307);
	assert.equal(res.headers?.location.value, "/icon");
});

test("ページは主と予備の 2 つのオリジンに振る", () => {
	const { handler, groups } = loadHandler();
	const res = handler(createEvent("/2024/multi-cloud"));
	assert.equal(res.uri, "/2024/multi-cloud");
	assert.equal(groups.length, 1);
	const [primary, secondary] = groups[0].originIds;
	assert.notEqual(primary.originId, secondary.originId);
	assert.deepEqual(
		[...groups[0].failoverCriteria.statusCodes],
		[500, 502, 503, 504],
	);
});

test("同じ訪問者は同じ主オリジンに振られ、/apphost はその名前を返す", () => {
	const { handler, groups } = loadHandler();
	handler(createEvent("/a", "198.51.100.7"));
	handler(createEvent("/b", "198.51.100.7"));
	assert.equal(
		groups[0].originIds[0].originId,
		groups[1].originIds[0].originId,
	);
	const res = handler(createEvent("/apphost", "198.51.100.7"));
	const label = JSON.parse(res.body?.data ?? "");
	const labels: Record<string, string> = {
		vercel: "Vercel",
		netlify: "Netlify",
		firebase: "Firebase",
		aws: "AWS",
	};
	assert.equal(label, labels[groups[0].originIds[0].originId]);
});

test("訪問者が多ければすべてのオリジンに振られる", () => {
	const { handler, groups } = loadHandler();
	for (let i = 0; i < 1000; i++) {
		handler(createEvent("/", `203.0.113.${i % 256}.${i}`));
	}
	const counts = new Map<string, number>();
	for (const g of groups) {
		const id = g.originIds[0].originId;
		counts.set(id, (counts.get(id) ?? 0) + 1);
	}
	assert.equal(counts.size, 4);
	for (const [id, count] of counts) {
		assert.ok(count > 150, `${id}: ${count}`);
	}
});
