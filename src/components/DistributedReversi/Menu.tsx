import { useAtom } from "jotai";
import { useAtomCallback } from "jotai/utils";
import type { ChangeEvent } from "react";
import { useCallback } from "react";
import { clamp } from "../../util/clamp.ts";
import { SecondaryButton } from "../Button";
import { Toggle } from "../Toggle";
import { useFullScreen } from "../use/FullScreen.ts";
import { ZoomSlider } from "../ZoomSlider";
import { DRCellInspector } from "./CellInspector";
import {
	cellAtom,
	cellListAtom,
	devModeAtom,
	editModeAtom,
	rxDelayMsAtom,
	txDelayMsAtom,
	zoomAtom,
} from "./jotai.app.ts";
import * as style from "./style.module.scss";
import { DRInitialState, InitialDRPlayerId, zoom } from "./util.ts";

export const DRMenu = () => (
	<nav className={style.info}>
		<EditModeToggle />
		<DRCellInspector />
		<div className={style.spacer} />
		<InitGameButton />
		<ZoomControl />
		<FullScreenToggle />
		<TxDelayControl />
		<RxDelayControl />
		<DevModeToggle />
	</nav>
);

const InitGameButton = () => {
	const onClick = useAtomCallback(
		useCallback((get, set) => {
			for (const cellId of get(cellListAtom)) {
				set(cellAtom(cellId), (cell) =>
					cell
						? {
								...cell,
								pending: null,
								state: DRInitialState,
								shared: { state: InitialDRPlayerId, playerCount: 2 },
							}
						: cell,
				);
			}
		}, []),
	);
	return (
		<SecondaryButton icon="refresh" onClick={onClick}>
			はじめから
		</SecondaryButton>
	);
};

const ZoomControl = () => {
	const [{ z: value }, setZoom] = useAtom(zoomAtom);
	const onChangeValue = useCallback((z: number) => setZoom({ z }), [setZoom]);
	return (
		<ZoomSlider
			value={value}
			min={zoom.min}
			max={zoom.max}
			onChangeValue={onChangeValue}
		/>
	);
};

const TxDelayControl = () => {
	const [ms, setMs] = useAtom(txDelayMsAtom);
	const onChange = useCallback(
		(event: ChangeEvent<HTMLInputElement>) => {
			setMs(clamp(Math.round(Number(event.currentTarget.value)), 0, 5000));
		},
		[setMs],
	);
	const id = "TxDelayMs";
	return (
		<section className={style.number}>
			<label htmlFor={id}>送信遅延 [ms]</label>
			<input id={id} type="number" step={10} value={ms} onChange={onChange} />
		</section>
	);
};

const RxDelayControl = () => {
	const [ms, setMs] = useAtom(rxDelayMsAtom);
	const onChange = useCallback(
		(event: ChangeEvent<HTMLInputElement>) => {
			setMs(clamp(Math.round(Number(event.currentTarget.value)), 0, 5000));
		},
		[setMs],
	);
	const id = "RxDelayMs";
	return (
		<section className={style.number}>
			<label htmlFor={id}>受信遅延 [ms]</label>
			<input id={id} type="number" step={10} value={ms} onChange={onChange} />
		</section>
	);
};

const FullScreenToggle = () => {
	const [state, toggle] = useFullScreen(`.${style.container}`);
	const id = "FullScreen";
	return (
		<section className={style.toggle}>
			<label htmlFor={id}>フルスクリーン</label>
			<Toggle id={id} state={state} onClick={toggle} />
		</section>
	);
};

const EditModeToggle = () => {
	const [editMode, setEditMode] = useAtom(editModeAtom);
	const toggle = useCallback(() => setEditMode((s) => !s), [setEditMode]);
	const id = "EditMode";
	return (
		<section className={style.toggle}>
			<label htmlFor={id}>編集モード</label>
			<Toggle id={id} state={editMode} onClick={toggle} />
		</section>
	);
};

const DevModeToggle = () => {
	const [devMode, setDevMode] = useAtom(devModeAtom);
	const toggle = useCallback(() => setDevMode((s) => !s), [setDevMode]);
	const id = "DevMode";
	return (
		<section className={style.toggle}>
			<label htmlFor={id}>開発モード</label>
			<Toggle id={id} state={devMode} onClick={toggle} />
		</section>
	);
};
