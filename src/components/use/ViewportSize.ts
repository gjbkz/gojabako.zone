import { useEffect, useState } from "react";
import { hasWindow } from "../../util/env";

const getViewportSize = () =>
	hasWindow
		? { width: window.innerWidth, height: window.innerHeight }
		: { width: 0, height: 0 };

export const useViewportSize = () => {
	const [size, setSize] = useState(getViewportSize());
	useEffect(() => {
		const abc = new AbortController();
		const onResize = () => setSize(getViewportSize());
		window.addEventListener("resize", onResize, { signal: abc.signal });
		return () => {
			abc.abort();
		};
	}, []);
	return size;
};
