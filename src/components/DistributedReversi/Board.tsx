import { useAtomValue, useSetAtom } from "jotai";
import { useAtomCallback } from "jotai/utils";
import type { MouseEvent, ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import { classnames } from "../../util/classnames.ts";
import { useRect } from "../use/Rect.ts";
import { DRCellG } from "./Cell";
import type { XYWHZ } from "./jotai.app.ts";
import {
	cellAtom,
	cellListAtom,
	draggingAtom,
	editModeAtom,
	pointeredCellAtom,
	pointerPositionAtom,
	selectedCellsAtom,
	viewBoxAtom,
	viewportAtom,
} from "./jotai.app.ts";
import * as style from "./style.module.scss";
import type { DRCellId } from "./util.ts";
import { defaultDRCell, toDRCellId } from "./util.ts";

export const DRBoard = () => {
	const [element, setElement] = useState<Element | null>(null);
	const editMode = useAtomValue(editModeAtom);
	const viewBox = useAtomValue(viewBoxAtom);
	useSyncRect(element);
	useSyncPointerPosition(element as HTMLElement);
	useGrab(element as HTMLElement);
	return (
		// biome-ignore lint/a11y/useKeyWithClickEvents: 仮実装のため省略
		<svg
			ref={setElement}
			className={classnames(style.board, editMode && style.editing)}
			viewBox={viewBox}
			onClick={useOnClick()}
		>
			<title>DRBoard</title>
			<Cells />
			<SelectedCoordinates />
			{editMode && <EditGuide />}
		</svg>
	);
};

const useOnClick = () =>
	useAtomCallback(
		useCallback(
			(get, set) => (event: MouseEvent) => {
				event.preventDefault();
				event.stopPropagation();
				if (get(draggingAtom)) {
					return;
				}
				set(selectedCellsAtom, new Set());
				if (get(editModeAtom)) {
					const [x0, y0, , , z] = get(viewportAtom);
					const e = event.nativeEvent as PointerEvent;
					const cellId = toDRCellId(e.offsetX / z + x0, -e.offsetY / z - y0);
					if (get(cellAtom(cellId))) {
						set(cellAtom(cellId), null);
						set(cellListAtom, (current: Set<DRCellId>) => {
							const next = new Set(current);
							next.delete(cellId);
							return next;
						});
					} else {
						set(cellAtom(cellId), defaultDRCell());
						set(cellListAtom, (current: Set<DRCellId>) => {
							const next = new Set(current);
							next.add(cellId);
							return next;
						});
					}
				}
			},
			[],
		),
	);

const EditGuide = () => {
	const cellId = useAtomValue(pointeredCellAtom);
	const dragging = useAtomValue(draggingAtom);
	const list = useAtomValue(cellListAtom);
	if (!cellId || dragging) {
		return null;
	}
	const transform = `translate(${cellId[0]},${-cellId[1]})`;
	const empty = !list.has(cellId);
	const s = 0.52;
	const l = empty ? 0.24 : 0.2;
	return (
		<g className={style.pointered} transform={transform}>
			<rect x={-s} y={-s} width={s * 2} height={s * 2} />
			<path
				d={
					empty
						? `M${-l} 0H${l}M0 ${-l}V${l}`
						: `M${-l} ${-l}L${l} ${l}M${-l} ${l}L${l} ${-l}`
				}
			/>
		</g>
	);
};

const Cells = () => {
	const cells = useAtomValue(cellListAtom);
	return [
		...(function* (): Generator<ReactNode> {
			for (const cellId of cells) {
				yield <DRCellG key={cellId.join(",")} cellId={cellId} />;
			}
		})(),
	];
};

const SelectedCoordinates = () => {
	const selectedCells = useAtomValue(selectedCellsAtom);
	return [
		...(function* (): Generator<ReactNode> {
			for (const [x, y] of selectedCells) {
				yield (
					<circle
						key={`selected ${x} ${y}`}
						className={style.selected}
						cx={x}
						cy={-y}
						r="0.5"
					/>
				);
			}
		})(),
	];
};

const useSyncPointerPosition = (board: HTMLElement | null) => {
	const setPosition = useSetAtom(pointerPositionAtom);
	useEffect(() => {
		const abc = new AbortController();
		if (board) {
			board.addEventListener(
				"pointermove",
				(e) => setPosition([e.offsetX, e.offsetY]),
				{ signal: abc.signal },
			);
			board.addEventListener("pointerleave", () => setPosition(null), {
				signal: abc.signal,
			});
		}
		return () => abc.abort();
	}, [board, setPosition]);
};

const useSyncRect = (board: Element | null) => {
	const [lastRect, setLastRect] = useState<DOMRect | null>(null);
	const rect = useRect(board);
	const setViewport = useSetAtom(viewportAtom);
	// biome-ignore lint/correctness/useExhaustiveDependencies: rect,setViewportの変更のみ見る
	useEffect(() => {
		if (!rect) {
			return;
		}
		const { width: w, height: h } = rect;
		if (lastRect) {
			const dx = rect.width - lastRect.width;
			const dy = rect.height - lastRect.height;
			if (dx === 0 && dy === 0) {
				return;
			}
			setViewport(([x, y, _w, _h, z]) => [
				x - dx / z / 2,
				y - dy / z / 2,
				w / z,
				h / z,
				z,
			]);
		} else {
			setViewport(([_x, _y, _w, _h, z]) => [
				rect.width / -2 / z,
				rect.height / -2 / z,
				w / z,
				h / z,
				z,
			]);
		}
		setLastRect(rect);
	}, [rect, setViewport]);
};

const useGrab = (board: HTMLElement | null) => {
	const onPointerDown = useAtomCallback(
		useCallback(
			(get, set) => (e0: PointerEvent) => {
				if (e0.button !== 0 || get(draggingAtom)) {
					return;
				}
				const target = e0.target as HTMLElement;
				target.setPointerCapture(e0.pointerId);
				const abc = new AbortController();
				const anchor = get(viewportAtom);
				const diff = (e: PointerEvent): [number, number] => [
					e.clientX - e0.clientX,
					e.clientY - e0.clientY,
				];
				const onMove = (e: PointerEvent) => {
					if (e.pointerId === e0.pointerId) {
						set(draggingAtom, abc);
						const next: XYWHZ = [...anchor] as XYWHZ;
						next[5] = diff(e);
						set(viewportAtom, next);
					}
				};
				const onUp = (e: PointerEvent) => {
					target.releasePointerCapture(e0.pointerId);
					abc.abort();
					const [x, y, w, h, z] = anchor;
					const d = diff(e);
					set(viewportAtom, [x - d[0] / z, y - d[1] / z, w, h, z]);
					setTimeout(() => set(draggingAtom, null), 50);
				};
				target.addEventListener("pointermove", onMove, { signal: abc.signal });
				target.addEventListener("pointerup", onUp, { signal: abc.signal });
			},
			[],
		),
	);
	useEffect(() => {
		const abc = new AbortController();
		board?.addEventListener("pointerdown", onPointerDown, {
			signal: abc.signal,
		});
		return () => abc.abort();
	}, [board, onPointerDown]);
};
