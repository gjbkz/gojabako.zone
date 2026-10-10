// template.yaml の __FUNCTION_CODE__ を function.js の中身で置き換えて標準出力に書く。
// 使い方: node infra/front/render.ts > front.yaml
import { readFileSync } from "node:fs";

const read = (name: string) =>
	readFileSync(new URL(name, import.meta.url), "utf8");

const template = read("template.yaml");
const code = read("function.js");
const rendered = template.replace(
	/^( *)__FUNCTION_CODE__$/m,
	(_, indent: string) =>
		code
			.trimEnd()
			.split("\n")
			.map((line) => (line ? `${indent}${line}` : ""))
			.join("\n"),
);
if (rendered === template) {
	throw new Error("__FUNCTION_CODE__ was not found in template.yaml");
}
process.stdout.write(rendered);
