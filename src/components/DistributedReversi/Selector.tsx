import { isString } from "@nlib/typing";
import type { ChangeEvent, ReactNode } from "react";
import { useCallback } from "react";
import * as style from "./style.module.scss";

export interface DRSelectorProps<T extends number | string> {
	id: string;
	label: ReactNode;
	values: Iterable<T>;
	defaultValue?: string;
	onChange: ((value: string) => string) | ((value: string) => void);
}

export const DRSelector = <T extends number | string>({
	id,
	label,
	values,
	defaultValue,
	onChange: onChangeValue,
}: DRSelectorProps<T>) => {
	const onChange = useCallback(
		(e: ChangeEvent<HTMLSelectElement>) => {
			const returned = onChangeValue(e.currentTarget.value);
			if (isString(returned)) {
				e.currentTarget.value = returned;
			}
		},
		[onChangeValue],
	);
	return (
		<section className={style.selector}>
			<label htmlFor={id}>{label}</label>
			<select onChange={onChange} defaultValue={defaultValue}>
				{[
					...(function* () {
						for (const value of values) {
							yield (
								<option key={value} value={value}>
									{value === "" ? "選択" : value}
								</option>
							);
						}
					})(),
				]}
			</select>
		</section>
	);
};
