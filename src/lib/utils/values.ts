// Value equality and emptiness shared by fields, Form and registered input types. A field's
// "empty" is what a user sees as nothing entered: no text, no selection, no file. Equality
// compares what a value means rather than its identity, so a Form that writes a value back as a
// new array, or a parent that resets a date to an equal Date, does not read as an edit.

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
	if (value === null || typeof value !== 'object') return false;
	const prototype = Object.getPrototypeOf(value);
	return prototype === Object.prototype || prototype === null;
};

/**
 * Whether a value holds nothing a user entered: `null`, `undefined`, `''`, an empty array, or an
 * array of empty slots (a date range with neither end chosen).
 */
export const isEmptyValue = (value: unknown): boolean => {
	if (value === null || value === undefined || value === '') return true;
	if (Array.isArray(value)) return value.every((item) => item === null || item === undefined);
	return false;
};

/**
 * Structural equality: Dates by time, arrays item by item, plain objects key by key; everything
 * else (files, blobs, class instances, primitives) by identity, with `NaN` equal to itself.
 */
export const deepEqual = (left: unknown, right: unknown): boolean => {
	if (Object.is(left, right)) return true;
	if (left instanceof Date || right instanceof Date) {
		return (
			left instanceof Date && right instanceof Date && Object.is(left.getTime(), right.getTime())
		);
	}
	if (Array.isArray(left) || Array.isArray(right)) {
		if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) return false;
		return left.every((item, index) => deepEqual(item, right[index]));
	}
	if (isPlainObject(left) && isPlainObject(right)) {
		const leftKeys = Object.keys(left);
		if (leftKeys.length !== Object.keys(right).length) return false;
		return leftKeys.every((key) => Object.hasOwn(right, key) && deepEqual(left[key], right[key]));
	}
	return false;
};

/**
 * Field value equality: two empty values are equal whatever their shape (`null`, `''`, `[]`), so
 * clearing a field back to nothing is not a change; otherwise the values must be `deepEqual`.
 */
export const valuesEqual = (left: unknown, right: unknown): boolean =>
	(isEmptyValue(left) && isEmptyValue(right)) || deepEqual(left, right);
