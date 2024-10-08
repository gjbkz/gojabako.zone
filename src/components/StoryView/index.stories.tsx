import type { StoryObj } from "@storybook/react";
import { StoryView } from ".";

export const Default: StoryObj = {
	render: () => (
		<StoryView.Gallery>
			<StoryView.Heading>{StoryView.Columns.name}</StoryView.Heading>
			<StoryView.Columns
				columns={{ 1: "C1", 2: "C2", 3: "C3" }}
				render={({ column }) => `Column ${column}`}
			/>
			<StoryView.Heading>{StoryView.Rows.name}</StoryView.Heading>
			<StoryView.Rows
				rows={{ 1: "R1", 2: "R2", 3: "R3" }}
				render={({ row }) => `Row ${row}`}
			/>
			<StoryView.Heading>{StoryView.Table.name}</StoryView.Heading>
			<StoryView.Table
				title="タイトル"
				columns={{ 1: "C1", 2: "C2", 3: "C3" }}
				rows={{ 1: "R1", 2: "R2", 3: "R3" }}
				render={({ column, row }) => `Table ${column}, ${row}`}
			/>
		</StoryView.Gallery>
	),
};
