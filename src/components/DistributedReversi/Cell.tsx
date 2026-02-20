import { useAtomValue, useSetAtom } from "jotai";
import type { MouseEvent } from "react";
import { Fragment, useMemo } from "react";
import { classnames } from "../../util/classnames.ts";
import {
	cellAtom,
	devModeAtom,
	messageBufferAtom,
	selectCoordinates,
	selectedCellsAtom,
} from "./jotai.app.ts";
import * as style from "./style.module.scss";
import { useOnConnection } from "./useOnConnection.ts";
import { useOnPressCell } from "./useOnPressCell.ts";
import { useRx } from "./useRx.ts";
import { useTx } from "./useTx.ts";
import type { DRCellId, DRCellState, DRDirection } from "./util.ts";
import {
	DRDirections,
	DRInitialState,
	isDRPlayerId,
	toDRBufferId,
} from "./util.ts";

const hue = (t: number) => Math.round(360 * t) % 360;

interface DRCellGProps {
	cellId: DRCellId;
}

export const DRCellG = ({ cellId }: DRCellGProps) => {
	return (
		<g
			id={encodeURIComponent(`cell${cellId}`)}
			transform={`translate(${cellId[0]},${-cellId[1]})`}
		>
			<Cell cellId={cellId} />
			{DRDirections.map((d) => (
				<Fragment key={d}>
					<Tx cellId={cellId} d={d} />
					<Rx cellId={cellId} d={d} />
				</Fragment>
			))}
		</g>
	);
};

const Cell = ({ cellId }: DRCellGProps) => {
	const cell = useAtomValue(cellAtom(cellId));
	const devMode = useAtomValue(devModeAtom);
	return (
		cell && (
			<>
				<BackRect hue={hue(cell.shared.state / cell.shared.playerCount)} />
				<ForeRect
					cellId={cellId}
					state={cell.state}
					playerCount={cell.shared.playerCount}
				/>
				{devMode && (
					<text className={style.cellText} x={0} y={0.09}>
						{cell.state}
						{cell.pending !== null && ` - ${cell.pending}`}
					</text>
				)}
			</>
		)
	);
};

const BackRect = ({ hue: h }: { hue: number }) => {
	const color = `oklch(100% 0.15 ${h})`;
	return (
		<rect
			className={style.cellBackground}
			x="-0.5"
			y="-0.5"
			width="1"
			height="1"
			style={{ fill: color, stroke: color }}
		/>
	);
};

const ForeRect = ({
	cellId,
	state,
	playerCount,
}: {
	cellId: DRCellId;
	state: DRCellState;
	playerCount: number;
}) => {
	const initial = state === DRInitialState;
	let color = "";
	if (isDRPlayerId(state)) {
		color = `oklch(80% 0.15 ${hue(state / playerCount)})`;
	}
	const setSelected = useSetAtom(selectedCellsAtom);
	const onContextMenu = (event: MouseEvent) => {
		event.preventDefault();
		const alt = event.shiftKey || event.metaKey || event.ctrlKey;
		setSelected(selectCoordinates(cellId, alt ? "add" : "toggle"));
	};
	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: 仮実装のため省略
		<rect
			className={classnames(style.cell, initial && style.initial)}
			x="-0.4"
			y="-0.4"
			rx="0.1"
			ry="0.1"
			width="0.8"
			height="0.8"
			onClick={useOnPressCell(cellId)}
			onContextMenu={onContextMenu}
			style={color ? { fill: color, stroke: color } : undefined}
		/>
	);
};

interface TxRxProps {
	cellId: DRCellId;
	d: DRDirection;
}

const textDy = 0.04;

const Tx = ({ cellId, d }: TxRxProps) => {
	const bufferId = toDRBufferId(cellId, d, "tx");
	useTx(bufferId);
	useOnConnection(bufferId);
	const bufferedCount = useAtomValue(messageBufferAtom(bufferId)).length;
	const [cx, cy] = useArrowPosition(d, -0.2);
	const devMode = useAtomValue(devModeAtom);
	return (
		devMode &&
		0 < bufferedCount && (
			<>
				<path
					d={`M${cx.toFixed(3)} ${cy.toFixed(3)}${arrowD[getT(d)]}`}
					className={classnames(style.buffer, style.tx, style.active)}
				/>
				<text x={cx} y={cy + textDy} className={style.buffer}>
					{bufferedCount}
				</text>
			</>
		)
	);
};

const Rx = ({ cellId, d }: TxRxProps) => {
	const bufferId = toDRBufferId(cellId, d, "rx");
	useRx(bufferId);
	const bufferedCount = useAtomValue(messageBufferAtom(bufferId)).length;
	const [cx, cy] = useArrowPosition(d, 0.2);
	const devMode = useAtomValue(devModeAtom);
	return (
		devMode &&
		0 < bufferedCount && (
			<>
				<path
					d={`M${cx.toFixed(3)} ${cy.toFixed(3)}${arrowD[getT(d, 2)]}`}
					className={classnames(style.buffer, style.rx, style.active)}
				/>
				<text x={cx} y={cy + textDy} className={style.buffer}>
					{bufferedCount}
				</text>
			</>
		)
	);
};

const useArrowPosition = (d: DRDirection, offset: number) =>
	useMemo(() => {
		const r = 0.43;
		const tt = ((getT(d) + offset) * Math.PI) / 2;
		return [r * Math.cos(tt), r * Math.sin(tt)];
	}, [d, offset]);

const getT = (d: DRDirection, offset = 0): 0 | 1 | 2 | 3 =>
	((({ e: 0, s: 1, w: 2, n: 3 })[d] + offset) % 4) as 0 | 1 | 2 | 3;

const arrowD = ((a: number, b = a / 1.8, c = a / 4) => ({
	0: `m${a / -2.25} 0l${-c} ${b}h${a}l${c} ${-b}l${-c} ${-b}h${-a}z`,
	1: `m0 ${a / -2.25}l${-b} ${-c}v${a}l${b} ${c}l${b} ${-c}v${-a}z`,
	2: `m${a / 2.25} 0l${c} ${b}h${-a}l${-c} ${-b}l${c} ${-b}h${a}z`,
	3: `m0 ${a / 2.25}l${-b} ${c}v${-a}l${b} ${-c}l${b} ${c}v${a}z`,
}))(0.15);
