import { copyFile, mkdir } from "node:fs/promises";
import { rootDir } from "../util/node/directories.ts";
import { walkFiles } from "../util/node/walkFiles.ts";

const cliName = import.meta.url.slice(rootDir.href.length);
const fontDir = new URL("node_modules/@fontsource/noto-sans-jp/", rootDir);
const fontFilesDir = new URL("files/", fontDir);
const destDir = new URL("public/fonts/noto-sans-jp/", rootDir);

await mkdir(destDir, { recursive: true });
for await (const src of walkFiles(fontFilesDir)) {
	if (!/files\/noto-sans-jp-\d+-\d+-\w+|\.woff2$/.test(src.pathname)) {
		const filePath = src.pathname.slice(fontFilesDir.pathname.length).slice(13);
		console.info(`${cliName}: ${filePath}`);
		const dest = new URL(filePath, destDir);
		await copyFile(src, dest);
	}
}
console.info(`${cliName}: done`);
