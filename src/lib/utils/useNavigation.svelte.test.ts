// useNavigation, the roving tab stop behind Tabs, menus, toolbars and segmented controls: the tab
// stop follows the focused element through list changes (CX-7), groups get their own options
// (CC-INFRA-2b), text fields keep their keys (MN-INFRA-2), highlight moves stay cheap (MN-13) and
// type-ahead skips what it cannot focus (MN-15).
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, within } from '@testing-library/svelte';
import { tick } from 'svelte';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { mockNotRendered } from '$lib/testing/jsdom.test-helper.js';
import { renderInTheme } from '../components/Theme/renderInTheme.test-helper.js';
import TabbarFallbackHarness from '../components/Tabbar/TabbarFallbackHarness.test.svelte';
import NavigationKeysHarness from './NavigationKeysHarness.test.svelte';
import NavigationListHarness, { type HarnessItem } from './NavigationListHarness.test.svelte';
import type { useNavigation } from './useNavigation.svelte.js';

const motion = vi.hoisted(() => ({ reduce: false }));
vi.mock('./motion.svelte.js', async (importOriginal) => ({
	...(await importOriginal<typeof import('./motion.svelte.js')>()),
	prefersReducedMotion: () => motion.reduce
}));

type Navigation = ReturnType<typeof useNavigation>;
type Props = Parameters<typeof NavigationListHarness>[1];

const items = (...labels: string[]): HarnessItem[] =>
	labels.map((label) => ({ id: label.toLowerCase(), label }));

const mount = (props: Props) => {
	let navigation: Navigation | undefined;
	const result = render(NavigationListHarness, {
		props: { ...props, onReady: (ready) => (navigation = ready) }
	});
	return {
		...result,
		list: screen.getByTestId('list'),
		navigation: () => navigation!
	};
};

const item = (name: string) => screen.getByRole('button', { name });
const tabStops = (root: Element | Document = document) =>
	Array.from(root.querySelectorAll('[tabindex="0"]'));
/** Let a removal's focus restore (scheduled on a microtask after the flush) run. */
const settle = async () => {
	await tick();
	await new Promise((resolve) => setTimeout(resolve, 0));
};
const press = (key: string, init: KeyboardEventInit = {}) =>
	fireEvent.keyDown(document.activeElement ?? document.body, { key, ...init });
const focus = async (element: HTMLElement) => {
	element.focus();
	await tick();
};

afterEach(() => {
	motion.reduce = false;
	(document.activeElement as HTMLElement | null)?.blur?.();
});

