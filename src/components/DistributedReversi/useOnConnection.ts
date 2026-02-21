import { useAtomValue } from "jotai";
import { useAtomCallback } from "jotai/utils";
import { useCallback, useEffect, useState } from "react";
import type { JotaiSelectorOpts } from "../../util/jotai/callback.ts";
import { cellAtom } from "./jotai.app.ts";
import { sendDRMessage } from "./jotai.send.ts";
import type { DRBufferId } from "./util.ts";
import { generateMessageProps, getAdjacentId } from "./util.ts";

/**
 * TX バッファに対応する隣接セルが存在する（接続が確立した）タイミングで、
 * connect メッセージを送って自分の shared を通知する。
 */
export const useOnConnection = (bufferId: DRBufferId) => {
	const [sent, setSent] = useState(false);
	const adjacentCell = useAtomValue(cellAtom(getAdjacentId(bufferId)));
	const onConnection = useAtomCallback(
		useCallback(
			(get, set) => {
				const opts: JotaiSelectorOpts = { get, set };
				const cell = get(cellAtom(bufferId[0]));
				if (cell) {
					sendDRMessage(opts, bufferId[0], {
						...generateMessageProps(),
						type: "connect",
						mode: bufferId[1],
						ttl: 1,
						payload: cell.shared,
					});
				}
			},
			[bufferId],
		),
	);
	useEffect(() => {
		if (adjacentCell && !sent) {
			onConnection();
			setSent(true);
		}
	}, [adjacentCell, onConnection, sent]);
};
