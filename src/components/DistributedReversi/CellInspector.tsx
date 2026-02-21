import { useAtomValue } from "jotai";
import { useAtomCallback } from "jotai/utils";
import type { ChangeEvent } from "react";
import { useCallback, useMemo } from "react";
import type { JotaiSelectorOpts } from "../../util/jotai/callback.ts";
import type { CellSelection } from "./jotai.app.ts";
import {
	cellAtom,
	selectedCellInfoAtom,
	selectedCellsAtom,
} from "./jotai.app.ts";
import { DRSelector } from "./Selector";
import * as style from "./style.module.scss";
import type { DRCell, DRCellState, DRPlayerId } from "./util.ts";
import { DRInitialState, isDRPlayerId } from "./util.ts";

export const DRCellInspector = () => {
	const coordinates = useAtomValue(selectedCellsAtom);
	const selection = useAtomValue(selectedCellInfoAtom);
	const coordinateCount = coordinates.size;
	const cellCount = selection.map.size;
	if (coordinateCount === 0) {
		return null;
	}
	if (cellCount === 0) {
		return <p>{coordinateCount}個の座標を選択中</p>;
	}
	return (
		<>
			<p>{coordinateCount}個の座標を選択中</p>
			<StateSelector {...selection} />
			<SharedStateSelector {...selection} />
			<PlayerCountControl value={selection.maxPlayerCount} />
		</>
	);
};

const StateSelector = ({ maxPlayerCount }: CellSelection) => {
	const update = useUpdateSelectedCells();
	const onChange = useCallback(
		(value: string) => {
			if (value === DRInitialState) {
				update({ state: DRInitialState });
			} else if (value) {
				const state = Number(value);
				if (isDRPlayerId(state)) {
					update({ state });
				}
			}
			return "";
		},
		[update],
	);
	const values = useMemo(
		() => [
			...(function* () {
				yield "";
				yield DRInitialState;
				for (let player = 0; player < maxPlayerCount; player++) {
					yield player;
				}
			})(),
		],
		[maxPlayerCount],
	);
	return (
		<DRSelector
			id="CellState"
			label="state"
			onChange={onChange}
			values={values}
		/>
	);
};

const SharedStateSelector = ({ maxPlayerCount }: CellSelection) => {
	const update = useUpdateSelectedCells();
	const onChange = useCallback(
		(value: string) => {
			const sharedState = value && Number(value);
			if (isDRPlayerId(sharedState)) {
				update({ sharedState });
			}
			return "";
		},
		[update],
	);
	const values = useMemo(
		() => [
			...(function* () {
				yield "";
				for (let player = 0; player < maxPlayerCount; player++) {
					yield player;
				}
			})(),
		],
		[maxPlayerCount],
	);
	return (
		<DRSelector
			id="CellSharedState"
			label="sharedState"
			onChange={onChange}
			values={values}
		/>
	);
};

const PlayerCountControl = ({ value }: { value: number }) => {
	const update = useUpdateSelectedCells();
	const onChange = useCallback(
		({ currentTarget }: ChangeEvent<HTMLInputElement>) => {
			let playerCount = Number(currentTarget.value);
			if (!(1 < playerCount)) {
				playerCount = 2;
			}
			update({ playerCount });
		},
		[update],
	);
	const id = "CellSharedPlayerCount";
	return (
		<section className={style.number}>
			<label htmlFor={id}>playerCount</label>
			<input id={id} type="number" step={1} value={value} onChange={onChange} />
		</section>
	);
};

interface CellUpdates {
	state?: DRCellState;
	sharedState?: DRPlayerId;
	playerCount?: number;
}

const useUpdateSelectedCells = () =>
	useAtomCallback(
		useCallback((get, set, updates: CellUpdates) => {
			const opts: JotaiSelectorOpts = { get, set };
			const cellUpdates: Partial<DRCell> = {};
			if ("state" in updates) {
				cellUpdates.state = updates.state;
			}
			const sharedUpdates: Partial<DRCell["shared"]> = {};
			if ("sharedState" in updates) {
				sharedUpdates.state = updates.sharedState;
			}
			if ("playerCount" in updates) {
				sharedUpdates.playerCount = updates.playerCount;
			}
			for (const cellId of opts.get(selectedCellsAtom)) {
				opts.set(cellAtom(cellId), (cell) => {
					if (!cell) {
						return cell;
					}
					return {
						...cell,
						pending: null,
						...cellUpdates,
						shared: { ...cell.shared, ...sharedUpdates },
					};
				});
			}
		}, []),
	);
