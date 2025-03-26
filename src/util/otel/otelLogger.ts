import { parseKeyPairsIntoRecord } from "@opentelemetry/core";
import {
	LoggerProvider,
	SimpleLogRecordProcessor,
} from "@opentelemetry/sdk-logs";
import { OtelLogExporter } from "./OtelLogExporter";
import { otelResource } from "./otelResource";
import { otelWorkers } from "./otelWorkers";

const logExporter = new OtelLogExporter({
	url: process.env.OTEL_EXPORTER_OTLP_LOGS_ENDPOINT,
	headers: {
		...parseKeyPairsIntoRecord(
			process.env.OTEL_EXPORTER_OTLP_LOGS_HEADERS?.trim(),
		),
		...parseKeyPairsIntoRecord(process.env.OTEL_EXPORTER_OTLP_HEADERS?.trim()),
	},
});
otelWorkers.add(logExporter);

const loggerProvider = new LoggerProvider({
	resource: otelResource,
	logRecordLimits: {},
});
otelWorkers.add(loggerProvider);
loggerProvider.addLogRecordProcessor(new SimpleLogRecordProcessor(logExporter));
export const otelLogger = loggerProvider.getLogger("app");
otelLogger.emit({ body: "started: otel" });
