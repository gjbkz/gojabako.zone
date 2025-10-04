import type { StoryObj } from "@storybook/react";
import {
	type CSSProperties,
	Fragment,
	type HTMLAttributes,
	useState,
} from "react";
import { StoryView } from "../StoryView";
import { LogSlider } from ".";

const values = [1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024];
const min = values[0];
const max = values[values.length - 1];
const LogSliderSample = ({ row: defaultValue }: { row: number }) => {
	const [value, setValue] = useState(defaultValue);
	return (
		<Fragment>
			<LogSlider
				min={min}
				max={max}
				defaultValue={defaultValue}
				onChangeValue={setValue}
			/>
			<div style={{ justifySelf: "end" }}>{value.toFixed(3)}</div>
		</Fragment>
	);
};

const dlStyle: CSSProperties = { justifyContent: "stretch" };
const cellProps: HTMLAttributes<HTMLElement> = {
	style: {
		justifySelf: "stretch",
		gridTemplateColumns: "1fr",
	},
};

export const Default: StoryObj = {
	render: () => (
		<StoryView.Gallery>
			<StoryView.Heading>{LogSlider.name}</StoryView.Heading>
			<StoryView.Rows
				rows={values.map((v) => [v, v])}
				render={LogSliderSample}
				style={dlStyle}
				cellProps={cellProps}
			/>
		</StoryView.Gallery>
	),
};
