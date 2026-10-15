import { en, type Messages } from '$lib/i18n/en.js';

export type AIToolValueTreeNode =
	| {
			kind: 'branch';
			/** Object key, or `''` for array items and the root (no key is shown). */
			key: string;
			valueKind: 'object' | 'array';
			summary: string;
			children: AIToolValueTreeNode[];
	  }
	| {
			kind: 'leaf';
			key: string;
			value: string;
			valueKind: 'string' | 'number' | 'boolean' | 'null' | 'undefined' | 'empty' | 'unknown';
	  };

/** Words the value renderers need, read from the i18n catalog. */
export type AIToolValueMessages = Pick<
	Messages,
	| 'aiToolValueItems'
	| 'aiToolValueKeys'
	| 'aiToolValueMore'
	| 'aiToolValueEmptyArray'
	| 'aiToolValueEmptyObject'
	| 'aiToolValueCircular'
	| 'aiToolValueMaxDepth'
	| 'aiToolValueInvalidDate'
	| 'aiToolValueUnreadable'
>;

const DEFAULT_MAX_DEPTH = 8;
const DEFAULT_MAX_ENTRIES = 80;

type Limits = { maxDepth: number; maxEntries: number; t: AIToolValueMessages };

function limits(maxDepth: number, maxEntries: number, t: AIToolValueMessages): Limits {
	return {
		maxDepth: normalizeLimit(maxDepth, DEFAULT_MAX_DEPTH),
		maxEntries: normalizeLimit(maxEntries, DEFAULT_MAX_ENTRIES),
		t
	};
}

export function buildToolValueTree(
	value: unknown,
	maxDepth = DEFAULT_MAX_DEPTH,
	maxEntries = DEFAULT_MAX_ENTRIES,
	t: AIToolValueMessages = en
): AIToolValueTreeNode[] {
	const tree = buildNode('', value, new WeakSet(), 0, limits(maxDepth, maxEntries, t));
	return tree.kind === 'branch' && tree.key === '' ? tree.children : [tree];
}

/** Counts rendered rows so a long tree can collapse behind "Show all". */
export function countToolValueTreeRows(nodes: readonly AIToolValueTreeNode[]): number {
	return nodes.reduce(
		(count, node) =>
			count + 1 + (node.kind === 'branch' ? countToolValueTreeRows(node.children) : 0),
		0
	);
}

function buildNode(
	key: string,
	value: unknown,
	seen: WeakSet<object>,
	depth: number,
	options: Limits
): AIToolValueTreeNode {
	const { t } = options;
	if (value === null || typeof value !== 'object') return leafNode(key, value);
	if (value instanceof Date) {
		return Number.isNaN(value.getTime())
			? leafNode(key, t.aiToolValueInvalidDate, 'unknown')
			: leafNode(key, value.toISOString(), 'unknown');
	}
	if (value instanceof Error) return leafNode(key, errorText(value), 'unknown');
	if (depth >= options.maxDepth) return leafNode(key, t.aiToolValueMaxDepth, 'unknown');
	if (seen.has(value)) return leafNode(key, t.aiToolValueCircular, 'unknown');

	seen.add(value);
	const node = Array.isArray(value)
		? arrayNode(key, value, seen, depth, options)
		: objectNode(key, value, seen, depth, options);
	seen.delete(value);
	return node;
}

function arrayNode(
	key: string,
	value: unknown[],
	seen: WeakSet<object>,
	depth: number,
	options: Limits
): AIToolValueTreeNode {
	const { t, maxEntries } = options;
	// Array items carry no key: their position is already the row order, and `[0]` keys were noise.
	const children = value
		.slice(0, maxEntries)
		.map((entry) => buildNode('', entry, seen, depth + 1, options));
	if (value.length > maxEntries) {
		children.push(leafNode('', t.aiToolValueMore(value.length - maxEntries), 'empty'));
	}
	if (value.length === 0) return leafNode(key, t.aiToolValueEmptyArray, 'empty');
	return {
		kind: 'branch',
		key,
		valueKind: 'array',
		summary: t.aiToolValueItems(value.length),
		children
	};
}

function objectNode(
	key: string,
	value: object,
	seen: WeakSet<object>,
	depth: number,
	options: Limits
): AIToolValueTreeNode {
	const { t, maxEntries } = options;
	const { keys, hasMore } = collectEnumerableKeys(value, maxEntries);
	if (keys.length === 0) return leafNode(key, objectLabel(value, t), 'empty');

	const children = keys.map((entryKey) =>
		buildNode(entryKey, readProperty(value, entryKey, t), seen, depth + 1, options)
	);
	if (hasMore) children.push(leafNode('', `…`, 'empty'));
	return {
		kind: 'branch',
		key,
		valueKind: 'object',
		summary: hasMore ? t.aiToolValueKeys(`${maxEntries}+`) : t.aiToolValueKeys(keys.length),
		children
	};
}

/**
 * A JSON-safe copy of an arbitrary tool value, bounded like the tree: circular references, depth
 * and entry limits become readable markers, Dates become ISO strings, Errors become their message.
 */
