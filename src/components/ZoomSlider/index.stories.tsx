import type { StoryObj } from "@storybook/react";
import { useState } from "react";
import { StoryView } from "../StoryView";
import { ZoomSlider } from ".";

const SampleApp = () => {
	const min = 0.1;
	const max = 5;
	const [z, setZ] = useState(1);
	return (
		<div>
			<ZoomSlider
				min={min}
				max={max}
				defaultValue={1}
				value={z}
				onChangeValue={setZ}
			/>
			<div>{(z * 100).toFixed(0)}%</div>
		</div>
	);
};

export const Default: StoryObj = {
	render: () => (
		<StoryView.Gallery>
			<StoryView.Heading>{ZoomSlider.name}</StoryView.Heading>
			<SampleApp />
		</StoryView.Gallery>
	),
};
