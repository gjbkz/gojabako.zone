"use client";
import type { MouseEvent } from "react";
import { useCallback } from "react";
import { classnames, IconClass } from "../../util/classnames.ts";
import type { LogSliderProps } from "../LogSlider";
import { LogSlider, toLinearValue } from "../LogSlider";
import * as css from "./style.module.css";

export const ZoomSlider = ({ className, ...props }: LogSliderProps) => {
	const { onChangeValue, min, max } = props;
	const onClick = useCallback(
		(event: MouseEvent<HTMLButtonElement>) => {
			const button = event.currentTarget;
			const input = findSiblingRangeInput(button);
			if (!input) {
				return;
			}
			const d = { "-": -0.1, "+": 0.1 }[button.value] ?? 0;
			if (d === 0) {
				return;
			}
			input.value = (Number(input.value) + d).toFixed(4);
			if (onChangeValue) {
				onChangeValue(toLinearValue(Number(input.value), [min, max]));
			}
		},
		[onChangeValue, min, max],
	);
	return (
		<div className={classnames(css.container, className)}>
			<button type="button" className={IconClass} value="-" onClick={onClick}>
				zoom_out
			</button>
			<LogSlider {...props} />
			<button type="button" className={IconClass} value="+" onClick={onClick}>
				zoom_in
			</button>
		</div>
	);
};

const findSiblingRangeInput = (e: Element): HTMLInputElement | null => {
	for (const sibling of e.parentElement?.children ?? []) {
		if (isRangeInput(sibling)) {
			return sibling;
		}
	}
	return null;
};

const isRangeInput = (e: Element): e is HTMLInputElement =>
	e.tagName.toLowerCase() === "input" && e.getAttribute("type") === "range";