export function toToolJsonValue(
	value: unknown,
	maxDepth = DEFAULT_MAX_DEPTH,
	maxEntries = DEFAULT_MAX_ENTRIES,
	t: AIToolValueMessages = en
): unknown {
	return jsonNode(value, new WeakSet(), 0, limits(maxDepth, maxEntries, t));
}

function jsonNode(value: unknown, seen: WeakSet<object>, depth: number, options: Limits): unknown {
	const { t, maxEntries } = options;
	if (value === undefined) return null;
	if (typeof value === 'bigint') return value.toString();
	if (typeof value === 'number') return Number.isFinite(value) ? value : String(value);
	if (typeof value === 'symbol' || typeof value === 'function') return formatValue(value);
	if (value === null || typeof value !== 'object') return value;
	if (value instanceof Date) {
		return Number.isNaN(value.getTime()) ? t.aiToolValueInvalidDate : value.toISOString();
	}
	if (value instanceof Error) return errorText(value);
	if (depth >= options.maxDepth) return `[${t.aiToolValueMaxDepth}]`;
	if (seen.has(value)) return `[${t.aiToolValueCircular}]`;

	seen.add(value);
	let result: unknown;
	if (Array.isArray(value)) {
		const items = value
			.slice(0, maxEntries)
			.map((entry) => jsonNode(entry, seen, depth + 1, options));
		if (value.length > maxEntries) items.push(`… ${t.aiToolValueMore(value.length - maxEntries)}`);
		result = items;
	} else {
		const { keys, hasMore } = collectEnumerableKeys(value, maxEntries);
		const record: Record<string, unknown> = {};
		for (const key of keys) {
			record[key] = jsonNode(readProperty(value, key, t), seen, depth + 1, options);
		}
		if (hasMore) record['…'] = '…';
		result = record;
	}
	seen.delete(value);
	return result;
}

/** Plain sentence for an error value, or `undefined` when it needs the structured view. */
export function getToolErrorSentence(value: unknown): string | undefined {
	if (typeof value === 'string') return value;
	if (value instanceof Error) return value.message || value.name;
	if (value === null || typeof value !== 'object') return formatValue(value);
	// MCP results flag errors with `isError` and carry the text in `content[].text`.
	const content = (value as { content?: unknown }).content;
	if (Array.isArray(content)) {
		const texts = content
			.map((part) =>
				part && typeof part === 'object' ? (part as { text?: unknown }).text : undefined
			)
			.filter((text): text is string => typeof text === 'string' && text.length > 0);
		if (texts.length > 0 && texts.length === content.length) return texts.join('\n');
	}
	const message = (value as { message?: unknown }).message;
	if (typeof message === 'string' && Object.keys(value).length <= 2) return message;
	return undefined;
}

function errorText(value: Error): string {
	return value.message ? `${value.name}: ${value.message}` : value.name;
}

function collectEnumerableKeys(
	value: object,
	maxEntries: number
): { keys: string[]; hasMore: boolean } {
	const keys: string[] = [];
	for (const key in value) {
		if (!Object.prototype.hasOwnProperty.call(value, key)) continue;
		if (keys.length === maxEntries) return { keys, hasMore: true };
		keys.push(key);
	}
	return { keys, hasMore: false };
}

function readProperty(value: object, key: string, t: AIToolValueMessages): unknown {
	try {
		return Reflect.get(value, key);
	} catch {
		return new Error(t.aiToolValueUnreadable);
	}
}

function leafNode(
	key: string,
	value: unknown,
	valueKind = primitiveKind(value)
): Extract<AIToolValueTreeNode, { kind: 'leaf' }> {
	// Strings are quoted so the string "3" reads differently from the number 3.
	const text =
		typeof value === 'string' && valueKind === 'string'
			? JSON.stringify(value)
			: formatValue(value);
	return { kind: 'leaf', key, value: text, valueKind };
}

function primitiveKind(
	value: unknown
): Extract<AIToolValueTreeNode, { kind: 'leaf' }>['valueKind'] {
	if (value === null) return 'null';
	if (value === undefined) return 'undefined';
	if (typeof value === 'string') return 'string';
	if (typeof value === 'number' || typeof value === 'bigint') return 'number';
	if (typeof value === 'boolean') return 'boolean';
	return 'unknown';
}

function formatValue(value: unknown): string {
	if (value === null) return 'null';
	if (value === undefined) return 'undefined';
	if (typeof value === 'symbol') {
		return value.description ? `Symbol(${value.description})` : 'Symbol';
	}
	if (typeof value === 'function') return value.name ? `Function ${value.name}` : 'Function';
	return String(value);
}

function objectLabel(value: object, t: AIToolValueMessages): string {
	const name = value.constructor?.name;
	if (!name || name === 'Object') return t.aiToolValueEmptyObject;
	return name;
}

function normalizeLimit(value: number, fallback: number): number {
	if (!Number.isFinite(value)) return fallback;
	return Math.max(1, Math.floor(value));
}
