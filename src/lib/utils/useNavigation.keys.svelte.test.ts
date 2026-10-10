// Keys that belong elsewhere stay there: a Menu under the pointer must not take keys typed in
// another field (MN-2), and Alt/Ctrl/Meta + a navigation key is a browser shortcut, never a move
// (CC-INFRA-2a).
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, within } from '@testing-library/svelte';
import { flushSync } from 'svelte';
import { afterEach, describe, expect, test, vi } from 'vitest';
import NavigationKeysHarness from './NavigationKeysHarness.test.svelte';
import { useKeyDown } from './useKeyDown.svelte.js';

const menuItems = (onProfile = vi.fn(), onSettings = vi.fn()) => [
	{ type: 'option' as const, title: 'Profile', onclick: onProfile },
	{ type: 'option' as const, title: 'Settings', onclick: onSettings },
	{ type: 'option' as const, title: 'Billing' }
];

const mountMenu = (items = menuItems()) => {
	render(NavigationKeysHarness, { props: { scenario: 'menu', items } });
	const menu = screen.getByRole('menu');
	return {
		menu,
		rows: within(menu).getAllByRole('menuitem'),
		input: screen.getByRole('textbox', { name: 'Search' })
	};
};

/** Rest the pointer on the menu, optionally over one row (pointerenter does not bubble). */
const hover = async (menu: HTMLElement, row?: HTMLElement) => {
	await fireEvent.pointerEnter(menu);
	if (row) await fireEvent.pointerEnter(row);
};

afterEach(() => {
	(document.activeElement as HTMLElement | null)?.blur?.();
});

describe('hovered menu and keys typed elsewhere (MN-2)', () => {
	test('Space and Enter in another field are not taken and do not click the hovered row', async () => {
		const onProfile = vi.fn();
		const { menu, rows, input } = mountMenu(menuItems(onProfile));
		await hover(menu, rows[0]);
		expect(rows[0]).toHaveAttribute('data-highlighted', 'true');

		input.focus();
		expect(await fireEvent.keyDown(input, { key: ' ' })).toBe(true);
		expect(await fireEvent.keyDown(input, { key: 'Enter' })).toBe(true);

		expect(onProfile).not.toHaveBeenCalled();
		expect(document.activeElement).toBe(input);
	});

	test('arrows, Home and End in another field keep focus there', async () => {
		const { menu, rows, input } = mountMenu();
		await hover(menu, rows[0]);

		input.focus();
		for (const key of ['ArrowDown', 'ArrowUp', 'Home', 'End']) {
			expect(await fireEvent.keyDown(input, { key })).toBe(true);
			expect(document.activeElement).toBe(input);
		}
	});

	test('a focused button elsewhere keeps its keys too', async () => {
		const { menu, rows } = mountMenu();
		const outside = document.createElement('button');
		document.body.append(outside);
		try {
			await hover(menu, rows[1]);
			outside.focus();
			expect(await fireEvent.keyDown(outside, { key: 'ArrowDown' })).toBe(true);
			expect(document.activeElement).toBe(outside);
		} finally {
			outside.remove();
		}
	});

	test('with nothing focused, ArrowDown moves on from the hovered row', async () => {
		const { menu, rows } = mountMenu();
		await hover(menu, rows[0]);
		expect(document.activeElement).toBe(document.body);

		expect(await fireEvent.keyDown(document.body, { key: 'ArrowDown' })).toBe(false);
		expect(document.activeElement).toBe(rows[1]);
	});

	test('with nothing focused and no row under the pointer, arrows enter at the matching edge', async () => {
		const { menu, rows } = mountMenu();
		await hover(menu);
		await fireEvent.keyDown(document.body, { key: 'ArrowDown' });
		expect(document.activeElement).toBe(rows[0]);

		(document.activeElement as HTMLElement).blur();
		await fireEvent.pointerLeave(menu);
		await hover(menu);
		await fireEvent.keyDown(document.body, { key: 'ArrowUp' });
		expect(document.activeElement).toBe(rows[2]);
	});

	test('with nothing focused, Enter and Space never click the row under the pointer', async () => {
		const onProfile = vi.fn();
		const { menu, rows } = mountMenu(menuItems(onProfile));
		await hover(menu, rows[0]);

		expect(await fireEvent.keyDown(document.body, { key: 'Enter' })).toBe(true);
		expect(await fireEvent.keyDown(document.body, { key: ' ' })).toBe(true);
		expect(onProfile).not.toHaveBeenCalled();
		expect(document.activeElement).toBe(document.body);
	});

	test('a key another handler already took is left alone', async () => {
		const { menu, rows } = mountMenu();
		await hover(menu, rows[0]);
		const claim = (event: KeyboardEvent) => event.preventDefault();
		document.body.addEventListener('keydown', claim);
		try {
			await fireEvent.keyDown(document.body, { key: 'ArrowDown' });
			expect(document.activeElement).toBe(document.body);
		} finally {
			document.body.removeEventListener('keydown', claim);
		}
	});

	test('once focus is inside, Enter still activates the focused row', async () => {
		const onSettings = vi.fn();
		const { menu, rows } = mountMenu(menuItems(vi.fn(), onSettings));
		await hover(menu, rows[0]);
		await fireEvent.keyDown(document.body, { key: 'ArrowDown' });
		expect(document.activeElement).toBe(rows[1]);

		expect(await fireEvent.keyDown(rows[1], { key: 'Enter' })).toBe(false);
		expect(onSettings).toHaveBeenCalledOnce();
	});
});

