import { useAtomCallback } from "jotai/utils";
import { useCallback } from "react";
import { iterate } from "../../util/iterate.ts";
import type { JotaiSelectorOpts } from "../../util/jotai/callback.ts";
import { cellAtom, draggingAtom } from "./jotai.app.ts";
import { sendDRMessage } from "./jotai.send.ts";
import type { DRCellId } from "./util.ts";
import {
	DRDiagonalDirections,
	DRDirections,
	generateMessageProps,
	stepDRSharedState,
} from "./util.ts";

export const useOnPressCell = (cellId: DRCellId) =>
	useAtomCallback(
		useCallback(
			(get, set) => {
				if (get(draggingAtom)) {
					return;
				}
				const cell = get(cellAtom(cellId));
				if (!cell) {
					return;
				}
				const opts: JotaiSelectorOpts = { get, set };
				// 全8方向に reversi1 を送信（ひっくり返し探索）
				for (const mode of iterate(DRDirections, DRDiagonalDirections)) {
					sendDRMessage(opts, cellId, {
						...generateMessageProps(),
						mode,
						type: "reversi1",
						payload: cell.shared,
					});
				}
				// setShared を全体に spread（次プレイヤーへの手番移動）
				const nextSharedState = stepDRSharedState(cell.shared);
				sendDRMessage(opts, cellId, {
					...generateMessageProps(),
					mode: "spread",
					type: "setShared",
					payload: nextSharedState,
				});
				// 自セルの状態を即時更新
				set(cellAtom(cellId), {
					...cell,
					state: cell.shared.state,
					shared: nextSharedState,
				});
			},
			[cellId],
		),
	);
