import { atom } from "jotai";
import { atomFamily } from "jotai/utils";
import { clamp } from "../../util/clamp.ts";
import type { DRBufferId, DRCell, DRCellId, DRMessage } from "./util.ts";
import { toDRCellId, zoom } from "./util.ts";

// ---------------------------------------------------------------------------
// Per-cell / per-buffer (atomFamily)
// キーは toDRCellId / toDRBufferId でキャッシュされているため参照等価が成立する
// ---------------------------------------------------------------------------

export const cellAtom = atomFamily((_cellId: DRCellId) =>
	atom<DRCell | null>(null),
);

export const messageBufferAtom = atomFamily((_bufferId: DRBufferId) =>
	atom<Array<DRMessage>>([]),
);

// ---------------------------------------------------------------------------
// ゲーム盤
// ---------------------------------------------------------------------------

export const cellListAtom = atom<Set<DRCellId>>(new Set<DRCellId>());

// ---------------------------------------------------------------------------
// UI モード
// ---------------------------------------------------------------------------

export const editModeAtom = atom(false);
export const devModeAtom = atom(false);
export const txDelayMsAtom = atom(20);
export const rxDelayMsAtom = atom(20);

// ---------------------------------------------------------------------------
// インタラクション
// ---------------------------------------------------------------------------

export const selectedCellsAtom = atom<Set<DRCellId>>(new Set<DRCellId>());

export const selectCoordinates =
	(cellId: DRCellId, mode: "add" | "toggle") =>
	(current: Set<DRCellId>): Set<DRCellId> => {
		const next = new Set(current);
		if (mode === "add") {
			if (current.has(cellId)) {
				next.delete(cellId);
			} else {
				next.add(cellId);
			}
		} else {
			next.clear();
			if (!current.has(cellId)) {
				next.add(cellId);
			}
		}
		return next;
	};

export const pointerPositionAtom = atom<[number, number] | null>(null);
export const draggingAtom = atom<AbortController | null>(null);

// ---------------------------------------------------------------------------
// ビューポート
// [x, y, w, h, z] または [x, y, w, h, z, dragDelta]
// dragDelta はドラッグ中の一時オフセット。ドラッグ終了時に x,y に反映して除去する。
// ---------------------------------------------------------------------------

export type XYWHZ =
	| [number, number, number, number, number]
	| [number, number, number, number, number, [number, number]];

export const viewportAtom = atom<XYWHZ>([0, 0, 0, 0, 80]);

// SVG viewBox 文字列（ドラッグ中は dragDelta 分を補正して表示）
export const viewBoxAtom = atom((get) => {
	const [x, y, w, h, z, d] = get(viewportAtom);
	const r = (v: number) => v.toFixed(3);
	if (d) {
		return `${r(x - d[0] / z)} ${r(y - d[1] / z)} ${r(w)} ${r(h)}`;
	}
	return `${r(x)} ${r(y)} ${r(w)} ${r(h)}`;
});

// ズーム操作（読み書き）
export const zoomAtom = atom(
	(get): { z: number } => ({ z: get(viewportAtom)[4] }),
	(
		get,
		set,
		{ z: newZ, cx = 0.5, cy = 0.5 }: { z: number; cx?: number; cy?: number },
	) => {
		const [x, y, w, h, oldZ] = get(viewportAtom);
		const clamped = clamp(newZ, zoom.min, zoom.max);
		const rz = clamped / oldZ;
		set(viewportAtom, [
			x - (w / rz - w) * cx,
			y - (h / rz - h) * cy,
			w / rz,
			h / rz,
			clamped,
		]);
	},
);

// ---------------------------------------------------------------------------
// 派生 atom
// ---------------------------------------------------------------------------

// マウス座標下のセル ID
export const pointeredCellAtom = atom((get) => {
	const pointer = get(pointerPositionAtom);
	if (!pointer) {
		return null;
	}
	const [x0, y0, , , z] = get(viewportAtom);
	return toDRCellId(pointer[0] / z + x0, -pointer[1] / z - y0);
});

// 選択中セルの詳細情報
export interface CellSelection {
	map: Map<DRCellId, DRCell>;
	maxPlayerCount: number;
}

export const selectedCellInfoAtom = atom<CellSelection>((get) => {
	const map = new Map<DRCellId, DRCell>();
	let maxPlayerCount = 0;
	for (const cellId of get(selectedCellsAtom)) {
		const cell = get(cellAtom(cellId));
		if (cell) {
			map.set(cellId, cell);
			if (cell.shared.playerCount > maxPlayerCount) {
				maxPlayerCount = cell.shared.playerCount;
			}
		}
	}
	return { map, maxPlayerCount };
});
