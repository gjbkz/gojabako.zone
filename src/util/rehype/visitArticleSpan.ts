import type { Element, Node } from "hast";
import { find } from "unist-util-find";
import { SKIP } from "unist-util-visit";
import type { VFileLike } from "../unified.ts";
import { addClass, hasClass } from "./className.ts";
import {
	createFragmentRef,
	createFragmentTarget,
	createHastElement,
} from "./createHastElement.ts";
import { isHastElement } from "./isHastElement.ts";
import type { HastElementVisitor } from "./visitHastElement.ts";
import { visitHastElement } from "./visitHastElement.ts";

const findKatexHtml = (span: Element) =>
	find<Element>(
		span,
		(n: Element | Node) => isHastElement(n) && hasClass(n, "katex-html"),
	);

export const visitArticleSpan = (
	_file: VFileLike,
	_tasks: Array<Promise<void>>,
): HastElementVisitor => {
	let mathCount = 0;
	let equationCount = 0;
	return (span, index, parent) => {
		if (hasClass(span, "katex-display")) {
			const id = `math${++mathCount}`;
			const katexHtml = findKatexHtml(span);
			if (katexHtml) {
				addClass(katexHtml, "katex");
				parent.children.splice(
					index,
					1,
					createHastElement(
						"figure",
						{ dataType: "math" },
						createFragmentTarget(id),
						createHastElement(
							"figcaption",
							{},
							createHastElement("span", {}),
							createFragmentRef(id),
						),
						katexHtml,
					),
				);
				visitHastElement(katexHtml, {
					span: (e) => {
						if (isHastElement(e, "span", "eqn-num")) {
							const equationId = `eq${++equationCount}`;
							e.children.push(
								createFragmentTarget(equationId),
								createFragmentRef(equationId, `(${equationCount})`),
							);
						}
					},
				});
			}
			return SKIP;
		}
		if (hasClass(span, "katex")) {
			const katexHtml = findKatexHtml(span);
			if (katexHtml) {
				addClass(katexHtml, "katex");
				parent.children.splice(index, 1, katexHtml);
			}
			return SKIP;
		}
		return null;
	};
};
