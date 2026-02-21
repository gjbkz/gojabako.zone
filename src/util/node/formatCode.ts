import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { rootDir } from "./directories.ts";

export const formatCode = async (
	code: string,
	options: { filePath: string },
): Promise<string> => {
	const result = spawnSync(
		"node_modules/.bin/biome",
		["format", `--stdin-file-path=${options.filePath}`],
		{ input: code, encoding: "utf8", cwd: fileURLToPath(rootDir) },
	);
	if (result.status !== 0) {
		throw new Error(`Biome format failed: ${result.stderr}`);
	}
	return result.stdout;
};
