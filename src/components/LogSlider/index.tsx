"use client";
import { ensure, isFiniteNumber } from "@nlib/typing";
import type { ChangeEvent, InputHTMLAttributes } from "react";
import { useCallback, useState } from "react";
import { clamp } from "../../util/clamp.ts";
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
	const [internalRatio, setInternalRatio] = useState(() =>
		toLogValue(toNumber(rawValue ?? toNumber(defaultValue)), [min, max]),
	);
	const ratio =
		rawValue !== undefined
			? toLogValue(toNumber(rawValue), [min, max])
			: internalRatio;
	const onChange = useCallback(
		(event: ChangeEvent<HTMLInputElement>) => {
			const newRatio = clamp(toNumber(event.currentTarget.value), 0, 1);
			setInternalRatio(newRatio);
			if (onChangeValue) {
				onChangeValue(toLinearValue(newRatio, [min, max]));
			}
			if (onChangeFn) {
				onChangeFn(event);
			}
		},
		[onChangeFn, onChangeValue, min, max],
	);
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
