"use client";
import { useEffect, useMemo, useState } from "react";
import { hashHitClassName } from "../../util/classnames.ts";
import { getCurrentUrl } from "../../util/getCurrentUrl.ts";
import { minmax } from "../../util/minmax.ts";
import { noop } from "../../util/noop.ts";
import {
	listValues,
	normalizeRanges,
	parseRangeListString,
	toRangeListString,
} from "../../util/range.ts";
import { useHash } from "../use/Hash";

/**
 * コードブロックの行番号の処理を行うコンポーネントです。
 */
export const CodeLineHandlers = () => {
	const [div, setDiv] = useState<Element | null>(null);
	const article = useMemo(() => div?.closest("article") ?? null, [div]);
	useLineLinkHandlers(article);
	useHighlightCodeLines(article);
	return <div ref={setDiv} style={{ display: "none" }} />;
};

const useLineLinkHandlers = (root: Element | null) => {
	const [, syncHash] = useHash();
	useEffect(() => {
		let timerId = setTimeout(noop);
		let abc = new AbortController();
		const set = () => {
			if (!root) {
				return;
			}
			const onClick = (event: MouseEvent) => {
				event.preventDefault();
				event.stopPropagation();
				const a = event.currentTarget as HTMLAnchorElement;
				const newHash = calculateNewHash(new URL(a.href).hash, {
					add: event.metaKey || event.ctrlKey,
					expand: event.shiftKey,
				});
				syncHash(newHash);
			};
			for (const a of root.querySelectorAll<HTMLAnchorElement>("a.hljs-ln")) {
				a.addEventListener("click", onClick, { signal: abc.signal });
			}
		};
		const reset = () => {
			clearTimeout(timerId);
			abc.abort();
			abc = new AbortController();
		};
		const onMutation = () => {
			reset();
			timerId = setTimeout(set, 300);
		};
		const observer = new MutationObserver(onMutation);
		if (root) {
			observer.observe(root, { childList: true });
			onMutation();
		}
		return () => {
			reset();
			observer.disconnect();
		};
	}, [root, syncHash]);
};

const calculateNewHash = (
	requestedHash: string,
	mode: { add: boolean; expand: boolean },
): string => {
	const [requestedCodeId, requestedLineId] = parseHash(requestedHash);
	const [currentCodeId, currentLineId] = parseHash(getCurrentUrl().hash);
	if (requestedCodeId !== currentCodeId) {
		return requestedHash;
	}
	if (requestedLineId === currentLineId) {
		const reset = getCurrentUrl();
		reset.hash = "";
		return reset.hash;
	}
	let ranges = [...parseRangeListString(requestedLineId)];
	if (mode.expand) {
		ranges = [
			minmax(
				(function* (): Generator<number> {
					for (const item of [ranges, parseRangeListString(currentLineId)]) {
						for (const [a, b] of item) {
							yield a;
							yield b;
						}
					}
				})(),
			),
		];
	} else if (mode.add) {
		const current = [...parseRangeListString(currentLineId)];
		ranges = [...normalizeRanges([...ranges, ...current])];
	}
	return `#${requestedCodeId}L${toRangeListString(ranges)}`;
};

const useHighlightCodeLines = (root: Element | null) => {
	const [hash] = useHash();
	useEffect(() => {
		const [codeId, lineId] = parseHash(hash);
		const code = codeId && root?.querySelector(`#${codeId}>code`);
		const targets = new Set<Element>();
		if (codeId && code) {
			const normalizedRanges = [
				...normalizeRanges(parseRangeListString(lineId)),
			];
			const expected = toRangeListString(normalizedRanges);
			if (lineId === expected) {
				let line = code.firstElementChild;
				for (const i of listValues(normalizedRanges)) {
					const href = `#${codeId}L${i}`;
					while (line && line.getAttribute("href") !== href) {
						line = line.nextElementSibling;
					}
					if (!line) {
						break;
					}
					line.classList.add(hashHitClassName);
					targets.add(line);
				}
			} else {
				history.replaceState(null, "", `#${codeId}L${expected}`);
			}
		}
		return () => {
			for (const line of targets) {
				line.classList.remove(hashHitClassName);
			}
		};
	}, [hash, root]);
};

const parseHash = (hash: string) => {
	const matched = /^#(\w+?)(?:L([\d-,]*))?$/.exec(hash) ?? [];
	return [matched[1] || "", matched[2] || ""];
};
