import { SKIP } from "unist-util-visit";
import type { VFileLike } from "../unified.ts";
import {
	createFragmentRef,
	createFragmentTarget,
	createHastElement,
} from "./createHastElement.ts";
import type { HastElementVisitor } from "./visitHastElement.ts";

export const visitArticleTable = (
	_file: VFileLike,
	_tasks: Array<Promise<void>>,
): HastElementVisitor => {
	let tableCount = 0;
	return (e, index, parent) => {
		const id = `table${++tableCount}`;
		parent.children.splice(
			index,
			1,
			createHastElement(
				"figure",
				{ dataType: "table" },
				createFragmentTarget(id),
				createHastElement(
					"figcaption",
					{},
					createHastElement("span", {}),
					createFragmentRef(id),
				),
				e,
			),
		);
		return SKIP;
	};
};
