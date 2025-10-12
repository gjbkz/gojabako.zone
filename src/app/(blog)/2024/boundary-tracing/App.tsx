"use client";
import type { ValueOf } from "@nlib/typing";
import { useSearchParams } from "next/navigation";
import {
	type ChangeEvent,
	type CSSProperties,
	createContext,
	type Dispatch,
	Fragment,
	type PropsWithChildren,
	type SetStateAction,
	type SVGAttributes,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { useIsInView } from "../../../../components/use/IsInView";
import { useRect } from "../../../../components/use/Rect.ts";
import { decodeCellList, encodeCellList } from "../../../../util/cellList";
import { clamp } from "../../../../util/clamp";
import { classnames, IconClass } from "../../../../util/classnames.ts";
import { getCurrentUrl } from "../../../../util/getCurrentUrl";
import * as css from "./style.module.css";

type Cell = [number, number];
type Edge = [number, number, number, number];
type CellEdge = Edge & { x: number; y: number };
const Direction = { Right: 0, Down: 1, Left: 2, Up: 3 } as const;
type Direction = ValueOf<typeof Direction>;
type ViewBox = [number, number, number, number];
interface BoundingBox {
	minX: number;
	maxX: number;
	minY: number;
	maxY: number;
}

const isSameCell = (a: Cell, b: Cell) => a[0] === b[0] && a[1] === b[1];
const isSameEdge = (a: Edge, b: Edge) =>
	a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
const getOppositeEdge = (e: Edge): Edge => [e[2], e[3], e[0], e[1]];
const getDirection = (e: Edge): Direction => {
	const dx = e[2] - e[0];
	const dy = e[3] - e[1];
	if (dx === 0) {
		if (0 < dy) {
			return Direction.Down;
		}
		if (dy < 0) {
			return Direction.Up;
		}
	} else if (dy === 0) {
		if (0 < dx) {
			return Direction.Right;
		}
		if (dx < 0) {
			return Direction.Left;
		}
	}
	throw new Error(`Invalid edge: ${e}`);
};
const r = (value: number) => value.toFixed(4).replace(/\.?0+$/, "");
const parseViewBox = function* (viewBoxString: string): Generator<number> {
	let i = 0;
	for (const part of viewBoxString.trim().split(/\s+/)) {
		yield Number.parseFloat(part);
		if (4 <= ++i) {
			break;
		}
	}
};
/** @return [min,min+u)内かつvalueからの距離がuの整数倍のところ */
const getStart = (u: number, min: number, value: number) => {
	const diff = value - min;
	const offset = diff - Math.floor(diff / u) * u;
	return min + offset + (offset < 0 ? 1 : 0);
};
const getNextDFragment = (x1: number, y1: number, x2: number, y2: number) => {
	if (x1 === x2) {
		return `V${r(y2)}`;
	}
	if (y1 === y2) {
		return `H${r(x2)}`;
	}
	return `L${r(x2)} ${r(y2)}`;
};
const getLineD = (x1: number, y1: number, x2: number, y2: number) =>
	`M${r(x1)} ${r(y1)}${getNextDFragment(x1, y1, x2, y2)}`;
const getArrowD = ([x1, y1, x2, y2]: Edge, l: number, da = Math.PI / 6) => {
	let d = getLineD(x1, y1, x2, y2);
	const t = Math.atan2(y2 - y1, x2 - x1);
	const a1 = t + da;
	d += getLineD(x2 - l * Math.cos(a1), y2 - l * Math.sin(a1), x2, y2);
	const a2 = t - da;
	d += getNextDFragment(
		x2,
		y2,
		x2 - l * Math.cos(a2),
		y2 - l * Math.sin(a2),
	).slice();
	return d;
};
const getMidArrowD = ([x1, y1, x2, y2]: Edge, l: number, da = Math.PI / 6) => {
	let d = getLineD(x1, y1, x2, y2);
	const t = Math.atan2(y2 - y1, x2 - x1);
	const x3 = (x1 + x2 + l * Math.cos(t)) / 2;
	const y3 = (y1 + y2 + l * Math.sin(t)) / 2;
	const a1 = t + da;
	d += getLineD(x3 - l * Math.cos(a1), y3 - l * Math.sin(a1), x3, y3);
	const a2 = t - da;
	d += getNextDFragment(
		x3,
		y3,
		x3 - l * Math.cos(a2),
		y3 - l * Math.sin(a2),
	).slice();
	d += `M${r(x2)} ${r(y2)}`;
	return d;
};

const isPointInView = (bb: BoundingBox, x: number, y: number) =>
	bb.minX <= x && x <= bb.maxX && bb.minY <= y && y <= bb.maxY;
const isEdgeInView = (bb: BoundingBox, e: Edge) =>
	isPointInView(bb, e[0], e[1]) || isPointInView(bb, e[2], e[3]);

interface BoundaryTracingProps {
	/** X方向の余白 (格子座標系での距離) */
	px: number;
	/** Y方向の余白 (格子座標系での距離) */
	py: number;
	/** 塗りのあるマス目のリスト */
	cells: Array<Cell>;
}

interface BoundaryTracingContext extends BoundaryTracingProps {
	/** 拡大率 */
	z: number;
	/** セルの領域 */
	bb: BoundingBox;
	/** SVGの描画領域 */
	vb: BoundingBox;
	/** 画面上の1pxに相当する値 */
	dpx: number;
}

const BoundaryTracingContext = createContext<BoundaryTracingContext>({
	px: 0,
	py: 0,
	cells: [],
	z: 1,
	bb: { minX: 0, maxX: 0, minY: 0, maxY: 0 },
	vb: { minX: 0, maxX: 0, minY: 0, maxY: 0 },
	dpx: 1,
});

interface SvgProps extends Partial<BoundaryTracingProps> {
	title?: string;
	cells: Array<Cell>;
	setSvgElement?: (svg: SVGSVGElement) => void;
}

export const Svg = ({
	px = 2.3,
	py = 1.3,
	cells: rawCells = [],
	title = "BoundaryTracing",
	viewBox: givenViewBox,
	setSvgElement,
	children,
	...props
}: PropsWithChildren<SvgProps & SVGAttributes<SVGSVGElement>>) => {
	const [svg, setSvg] = useState<SVGSVGElement | null>();
	useEffect(() => {
		if (setSvgElement && svg) {
			setSvgElement(svg);
		}
	}, [svg, setSvgElement]);
	const rect = useRect(svg);
	const cells = useMemo(() => getUniqueCells(rawCells), [rawCells]);
	const bb = getBoundingBox(cells);
	const sizeX = bb.maxX - bb.minX;
	const sizeY = bb.maxY - bb.minY;
	const baseWidth = sizeX + px * 2;
	const viewBox = useMemo((): ViewBox => {
		if (givenViewBox) {
			return [...parseViewBox(givenViewBox)] as ViewBox;
		}
		return [bb.minX + 0.5 - px, bb.minY + 0.5 - py, baseWidth, sizeY + py * 2];
	}, [bb, givenViewBox, baseWidth, sizeY, px, py]);
	const [vMinX, vMinY, vSizeX, vSizeY] = viewBox;
	const vb = getBoundingBox([
		[vMinX, vMinY],
		[vMinX + vSizeX, vMinY + vSizeY],
	]);
	useMemo<BoundingBox>(() => {
		const [minX, minY, sizeX, sizeY] = viewBox;
		return { minX, minY, maxX: minX + sizeX, maxY: minY + sizeY };
	}, [viewBox]);
	const z = baseWidth / vSizeX;
	const dpx = rect ? vSizeX / rect.width : 0;
	const context: BoundaryTracingContext = useMemo(
		() => ({ px, py, cells, z, bb, vb, dpx }),
		[px, py, cells, z, bb, vb, dpx],
	);
	return (
		<svg
			{...props}
			viewBox={viewBox.map((v) => r(v)).join(" ")}
			style={{ fontSize: `${r(18 * dpx)}px`, ...props.style }}
			ref={setSvg}
		>
			<title>{title}</title>
			<BoundaryTracingContext.Provider value={context}>
				{children}
			</BoundaryTracingContext.Provider>
		</svg>
	);
};

export const Cells = ({
	className,
	...props
}: SVGAttributes<SVGRectElement>) => {
	const { cells, vb } = useContext(BoundaryTracingContext);
	const p = 0.04;
	const r = 0.08;
	const size = 1;
	const minX = vb.minX - size;
	const maxX = vb.maxX;
	const minY = vb.minY - size;
	const maxY = vb.maxY;
	return (
		<g className={classnames(css.fill, className)}>
			{cells.map((cell) => {
				const x = cell[0] + p;
				const y = cell[1] + p;
				if (x < minX || maxX < x || y < minY || maxY < y) {
					// viewBox外は描画しない
					return null;
				}
				return (
					<rect
						rx={r}
						ry={r}
						{...props}
						key={cell.join(",")}
						x={x}
						y={y}
						width={size - p * 2}
						height={size - p * 2}
					/>
				);
			})}
		</g>
	);
};

interface PathProps {
	strokePx?: number;
}

interface GridProps extends PathProps {
	dx?: number;
	dy?: number;
}

export const Grid = ({
	dx = 0,
	dy = 0,
	strokePx = 1,
	className,
	...props
}: GridProps & SVGAttributes<SVGPathElement>) => {
	const { px, py, bb, vb, dpx } = useContext(BoundaryTracingContext);
	const { minX, maxX, minY, maxY } = vb;
	let d = "";
	const x0 = getStart(1, minX, Math.ceil(bb.minX - px) + dx);
	for (let x = x0; x < maxX; x += 1) {
		d += `M${r(x)} ${r(minY)}V${r(maxY)}`;
	}
	const y0 = getStart(1, minY, Math.ceil(bb.minY - py) + dy);
	for (let y = y0; y < maxY; y += 1) {
		d += `M${r(minX)} ${r(y)}H${r(maxX)}`;
	}
	return (
		<path
			{...props}
			className={classnames(css.stroke, className)}
			d={d}
			style={{ strokeWidth: strokePx * dpx, ...props.style }}
		/>
	);
};

export const Boundary = ({
	strokePx = 1,
	className,
	...props
}: PathProps & SVGAttributes<SVGPathElement>) => {
	const { cells, dpx } = useContext(BoundaryTracingContext);
	const unitEdges = useMemo(() => getUnitEdges(cells), [cells]);
	let d = "";
	for (const [x1, y1, x2, y2] of unitEdges.boundary) {
		d += getLineD(x1, y1, x2, y2);
	}
	return (
		<path
			{...props}
			className={classnames(css.stroke, className)}
			d={d}
			style={{ strokeWidth: strokePx * dpx, ...props.style }}
		/>
	);
};

interface EdgeProps extends PathProps {}

interface AllEdgesProps extends EdgeProps {
	modulo: number;
	remainder: number;
}

export const AllEdges = ({
	strokePx = 1,
	modulo,
	remainder,
	...props
}: AllEdgesProps & SVGAttributes<SVGPathElement>) => {
	const { cells, dpx, vb } = useContext(BoundaryTracingContext);
	const allEdges = useMemo(() => getAllUnitEdges(cells), [cells]);
	const edges = useMemo(
		() =>
			allEdges.filter(
				({ x, y }) => (modulo + ((x + y) % modulo)) % modulo === remainder,
			),
		[allEdges, modulo, remainder],
	);
	const arrowSize = dpx * 8;
	return (
		<path
			{...props}
			className={classnames(css.stroke, props.className)}
			style={{ strokeWidth: strokePx * dpx, ...props.style }}
			d={getEdgesInViewD(edges, vb, arrowSize, 0.1, 0.15)}
		/>
	);
};

export const BoundaryEdges = ({
	strokePx = 1,
	...props
}: EdgeProps & SVGAttributes<SVGPathElement>) => {
	const { cells, dpx, vb } = useContext(BoundaryTracingContext);
	const arrowSize = dpx * 8;
	const unitEdges = useMemo(() => getUnitEdges(cells), [cells]);
	return (
		<path
			{...props}
			className={classnames(css.stroke, props.className)}
			style={{ strokeWidth: strokePx * dpx, ...props.style }}
			d={getEdgesInViewD(unitEdges.boundary, vb, arrowSize, 0.1, 0.15)}
		/>
	);
};

export const NonBoundaryEdges = ({
	strokePx = 1,
	...props
}: EdgeProps & SVGAttributes<SVGPathElement>) => {
	const { cells, dpx, vb } = useContext(BoundaryTracingContext);
	const arrowSize = dpx * 8;
	const unitEdges = useMemo(() => getUnitEdges(cells), [cells]);
	return (
		<path
			{...props}
			className={classnames(css.stroke, props.className)}
			style={{ strokeWidth: strokePx * dpx, ...props.style }}
			d={getEdgesInViewD(unitEdges.nonBoundary, vb, arrowSize, 0.1, 0.15)}
		/>
	);
};

export const CellDelimiters = ({
	strokePx = 1,
	...props
}: EdgeProps & SVGAttributes<SVGPathElement>) => {
	const { cells, dpx, vb } = useContext(BoundaryTracingContext);
	const unitEdges = useMemo(() => getUnitEdges(cells), [cells]);
	return (
		<path
			{...props}
			className={classnames(css.stroke, props.className)}
			style={{ strokeWidth: strokePx * dpx, ...props.style }}
			d={getEdgesInViewD(unitEdges.cellDelimiter, vb, 0, 0, 0.2)}
		/>
	);
};

const getBoundingBox = (cells: Array<Cell>): BoundingBox => {
	let minX = Number.POSITIVE_INFINITY;
	let minY = Number.POSITIVE_INFINITY;
	let maxX = Number.NEGATIVE_INFINITY;
	let maxY = Number.NEGATIVE_INFINITY;
	for (const [x, y] of cells) {
		minX = Math.min(minX, x);
		minY = Math.min(minY, y);
		maxX = Math.max(maxX, x);
		maxY = Math.max(maxY, y);
	}
	return { minX, minY, maxX, maxY };
};

const getUniqueCells = (cells: Array<Cell>): Array<Cell> =>
	cells
		.filter((a, i) => i === cells.findIndex((b) => isSameCell(a, b)))
		.sort((c1, c2) => {
			const d = c1[0] + c1[1] - (c2[0] + c2[1]);
			return d === 0 ? c1[1] - c2[1] : d;
		});

const getAllUnitEdges = (cells: Array<Cell>) => [
	...(function* (): Generator<CellEdge> {
		const cellEdge = (edge: Edge, x: number, y: number): CellEdge =>
			Object.assign(edge, { x, y });
		for (const [x, y] of cells) {
			yield cellEdge([x, y, x + 1, y], x, y);
			yield cellEdge([x + 1, y, x + 1, y + 1], x, y);
			yield cellEdge([x + 1, y + 1, x, y + 1], x, y);
			yield cellEdge([x, y + 1, x, y], x, y);
		}
	})(),
];

const getUnitEdges = (cells: Array<Cell>) => {
	const allEdges = getAllUnitEdges(cells);
	const edgesToBeIgnored = new Set<Edge>();
	const boundary: Array<Edge> = [];
	const nonBoundary: Array<Edge> = [];
	for (const edge of allEdges) {
		if (!edgesToBeIgnored.has(edge)) {
			const oppositeTemp = getOppositeEdge(edge);
			const opposite = allEdges.find((e) => isSameEdge(e, oppositeTemp));
			if (opposite) {
				nonBoundary.push(edge, opposite);
				edgesToBeIgnored.add(opposite);
			} else {
				boundary.push(edge);
			}
		}
	}
	return { boundary, nonBoundary, cellDelimiter: [...edgesToBeIgnored] };
};

const getEdgesInViewD = (
	edges: Array<Edge>,
	vb: BoundingBox,
	arrowSize: number,
	offset1: number,
	offset2: number,
) => {
	const offsetMap: Record<Direction, Edge> = {
		[Direction.Right]: [offset2, offset1, -offset2, offset1],
		[Direction.Down]: [-offset1, offset2, -offset1, -offset2],
		[Direction.Left]: [-offset2, -offset1, offset2, -offset1],
		[Direction.Up]: [offset1, -offset2, offset1, offset2],
	};
	let d = "";
	if (arrowSize === 0) {
		for (const edge of listEdgesInView(edges, offsetMap, vb)) {
			d += getLineD(...edge);
		}
	} else {
		for (const edge of listEdgesInView(edges, offsetMap, vb)) {
			d += getArrowD(edge, arrowSize);
		}
	}
	return d;
};

const getEdgesWithMidArrayInViewD = (
	edges: Array<Edge>,
	vb: BoundingBox,
	arrowSize: number,
	offset1: number,
	offset2: number,
) => {
	const offsetMap: Record<Direction, Edge> = {
		[Direction.Right]: [offset2, offset1, -offset2, offset1],
		[Direction.Down]: [-offset1, offset2, -offset1, -offset2],
		[Direction.Left]: [-offset2, -offset1, offset2, -offset1],
		[Direction.Up]: [offset1, -offset2, offset1, offset2],
	};
	let d = "";
	for (const edge of listEdgesInView(edges, offsetMap, vb)) {
		d += (d ? "L" : "M") + getMidArrowD(edge, arrowSize).slice(1);
	}
	return d;
};

const listEdgesInView = function* (
	edges: Iterable<Edge>,
	offsetMap: Record<Direction, Edge>,
	vb: BoundingBox,
): Generator<Edge> {
	for (const edge of edges) {
		const offset = offsetMap[getDirection(edge)];
		const svgEdge: Edge = [
			edge[0] + offset[0],
			edge[1] + offset[1],
			edge[2] + offset[2],
			edge[3] + offset[3],
		];
		if (isEdgeInView(vb, svgEdge)) {
			yield svgEdge;
		}
	}
};

interface NormalizeAnimationAppProps extends SvgProps {
	/** アプリ識別子 (searchParamsで使います) */
	appId: string;
	/** アニメーション1周の長さ(ms)  */
	durationMs?: number;
	/** リピートまでの遅延(ms) */
	repeatDelayMs?: number;
	/** フェーズの初期値 (範囲:[0,1]) */
	initialPhase?: number;
	/** 自動再生する場合にtrue */
	autoPlay?: boolean;
	/** 方向パターン選択肢を表示する場合にtrue */
	displayTurnType?: boolean;
}

const TurnType = { Left: "左折優先", Right: "右折優先" } as const;
type TurnType = ValueOf<typeof TurnType>;

interface EdgeData {
	normalized: Array<Array<Edge>>;
	remainder: Array<Edge>;
}

export const NormalizeAnimationApp = ({
	appId,
	cells: defaultCells,
	durationMs: defaultDurationMs,
	repeatDelayMs = 100,
	initialPhase = 1,
	autoPlay: defaultAutoPlay,
	displayTurnType = false,
	...props
}: NormalizeAnimationAppProps) => {
	getCurrentUrl.defaultSearchParams = useSearchParams();
	const defaultUniqueCells = useMemo(
		() => getUniqueCells(defaultCells),
		[defaultCells],
	);
	const [cells, setCells] = useState<Array<Cell> & { initial?: boolean }>(
		() => {
			const initialCells: Array<Cell> = [];
			const encoded = appId && getCurrentUrl().searchParams.get(appId);
			if (encoded) {
				// URLにマス目の状態があればそれを使います。
				try {
					initialCells.push(...decodeCellList(encoded));
				} catch (error) {
					console.error(error);
				}
			}
			if (initialCells.length === 0) {
				initialCells.push(...defaultUniqueCells);
			}
			return Object.assign(initialCells, { initial: true });
		},
	);
	const isDefaultCells = useMemo(
		() =>
			cells.length === defaultUniqueCells.length &&
			cells.every((cell, index) => isSameCell(cell, defaultUniqueCells[index])),
		[cells, defaultUniqueCells],
	);
	const durationMs = defaultDurationMs || cells.length * 150;
	const [svg, setSvgElement] = useState<SVGSVGElement | null>(null);
	const isInView = useIsInView(svg, "-20% 0px -40% 0px");
	const [turnType, setTurnType] = useState<TurnType>(TurnType.Left);
	const onRepeat = useCallback(
		() =>
			setTurnType((t) =>
				t === TurnType.Left ? TurnType.Right : TurnType.Left,
			),
		[],
	);
	const [phase, setPhase] = useState<number>(initialPhase);
	const { boundary } = getUnitEdges(cells);
	const consumeLimit = Math.floor((boundary.length + 1) * phase);
	const edges = useMemo(() => {
		let consumeCount = 0;
		const generator = listNormalizedEdges(boundary, turnType);
		let edgeData: EdgeData = { normalized: [], remainder: [] };
		while (consumeCount++ <= consumeLimit) {
			const result = generator.next();
			if (result.done) {
				break;
			}
			edgeData = result.value;
		}
		return edgeData;
	}, [turnType, boundary, consumeLimit]);
	const [targetCell, setTargetCell] = useState<Cell | null>(null);
	useTargetCell(svg, setCells, setTargetCell);
	useEffect(() => {
		if (!cells.initial && appId) {
			// マス目の状態をURLに保存します。
			const url = getCurrentUrl();
			if (isDefaultCells) {
				url.searchParams.delete(appId);
			} else {
				url.searchParams.set(appId, encodeCellList(cells));
			}
			history.replaceState(null, "", url);
		}
	}, [appId, cells, isDefaultCells]);
	const reset = useCallback(
		() => setCells(defaultUniqueCells),
		[defaultUniqueCells],
	);
	const partsCount = useMemo(() => {
		const getCount = (type: TurnType) => {
			let lastEdgeData: EdgeData = { normalized: [], remainder: [] };
			for (const result of listNormalizedEdges(boundary, type)) {
				lastEdgeData = result;
			}
			return lastEdgeData.normalized.length;
		};
		return {
			[TurnType.Left]: getCount(TurnType.Left),
			[TurnType.Right]: getCount(TurnType.Right),
		};
	}, [boundary]);
	const varStyle = { "--gjTotalCount": partsCount[turnType] } as CSSProperties;
	return (
		<>
			<Svg
				{...props}
				className={css.app}
				cells={cells}
				style={varStyle}
				setSvgElement={setSvgElement}
			>
				<Grid strokePx={2} style={{ color: "var(--gjGray3)" }} />
				<Cells style={{ color: "var(--gjGray3)" }} />
				<NormalizedPath edges={edges} />
				<TargetCell cell={targetCell} />
			</Svg>
			<PhaseControl
				defaultAutoPlay={defaultAutoPlay}
				disabled={!isInView}
				durationMs={durationMs}
				repeatDelayMs={repeatDelayMs}
				value={phase}
				onChangeValue={setPhase}
				onRepeat={onRepeat}
			>
				{!isDefaultCells && (
					<button type="button" className={css.reset} onClick={reset}>
						<span className={classnames(css.icon, IconClass)}>delete</span>
						<span>リセット</span>
					</button>
				)}
			</PhaseControl>
			{displayTurnType && (
				<TurnTypeSelector
					turnType={turnType}
					appId={appId}
					onChangeValue={setTurnType}
				/>
			)}
			<DList
				edges={edges}
				partsCount={partsCount[turnType]}
				maxPartsCount={Math.max(...Object.values(partsCount))}
			/>
		</>
	);
};

const useTargetCell = (
	svg: SVGSVGElement | null,
	setCells: Dispatch<SetStateAction<Array<Cell>>>,
	setTargetCell: Dispatch<SetStateAction<Cell | null>>,
) => {
	useEffect(() => {
		const abc = new AbortController();
		if (svg) {
			type ClientPosition = { clientX: number; clientY: number };
			const getCell = (e: ClientPosition): Cell => {
				const rect = svg.getBoundingClientRect();
				const vb = svg.viewBox.baseVal;
				const x = vb.x + ((e.clientX - rect.left) * vb.width) / rect.width;
				const y = vb.y + ((e.clientY - rect.top) * vb.height) / rect.height;
				return [Math.floor(x), Math.floor(y)];
			};
			const onMove = (event: ClientPosition) => setTargetCell(getCell(event));
			svg.addEventListener("pointermove", onMove, { signal: abc.signal });
			const onLeave = () => setTargetCell(null);
			svg.addEventListener("pointerleave", onLeave, { signal: abc.signal });
			const onClick = (event: ClientPosition) => {
				const target = getCell(event);
				setCells((current) => {
					const index = current.findIndex((cell) => isSameCell(cell, target));
					if (index < 0) {
						return getUniqueCells([...current, target]);
					}
					return [...current.slice(0, index), ...current.slice(index + 1)];
				});
			};
			svg.addEventListener("click", onClick, { signal: abc.signal });
		}
		return () => abc.abort();
	}, [svg, setCells, setTargetCell]);
};

interface PhaseControlProps {
	defaultAutoPlay?: boolean;
	disabled?: boolean;
	durationMs: number;
	repeatDelayMs: number;
	value: number;
	onChangeValue: (phase: number) => void;
	onRepeat?: (repeatCount: number) => void;
}

const TargetCell = ({ cell }: { cell: Cell | null }) => {
	const { cells, dpx } = useContext(BoundaryTracingContext);
	if (!cell) {
		return null;
	}
	const isDeletion = cells.some((c) => isSameCell(c, cell));
	return (
		<rect
			x={r(cell[0])}
			y={r(cell[1])}
			width={1}
			height={1}
			className={css.target}
			style={{ strokeWidth: 4 * dpx }}
		>
			<title>
				({cell.join(",")})を{isDeletion ? "削除" : "追加"}
			</title>
		</rect>
	);
};

const PhaseControl = ({
	disabled,
	durationMs,
	repeatDelayMs,
	value,
	onChangeValue,
	onRepeat,
	children,
	defaultAutoPlay = false,
}: PropsWithChildren<PhaseControlProps>) => {
	const valueRef = useRef(value);
	valueRef.current = value;
	const [autoPlay, setAutoPlay] = useState<boolean>(defaultAutoPlay);
	const onChange = useCallback(
		(event: ChangeEvent<HTMLInputElement>) => {
			onChangeValue(Number.parseFloat(event.currentTarget.value));
			setAutoPlay(false);
		},
		[onChangeValue],
	);
	const isPlaying = !disabled && autoPlay;
	useEffect(() => {
		let frameId = 0;
		if (isPlaying) {
			frameId = requestAnimationFrame((t0) => {
				const totalMs = repeatDelayMs + durationMs;
				const startedAt = t0 - valueRef.current * durationMs;
				let previousP = 0;
				let repeatCount = 0;
				const animate = (timestamp: number) => {
					const p = ((timestamp - startedAt) % totalMs) / durationMs;
					if (onRepeat && p < previousP) {
						onRepeat(++repeatCount);
					}
					onChangeValue(clamp(p, 0, 1));
					frameId = requestAnimationFrame(animate);
					previousP = p;
				};
				frameId = requestAnimationFrame(animate);
			});
		}
		return () => cancelAnimationFrame(frameId);
	}, [isPlaying, durationMs, repeatDelayMs, onChangeValue, onRepeat]);
	const onClickPlay = useCallback(() => setAutoPlay((v) => !v), []);
	return (
		<div className={css.control}>
			<button
				type="button"
				title="再生/一時停止"
				className={IconClass}
				value="-"
				onClick={onClickPlay}
			>
				{isPlaying ? "pause_circle" : "play_circle"}
			</button>
			<input
				title="アニメーションの進行度"
				min={0}
				max={1}
				step={0.001}
				value={value.toFixed(4)}
				type="range"
				onChange={onChange}
			/>
			{children}
		</div>
	);
};

interface TurnTypeSelectorProps {
	turnType: TurnType;
	appId: string;
	onChangeValue: (value: TurnType) => void;
}

const TurnTypeSelector = ({
	turnType,
	appId,
	onChangeValue,
}: TurnTypeSelectorProps) => {
	const onChange = useCallback(
		({ currentTarget: { value } }: ChangeEvent<HTMLInputElement>) => {
			for (const type of Object.values(TurnType)) {
				if (value === type) {
					onChangeValue(type);
					break;
				}
			}
		},
		[onChangeValue],
	);
	return (
		<div className={css.turnType}>
			{[...Object.values(TurnType)].map((type) => {
				const name = `${appId}TurnType`;
				return (
					<label key={`${appId}TurnType${type}`}>
						<input
							type="radio"
							name={name}
							value={type}
							onChange={onChange}
							checked={type === turnType}
						/>
						{type}
					</label>
				);
			})}
		</div>
	);
};

interface NormalizedPathProps {
	edges: EdgeData;
}

const NormalizedPath = ({ edges }: NormalizedPathProps) => {
	const { dpx, vb } = useContext(BoundaryTracingContext);
	return (
		<>
			{edges.normalized.map((edgeList, index) => {
				const d = getEdgesWithMidArrayInViewD(edgeList, vb, dpx * 8, 0, 0.15);
				const pathStyle = { strokeWidth: 4 * dpx, "--gjIndex": `${index}` };
				return (
					<path
						key={d}
						className={classnames(css.stroke, css.indexColor)}
						style={pathStyle}
						d={d}
					/>
				);
			})}
			<path
				className={classnames(css.stroke)}
				style={{ strokeWidth: 4 * dpx, color: "var(--gjGray6)" }}
				d={getEdgesInViewD(edges.remainder, vb, dpx * 8, 0, 0.2)}
			/>
		</>
	);
};

const listNormalizedEdges = function* (
	edgeList: Array<Edge>,
	turnType: TurnType,
): Generator<EdgeData> {
	const remainder = edgeList.slice();
	let buffer: Array<Edge> = [];
	const normalized: Array<Array<Edge>> = [buffer];
	yield {
		normalized: normalized.slice(),
		remainder: remainder.slice(),
	};
	let edge = remainder.shift();
	while (edge) {
		if (buffer[buffer.length - 1] !== edge) {
			edge = edge.slice() as Edge;
			buffer.push(edge);
		}
		yield {
			normalized: normalized.slice(),
			remainder: remainder.slice(),
		};
		const currentDirection = getDirection(edge);
		const directionPriority = [
			Direction.Right,
			Direction.Down,
			Direction.Left,
			Direction.Up,
		];
		if (turnType === TurnType.Left) {
			directionPriority.reverse();
		}
		directionPriority.push(...directionPriority);
		for (let index = directionPriority.indexOf(currentDirection); index--; ) {
			directionPriority.push(directionPriority.shift() as Direction);
		}
		let next: { priority: number; edge: Edge; index: number } | undefined;
		for (let index = 0; index < remainder.length; index++) {
			const e = remainder[index];
			if (edge[2] === e[0] && edge[3] === e[1]) {
				const direction = getDirection(e);
				const priority = directionPriority.indexOf(direction);
				if (!next || priority < next.priority) {
					next = { priority, edge: e, index };
					if (priority === 0) {
						break;
					}
				}
			}
		}
		if (next) {
			remainder.splice(next.index, 1);
			if (next.priority === 0) {
				edge[2] = next.edge[2];
				edge[3] = next.edge[3];
			} else {
				edge = next.edge;
			}
		} else {
			buffer = [];
			normalized.push(buffer);
			edge = remainder.shift();
		}
	}
};

interface DListProps {
	edges: EdgeData;
	partsCount: number;
	maxPartsCount: number;
}

const DList = ({ edges, partsCount, maxPartsCount }: DListProps) => {
	const dList = useMemo(
		() => [
			...(function* () {
				let count = 0;
				for (const edgeList of edges.normalized) {
					for (const d of listEdgesD(edgeList, true)) {
						yield { d, key: count++, normalized: true };
					}
				}
				for (const d of listEdgesD(edges.remainder)) {
					yield { d, key: count++, remainder: true };
				}
				while (count <= maxPartsCount) {
					yield { d: "", key: count++ };
				}
			})(),
		],
		[edges, maxPartsCount],
	);
	const varStyle = { "--gjTotalCount": `${partsCount}` } as CSSProperties;
	return (
		<div className={css.dList} style={varStyle}>
			{dList.map(({ key, d, normalized, remainder }, index) => {
				const indexStyle = { "--gjIndex": index } as CSSProperties;
				return (
					<Fragment key={key}>
						<div
							className={classnames(
								css.badge,
								normalized && css.indexColor,
								remainder && css.remainder,
								!d && css.empty,
							)}
							style={indexStyle}
						/>
						<code className={classnames(!d && css.empty)}>{d}</code>
					</Fragment>
				);
			})}
		</div>
	);
};

const listEdgesD = function* (
	edges: Iterable<Edge>,
	closePath = false,
): Generator<string> {
	let e0: Edge | undefined;
	let e1: Edge | undefined;
	let d = "";
	for (const e2 of edges) {
		if (!e0) {
			e0 = e2;
		}
		if (!e1 || e1[2] !== e2[0] || e1[3] !== e2[1]) {
			if (closePath && e1 && e1[2] === e0[0] && e1[3] === e0[1]) {
				yield `${d}Z`;
				e0 = e2;
				d = "";
			}
			d += `M${r(e2[0])} ${r(e2[1])}`;
		}
		d += getNextDFragment(...e2);
		e1 = e2;
	}
	if (closePath && e0 && e1 && e1[2] === e0[0] && e1[3] === e0[1]) {
		d += "Z";
	}
	if (d) {
		yield d;
	}
};