describe('the tab stop follows the focused item through list changes (CX-7)', () => {
	test('inserting an item before the focused one keeps focus, the tab stop and the next key on it', async () => {
		const { rerender, navigation } = mount({
			items: items('Archive', 'Copy', 'Cut'),
			options: { orientation: 'vertical' }
		});
		await focus(item('Copy'));
		await rerender({ items: items('New', 'Archive', 'Copy', 'Cut') });
		await settle();

		expect(document.activeElement).toBe(item('Copy'));
		expect(tabStops()).toEqual([item('Copy')]);
		expect(navigation().focusedIndex).toBe(2);
		await press('ArrowDown');
		expect(document.activeElement).toBe(item('Cut'));
	});

	test('removing an item before the focused one keeps arrow keys on track', async () => {
		const { rerender } = mount({
			items: items('Archive', 'Copy', 'Cut', 'Delete'),
			options: { orientation: 'vertical' }
		});
		await focus(item('Cut'));
		await rerender({ items: items('Archive', 'Cut', 'Delete') });
		await settle();

		expect(tabStops()).toEqual([item('Cut')]);
		await press('ArrowDown');
		expect(document.activeElement).toBe(item('Delete'));
	});

	test('removing the focused item moves focus to the item that took its place', async () => {
		const onKeyboardMove = vi.fn();
		const { rerender } = mount({
			items: items('Archive', 'Copy', 'Cut'),
			options: { orientation: 'vertical', onKeyboardMove }
		});
		await focus(item('Copy'));
		await rerender({ items: items('Archive', 'Cut') });
		await settle();

		expect(document.activeElement).toBe(item('Cut'));
		expect(tabStops()).toEqual([item('Cut')]);
		expect(item('Cut')).toHaveAttribute('data-highlighted', 'true');
		// The restore is no keyboard move: a radio group must not select from it.
		expect(onKeyboardMove).not.toHaveBeenCalled();
	});

	test('removing the focused last item moves focus to the new last item', async () => {
		const { rerender } = mount({ items: items('Archive', 'Copy', 'Cut') });
		await focus(item('Cut'));
		await rerender({ items: items('Archive', 'Copy') });
		await settle();

		expect(document.activeElement).toBe(item('Copy'));
		expect(tabStops()).toEqual([item('Copy')]);
	});

	test('a disabled replacement is passed over for the nearest item that can take focus', async () => {
		const { rerender } = mount({
			items: [...items('Archive', 'Copy'), { id: 'cut', label: 'Cut', disabled: 'native' }]
		});
		await focus(item('Copy'));
		await rerender({
			items: [...items('Archive'), { id: 'cut', label: 'Cut', disabled: 'native' }]
		});
		await settle();

		expect(document.activeElement).toBe(item('Archive'));
	});

	test('focus that already moved elsewhere is left alone', async () => {
		const { rerender } = mount({ items: items('Archive', 'Copy', 'Cut') });
		await focus(item('Copy'));
		item('After').focus();
		await rerender({ items: items('Archive', 'Cut') });
		await settle();

		expect(document.activeElement).toBe(item('After'));
		expect(tabStops(screen.getByTestId('list'))).toEqual([item('Archive')]);
	});

	test('removing the tab-stop item while nothing has focus hands the stop to the next default', async () => {
		const { rerender, list } = mount({ items: items('Archive', 'Copy', 'Cut') });
		await tick();
		expect(tabStops(list)).toEqual([item('Archive')]);

		await rerender({ items: items('Copy', 'Cut') });
		await settle();

		expect(tabStops(list)).toEqual([item('Copy')]);
		expect(document.activeElement).toBe(document.body);
	});

	test('a keyed reorder: arrows follow the new document order and ids stay put', async () => {
		const { rerender } = mount({
			items: items('Archive', 'Copy', 'Cut'),
			options: { orientation: 'vertical' }
		});
		const ids = ['Archive', 'Copy', 'Cut'].map((name) => item(name).id);
		await focus(item('Copy'));
		await rerender({ items: items('Cut', 'Copy', 'Archive') });
		await settle();

		expect(['Archive', 'Copy', 'Cut'].map((name) => item(name).id)).toEqual(ids);
		await press('ArrowDown');
		expect(document.activeElement).toBe(item('Archive'));
		await press('ArrowUp');
		await press('ArrowUp');
		expect(document.activeElement).toBe(item('Cut'));
	});

	test('onChange reports the focused item, not an index that shifted under it', async () => {
		const onChange = vi.fn();
		const { rerender } = mount({ items: items('Archive', 'Copy', 'Cut'), options: { onChange } });
		await focus(item('Copy'));
		expect(onChange).toHaveBeenLastCalledWith(1);
		onChange.mockClear();

		await rerender({ items: items('New', 'Archive', 'Copy', 'Cut') });
		await settle();
		expect(onChange).not.toHaveBeenCalled();
	});
});

