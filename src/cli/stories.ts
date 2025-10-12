import * as console from "node:console";
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { watch } from "chokidar";
import { componentsDir, rootDir } from "../util/node/directories.ts";
import { walkFiles } from "../util/node/walkFiles.ts";
import { noop } from "../util/noop.ts";

const cliName = import.meta.url.slice(rootDir.href.length);
const dest = new URL("Storybook/all.ts", componentsDir);
const storySuffix = "/index.stories.tsx";
const storyFiles = new Set<string>();
const componentsDirPath = fileURLToPath(componentsDir);

const onError = (error: unknown) => {
	console.error(error);
};

const generate = async () => {
	let code = "";
	code += 'import type { StoryObj } from "@storybook/react";\n';
	let count = 0;
	const groupNames = new Map<string, string>();
	for (const filePath of [...storyFiles].sort((a, b) => (a < b ? -1 : 1))) {
		const relativePath = filePath.slice(componentsDirPath.length);
		const name = `g${++count}`;
		groupNames.set(relativePath.slice(0, -storySuffix.length), name);
		const source = `../${relativePath}`;
		code += `import * as ${name} from "${source}";\n`;
	}
	code += "\ntype Stories = Record<string, StoryObj>;\n";
	code += "export const storyGroups = new Map<string, Stories>();\n";
	for (const [relativePath, name] of groupNames) {
		code += `storyGroups.set("${relativePath}", ${name} as Stories);\n`;
	}
	await writeFile(dest, code);
	console.info(
		`${cliName}: Generated ${dest.pathname.slice(rootDir.pathname.length)}`,
	);
	return dest;
};

if (process.argv.includes("--watch")) {
	let timerId = setTimeout(noop);
	const update = () => {
		clearTimeout(timerId);
		timerId = setTimeout(() => {
			generate().catch(onError);
		}, 100);
	};
	const onChange = (filePath: string) => {
		if (filePath.endsWith(storySuffix)) {
			storyFiles.add(filePath);
			update();
		}
	};
	const onUnlink = (filePath: string) => {
		if (filePath.endsWith(storySuffix)) {
			storyFiles.delete(filePath);
			update();
		}
	};
	watch(fileURLToPath(componentsDir), { ignoreInitial: false })
		.on("add", onChange)
		.on("change", onChange)
		.on("unlink", onUnlink);
} else {
	for await (const file of walkFiles(componentsDir)) {
		const filePath = fileURLToPath(file);
		if (filePath.endsWith(storySuffix)) {
			storyFiles.add(filePath);
		}
	}
	await generate();
	console.info(`${cliName}: done`);
}
