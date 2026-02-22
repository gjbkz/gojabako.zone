import { clamp } from "../../util/clamp.ts";
import type { Range } from "../../util/range.ts";

export const toLogValue = (value: number, [min, max]: Range): number => {
	const logValue = Math.log(clamp(value, min, max));
	const logMin = Math.log(min);
	const logMax = Math.log(max);
	return (logValue - logMin) / (logMax - logMin);
};

export const toLinearValue = (ratio: number, [min, max]: Range) => {
	return min * Number((max / min) ** ratio);
};