describe('hidden and disabled items (CX-7, law 7)', () => {
	test('arrow keys skip an item that is not rendered', async () => {
		mount({ items: items('Archive', 'Copy', 'Cut'), options: { orientation: 'vertical' } });
		mockNotRendered(item('Copy'));
		await focus(item('Archive'));
		await press('ArrowDown');
		expect(document.activeElement).toBe(item('Cut'));
		await press('End');
		await press('ArrowUp');
		expect(document.activeElement).toBe(item('Archive'));
	});

	test('an item that becomes inert gives up the tab stop', async () => {
		const { list } = mount({ items: items('Archive', 'Copy') });
		await tick();
		expect(tabStops(list)).toEqual([item('Archive')]);

		item('Archive').setAttribute('inert', '');
		await settle();
		expect(tabStops(list)).toEqual([item('Copy')]);
	});

	test('the tab stop stays on the default item while nothing is rendered (a hidden panel)', async () => {
		const { list, rerender } = mount({
			items: items('Archive', 'Copy'),
			options: { defaultFocusedIndex: () => 1 }
		});
		mockNotRendered(item('Archive'));
		mockNotRendered(item('Copy'));
		await rerender({ items: items('Archive', 'Copy') });
		item('Copy').setAttribute('data-disabled', 'false');
		await settle();
		expect(tabStops(list)).toEqual([item('Copy')]);
	});

	test.each(['aria', 'data', 'native'] as const)(
		'a %s-disabled item is skipped by default',
		async (disabled) => {
			mount({
				items: [...items('Archive'), { id: 'copy', label: 'Copy', disabled }, ...items('Cut')]
			});
			await focus(item('Archive'));
			await press('ArrowRight');
			expect(document.activeElement).toBe(item('Cut'));
		}
	);

	test.each([{ disabledItemsFocusable: true }, { skipDisabled: false }])(
		'%o keeps aria-disabled items in the arrow order but never activates them',
		async (option) => {
			const onActivate = vi.fn();
			mount({
				items: [
					...items('Archive'),
					{ id: 'copy', label: 'Copy', disabled: 'aria' },
					...items('Cut')
				],
				options: option,
				onActivate
			});
			await focus(item('Archive'));
			await press('ArrowRight');
			expect(document.activeElement).toBe(item('Copy'));
			expect(await press('Enter')).toBe(false);
			expect(await press(' ')).toBe(false);
			expect(onActivate).not.toHaveBeenCalled();
		}
	);

	test('natively disabled items stay out of reach even with disabledItemsFocusable', async () => {
		mount({
			items: [
				...items('Archive'),
				{ id: 'copy', label: 'Copy', disabled: 'native' },
				...items('Cut')
			],
			options: { disabledItemsFocusable: true }
		});
		await focus(item('Archive'));
		await press('ArrowRight');
		expect(document.activeElement).toBe(item('Cut'));
	});

	test('a fully aria-disabled toolbar keeps one tab stop with disabledItemsFocusable', async () => {
		const { list } = mount({
			items: ['Bold', 'Italic'].map((label) => ({ id: label, label, disabled: 'aria' as const })),
			options: { disabledItemsFocusable: true }
		});
		await tick();
		expect(tabStops(list)).toEqual([item('Bold')]);
	});

	test('without the option a fully aria-disabled list has no tab stop', async () => {
		const { list } = mount({
			items: ['Bold', 'Italic'].map((label) => ({ id: label, label, disabled: 'aria' as const }))
		});
		await tick();
		expect(tabStops(list)).toEqual([]);
	});

	test('scrolling to the focused item respects reduced motion', async () => {
		const scrollIntoView = vi.spyOn(Element.prototype, 'scrollIntoView');
		mount({ items: items('Archive', 'Copy', 'Cut') });
		await focus(item('Archive'));

		await press('ArrowRight');
		expect(scrollIntoView).toHaveBeenLastCalledWith(
			expect.objectContaining({ behavior: 'smooth' })
		);

		motion.reduce = true;
		await press('ArrowRight');
		expect(scrollIntoView).toHaveBeenLastCalledWith(expect.objectContaining({ behavior: 'auto' }));
		scrollIntoView.mockRestore();
	});
});

