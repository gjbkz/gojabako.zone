import {
	getType,
	isFiniteNumber,
	isFunction,
	isNonNegativeSafeInteger,
	isNull,
	isObject,
} from "@nlib/typing";

type PathItem = string | number;

export interface WalkStep<T = unknown> {
	text: string;
	value: T;
	type: string;
	path: Array<PathItem>;
}

export const walkValue = function* (
	value: unknown,
	path: Array<PathItem> = [],
	circular = new WeakMap<object, Array<PathItem>>(),
): Generator<WalkStep> {
	switch (typeof value) {
		case "string":
			yield { text: JSON.stringify(value), value, type: "String", path };
			break;
		case "number":
			yield { text: `${value}`, value, type: "Number", path };
			break;
		case "boolean":
			yield { text: `${value}`, value, type: "Boolean", path };
			break;
		case "undefined":
			yield { text: "undefined", value, type: "Undefined", path };
			break;
		case "bigint":
			yield { text: value.toString(), value, type: "BigInt", path };
			break;
		case "symbol":
			yield { text: value.toString(), value, type: "Symbol", path };
			break;
		case "function":
			yield { text: `function ${value.name}`, value, type: "Symbol", path };
			break;
		default:
			if (isNull(value)) {
				yield { text: "null", value, type: "Null", path };
			} else if (isObject(value)) {
				yield* walkObject(value, path, circular);
			} else {
				yield { text: `${value}`, value, type: "Unknown", path };
			}
	}
};

const getArrayBuffer = (input: unknown): ArrayBuffer | null => {
	if (input instanceof ArrayBuffer) {
		return input;
	}
	if (isObject(input)) {
		if ("buffer" in input) {
			return getArrayBuffer(input.buffer);
		}
		if (isNonNegativeSafeInteger(input.byteLength) && isFunction(input.slice)) {
			return input as unknown as ArrayBuffer;
		}
	}
	return null;
};

const walkObject = function* (
	value: Record<string, unknown>,
	path: Array<PathItem>,
	circular: WeakMap<object, Array<PathItem>>,
): Generator<WalkStep> {
	const circularPath = circular.get(value);
	if (circularPath) {
		const text = `[Circular ${circularPath.join(".")}]`;
		yield { text, value, type: "Circular", path };
	} else if (typeof value.message === "string" && "stack" in value) {
		const { stack } = value;
		if (typeof stack === "string") {
			yield { text: stack, value, type: getType(value), path };
			return;
		}
	} else {
		circular.set(value, path);
		const type = getType(value);
		yield { text: `${type}(${getSize(value)})`, value, type, path };
	}
	const buffer = getArrayBuffer(value);
	if (buffer) {
		yield* walkBuffer(buffer, path);
		return;
	}
	if ("entries" in value && isFunction(value.entries)) {
		const iterator = value.entries();
		if (Symbol.iterator in value && isFunction(value[Symbol.iterator])) {
			for (const item of iterator as Iterable<unknown>) {
				if (Array.isArray(item)) {
					yield* walkValue(item[1], path.concat(item[0]), circular);
				}
			}
			return;
		}
	}
	for (const key of Object.keys(value)) {
		if (key in value) {
			yield* walkValue(value[key], path.concat(key), circular);
		}
	}
};

const walkBuffer = function* (
	buffer: ArrayBuffer,
	path: Array<PathItem>,
): Generator<WalkStep> {
	const view = new Uint8Array(buffer);
	const maxPos = view.length;
	const blockSize = 16;
	for (let pos = 0; pos < maxPos; pos += blockSize) {
		const chunk = view.slice(pos, pos + blockSize);
		yield {
			text: [...chunk]
				.map((byte) => byte.toString(16).padStart(2, "0"))
				.join(" "),
			value: chunk,
			type: "BufferChunk",
			path: path.concat(`0x${pos.toString(16).padStart(2, "0")}`),
		};
	}
};

const getSize = (value: Record<string, unknown>): number => {
	if (isFiniteNumber(value.length)) {
		return value.length;
	}
	if (isFiniteNumber(value.size)) {
		return value.size;
	}
	if (isFiniteNumber(value.byteLength)) {
		return value.byteLength;
	}
	return Object.keys(value).length;
};
