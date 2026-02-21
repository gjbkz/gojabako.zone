import { useAtomValue } from "jotai";
import { useAtomCallback } from "jotai/utils";
import { useCallback, useEffect } from "react";
import { noop } from "../../util/noop.ts";
import { cellAtom, messageBufferAtom, txDelayMsAtom } from "./jotai.app.ts";
import type { DRBufferId } from "./util.ts";
import {
	DRAdjacentStep,
	getAdjacentId,
	isOpenableDRMessage,
	OppositeDRDirection,
	toDRBufferId,
} from "./util.ts";

export const useTx = (bufferId: DRBufferId) => {
	const transmit = useTransmit(bufferId);
	const txBufferLength = useAtomValue(messageBufferAtom(bufferId)).length;
	const delayMs = useAtomValue(txDelayMsAtom);
	useEffect(() => {
		if (txBufferLength === 0) {
			return noop;
		}
		const timerId = setTimeout(transmit, delayMs);
		return () => clearTimeout(timerId);
	}, [txBufferLength, transmit, delayMs]);
};

const useTransmit = (bufferId: DRBufferId) =>
	useAtomCallback(
		useCallback(
			(get, set) => {
				const buf = get(messageBufferAtom(bufferId)).slice();
				const tMsg = buf.shift();
				set(messageBufferAtom(bufferId), buf);
				if (!tMsg) {
					return;
				}
				const adjacentId = getAdjacentId(bufferId);
				if (!get(cellAtom(adjacentId))) {
					return;
				}
				const d = bufferId[1];
				// セル境界を渡るたびに変位ベクトルを加算する
				const rMsg = {
					...tMsg,
					d: [
						tMsg.d[0] + DRAdjacentStep[d][0],
						tMsg.d[1] + DRAdjacentStep[d][1],
					] as [number, number],
				};
				// TTL を持つメッセージで開封条件を満たす場合のみ TTL を減算する
				if (rMsg.ttl && isOpenableDRMessage(rMsg)) {
					rMsg.ttl -= 1;
				}
				const rxBufferId = toDRBufferId(
					adjacentId,
					OppositeDRDirection[d],
					"rx",
				);
				set(messageBufferAtom(rxBufferId), (b) => [...b, rMsg]);
			},
			[bufferId],
		),
	);
