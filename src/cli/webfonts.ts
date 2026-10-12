import { mkdir, readdir, rm, writeFile } from "node:fs/promises";
import { rootDir, srcDir } from "../util/node/directories.ts";

/**
 * Google Fonts から Roboto Mono と Material Symbols Rounded をダウンロードし、
 * src/fonts/ に woff2 と CSS を書き出します。ビルドでは実行せず、
 * フォントやアイコンを変えたいときに手動で実行して結果をコミットします。
 *
 * npm run webfonts
 */

const cliName = import.meta.url.slice(rootDir.href.length);
const destDir = new URL("fonts/", srcDir);
/** woff2 を返してもらうためのUser-Agent */
const userAgent =
	"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36";

/**
 * サイトで使っているアイコン名。アイコンを追加したらここに足して再実行します。
 * 使っていないアイコンを含めないことでフォントを数KBに抑えています。
 */
const iconNames = [
	"arrow_insert",
	"cloud",
	"cloud_done",
	"delete",
	"download",
	"downloading",
	"north_east",
	"pause_circle",
	"play_circle",
	"public",
	"refresh",
	"remove",
	"width",
	"zoom_in",
	"zoom_out",
];

const families = [
	{
		name: "roboto-mono",
		query: "family=Roboto+Mono:ital,wght@0,100..700;1,100..700&display=swap",
	},
	{
		name: "material-symbols-rounded",
		query: `family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&icon_names=${[...iconNames].sort().join(",")}&display=block`,
	},
];

const fetchOk = async (url: string) => {
	const res = await fetch(url, { headers: { "user-agent": userAgent } });
	if (!res.ok) {
		throw new Error(`${res.status} ${res.statusText}: ${url}`);
	}
	return res;
};

await mkdir(destDir, { recursive: true });
for (const file of await readdir(destDir)) {
	if (file.endsWith(".woff2")) {
		await rm(new URL(file, destDir));
	}
}
const cssChunks: Array<string> = [
	"/* npm run webfonts で生成しています。手で編集しないでください。 */",
];
for (const { name, query } of families) {
	const css = await (
		await fetchOk(`https://fonts.googleapis.com/css2?${query}`)
	).text();
	let result = css;
	for (const match of css.matchAll(
		/(?:\/\* ([\w-]+) \*\/\s*)?@font-face\s*\{([^}]*)\}/g,
	)) {
		const [, subset, block] = match;
		const url = /url\((https:[^)]+)\)/.exec(block)?.[1];
		if (!url) {
			continue;
		}
		const style = /font-style: (\w+)/.exec(block)?.[1] ?? "normal";
		const fileName = `${[name, style, subset].filter(Boolean).join("-")}.woff2`;
		const data = await (await fetchOk(url)).arrayBuffer();
		await writeFile(new URL(fileName, destDir), Buffer.from(data));
		console.info(`${cliName}: ${fileName} (${data.byteLength} bytes)`);
		result = result.replace(url, `./${fileName}`);
	}
	cssChunks.push(result.trim());
}
await writeFile(new URL("webfonts.css", destDir), `${cssChunks.join("\n")}\n`);
console.info(`${cliName}: done`);
