// template.yaml のプレースホルダーをコードの中身で置き換えて標準出力に書く。
// __FUNCTION_CODE__ → function.js（CloudFront Function）、__HEALTH_CODE__ → health.js（Lambda）
// 使い方: node infra/front/render.ts > front.yaml
import { readFileSync } from "node:fs";

const read = (name: string) =>
	readFileSync(new URL(name, import.meta.url), "utf8");

const embed = (template: string, placeholder: string, file: string) => {
	const code = read(file);
	const rendered = template.replace(
		new RegExp(`^( *)${placeholder}$`, "m"),
		(_, indent: string) =>
			code
				.trimEnd()
				.split("\n")
				.map((line) => (line ? `${indent}${line}` : ""))
				.join("\n"),
	);
	if (rendered === template) {
		throw new Error(`${placeholder} was not found in template.yaml`);
	}
	return rendered;
};

process.stdout.write(
	embed(
		embed(read("template.yaml"), "__FUNCTION_CODE__", "function.js"),
		"__HEALTH_CODE__",
		"health.js",
	),
);
