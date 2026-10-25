declare module "@storybook/react" {
	import type { FunctionComponent, ReactElement } from "react";

	interface ReactRenderer<P> {
		component: FunctionComponent<P>;
		storyResult: ReactElement<unknown>;
		canvasElement: HTMLElement;
	}

	export interface Story<P = object> {
		render?: ArgsStoryFn<ReactRenderer<P>, []>;
	}

	export type StoryObj<C = ComponentType> =
		C extends ComponentType<infer P> ? Story<P> : never;
}

declare module "vlq" {
	export function decode(string: string): number[];
	export function encode(value: number | number[]): string;
}
