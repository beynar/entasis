import { afterEach, describe, expect, test, vi } from 'vitest';
import { flushSync } from 'svelte';
import { createOptionIds, useListNavigation } from './useListNavigation.svelte.js';

type Options = Parameters<typeof useListNavigation<string>>[0];

const cleanups: Array<() => void> = [];

/** Runs the hook inside an effect root, with reactive `values`, `query` and `open`. */
const setup = (
	initial: string[],
	extra: Partial<Omit<Options, 'query' | 'open'>> & { query?: string; open?: boolean } = {}
) => {
	const state = $state({
		values: initial,
		query: extra.query ?? '',
		open: extra.open ?? true
	});
	const { query, open, ...rest } = extra;
	void query;
	void open;
	let nav!: ReturnType<typeof useListNavigation<string>>;
	const stop = $effect.root(() => {
		nav = useListNavigation<string>({
			values: () => state.values,
			...(extra.query !== undefined ? { query: () => state.query } : {}),
			...(extra.open !== undefined ? { open: () => state.open } : {}),
			...rest
		});
	});
	cleanups.push(stop);
	flushSync();
	return { nav, state, stop };
};

const key = (name: string, extra: KeyboardEventInit = {}) => {
	const event = new KeyboardEvent('keydown', { key: name, cancelable: true, ...extra });
	return event;
};

afterEach(() => {
	for (const stop of cleanups.splice(0)) stop();
	document.body.innerHTML = '';
	vi.useRealTimers();
});

describe('useListNavigation highlight model', () => {
	test('highlights the first value by default and re-anchors when it disappears', () => {
		const { nav, state } = setup(['a', 'b', 'c']);
		expect(nav.highlighted).toBe('a');
		nav.highlight('c');
		state.values = ['b', 'c'];
		flushSync();
		expect(nav.highlighted).toBe('c');
		state.values = ['b'];
		flushSync();
		expect(nav.highlighted).toBe('b');
	});

	test('autoHighlight false leaves nothing highlighted and Enter does nothing', () => {
		const onSelect = vi.fn();
		const { nav, state } = setup(['a', 'b'], { autoHighlight: false, onSelect });
		expect(nav.highlighted).toBeUndefined();
		const enter = key('Enter');
		nav.onKeydown(enter);
		expect(onSelect).not.toHaveBeenCalled();
		expect(enter.defaultPrevented).toBe(false);
		nav.onKeydown(key('ArrowDown'));
		expect(nav.highlighted).toBe('a');
		state.values = ['b'];
		flushSync();
		expect(nav.highlighted).toBeUndefined();
	});

	test('autoHighlight true highlights the first match only once a query is typed', () => {
		const { nav, state } = setup(['apple', 'avocado'], { autoHighlight: true, query: '' });
		expect(nav.highlighted).toBeUndefined();
		state.query = 'a';
		flushSync();
		expect(nav.highlighted).toBe('apple');
		nav.highlight('avocado');
		state.query = '';
		flushSync();
		expect(nav.highlighted).toBeUndefined();
	});

	test('anchor wins when the list opens and when the query clears', () => {
		const { nav, state } = setup(['a', 'b', 'c'], {
			anchor: () => 'c',
			query: '',
			open: false
		});
		expect(nav.highlighted).toBeUndefined();
		state.open = true;
		flushSync();
		expect(nav.highlighted).toBe('c');

		state.query = 'x';
		state.values = ['a', 'b'];
		flushSync();
		expect(nav.highlighted).toBe('a'); // anchor is not in the filtered list

		state.query = '';
		state.values = ['a', 'b', 'c'];
		flushSync();
		expect(nav.highlighted).toBe('c');
	});

	test('anchor is ignored while a query is typed and when it is not in the list', () => {
		const { nav, state } = setup(['a', 'b'], { anchor: () => 'zzz', query: '' });
		expect(nav.highlighted).toBe('a');
		state.open = true;
		state.query = 'b';
		flushSync();
		expect(nav.highlighted).toBe('a');
	});

	test('an anchor still wins when the values arrive after the list opened', () => {
		const { nav, state } = setup([], { anchor: () => 'b', query: '' });
		expect(nav.highlighted).toBeUndefined();
		state.values = ['a', 'b', 'c'];
		flushSync();
		expect(nav.highlighted).toBe('b');
	});

	test('reanchor re-runs the anchor, else the auto-highlight rule', () => {
		let anchor: string | undefined = 'c';
		const { nav } = setup(['a', 'b', 'c'], { anchor: () => anchor });
		nav.highlight('b');
		nav.reanchor();
		expect(nav.highlighted).toBe('c');
		expect(nav.highlightDetails.reason).toBe('list');
		anchor = undefined;
		nav.highlight('b');
		nav.reanchor();
		expect(nav.highlighted).toBe('a');
	});

	test('the highlight is left alone while the list is closed', () => {
		const { nav, state } = setup(['a', 'b'], { open: true });
		nav.highlight('b');
		state.open = false;
		state.values = ['a'];
		flushSync();
		expect(nav.highlighted).toBe('b');
		state.open = true;
		flushSync();
		expect(nav.highlighted).toBe('a');
	});
});

