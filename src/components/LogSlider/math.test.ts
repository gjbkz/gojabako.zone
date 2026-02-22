import * as assert from "node:assert";
import { describe, test } from "node:test";
import { toLinearValue, toLogValue } from "./math.ts";

const ranges: Array<[number, number]> = [
	[1, 1024],
	[200, 5000],
	[2, 50],
];

describe(toLogValue.name, () => {
	for (const [min, max] of ranges) {
		const range = `[${min}, ${max}]` as const;
		test(`min → 0 (${range})`, () => {
			assert.strictEqual(toLogValue(min, [min, max]), 0);
		});
		test(`max → 1 (${range})`, () => {
			assert.strictEqual(toLogValue(max, [min, max]), 1);
		});
		test(`幾何平均 → 0.5 (${range})`, () => {
			assert.ok(
				Math.abs(toLogValue(Math.sqrt(min * max), [min, max]) - 0.5) < 1e-9,
			);
		});
	}
});

describe(toLinearValue.name, () => {
	for (const [min, max] of ranges) {
		const range = `[${min}, ${max}]` as const;
		test(`0 → min (${range})`, () => {
			assert.strictEqual(toLinearValue(0, [min, max]), min);
		});
		test(`1 → max (${range})`, () => {
			assert.strictEqual(toLinearValue(1, [min, max]), max);
		});
		test(`0.5 → 幾何平均 (${range})`, () => {
			assert.ok(
				Math.abs(toLinearValue(0.5, [min, max]) - Math.sqrt(min * max)) < 1e-9,
			);
		});
	}
});

describe("ラウンドトリップ誤差", () => {
	const ratios = [0, 0.001, 0.25, 0.5, 0.75, 0.999, 1];
	for (const [min, max] of ranges) {
		const range = `[${min}, ${max}]` as const;
		for (const ratio of ratios) {
			test(`ratio=${ratio} (${range})`, () => {
				const roundTrip = toLogValue(toLinearValue(ratio, [min, max]), [
					min,
					max,
				]);
				assert.ok(
					Math.abs(roundTrip - ratio) < 1e-9,
					`誤差 ${Math.abs(roundTrip - ratio)} が 1e-9 以上`,
				);
			});
		}
	}
});
