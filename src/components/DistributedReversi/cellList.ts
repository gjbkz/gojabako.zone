import { isSafeInteger } from "@nlib/typing";
import { decode, encode } from "vlq";
import type { DRCellId } from "./util.ts";
import { toDRCellId } from "./util.ts";

export const encodeCellList = (cellList: Set<DRCellId>): string => {
	const limits = getBoundingLimits(cellList);
	const vlq = encode([...listRunLengths(cellList, limits)]);
	return `${1 + limits[2] - limits[0]}w${1 + limits[3] - limits[1]}h${vlq}`;
};

export const decodeCellList = function* (encoded: string): Generator<DRCellId> {
	const matched = /^(\d+)w(\d+)h(.*)$/.exec(encoded);
	if (matched) {
		const wh: [number, number] = [0, 0];
		for (let i = 0; i < 2; i++) {
			const value = Number(matched[i + 1]);
			if (!isSafeInteger(value)) {
				return;
			}
			wh[i] = value;
		}
		const [w, h] = wh;
		const x = Math.round(w / -2);
		const y = Math.round(h / -2);
		let state = true;
		let pos = 0;
		for (const length of decode(matched[3])) {
			const endPos = pos + length;
			if (state) {
				while (pos < endPos) {
					yield toDRCellId(x + (pos % w), y + Math.floor(pos / w));
					pos++;
				}
			}
			pos = endPos;
			state = !state;
		}
		if (state) {
			const endPos = w * h;
			while (pos < endPos) {
				yield toDRCellId(x + (pos % w), y + Math.floor(pos / w));
				pos++;
			}
		}
	}
};

type Limits = [number, number, number, number];

const getBoundingLimits = (cellList: Iterable<DRCellId>): Limits => {
	let minX = Number.POSITIVE_INFINITY;
	let maxX = Number.NEGATIVE_INFINITY;
	let minY = Number.POSITIVE_INFINITY;
	let maxY = Number.NEGATIVE_INFINITY;
	for (const [x, y] of cellList) {
		if (x < minX) {
			minX = x;
		}
		if (maxX < x) {
			maxX = x;
		}
		if (y < minY) {
			minY = y;
		}
		if (maxY < y) {
			maxY = y;
		}
	}
	return [minX, minY, maxX, maxY];
};

const listRunLengths = function* (
	cellList: Set<DRCellId>,
	[minX, minY, maxX, maxY]: Limits,
): Generator<number> {
	let runLength = 0;
	let lastState = true;
	for (let y = minY; y <= maxY; y++) {
		for (let x = minX; x <= maxX; x++) {
			const state = cellList.has(toDRCellId(x, y));
			if (lastState === state) {
				runLength++;
			} else {
				yield runLength;
				lastState = state;
				runLength = 1;
			}
		}
	}
};