describe('options for groups (CC-INFRA-2b)', () => {
	test("orientation 'both' moves with all four arrows", async () => {
		mount({ items: items('Small', 'Medium', 'Large'), options: { orientation: 'both' } });
		await focus(item('Small'));
		await press('ArrowDown');
		expect(document.activeElement).toBe(item('Medium'));
		await press('ArrowRight');
		expect(document.activeElement).toBe(item('Large'));
		await press('ArrowUp');
		expect(document.activeElement).toBe(item('Medium'));
		await press('ArrowLeft');
		expect(document.activeElement).toBe(item('Small'));
	});

	test("orientation 'both' mirrors the inline arrows in RTL", async () => {
		mount({
			items: items('Small', 'Medium', 'Large'),
			options: { orientation: 'both' },
			dir: 'rtl'
		});
		await focus(item('Small'));
		await press('ArrowLeft');
		expect(document.activeElement).toBe(item('Medium'));
		await press('ArrowDown');
		expect(document.activeElement).toBe(item('Large'));
	});

	test('the container is focusable from script but never a Tab stop', async () => {
		const { list } = mount({ items: items('Archive', 'Copy') });
		await tick();
		expect(list).toHaveAttribute('tabindex', '-1');
		expect(tabStops()).toEqual([item('Archive')]);
	});

	test('focusableContainer: false leaves the container unfocusable', async () => {
		const { list } = mount({
			items: items('Archive', 'Copy'),
			options: { focusableContainer: false }
		});
		await tick();
		expect(list).not.toHaveAttribute('tabindex');
		expect(tabStops()).toEqual([item('Archive')]);
	});

	test('onKeyboardMove fires for arrows, Home, End and type-ahead only', async () => {
		const onKeyboardMove = vi.fn();
		const { navigation } = mount({
			items: items('Archive', 'Copy', 'Cut'),
			options: { onKeyboardMove, typeahead: true, loop: false }
		});
		await focus(item('Archive'));
		await fireEvent.click(item('Copy'));
		item('Copy').focus();
		navigation().focusItem(2);
		await tick();
		expect(onKeyboardMove).not.toHaveBeenCalled();

		await press('ArrowRight'); // the last item and no loop: nowhere to go
		expect(onKeyboardMove).not.toHaveBeenCalled();
		await press('Home');
		expect(onKeyboardMove).toHaveBeenLastCalledWith(0);
		await press('ArrowRight');
		expect(onKeyboardMove).toHaveBeenLastCalledWith(1);
		await press('End');
		expect(onKeyboardMove).toHaveBeenLastCalledWith(2);
		await press('a');
		expect(onKeyboardMove).toHaveBeenLastCalledWith(0);
		expect(onKeyboardMove).toHaveBeenCalledTimes(4);
	});
});

