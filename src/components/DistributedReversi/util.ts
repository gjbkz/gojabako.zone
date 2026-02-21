import type { Nominal } from "@nlib/typing";
import { isNonNegativeSafeInteger, typeChecker } from "@nlib/typing";

export const zoom = { min: 40, max: 200 };
export type DRPlayerId = Nominal<number, "DRPlayerId">;
export const isDRPlayerId = typeChecker<DRPlayerId>(
	(input: unknown): input is DRPlayerId => isNonNegativeSafeInteger(input),
);
/** この値は描画用で、実機では使えないことに注意します */
export type DRCellId = Nominal<[number, number], "DRCellId">;
export const toDRCellId = (() => {
	const cache = new Map<string, DRCellId>();
	return (x1: number, y1: number) => {
		const x = Math.round(x1);
		const y = Math.round(y1);
		const key = `${x},${y}`;
		let cached = cache.get(key);
		if (!cached) {
			cached = [x, y] as DRCellId;
			cache.set(key, cached);
		}
		return cached;
	};
})();
export type DRInitialStateType = Nominal<"N", "DRState">;
export const DRInitialState = "N" as DRInitialStateType;
export type DRCellState = DRInitialStateType | DRPlayerId;
export interface DRSharedState {
	state: DRPlayerId;
	playerCount: number;
}
export interface DRCell {
	state: DRCellState;
	pending: DRPlayerId | null;
	shared: DRSharedState;
}
export const defaultDRCell = (): DRCell => ({
	pending: null,
	state: DRInitialState,
	shared: { state: InitialDRPlayerId, playerCount: 2 },
});
export const DRDirections = ["e", "n", "w", "s"] as const;
export type DRDirection = (typeof DRDirections)[number];
export const isDRDirection = typeChecker<DRDirection>(
	(input: unknown): input is DRDirection =>
		DRDirections.includes(input as DRDirection),
);
export const DRDiagonalDirections = ["ne", "nw", "sw", "se"] as const;
export type DRDiagonalDirection = (typeof DRDiagonalDirections)[number];
export const isDRDiagonalDirection = typeChecker<DRDiagonalDirection>(
	(input: unknown): input is DRDiagonalDirection =>
		DRDiagonalDirections.includes(input as DRDiagonalDirection),
);
export const OppositeDRDirection: Record<DRDirection, DRDirection> = {
	e: "w",
	n: "s",
	w: "e",
	s: "n",
};
export const DRAdjacentStep: Record<DRDirection, [number, number]> = {
	e: [1, 0],
	n: [0, 1],
	w: [-1, 0],
	s: [0, -1],
};
export const getAdjacentId = ([cellId, d]: [
	DRCellId,
	DRDirection,
	...others: Array<unknown>,
]): DRCellId => {
	const step = DRAdjacentStep[d];
	return toDRCellId(cellId[0] + step[0], cellId[1] + step[1]);
};
export type DRBufferId = Nominal<
	[DRCellId, DRDirection, "rx" | "tx"],
	"DRBufferId"
>;
export const toDRBufferId = (() => {
	const cache = new Map<string, DRBufferId>();
	return (cellId: DRCellId, d: DRDirection, mode: "rx" | "tx") => {
		const key = `${cellId[0]},${cellId[1]},${d},${mode}`;
		let cached = cache.get(key);
		if (!cached) {
			cached = [cellId, d, mode] as DRBufferId;
			cache.set(key, cached);
		}
		return cached;
	};
})();
export type DRMessageMode = DRDiagonalDirection | DRDirection | "spread";
interface DRMessageObject<T extends string, P> {
	id: string;
	/**
	 * このメッセージが移動した距離です。この値はセル間を移動する際（TxからRxに移る際）に変更さ
	 * れます。Txバッファに追加しただけでは変更されません。
	 */
	d: [number, number];
	type: T;
	ttl?: number;
	mode: DRMessageMode;
	payload: P;
}
export interface DRMessageMap {
	reversi1: DRMessageObject<"reversi1", DRSharedState>;
	reversi2: DRMessageObject<"reversi2", DRPlayerId | null>;
	connect: DRMessageObject<"connect", DRSharedState>;
	setShared: DRMessageObject<"setShared", DRSharedState>;
}
export type DRMessageType = keyof DRMessageMap;
export const DRMessagePayloadTypes: Record<
	DRMessageType,
	"boolean" | "shared" | null
> = {
	reversi1: "shared",
	reversi2: "boolean",
	connect: "shared",
	setShared: "shared",
};
export const DRMessageTypes = Object.keys(
	DRMessagePayloadTypes,
) as Array<DRMessageType>;
export type DRMessage = DRMessageMap[DRMessageType];
export const generateMessageProps = (() => {
	let deduplicationIdCounter = 0;
	return () => ({
		id: (++deduplicationIdCounter).toString(36),
		d: [0, 0] as [number, number],
	});
})();
export const isOpenableDRMessage = ({ mode, d: [dx, dy] }: DRMessage) => {
	switch (mode) {
		case "e":
			return dy === 0 && 0 < dx;
		case "w":
			return dy === 0 && dx < 0;
		case "n":
			return dx === 0 && 0 < dy;
		case "s":
			return dx === 0 && dy < 0;
		case "ne":
			return dx === dy && 0 < dx;
		case "nw":
			return dx === -dy && dx < 0;
		case "se":
			return dx === -dy && 0 < dx;
		case "sw":
			return dx === dy && dx < 0;
		default:
			return true;
	}
};
export const InitialDRPlayerId = 0 as DRPlayerId;
export const stepDRSharedState = ({
	state,
	playerCount,
	...others
}: DRSharedState): DRSharedState => ({
	...others,
	state: ((state + 1) % playerCount) as DRPlayerId,
	playerCount,
});
export const chessboardDistance = ([dx, dy]: [number, number]) =>
	Math.max(Math.abs(dx), Math.abs(dy));
