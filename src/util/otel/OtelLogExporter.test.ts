import * as assert from "node:assert/strict";
import { test } from "node:test";
import { ExportResultCode } from "@opentelemetry/core";
import { resourceFromAttributes } from "@opentelemetry/resources";
import {
	LoggerProvider,
	SimpleLogRecordProcessor,
} from "@opentelemetry/sdk-logs";
import { OtelLogExporter } from "./OtelLogExporter.ts";

test("OpenTelemetry SDK のログを OTLP JSON に変換し、送信完了まで flush する", async (t) => {
	const response = Promise.withResolvers<Response>();
	const requested = Promise.withResolvers<RequestInit>();
	t.mock.method(globalThis, "fetch", async (url: URL, init: RequestInit) => {
		assert.equal(url.href, "https://collector.example/v1/logs");
		requested.resolve(init);
		return response.promise;
	});
	const exporter = new OtelLogExporter({
		url: "https://collector.example/v1/logs",
		headers: { authorization: "test" },
	});
	const provider = new LoggerProvider({
		resource: resourceFromAttributes({ "service.name": "test-service" }),
		processors: [new SimpleLogRecordProcessor({ exporter })],
	});
	t.after(async () => {
		response.resolve(new Response(null, { status: 200 }));
		await provider.shutdown();
	});
	provider.getLogger("test-logger").emit({
		body: "migration test",
		attributes: { migrated: true },
	});
	const init = await requested.promise;
	assert.equal(init.method, "POST");
	const headers = new Headers(init.headers);
	assert.equal(headers.get("content-type"), "application/json");
	assert.equal(headers.get("authorization"), "test");
	assert.ok(init.body instanceof Blob);
	const payload = JSON.parse(await init.body.text());
	const resourceLogs = payload.resourceLogs[0];
	assert.deepEqual(resourceLogs.resource.attributes, [
		{ key: "service.name", value: { stringValue: "test-service" } },
	]);
	assert.equal(resourceLogs.scopeLogs[0].scope.name, "test-logger");
	assert.equal(
		resourceLogs.scopeLogs[0].logRecords[0].body.stringValue,
		"migration test",
	);
	let flushed = false;
	const flush = exporter.forceFlush().then(() => {
		flushed = true;
	});
	await new Promise<void>((resolve) => setImmediate(resolve));
	assert.equal(flushed, false);
	response.resolve(new Response(null, { status: 200 }));
	await flush;
	assert.equal(flushed, true);
});

test("OTLP の HTTP エラーを exporter の失敗として返す", async (t) => {
	t.mock.method(
		globalThis,
		"fetch",
		async () =>
			new Response("unavailable", {
				status: 503,
				statusText: "Service Unavailable",
			}),
	);
	const exporter = new OtelLogExporter({
		url: "https://collector.example/v1/logs",
		headers: {},
	});
	const result = Promise.withResolvers<{
		code: ExportResultCode;
		error?: Error;
	}>();
	exporter.export([], result.resolve);
	await exporter.shutdown();
	const exported = await result.promise;
	assert.equal(exported.code, ExportResultCode.FAILED);
	assert.match(
		exported.error?.message ?? "",
		/503 Service Unavailable: unavailable/,
	);
});
