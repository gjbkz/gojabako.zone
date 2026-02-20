"use client";
import { createStore, Provider } from "jotai";
import { useSearchParams } from "next/navigation";
import type { HTMLAttributes } from "react";
import { useState } from "react";
import { classnames } from "../../util/classnames.ts";
import { getCurrentUrl } from "../../util/getCurrentUrl.ts";
import { DRBoard } from "./Board";
import { decodeCellList } from "./cellList.ts";
import { cellAtom, cellListAtom } from "./jotai.app.ts";
import { DRMenu } from "./Menu";
import * as style from "./style.module.scss";
import type { DRCellId } from "./util.ts";
import { defaultDRCell, toDRCellId } from "./util.ts";

export const DistributedReversi = (props: HTMLAttributes<HTMLElement>) => {
	getCurrentUrl.defaultSearchParams = useSearchParams();
	const [store] = useState(createInitialStore);
	return (
		<section
			{...props}
			className={classnames(style.container, props.className)}
		>
			<Provider store={store}>
				<DRBoard />
				<DRMenu />
			</Provider>
		</section>
	);
};

const createInitialStore = () => {
	const store = createStore();
	const size = 2;
	const coordinates = new Set<DRCellId>();
	const encoded = getCurrentUrl().searchParams.get("c");
	if (encoded) {
		for (const cellId of decodeCellList(encoded)) {
			coordinates.add(cellId);
		}
	}
	if (coordinates.size === 0) {
		for (let x = -size; x <= size; x++) {
			for (let y = -size; y <= size; y++) {
				coordinates.add(toDRCellId(x, y));
			}
		}
	}
	for (const cellId of coordinates) {
		store.set(cellAtom(cellId), defaultDRCell());
	}
	store.set(cellListAtom, coordinates);
	return store;
};
