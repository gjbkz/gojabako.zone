"use client";
import { useSearchParams } from "next/navigation";
import type { HTMLAttributes } from "react";
import { useCallback } from "react";
import type { MutableSnapshot } from "recoil";
import { RecoilRoot } from "recoil";
import { classnames } from "../../util/classnames.ts";
import { getCurrentUrl } from "../../util/getCurrentUrl.ts";
import { DRBoard } from "./Board";
import { decodeCellList } from "./cellList.ts";
import { DRMenu } from "./Menu";
import { rcCell, rcCellList } from "./recoil.app.ts";
import * as style from "./style.module.scss";
import type { DRCellId } from "./util.ts";
import { defaultDRCell, toDRCellId } from "./util.ts";

export const DistributedReversi = (props: HTMLAttributes<HTMLElement>) => {
  getCurrentUrl.defaultSearchParams = useSearchParams();
  return (
    <section
      {...props}
      className={classnames(style.container, props.className)}
    >
      <RecoilRoot initializeState={useInit()}>
        <DRBoard />
        <DRMenu />
      </RecoilRoot>
    </section>
  );
};

const useInit = () =>
  useCallback(({ set }: MutableSnapshot) => {
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
      set(rcCell(cellId), defaultDRCell());
    }
    set(rcCellList, coordinates);
  }, []);