describe('text fields keep their keys (MN-INFRA-2)', () => {
	const toolbar = (dir: 'ltr' | 'rtl' = 'ltr') => {
		mount({
			items: [
				...items('Bold'),
				{ id: 'search', label: 'Search', kind: 'input', value: 'abc' },
				...items('Italic')
			],
			dir
		});
		return screen.getByRole('textbox', { name: 'Search' }) as HTMLInputElement;
	};

	test('Home, End, Space and Enter stay in a toolbar field', async () => {
		const search = toolbar();
		await focus(search);
		search.setSelectionRange(1, 1);
		for (const key of ['Home', 'End', ' ', 'Enter']) {
			expect(await press(key)).toBe(true);
			expect(document.activeElement).toBe(search);
		}
	});

	test('ArrowLeft and ArrowRight leave a toolbar field only from the caret edge they point past', async () => {
		const search = toolbar();
		await focus(search);

		search.setSelectionRange(1, 1);
		expect(await press('ArrowLeft')).toBe(true);
		expect(await press('ArrowRight')).toBe(true);
		expect(document.activeElement).toBe(search);

		search.setSelectionRange(0, 3);
		expect(await press('ArrowRight')).toBe(true);
		search.setSelectionRange(3, 3);
		expect(await press('ArrowRight', { shiftKey: true })).toBe(true);
		expect(document.activeElement).toBe(search);

		expect(await press('ArrowRight')).toBe(false);
		expect(document.activeElement).toBe(item('Italic'));

		await focus(search);
		search.setSelectionRange(0, 0);
		expect(await press('ArrowLeft')).toBe(false);
		expect(document.activeElement).toBe(item('Bold'));
	});

	test('in RTL the arrow pointing past the end of the text moves on', async () => {
		const search = toolbar('rtl');
		await focus(search);
		search.setSelectionRange(3, 3);
		expect(await press('ArrowRight')).toBe(true);
		expect(await press('ArrowLeft')).toBe(false);
		expect(document.activeElement).toBe(item('Italic'));
	});

	test('a filter field above a vertical list: Up and Down enter the list, other keys stay', async () => {
		mount({
			items: items('Archive', 'Copy', 'Cut'),
			options: { orientation: 'vertical' },
			header: 'input'
		});
		const filter = screen.getByRole('textbox', { name: 'Filter' });
		await focus(filter);
		expect(document.activeElement).toBe(filter);
		for (const key of ['ArrowLeft', 'ArrowRight', 'Home', 'End', ' ', 'Enter']) {
			expect(await press(key)).toBe(true);
			expect(document.activeElement).toBe(filter);
		}

		expect(await press('ArrowDown')).toBe(false);
		expect(document.activeElement).toBe(item('Archive'));
		await focus(filter);
		expect(await press('ArrowUp')).toBe(false);
		expect(document.activeElement).toBe(item('Cut'));
	});

	test('a button inside the list that is no item keeps Enter and Space; arrows enter at the edge', async () => {
		const onActivate = vi.fn();
		mount({
			items: items('Archive', 'Copy', 'Cut'),
			options: { orientation: 'vertical' },
			header: 'button',
			onActivate
		});
		const action = item('Header action');
		await focus(item('Copy'));
		await focus(action);
		expect(await press('Enter')).toBe(true);
		expect(await press(' ')).toBe(true);
		expect(onActivate).not.toHaveBeenCalled();
		expect(document.activeElement).toBe(action);

		await press('ArrowDown');
		expect(document.activeElement).toBe(item('Archive'));
	});
});

describe('highlight moves are cheap (MN-13)', () => {
	const many = (count: number) =>
		Array.from({ length: count }, (_, index) => ({ id: `row-${index}`, label: `Row ${index}` }));

	test('a highlight move among 500 items writes at most four item attributes', async () => {
		const { list } = mount({ items: many(500), options: { orientation: 'vertical' } });
		await focus(item('Row 10'));
		const rows = new Set<Element>(within(list).getAllByRole('button'));
		// Every attribute write that lands on an item, as `method:name`.
		const writes: string[] = [];
		const { setAttribute, removeAttribute } = Element.prototype;
		Element.prototype.setAttribute = function (this: Element, name: string, value: string) {
			if (rows.has(this)) writes.push(`set:${name}`);
			return setAttribute.call(this, name, value);
		};
		Element.prototype.removeAttribute = function (this: Element, name: string) {
			if (rows.has(this)) writes.push(`remove:${name}`);
			return removeAttribute.call(this, name);
		};
		try {
			await press('ArrowDown');
			await tick();
		} finally {
			Element.prototype.setAttribute = setAttribute;
			Element.prototype.removeAttribute = removeAttribute;
		}

		expect(document.activeElement).toBe(item('Row 11'));
		expect(writes.length).toBeLessThanOrEqual(4);
		expect(item('Row 11')).toHaveAttribute('tabindex', '0');
		expect(item('Row 10')).toHaveAttribute('tabindex', '-1');
		expect(item('Row 11')).toHaveAttribute('data-highlighted', 'true');
		expect(item('Row 10')).not.toHaveAttribute('data-highlighted');
	});

	test('mounting checks the order with one linear pass, and appending an item adds one comparison', async () => {
		const compare = vi.spyOn(Node.prototype, 'compareDocumentPosition');
		const { rerender } = mount({ items: many(500) });
		await tick();
		expect(compare.mock.calls.length).toBeLessThan(1000);

		compare.mockClear();
		await rerender({ items: many(501) });
		await tick();
		const appended = compare.mock.calls.length;
		compare.mockRestore();
		// A full re-sort compares every adjacent pair again (500 calls or more).
		expect(appended).toBeLessThanOrEqual(2);
	});
});

