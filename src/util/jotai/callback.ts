import type { Getter, Setter } from "jotai";

/**
 * useAtomCallback の (get, set) と同じ型。
 * jotai.send.ts や useRx.ts の純関数に渡すことで、
 * フック外でも複数 atom を読み書きできる。
 */
export interface JotaiSelectorOpts {
	get: Getter;
	set: Setter;
}
