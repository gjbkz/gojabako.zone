import type { StoryObj } from "@storybook/react";
import { StoryView } from "../StoryView";
import { PrimaryButton, SecondaryButton, TextButton } from ".";

const buttons = {
	Primary: PrimaryButton,
	Secondary: SecondaryButton,
	Text: TextButton,
};

export const Default: StoryObj = {
	render: () => (
		<StoryView.Gallery>
			<StoryView.Heading>Button</StoryView.Heading>
			<StoryView.Table
				title="状態・種類"
				columns={buttons}
				rows={
					{
						default: {},
						hover: { state: "hover" },
						active: { state: "active" },
						focus: { state: "focus" },
						disabled: { disabled: true },
						icon1: { icon: "download" },
						icon2: { icon: "downloading" },
					} as const
				}
				render={({ column: Button, row }) => <Button {...row}>Button</Button>}
			/>
			<StoryView.Table
				title="長いテキスト"
				columns={buttons}
				rows={
					{
						Long: "Lorem ipsum dolor sit amet",
						LongCJK: "テキストが長いボタンは作らない",
					} as const
				}
				render={({ column: Button, row }) => <Button>{row}</Button>}
			/>
		</StoryView.Gallery>
	),
};
