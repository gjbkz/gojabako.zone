import { useCallback } from 'react';
import type { MouseEvent } from 'react';
import { useSetRecoilState } from 'recoil';
import { writer } from '../../util/recoil/selector.mts';
import { rcCell } from './recoil.app.mts';
import { rcSend } from './recoil.send.mts';
import type { DRCellId } from './util.mts';
import { generateMessageProps, isDRPlayerId, nextDRPlayerId } from './util.mts';

export const useOnPressCell = (cellId: DRCellId) => {
  const press = useSetRecoilState(rcPressCell);
  return useCallback(
    (event: MouseEvent) => {
      event.stopPropagation();
      press(cellId);
    },
    [cellId, press],
  );
};

const rcPressCell = writer<DRCellId>({
  key: 'PressCell',
  set: ({ get, set }, cellId) => {
    const cell = get(rcCell(cellId));
    if (!cell) {
      return;
    }
    const state = cell.gameState;
    if (isDRPlayerId(state)) {
      set(rcSend(cellId), {
        ...generateMessageProps(),
        mode: 'spread',
        type: 'press',
        state,
      });
      set(rcCell(cellId), {
        ...cell,
        state,
        gameState: nextDRPlayerId(state),
      });
    }
  },
});
