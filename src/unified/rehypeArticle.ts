import type { Element, Node, Root } from "hast";
import { find } from "unist-util-find";
import { hasClass } from "../util/rehype/className.ts";
import { createMdxEsm } from "../util/rehype/createMdxJsEsm.ts";
import { insertArticleData } from "../util/rehype/insertArticleData.ts";
import { isHastElement } from "../util/rehype/isHastElement.ts";
import { visitArticleA } from "../util/rehype/visitArticleA.ts";
import { visitArticleHeading } from "../util/rehype/visitArticleHeading.ts";
import { visitArticleImg } from "../util/rehype/visitArticleImg.ts";
import { visitArticleLi } from "../util/rehype/visitArticleLi.ts";
import { visitArticlePre } from "../util/rehype/visitArticlePre.ts";
import { visitArticleSpan } from "../util/rehype/visitArticleSpan.ts";
import { visitArticleSup } from "../util/rehype/visitArticleSup.ts";
import { visitArticleTable } from "../util/rehype/visitArticleTable.ts";
import { visitHastElement } from "../util/rehype/visitHastElement.ts";
import type { VFileLike } from "../util/unified.ts";

export const rehypeArticle = () => async (tree: Root, file: VFileLike) => {
	const tasks: Array<Promise<void>> = [];
	visitHastElement(tree, {
		span: visitArticleSpan(file, tasks),
		sup: visitArticleSup(file, tasks),
		li: visitArticleLi(file, tasks),
		h1: visitArticleHeading(file, tasks),
		h2: visitArticleHeading(file, tasks),
		h3: visitArticleHeading(file, tasks),
		h4: visitArticleHeading(file, tasks),
		h5: visitArticleHeading(file, tasks),
		h6: visitArticleHeading(file, tasks),
		pre: visitArticlePre(file, tasks),
		table: visitArticleTable(file, tasks),
		img: visitArticleImg(file, tasks),
		a: visitArticleA(file, tasks),
	});
	await Promise.all(tasks);
	insertArticleData(tree, file);
	insertKatexStyle(tree);
	return tree;
};

/** 数式があるページだけで KaTeX の CSS を読み込みます。 */
const insertKatexStyle = (tree: Root) => {
	const katex = find<Element>(
		tree,
		(n: Element | Node) => isHastElement(n) && hasClass(n, "katex"),
	);
	if (katex) {
		tree.children.unshift(createMdxEsm('import "katex/dist/katex.min.css";'));
	}
};