describe('useListNavigation loop', () => {
	test('wrap goes round both ends and starts at the last value with ArrowUp', () => {
		const { nav } = setup(['a', 'b', 'c'], { autoHighlight: false });
		nav.onKeydown(key('ArrowUp'));
		expect(nav.highlighted).toBe('c');
		nav.onKeydown(key('ArrowDown'));
		expect(nav.highlighted).toBe('a');
	});

	test('input lands on no highlight at either end, then wraps from there', () => {
		const { nav } = setup(['a', 'b'], { loop: 'input' });
		expect(nav.highlighted).toBe('a');
		nav.onKeydown(key('ArrowUp'));
		expect(nav.highlighted).toBeUndefined();
		expect(nav.activeDescendant).toBeUndefined();
		nav.onKeydown(key('ArrowUp'));
		expect(nav.highlighted).toBe('b');
		nav.onKeydown(key('ArrowDown'));
		expect(nav.highlighted).toBeUndefined();
		nav.onKeydown(key('ArrowDown'));
		expect(nav.highlighted).toBe('a');
	});

	test('false stops at the ends and the legacy boolean still works', () => {
		const stop = setup(['a', 'b'], { loop: false });
		stop.nav.onKeydown(key('ArrowUp'));
		expect(stop.nav.highlighted).toBe('a');
		stop.nav.onKeydown(key('End'));
		stop.nav.onKeydown(key('ArrowDown'));
		expect(stop.nav.highlighted).toBe('b');

		const wrap = setup(['a', 'b'], { loop: true });
		wrap.nav.onKeydown(key('ArrowUp'));
		expect(wrap.nav.highlighted).toBe('b');
	});
});

describe('useListNavigation reasons', () => {
	test('reports keyboard, pointer and list reasons with their events', () => {
		const onHighlightChange = vi.fn();
		const { nav, state } = setup(['a', 'b', 'c'], { onHighlightChange });
		expect(onHighlightChange).toHaveBeenLastCalledWith('a', { reason: 'list' });

		const down = key('ArrowDown');
		nav.onKeydown(down);
		expect(onHighlightChange).toHaveBeenLastCalledWith('b', { reason: 'keyboard', event: down });

		const move = new MouseEvent('pointermove', { clientX: 4, clientY: 4 });
		nav.pointerHighlight('c', move);
		expect(onHighlightChange).toHaveBeenLastCalledWith('c', { reason: 'pointer', event: move });
		expect(nav.highlightDetails.reason).toBe('pointer');

		state.values = ['a'];
		flushSync();
		expect(onHighlightChange).toHaveBeenLastCalledWith('a', { reason: 'list' });
	});

	test('typeahead matches report the keyboard event', () => {
		const onHighlightChange = vi.fn();
		const { nav } = setup(['apple', 'banana'], { typeahead: (v) => v, onHighlightChange });
		const press = key('b');
		nav.onKeydown(press);
		expect(nav.highlighted).toBe('banana');
		expect(onHighlightChange).toHaveBeenLastCalledWith('banana', {
			reason: 'keyboard',
			event: press
		});
	});
});

