import Link from "next/link";
import type { ReactNode } from "react";
import { classnames } from "../../util/classnames.ts";
import { storyGroups } from "./all.ts";
import * as style from "./style.module.scss";

interface StorybookNavProps {
	currentPath?: string;
}

export const StorybookNav = ({ currentPath = "" }: StorybookNavProps) => (
	<nav className={style.list}>{[...listItems(currentPath)]}</nav>
);

const listItems = function* (currentPath: string): Generator<ReactNode> {
	for (const [group, stories] of storyGroups) {
		const groupPath = group.split("_").join("/");
		for (const name of Object.keys(stories)) {
			let storyPath = groupPath;
			if (name !== "Default") {
				storyPath += `/${name}`;
			}
			const active = currentPath === storyPath;
			yield (
				<Link
					key={storyPath}
					href={`/app/components/${storyPath}`}
					className={classnames(active && style.active)}
				>
					{storyPath}
				</Link>
			);
		}
	}
};
