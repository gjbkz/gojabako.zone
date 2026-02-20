import { isSafeInteger } from "@nlib/typing";
import type { JotaiSelectorOpts } from "../../util/jotai/callback.ts";
import { cellAtom, messageBufferAtom } from "./jotai.app.ts";
import type {
	DRCellId,
	DRDiagonalDirection,
	DRDirection,
	DRMessage,
} from "./util.ts";
import {
	DRDirections,
	getAdjacentId,
	isDRDiagonalDirection,
	isDRDirection,
	toDRBufferId,
} from "./util.ts";

export const sendDRMessage = (
	opts: JotaiSelectorOpts,
	cellId: DRCellId,
	msg: DRMessage,
) => {
	const { mode } = msg;
	if (isDRDirection(mode)) {
		sendD(opts, cellId, msg, mode);
	} else if (isDRDiagonalDirection(mode)) {
		sendDD(opts, cellId, msg, mode);
	} else {
		spread(opts, cellId, msg);
	}
};

/** @returns 転送できれば true */
export const forwardDRMessage = (
	opts: JotaiSelectorOpts,
	cellId: DRCellId,
	msg: DRMessage,
	from: DRDirection,
): boolean => {
	const { ttl, mode } = msg;
	if (isSafeInteger(ttl) && !(0 < ttl)) {
		return false;
	}
	if (isDRDirection(mode)) {
		return sendD(opts, cellId, msg, mode);
	}
	if (isDRDiagonalDirection(mode)) {
		return sendDD(opts, cellId, msg, mode);
	}
	return spread(opts, cellId, msg, from);
};

const sendD = (
	{ get, set }: JotaiSelectorOpts,
	cellId: DRCellId,
	msg: DRMessage,
	d: DRDirection,
): boolean => {
	const adjacentId = getAdjacentId([cellId, d]);
	if (!get(cellAtom(adjacentId))) {
		return false;
	}
	const bufferId = toDRBufferId(cellId, d, "tx");
	set(messageBufferAtom(bufferId), (b) => [...b, msg]);
	return true;
};

const sendDD = (
	opts: JotaiSelectorOpts,
	cellId: DRCellId,
	msg: DRMessage,
	dd: DRDiagonalDirection,
): boolean => {
	const dx = Math.abs(msg.d[0]);
	const dy = Math.abs(msg.d[1]);
	if (dy < dx) {
		return sendD(opts, cellId, msg, dd[0] as DRDirection);
	}
	if (dx < dy) {
		return sendD(opts, cellId, msg, dd[1] as DRDirection);
	}
	return sendToLeastLoadedBuffer(opts, cellId, msg, dd);
};

/** 斜め方向で dx === dy の場合、バッファが少ない方向を選ぶ */
const sendToLeastLoadedBuffer = (
	{ get, set }: JotaiSelectorOpts,
	cellId: DRCellId,
	msg: DRMessage,
	dd: DRDiagonalDirection,
): boolean => {
	let min: [number, DRDirection] | null = null;
	for (const d of dd as Iterable<DRDirection>) {
		if (get(cellAtom(getAdjacentId([cellId, d])))) {
			const count = get(
				messageBufferAtom(toDRBufferId(cellId, d, "tx")),
			).length;
			if (!min || count < min[0]) {
				min = [count, d];
			}
		}
	}
	if (!min) {
		return false;
	}
	set(messageBufferAtom(toDRBufferId(cellId, min[1], "tx")), (b) => [
		...b,
		msg,
	]);
	return true;
};

const spread = (
	opts: JotaiSelectorOpts,
	cellId: DRCellId,
	msg: DRMessage,
	...exclude: Array<DRDirection>
): boolean => {
	const targets = new Set(DRDirections);
	for (const d of exclude) {
		targets.delete(d);
	}
	let sent = false;
	for (const d of targets) {
		if (sendD(opts, cellId, msg, d)) {
			sent = true;
		}
	}
	return sent;
};
