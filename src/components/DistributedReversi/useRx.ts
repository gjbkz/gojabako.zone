import { useAtomValue } from "jotai";
import { useAtomCallback } from "jotai/utils";
import { useCallback, useEffect } from "react";
import type { JotaiSelectorOpts } from "../../util/jotai/callback.ts";
import { noop } from "../../util/noop.ts";
import { cellAtom, messageBufferAtom, rxDelayMsAtom } from "./jotai.app.ts";
import { forwardDRMessage, sendDRMessage } from "./jotai.send.ts";
import type {
	DRBufferId,
	DRCell,
	DRCellId,
	DRDiagonalDirection,
	DRDirection,
	DRMessage,
	DRMessageMap,
	DRMessageType,
} from "./util.ts";
import {
	chessboardDistance,
	DRAdjacentStep,
	generateMessageProps,
	isDRDiagonalDirection,
	isOpenableDRMessage,
} from "./util.ts";

export const useRx = (bufferId: DRBufferId) => {
	const receive = useReceive(bufferId);
	const buffer = useAtomValue(messageBufferAtom(bufferId));
	const delayMs = useAtomValue(rxDelayMsAtom);
	useEffect(() => {
		if (buffer.length === 0) {
			return noop;
		}
		const timerId = setTimeout(() => receive(buffer), delayMs);
		return () => clearTimeout(timerId);
	}, [buffer, receive, delayMs]);
};

// 各セルの受信済みメッセージID集合（重複排除・無限ループ防止）
const getReceived = (() => {
	const cache = new Map<DRCellId, Set<string>>();
	return (cellId: DRCellId): Set<string> => {
		let set = cache.get(cellId);
		if (!set) {
			set = new Set();
			cache.set(cellId, set);
		}
		return set;
	};
})();

const useReceive = (bufferId: DRBufferId) =>
	useAtomCallback(
		useCallback(
			(get, set, buffer: Array<DRMessage>) => {
				const opts: JotaiSelectorOpts = { get, set };
				const buf = buffer.slice();
				const msg = buf.shift();
				set(messageBufferAtom(bufferId), buf);
				if (!msg) {
					return;
				}
				const [cellId, from] = bufferId;
				const received = getReceived(cellId);
				if (received.has(msg.id)) {
					return;
				}
				received.add(msg.id);
				const cell = get(cellAtom(cellId));
				if (!cell) {
					return;
				}
				if (isOpenableDRMessage(msg)) {
					const receiver = receivers[msg.type] as Receiver<DRMessage>;
					if (!receiver(opts, cellId, cell, msg, from)) {
						return;
					}
				}
				if (!forwardDRMessage(opts, cellId, msg, from)) {
					const terminator = terminators[msg.type] as
						| Receiver<DRMessage>
						| undefined;
					terminator?.(opts, cellId, cell, msg, from);
				}
			},
			[bufferId],
		),
	);

/** @returns 転送が必要なら true */
type Receiver<T extends DRMessage> = (
	opts: JotaiSelectorOpts,
	cellId: DRCellId,
	cell: DRCell,
	msg: T,
	from: DRDirection,
) => boolean;

const receivers: { [K in DRMessageType]: Receiver<DRMessageMap[K]> } = {
	connect: ({ set }, cellId, cell, { payload }) => {
		set(cellAtom(cellId), { ...cell, shared: payload });
		return false;
	},
	reversi1: (opts, cellId, cell, msg) => {
		const { payload } = msg;
		if (cell.state === payload.state) {
			// 同じ色のセルを見つけた → reversi2（確定）を発信元方向へ送信
			const mode = getAnswerDirection(msg.d);
			if (mode) {
				sendDRMessage(opts, cellId, {
					...generateMessageProps(),
					type: "reversi2",
					mode,
					payload: payload.state,
					ttl: chessboardDistance(msg.d),
				});
			}
			return false;
		}
		// 違う色 → pending にセットして reversi1 を転送
		opts.set(cellAtom(cellId), { ...cell, pending: payload.state });
		return true;
	},
	reversi2: ({ set }, cellId, cell, msg) => {
		set(cellAtom(cellId), {
			...cell,
			state: msg.payload ?? cell.state,
			pending: null,
		});
		return true;
	},
	setShared: ({ set }, cellId, cell, msg) => {
		set(cellAtom(cellId), { ...cell, shared: msg.payload });
		return true;
	},
};

/** reversi1 が盤端に到達した際の終端処理 */
const terminators: { [K in DRMessageType]?: Receiver<DRMessageMap[K]> } = {
	reversi1: (opts, cellId, cell, msg, from) => {
		const mode = getAnswerDirection(msg.d);
		if (!mode) {
			return false;
		}
		// 斜め方向で dx !== dy の場合、折返し起点を補正する
		let d: [number, number] = [0, 0];
		if (
			isDRDiagonalDirection(mode) &&
			Math.abs(msg.d[0]) !== Math.abs(msg.d[1])
		) {
			d = DRAdjacentStep[mode.replace(from, "") as DRDirection];
		}
		sendDRMessage(opts, cellId, {
			...generateMessageProps(),
			d,
			type: "reversi2",
			mode,
			payload: null,
			ttl: chessboardDistance(msg.d),
		});
		opts.set(cellAtom(cellId), { ...cell, pending: null });
		return false;
	},
};

/**
 * 変位ベクトル [dx, dy] から発信元（クリックしたセル）への方向を逆算する。
 * reversi2 を正しい向きで返すために使う。
 */
const getAnswerDirection = ([dx, dy]: [number, number]):
	| DRDiagonalDirection
	| DRDirection
	| null => {
	const v = dy < 0 ? "n" : "s";
	const h = dx < 0 ? "e" : "w";
	if (dx === 0) {
		return dy === 0 ? null : v;
	}
	if (dy === 0) {
		return h;
	}
	return `${v}${h}`;
};