describe('type-ahead (MN-15)', () => {
	const fruit = (...extra: HarnessItem[]) => [
		...items('Apple'),
		{ id: 'banana', label: 'Banana', disabled: 'aria' as const },
		...items('Blueberry', 'Lemon'),
		...extra
	];

	test('a disabled match is passed over for the next one', async () => {
		mount({ items: fruit(), options: { typeahead: true, orientation: 'vertical' } });
		await focus(item('Apple'));
		await press('b');
		expect(document.activeElement).toBe(item('Blueberry'));
	});

	test('an item matches on its data-typeahead text before its label', async () => {
		mount({
			items: [
				...items('Apple'),
				{ id: 'kbd', label: '⌘K Command palette', textValue: 'Command palette' }
			],
			options: { typeahead: true }
		});
		await focus(item('Apple'));
		await press('c');
		expect(document.activeElement).toBe(item('⌘K Command palette'));
	});

	test('the buffer starts over when focus leaves the list', async () => {
		mount({ items: fruit(), options: { typeahead: true, orientation: 'vertical' } });
		await focus(item('Apple'));
		await press('b');
		expect(document.activeElement).toBe(item('Blueberry'));
		await focus(item('After'));
		await focus(item('Apple'));
		await press('l');
		// "bl" would have stayed on Blueberry.
		expect(document.activeElement).toBe(item('Lemon'));
	});

	test('the buffer timer is cleared when the list is destroyed', async () => {
		const { unmount } = mount({ items: fruit(), options: { typeahead: true } });
		item('Apple').focus();
		const started = vi.spyOn(globalThis, 'setTimeout');
		await press('b');
		const index = started.mock.calls.findIndex(([, delay]) => delay === 1000);
		const timer = started.mock.results[index]?.value;
		started.mockRestore();
		expect(timer).toBeDefined();

		const cleared = vi.spyOn(globalThis, 'clearTimeout');
		unmount();
		expect(cleared.mock.calls.map(([id]) => id)).toContain(timer);
		cleared.mockRestore();
	});

	test('a Menu option matches on its textValue', async () => {
		render(NavigationKeysHarness, {
			props: {
				scenario: 'menu',
				items: [
					{ type: 'option', title: 'Profile' },
					{ type: 'option', title: 'New file', textValue: 'Create file' },
					{ type: 'option', title: 'Settings' }
				]
			}
		});
		const [profile, newFile] = within(screen.getByRole('menu')).getAllByRole('menuitem');
		expect(newFile).toHaveAttribute('data-typeahead', 'Create file');
		await focus(profile);
		await press('c');
		expect(document.activeElement).toBe(newFile);
	});
});

describe('Tabs keep one tab stop (backlog: B9 review, W0 smoke)', () => {
	const tabs = () => screen.getAllByRole('tab');

	test('the tab list is not a Tab stop of its own', () => {
		renderInTheme(TabbarFallbackHarness, { items: ['Overview', 'Activity'] });
		expect(screen.getByRole('tablist')).toHaveAttribute('tabindex', '-1');
		expect(tabStops(screen.getByTestId('tabbar'))).toEqual([tabs()[0]]);
	});

	test('removing the focused, selected last tab moves focus and the tab stop to its replacement', async () => {
		const { rerender } = renderInTheme(TabbarFallbackHarness, {
			items: ['In review', 'Approved', 'Archived'],
			initialValue: 'Archived'
		});
		const archived = screen.getByRole('tab', { name: 'Archived' });
		await focus(archived);

		await rerender({ items: ['In review', 'Approved'] });
		await settle();

		const approved = screen.getByRole('tab', { name: 'Approved' });
		expect(approved).toHaveAttribute('aria-selected', 'true');
		expect(document.activeElement).toBe(approved);
		expect(tabStops(screen.getByTestId('tabbar'))).toEqual([approved]);
	});
});
