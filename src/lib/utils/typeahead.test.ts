import { describe, expect, it, vi } from 'vitest';
import { createTypeahead } from './typeahead.js';

const key = (k: string, extra: Partial<KeyboardEvent> = {}) =>
	({
		key: k,
		target: null,
		ctrlKey: false,
		metaKey: false,
		altKey: false,
		...extra
	}) as KeyboardEvent;

const setup = (items: string[], current = -1) => {
	const onMatch = vi.fn();
	let index = current;
	const typeahead = createTypeahead({
		getItems: () => items,
		getText: (item) => item,
		getCurrentIndex: () => index,
		onMatch: (i, item) => {
			index = i;
			onMatch(i, item);
		},
		timeout: 50
	});
	return { typeahead, onMatch, current: () => index };
};

describe('createTypeahead', () => {
	it('jumps to the next item starting with the typed letter, wrapping around', () => {
		const { typeahead, current } = setup(['Apple', 'Banana', 'Blueberry', 'Cherry'], 2);
		expect(typeahead.handleKey(key('b'))).toBe(true);
		expect(current()).toBe(1); // wraps past Cherry back to Banana
	});

	it('refines a multi-letter buffer against the same item', () => {
		const { typeahead, current } = setup(['Apple', 'Banana', 'Blueberry']);
		typeahead.handleKey(key('b'));
		expect(current()).toBe(1);
		typeahead.handleKey(key('l'));
		expect(current()).toBe(2); // "bl" → Blueberry
	});

	it('cycles through items when the same letter repeats', () => {
		const { typeahead, current } = setup(['Banana', 'Blueberry', 'Bread']);
		typeahead.handleKey(key('b'));
		typeahead.handleKey(key('b'));
		typeahead.handleKey(key('b'));
		expect(current()).toBe(2);
	});

	it('ignores modifier chords and a leading space', () => {
		const { typeahead, onMatch } = setup(['Apple']);
		expect(typeahead.handleKey(key('a', { ctrlKey: true }))).toBe(false);
		expect(typeahead.handleKey(key(' '))).toBe(false);
		expect(onMatch).not.toHaveBeenCalled();
	});

	it('resets the buffer after the timeout', async () => {
		vi.useFakeTimers();
		const { typeahead, current } = setup(['Apple', 'Banana', 'Blueberry']);
		typeahead.handleKey(key('b'));
		vi.advanceTimersByTime(60);
		typeahead.handleKey(key('a'));
		expect(current()).toBe(0); // fresh buffer "a", not "ba"
		vi.useRealTimers();
	});
});