describe('useListNavigation typeahead state', () => {
	test('isTyping tracks the buffer and reset clears it', () => {
		const { nav } = setup(['apple', 'banana'], { typeahead: (v) => v });
		expect(nav.typeahead?.isTyping).toBe(false);
		nav.onKeydown(key('b'));
		expect(nav.typeahead?.isTyping).toBe(true);
		nav.typeahead?.reset();
		expect(nav.typeahead?.isTyping).toBe(false);
	});

	test('isTyping clears itself after the timeout', () => {
		vi.useFakeTimers();
		const { nav } = setup(['apple', 'banana'], { typeahead: (v) => v });
		nav.onKeydown(key('a'));
		expect(nav.typeahead?.isTyping).toBe(true);
		vi.advanceTimersByTime(1100);
		expect(nav.typeahead?.isTyping).toBe(false);
	});

	test('destroying the root drops the buffer and the pending scroll timer', () => {
		vi.useFakeTimers();
		const { nav, stop } = setup(['apple', 'banana'], { typeahead: (v) => v });
		nav.onKeydown(key('b'));
		expect(nav.typeahead?.isTyping).toBe(true);
		expect(vi.getTimerCount()).toBeGreaterThan(0);
		stop();
		expect(nav.typeahead?.isTyping).toBe(false);
		expect(vi.getTimerCount()).toBe(0);
	});

	test('the typeahead is null without the option', () => {
		expect(setup(['a']).nav.typeahead).toBeNull();
	});
});

describe('useListNavigation pointer guard', () => {
	test('ignores pointermove events whose coordinates have not changed', () => {
		const { nav } = setup(['a', 'b', 'c']);
		const at = (x: number, y: number) => new MouseEvent('pointermove', { clientX: x, clientY: y });

		expect(nav.pointerHighlight('b', at(10, 10))).toBe(true);
		expect(nav.highlighted).toBe('b');

		nav.onKeydown(key('ArrowDown')); // keyboard moves to c; the list scrolls under the cursor
		expect(nav.highlighted).toBe('c');
		expect(nav.pointerHighlight('b', at(10, 10))).toBe(false); // synthetic move, same spot
		expect(nav.highlighted).toBe('c');

		expect(nav.pointerHighlight('b', at(11, 10))).toBe(true); // real move
		expect(nav.highlighted).toBe('b');
	});

	test('without an event it always applies', () => {
		const { nav } = setup(['a', 'b']);
		expect(nav.pointerHighlight('b')).toBe(true);
		expect(nav.pointerHighlight('a')).toBe(true);
		expect(nav.highlighted).toBe('a');
	});
});

describe('option ids', () => {
	test('values that sanitize alike still get distinct, stable ids', () => {
		const ids = createOptionIds('list');
		const dotted = ids.get('a.b');
		const underscored = ids.get('a_b');
		expect(dotted).not.toBe(underscored);
		expect(ids.get('a.b')).toBe(dotted);
		expect(new Set([dotted, underscored]).size).toBe(2);
	});

	test('nav.optionId drives aria-activedescendant for colliding values', () => {
		const { nav } = setup(['a.b', 'a_b'], { idPrefix: 'cb' });
		const first = nav.activeDescendant;
		nav.onKeydown(key('ArrowDown'));
		expect(nav.highlighted).toBe('a_b');
		expect(nav.activeDescendant).not.toBe(first);
		expect(nav.optionId('a.b')).toBe(first);
	});

	test('an explicit optionId wins, and neither option means no id', () => {
		expect(setup(['a'], { optionId: (v) => `x-${v}`, idPrefix: 'p' }).nav.activeDescendant).toBe(
			'x-a'
		);
		expect(setup(['a']).nav.activeDescendant).toBeUndefined();
	});

	test('looking up many values stays linear', () => {
		const ids = createOptionIds('big');
		const values = Array.from({ length: 20000 }, (_, i) => `v${i}`);
		const start = performance.now();
		for (const value of values) ids.get(value);
		for (const value of values) ids.get(value);
		expect(performance.now() - start).toBeLessThan(500);
		expect(ids.get('v19999')).toBe('big-option-19999');
	});
});

