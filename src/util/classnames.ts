type ClassNameEntry = Array<ClassNameEntry> | string | false | null | undefined;

export const classnames = (...args: Array<ClassNameEntry>) =>
	[...new Set(list(args))].join(" ");

const list = function* (entries: Array<ClassNameEntry>): Generator<string> {
	for (const entry of entries) {
		if (Array.isArray(entry)) {
			yield* list(entry);
		} else if (typeof entry === "string") {
			for (const className of entry.split(/\s+/)) {
				if (className) {
					yield className;
				}
			}
		}
	}
};

export const IconClass = "material-symbols-rounded";

/** コードブロックで URL のハッシュが指す行に付けるクラス */
export const hashHitClassName = "hash-hit";
