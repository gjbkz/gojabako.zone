"use client";
import { ensure, isFiniteNumber } from "@nlib/typing";
import type { ChangeEvent, InputHTMLAttributes } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { clamp } from "../../util/clamp.ts";
import type { Range } from "../../util/range.ts";
import { toLinearValue, toLogValue } from "./math.ts";

export { toLinearValue, toLogValue } from "./math.ts";

const toNumber = (value: ReadonlyArray<string> | number | string): number =>
	ensure(Number(value), isFiniteNumber);

export interface LogSliderProps
	extends Omit<InputHTMLAttributes<HTMLInputElement>, "max" | "min" | "type"> {
	min: number;
	max: number;
	onChangeValue?: (value: number) => void;
}

export const LogSlider = ({
	min,
	max,
	defaultValue = Math.sqrt(min * max),
	value: rawValue,
	onChangeValue,
	onChange: onChangeFn,
	...props
}: LogSliderProps) => {
	const range = useMemo((): Range => [min, max], [min, max]);
	const [ratio, setRatio] = useState(toLogValue(toNumber(defaultValue), range));
	const onChange = useCallback(
		(event: ChangeEvent<HTMLInputElement>) => {
			setRatio(clamp(toNumber(event.currentTarget.value), 0, 1));
			if (onChangeFn) {
				onChangeFn(event);
			}
		},
		[onChangeFn],
	);
	// biome-ignore lint/correctness/useExhaustiveDependencies: rawValueは見ない
	useEffect(() => {
		if (onChangeValue) {
			const diff = rawValue ? toLogValue(toNumber(rawValue), range) - ratio : 1;
			if (0.001 < Math.abs(diff)) {
				onChangeValue(toLinearValue(ratio, range));
			}
		}
	}, [ratio, range, onChangeValue]);
	useEffect(() => {
		if (rawValue) {
			const newRatio = toLogValue(toNumber(rawValue), range);
			setRatio((prev) => (Math.abs(newRatio - prev) < 1e-9 ? prev : newRatio));
		}
	}, [rawValue, range]);
	return (
		<input
			{...props}
			value={ratio}
			min={0}
			max={1}
			step={0.001}
			type="range"
			onChange={onChange}
		/>
	);
};