describe('scrolling inside the list', () => {
	/** A scrolling container with `count` 20px rows in a 100px viewport; jsdom has no layout. */
	const list = (count: number) => {
		const page = document.createElement('div');
		const container = document.createElement('div');
		container.style.overflowY = 'auto';
		Object.defineProperty(container, 'clientHeight', { value: 100 });
		container.getBoundingClientRect = () =>
			({ top: 0, bottom: 100, left: 0, right: 0, width: 0, height: 100 }) as DOMRect;
		const rows: HTMLElement[] = [];
		for (let i = 0; i < count; i += 1) {
			const row = document.createElement('div');
			row.id = `row-${i}`;
			row.getBoundingClientRect = () => {
				const top = i * 20 - container.scrollTop;
				return { top, bottom: top + 20, left: 0, right: 0, width: 0, height: 20 } as DOMRect;
			};
			container.append(row);
			rows.push(row);
		}
		page.append(container);
		document.body.append(page);
		return { page, container, rows };
	};

	const values = Array.from({ length: 20 }, (_, i) => `row-${i}`);

	test('highlighting moves only the container scrollTop, never scrollIntoView', () => {
		const { container, rows } = list(20);
		const scrollIntoView = vi.fn();
		for (const row of rows) row.scrollIntoView = scrollIntoView;
		const { nav } = setup(values, { optionId: (v) => v, scrollContainer: () => container });

		nav.highlight('row-10');
		expect(container.scrollTop).toBe(120); // row bottom (220) aligned to the viewport bottom (100)
		nav.highlight('row-0');
		expect(container.scrollTop).toBe(0);
		expect(scrollIntoView).not.toHaveBeenCalled();
	});

	test('falls back to the nearest scrolling ancestor and leaves the page alone', () => {
		const { page, container } = list(20);
		page.style.overflowY = 'auto';
		const { nav } = setup(values, { optionId: (v) => v });
		nav.highlight('row-15');
		expect(container.scrollTop).toBeGreaterThan(0);
		expect(page.scrollTop).toBe(0);
	});

	test('a changed query scrolls the list back to the top and highlights the first match', () => {
		const { container } = list(20);
		const { nav, state } = setup(values, {
			optionId: (v) => v,
			query: '',
			scrollContainer: () => container
		});
		nav.highlight('row-15');
		expect(container.scrollTop).toBeGreaterThan(0);

		state.query = 'row';
		state.values = values.slice(0, 16);
		flushSync();
		expect(container.scrollTop).toBe(0);
		expect(nav.highlighted).toBe('row-0');
	});

	test('the reset happens even when the old highlight is gone and nothing is highlighted', () => {
		const { container } = list(20);
		const { nav, state } = setup(values, {
			optionId: (v) => v,
			query: '',
			autoHighlight: false,
			scrollContainer: () => container
		});
		nav.highlight('row-18');
		expect(container.scrollTop).toBeGreaterThan(0);
		state.query = 'row-1';
		state.values = ['row-1', 'row-10'];
		flushSync();
		expect(nav.highlighted).toBeUndefined();
		expect(container.scrollTop).toBe(0);
	});

	test('the reset finds the scroller without scrollContainer, even with nothing highlighted', () => {
		const { container } = list(20);
		const { state } = setup(values, { optionId: (v) => v, query: '', autoHighlight: false });
		container.scrollTop = 100;
		state.query = 'row';
		state.values = values.slice(0, 16);
		flushSync();
		expect(container.scrollTop).toBe(0);
	});

	test('scrollToHighlighted brings the current highlight back into view on demand', () => {
		const { container } = list(20);
		const { nav } = setup(values, {
			optionId: (v) => v,
			autoHighlight: false,
			scrollContainer: () => container
		});
		nav.setHighlighted('row-15'); // hover-style: moves the highlight without scrolling
		expect(container.scrollTop).toBe(0);
		nav.scrollToHighlighted();
		expect(container.scrollTop).toBe(220);
	});

	test('without auto-highlight a surviving highlight is kept and scrolled back into view', () => {
		const { container } = list(20);
		const { nav, state } = setup(values, {
			optionId: (v) => v,
			query: '',
			autoHighlight: false,
			scrollContainer: () => container
		});
		nav.highlight('row-15');
		state.query = 'row';
		state.values = values.slice(0, 16);
		flushSync();
		expect(nav.highlighted).toBe('row-15');
		expect(container.scrollTop).toBe(220); // reset to 0, then row-15 (300-320) brought into view
	});

	test('the first match is in view after typing even when the old highlight is gone', () => {
		const { container } = list(20);
		const { nav, state } = setup(values, {
			optionId: (v) => v,
			query: '',
			scrollContainer: () => container
		});
		nav.highlight('row-18');
		state.query = 'row-1';
		state.values = ['row-1', 'row-10'];
		flushSync();
		expect(nav.highlighted).toBe('row-1');
		expect(container.scrollTop).toBe(0);
	});

	test('clearing the query scrolls the anchored value into view', () => {
		const { container } = list(20);
		const { nav, state } = setup(values, {
			optionId: (v) => v,
			query: 'row-1',
			anchor: () => 'row-12',
			scrollContainer: () => container
		});
		state.values = ['row-1', 'row-10'];
		flushSync();
		state.query = '';
		state.values = values;
		flushSync();
		expect(nav.highlighted).toBe('row-12');
		expect(container.scrollTop).toBe(160); // row bottom (260) aligned to the viewport bottom
	});
});