describe('modified navigation keys (CC-INFRA-2a)', () => {
	test.each(['altKey', 'ctrlKey', 'metaKey'] as const)(
		'SegmentedControl ignores %s + ArrowRight and leaves it to the browser',
		async (modifier) => {
			const onValueChange = vi.fn();
			render(NavigationKeysHarness, { props: { scenario: 'segmented', onValueChange } });
			const list = screen.getByRole('radio', { name: 'List' });
			list.focus();

			expect(await fireEvent.keyDown(list, { key: 'ArrowRight', [modifier]: true })).toBe(true);
			expect(document.activeElement).toBe(list);
			expect(onValueChange).not.toHaveBeenCalled();
			expect(list).toHaveAttribute('aria-checked', 'true');
		}
	);

	test('Shift + ArrowRight still moves and selects in SegmentedControl', async () => {
		const onValueChange = vi.fn();
		render(NavigationKeysHarness, { props: { scenario: 'segmented', onValueChange } });
		const list = screen.getByRole('radio', { name: 'List' });
		list.focus();

		expect(await fireEvent.keyDown(list, { key: 'ArrowRight', shiftKey: true })).toBe(false);
		expect(document.activeElement).toBe(screen.getByRole('radio', { name: 'Grid' }));
		expect(onValueChange).toHaveBeenCalledWith('grid');
	});

	test('Menu leaves Ctrl/Meta + arrows, Home and End to the browser', async () => {
		const { rows } = mountMenu();
		rows[0].focus();
		for (const key of ['ArrowDown', 'ArrowUp', 'Home', 'End']) {
			expect(await fireEvent.keyDown(rows[0], { key, ctrlKey: true })).toBe(true);
			expect(await fireEvent.keyDown(rows[0], { key, metaKey: true })).toBe(true);
			expect(document.activeElement).toBe(rows[0]);
		}
	});

	test('Menu leaves Meta + Enter to the browser instead of clicking the row itself', async () => {
		const onProfile = vi.fn();
		const { rows } = mountMenu(menuItems(onProfile));
		rows[0].focus();
		expect(await fireEvent.keyDown(rows[0], { key: 'Enter', metaKey: true })).toBe(true);
		expect(onProfile).not.toHaveBeenCalled();
	});

	test('a hovered menu ignores Alt + ArrowDown typed with nothing focused', async () => {
		const { menu, rows } = mountMenu();
		await hover(menu, rows[0]);
		expect(await fireEvent.keyDown(document.body, { key: 'ArrowDown', altKey: true })).toBe(true);
		expect(document.activeElement).toBe(document.body);
	});
});

describe('useKeyDown', () => {
	const setup = (options: { ignoreModifiers?: boolean; preventDefault?: boolean }) => {
		const callback = vi.fn();
		const node = document.createElement('div');
		let cleanup: (() => void) | void = undefined;
		const destroy = $effect.root(() => {
			const keyDown = useKeyDown({
				isActive: () => true,
				keys: ['ArrowDown'],
				callback,
				...options
			});
			cleanup = keyDown.reference(node);
		});
		flushSync();
		return {
			callback,
			node,
			destroy: () => {
				cleanup?.();
				destroy();
			}
		};
	};

	test('keeps modified keys by default (Combobox opens on Alt + ArrowDown)', () => {
		const { callback, node, destroy } = setup({});
		const event = new KeyboardEvent('keydown', {
			key: 'ArrowDown',
			altKey: true,
			cancelable: true
		});
		node.dispatchEvent(event);
		expect(callback).toHaveBeenCalledWith(event, 'element');
		expect(event.defaultPrevented).toBe(true);
		destroy();
	});

	test('ignoreModifiers skips Alt, Ctrl and Meta but not Shift', () => {
		const { callback, node, destroy } = setup({ ignoreModifiers: true });
		for (const modifier of ['altKey', 'ctrlKey', 'metaKey']) {
			const event = new KeyboardEvent('keydown', {
				key: 'ArrowDown',
				[modifier]: true,
				cancelable: true
			});
			node.dispatchEvent(event);
			expect(event.defaultPrevented).toBe(false);
		}
		expect(callback).not.toHaveBeenCalled();

		const shifted = new KeyboardEvent('keydown', {
			key: 'ArrowDown',
			shiftKey: true,
			cancelable: true
		});
		node.dispatchEvent(shifted);
		expect(callback).toHaveBeenCalledOnce();
		expect(shifted.defaultPrevented).toBe(true);
		destroy();
	});
});
