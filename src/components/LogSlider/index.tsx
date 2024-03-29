'use client';
import { ensure, isFiniteNumber } from '@nlib/typing';
import type { ChangeEvent, InputHTMLAttributes } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { clamp } from '../../util/clamp.mts';
import type { Range } from '../../util/range.mts';
import { useLastValue } from '../use/LastValue.mts';

const v = (value: ReadonlyArray<string> | number | string): number =>
  ensure(Number(value), isFiniteNumber);
export const toLogValue = (value: number, [min, max]: Range): number => {
  const logValue = Math.log(clamp(value, min, max));
  const logMin = Math.log(min);
  const logMax = Math.log(max);
  return (logValue - logMin) / (logMax - logMin);
};
export const toLinearValue = (ratio: number, [min, max]: Range) => {
  return min * Number((max / min) ** ratio);
};
export const defaultLinearRange = [0.1, 2];
export interface LogSliderProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'max' | 'min' | 'type'> {
  min: number;
  max: number;
  onChangeValue?: (value: number) => void;
}
// eslint-disable-next-line max-lines-per-function
export const LogSlider = ({
  min,
  max,
  value: zValue = 1,
  onChangeValue,
  onChange: onChangeFn,
  ...props
}: LogSliderProps) => {
  const range = useMemo((): Range => [min, max], [min, max]);
  const [ratio, setRatio] = useState<number>(toLogValue(v(zValue), range));
  const value = useMemo(() => toLinearValue(ratio, range), [ratio, range]);
  const lastValue = useLastValue(value, null);
  const onChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      if (onChangeFn) {
        onChangeFn(event);
      }
      setRatio(clamp(v(event.currentTarget.value), 0, 1));
    },
    [onChangeFn],
  );
  useEffect(
    () => {
      if (lastValue !== null && value !== lastValue && onChangeValue) {
        onChangeValue(value);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [value],
  );
  useEffect(
    () => {
      if (lastValue !== null) {
        setRatio(toLogValue(v(zValue), range));
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [zValue, range],
  );
  return (
    <input
      {...props}
      value={ratio}
      min={0}
      max={1}
      step={0.001}
      type="range"
      onChange={onChange}
    />
  );
};
