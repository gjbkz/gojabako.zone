import { isObject } from "@nlib/typing";

interface IgnoreConfig {
	/** @default true */
	throw?: boolean;
}

export const ignoreENOENT =
	({ throw: throwError = true }: IgnoreConfig = {}) =>
	(error: unknown) => {
		if (!isObject(error) || error.code !== "ENOENT") {
			if (throwError) {
				throw error;
			}
			console.error(error);
		}
		return null;
	};
