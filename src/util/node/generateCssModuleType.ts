import { readFile, writeFile } from "node:fs/promises";
import type { AtRule, Document, Root, Rule } from "postcss";
import postcss from "postcss";
import parseSelector from "postcss-selector-parser";

export const generateCssModuleType = async (
	scssFilePath: string,
	localByDefault = true,
) => {
	const { root } = await postcss().process(
		await readFile(scssFilePath, "utf-8"),
	);
	const dest = `${scssFilePath}.d.ts`;
	await writeFile(
		dest,
		generateTypeDefinition(listLocalNames(root, localByDefault)),
	);
	return dest;
};

export const listLocalNames = function* (
	container: AtRule | Root | Rule | Document,
	isLocal: boolean,
): Generator<string> {
	const yielded = new Set<string>();
	for (const selector of listSelectors(container)) {
		const root = parseSelector().astSync(selector, { lossless: false });
		for (const name of listLocalNamesInSelector(root, isLocal)) {
			if (!yielded.has(name)) {
				yield name;
				yielded.add(name);
			}
		}
	}
};

export const listSelectors = function* (
	container: AtRule | Root | Rule | Document,
): Generator<string> {
	const selectors = new Set<string>();
	if ("selector" in container) {
		const root = parseSelector().astSync(container.selector, {
			lossless: false,
		});
		for (const node of root.nodes) {
			const selector = node.toString();
			selectors.add(selector);
			yield selector;
		}
	}
	if (!container.nodes) {
		return;
	}
	for (const child of container.nodes) {
		if ("nodes" in child) {
			for (const s of listSelectors(child)) {
				if (selectors.size === 0) {
					yield s;
				} else {
					for (const parent of selectors) {
						yield `${parent}${s.startsWith("&") ? s.slice(1) : ` ${s}`}`;
					}
				}
			}
		}
	}
};

export const listLocalNamesInSelector = function* (
	container: parseSelector.Container | parseSelector.Root,
	isLocal: boolean,
): Generator<string> {
	let currentIsLocal = isLocal;
	for (const node of container.nodes) {
		switch (node.type) {
			case "root":
			case "selector":
				yield* listLocalNamesInSelector(node, currentIsLocal);
				break;
			case "class":
				if (currentIsLocal) {
					yield node.value;
				}
				break;
			case "pseudo":
				switch (node.value) {
					case ":global":
						if (0 < node.nodes.length) {
							for (const c of node.nodes) {
								yield* listLocalNamesInSelector(c, false);
							}
						} else {
							currentIsLocal = false;
						}
						break;
					case ":local":
						if (0 < node.nodes.length) {
							for (const c of node.nodes) {
								yield* listLocalNamesInSelector(c, true);
							}
						} else {
							currentIsLocal = true;
						}
						break;
					default:
				}
				break;
			default:
		}
	}
};

export const generateTypeDefinition = (localNames: Iterable<string>) => {
	let code = "";
	for (let name of localNames) {
		name = name.replace(/-+([a-z])/g, (_, c: string) => c.toUpperCase());
		code += `export declare const ${name}: string;\n`;
	}
	return code;
};
