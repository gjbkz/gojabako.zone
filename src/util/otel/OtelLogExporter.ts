import { type ExportResult, ExportResultCode } from "@opentelemetry/core";
import { JsonLogsSerializer } from "@opentelemetry/otlp-transformer/build/src/logs/json";
import type {
	LogRecordExporter,
	ReadableLogRecord,
} from "@opentelemetry/sdk-logs";

interface OtelLogExporterConstructorOptions {
	url?: string | URL;
	headers?: HeadersInit;
}

export class OtelLogExporter implements LogRecordExporter {
	private readonly endpoint?: URL;

	private readonly commonHeaders?: Headers;

	private readonly promises = new Set<Promise<void>>();

	public constructor({ url, headers }: OtelLogExporterConstructorOptions) {
		if (url && headers) {
			this.endpoint = new URL(url);
			const commonHeaders = new Headers(headers);
			commonHeaders.set("content-type", "application/json");
			this.commonHeaders = commonHeaders;
		} else {
			console.warn("missing otel exporter configurations", { url, headers });
		}
	}

	public export(
		logs: Array<ReadableLogRecord>,
		resultCallback: (result: ExportResult) => void,
	): void {
		if (this.endpoint && this.commonHeaders) {
			const promise = fetch(this.endpoint, {
				method: "POST",
				body: JsonLogsSerializer.serializeRequest(
					logs,
				) as ArrayBufferView<ArrayBuffer>,
				headers: new Headers(this.commonHeaders),
			})
				.then((res) => handleResponse(resultCallback, res))
				.catch((error) => handleError(resultCallback, error))
				.finally(() => this.promises.delete(promise));
			this.promises.add(promise);
		} else {
			for (const log of logs) {
				console.info(log.body, log.attributes);
			}
			resultCallback({ code: ExportResultCode.SUCCESS });
		}
	}

	public async shutdown(): Promise<void> {
		await Promise.all([...this.promises]);
	}
}

const handleResponse = async (
	resultCallback: (result: ExportResult) => void,
	res: Response,
) => {
	if (res.ok) {
		resultCallback({ code: ExportResultCode.SUCCESS });
	} else {
		const fallback = "Failed to read response body";
		const message = await res.text().catch(() => fallback);
		resultCallback({
			code: ExportResultCode.FAILED,
			error: new Error(`${res.status} ${res.statusText}: ${message}`),
		});
	}
};

const handleError = (
	resultCallback: (result: ExportResult) => void,
	error?: Error,
) => {
	console.error(error);
	resultCallback({ code: ExportResultCode.FAILED, error });
};
