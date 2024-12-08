export const listEnvTestEntries = function* (): Generator<
	[string, string | undefined]
> {
	yield ["EVTEST_ENV", process.env.EVTEST_ENV];
	yield ["EVTEST_CNF", process.env.EVTEST_CNF];
	yield ["EVTEST_HST", process.env.EVTEST_HST];
	yield ["EVTEST_ENV_CNF", process.env.EVTEST_ENV_CNF];
	yield ["EVTEST_ENV_HST", process.env.EVTEST_ENV_HST];
	yield ["EVTEST_CNF_HST", process.env.EVTEST_CNF_HST];

	yield ["NEXT_PUBLIC_EVTEST_ENV", process.env.NEXT_PUBLIC_EVTEST_ENV];
	yield ["NEXT_PUBLIC_EVTEST_CNF", process.env.NEXT_PUBLIC_EVTEST_CNF];
	yield ["NEXT_PUBLIC_EVTEST_HST", process.env.NEXT_PUBLIC_EVTEST_HST];
	yield ["NEXT_PUBLIC_EVTEST_ENV_CNF", process.env.NEXT_PUBLIC_EVTEST_ENV_CNF];
	yield ["NEXT_PUBLIC_EVTEST_ENV_HST", process.env.NEXT_PUBLIC_EVTEST_ENV_HST];
	yield ["NEXT_PUBLIC_EVTEST_CNF_HST", process.env.NEXT_PUBLIC_EVTEST_CNF_HST];

	yield ["EVTEST_ENV2", process.env.EVTEST_ENV2];
	yield ["EVTEST_CNF2", process.env.EVTEST_CNF2];
	yield ["EVTEST_HST2", process.env.EVTEST_HST2];
	yield ["EVTEST_ENV_CNF2", process.env.EVTEST_ENV_CNF2];
	yield ["EVTEST_ENV_HST2", process.env.EVTEST_ENV_HST2];
	yield ["EVTEST_CNF_HST2", process.env.EVTEST_CNF_HST2];

	yield ["NEXT_PUBLIC_EVTEST_ENV2", process.env.NEXT_PUBLIC_EVTEST_ENV2];
	yield ["NEXT_PUBLIC_EVTEST_CNF2", process.env.NEXT_PUBLIC_EVTEST_CNF2];
	yield ["NEXT_PUBLIC_EVTEST_HST2", process.env.NEXT_PUBLIC_EVTEST_HST2];
	yield [
		"NEXT_PUBLIC_EVTEST_ENV_CNF2",
		process.env.NEXT_PUBLIC_EVTEST_ENV_CNF2,
	];
	yield [
		"NEXT_PUBLIC_EVTEST_ENV_HST2",
		process.env.NEXT_PUBLIC_EVTEST_ENV_HST2,
	];
	yield [
		"NEXT_PUBLIC_EVTEST_CNF_HST2",
		process.env.NEXT_PUBLIC_EVTEST_CNF_HST2,
	];
};

export const EnvTestCsvHeader = "X-EVTEST";

export const getEnvTestCsv = (): string => {
	const result: string[] = [];
	for (const [, value] of listEnvTestEntries()) {
		result.push(value ?? "");
	}
	return result.join(",");
};

export const parseEnvTestCsv = function* (
	csv: string,
): Generator<[string, string | undefined]> {
	const values = csv.split(",");
	for (const [key] of listEnvTestEntries()) {
		yield [key, values.shift() || undefined];
	}
};

export const serializeEnvTest = (
	iterable: Iterable<[string, string | undefined]>,
): string => {
	const lines: Array<string> = [];
	for (const [key, value] of iterable) {
		lines.push(`${key}=${value ?? ""}`);
	}
	return lines.join("\n");
};
