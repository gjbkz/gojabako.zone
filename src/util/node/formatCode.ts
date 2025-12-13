import {
	Biome,
	Distribution,
	type FormatContentOptions,
} from "@biomejs/js-api";

let biome: Biome | null = null;

export const formatCode = async (
	code: string,
	options: FormatContentOptions,
): Promise<string> => {
	if (biome === null) {
		biome = await Biome.create({ distribution: Distribution.NODE });
	}
	return biome.formatContent(1, code, options).content;
};
