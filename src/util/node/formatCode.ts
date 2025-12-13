import { fileURLToPath } from "node:url";
import {
	Biome,
	Distribution,
	type FormatContentOptions,
} from "@biomejs/js-api";
import { rootDir } from "./directories.ts";

let biome: Biome | null = null;
export const formatCode = async (
	code: string,
	options: FormatContentOptions,
): Promise<string> => {
	if (biome === null) {
		biome = await Biome.create({ distribution: Distribution.NODE });
	}
	const projectPath = fileURLToPath(rootDir);
	const { projectKey } = biome.openProject(projectPath);
	return biome.formatContent(projectKey, code, options).content;
};
