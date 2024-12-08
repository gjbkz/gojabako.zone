import type { SyntheticEvent } from "react";
import { useCallback, useState } from "react";
import { hasWindow } from "../../util/env";

export const useFullScreen = (selector: string) => {
	const [state, setState] = useState(getState());
	const sync = useCallback(() => setState(getState()), []);
	const toggle = useCallback(
		(event: SyntheticEvent) => {
			const target = (event.currentTarget as Element).closest(selector);
			if (!target) {
				return;
			}
			if (target === document.fullscreenElement) {
				document.exitFullscreen().then(sync).catch(alert);
			} else {
				target.requestFullscreen().then(sync).catch(alert);
			}
		},
		[selector, sync],
	);
	return [state, toggle] as const;
};

const getState = () => Boolean(hasWindow && document.fullscreenElement);
