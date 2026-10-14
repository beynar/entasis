// The gestures that open and dismiss a context menu: a long press that tolerates a drifting
// finger, the native `contextmenu` Android sends after a long press, a second right-click on the
// anchor, and the browser's own menu over the open panel.
import '@testing-library/jest-dom/vitest';
import { fireEvent, screen, waitFor } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { renderInTheme } from '../Theme/renderInTheme.test-helper.js';
import ContextMenu from './ContextMenu.svelte';

const target = createRawSnippet(() => ({ render: () => '<button>Target</button>' }));
const zero = { in: { duration: 0 }, out: { duration: 0 } };

const mount = (props: Record<string, unknown> = {}) => {
	const onOpenChange = vi.fn();
	renderInTheme(ContextMenu, {
		items: [{ type: 'option', title: 'Copy' }],
		children: target,
		onOpenChange,
		popup: { transition: zero },
		...props
	});
	return { onOpenChange, target: screen.getByRole('button', { name: 'Target' }) };
};
const opens = (fn: { mock: { calls: unknown[][] } }) =>
	fn.mock.calls.filter(([open]) => open === true).length;
const touch = (clientX: number, clientY: number) => ({ pointerType: 'touch', clientX, clientY });

describe('long press', () => {
	beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
	afterEach(() => vi.useRealTimers());

	test('a11y:context-menu.long-press a finger that drifts a few pixels still opens the menu after 500 ms', async () => {
		const { onOpenChange, target } = mount();
		await fireEvent.pointerDown(target, touch(100, 100));
		await fireEvent.pointerMove(target, touch(103, 104));
		await vi.advanceTimersByTimeAsync(520);
		await waitFor(() => expect(screen.queryByRole('menu')).not.toBeNull());
		expect(opens(onOpenChange)).toBe(1);
	});

	test('a finger that moves past the tolerance cancels the press', async () => {
		const { onOpenChange, target } = mount();
		await fireEvent.pointerDown(target, touch(100, 100));
		await fireEvent.pointerMove(target, touch(100, 112));
		await vi.advanceTimersByTimeAsync(600);
		expect(screen.queryByRole('menu')).toBeNull();
		expect(opens(onOpenChange)).toBe(0);
	});

	test('lifting the finger early cancels the press', async () => {
		const { target } = mount();
		await fireEvent.pointerDown(target, touch(100, 100));
		await vi.advanceTimersByTimeAsync(200);
		await fireEvent.pointerUp(target, touch(100, 100));
		await vi.advanceTimersByTimeAsync(600);
		expect(screen.queryByRole('menu')).toBeNull();
	});

	test('the native contextmenu that follows a long press does not open the menu a second time', async () => {
		const { onOpenChange, target } = mount();
		await fireEvent.pointerDown(target, touch(100, 100));
		await vi.advanceTimersByTimeAsync(520);
		await waitFor(() => expect(screen.queryByRole('menu')).not.toBeNull());
		// Android Chrome sends it while the finger is still down, or just after it lifts.
		await fireEvent.contextMenu(target, { clientX: 100, clientY: 100 });
		await fireEvent.pointerUp(target, touch(100, 100));
		await fireEvent.contextMenu(target, { clientX: 100, clientY: 100 });
		await vi.advanceTimersByTimeAsync(50);
		expect(opens(onOpenChange)).toBe(1);
		expect(screen.getAllByRole('menu')).toHaveLength(1);
	});

	test('a native contextmenu that arrives before the timer opens the menu once', async () => {
		const { onOpenChange, target } = mount();
		await fireEvent.pointerDown(target, touch(100, 100));
		await fireEvent.contextMenu(target, { clientX: 100, clientY: 100 });
		await vi.advanceTimersByTimeAsync(600);
		await waitFor(() => expect(screen.queryByRole('menu')).not.toBeNull());
		expect(opens(onOpenChange)).toBe(1);
	});

	test('a right-click after the touch is over opens a menu again', async () => {
		const { onOpenChange, target } = mount();
		await fireEvent.pointerDown(target, touch(100, 100));
		await fireEvent.pointerUp(target, touch(100, 100));
		await vi.advanceTimersByTimeAsync(800);
		await fireEvent.contextMenu(target, { clientX: 20, clientY: 30 });
		await waitFor(() => expect(screen.queryByRole('menu')).not.toBeNull());
		expect(opens(onOpenChange)).toBe(1);
	});
});

describe('right-click', () => {
	test('a11y:context-menu.second-click a second right-click on the spot the menu is anchored to closes it', async () => {
		const { onOpenChange, target } = mount();
		await fireEvent.contextMenu(target, { clientX: 200, clientY: 150 });
		await waitFor(() => expect(screen.queryByRole('menu')).not.toBeNull());

		await fireEvent.contextMenu(target, { clientX: 204, clientY: 153 });
		await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
		expect(onOpenChange.mock.calls.map(([open]) => open)).toEqual([true, false]);
	});

	test('a11y:context-menu.second-click the press that dismisses the menu first does not reopen it', async () => {
		const { onOpenChange, target } = mount();
		await fireEvent.contextMenu(target, { clientX: 200, clientY: 150 });
		await waitFor(() => expect(screen.queryByRole('menu')).not.toBeNull());

		// A real browser sends pointerdown (an outside press, which closes the menu) before contextmenu.
		const press = { pointerType: 'mouse', button: 2, clientX: 204, clientY: 153 };
		await fireEvent.pointerDown(target, press);
		expect(onOpenChange.mock.calls.at(-1)?.[1].reason).toBe('outside-press');
		await fireEvent.contextMenu(target, press);
		await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
		expect(onOpenChange.mock.calls.map(([open]) => open)).toEqual([true, false]);
	});

	test('a right-click elsewhere still moves the menu when the press closes it first', async () => {
		const { onOpenChange, target } = mount();
		await fireEvent.contextMenu(target, { clientX: 200, clientY: 150 });
		await waitFor(() => expect(screen.queryByRole('menu')).not.toBeNull());

		const press = { pointerType: 'mouse', button: 2, clientX: 400, clientY: 300 };
		await fireEvent.pointerDown(target, press);
		await fireEvent.contextMenu(target, press);
		await waitFor(() => expect(screen.queryByRole('menu')).not.toBeNull());
		expect(opens(onOpenChange)).toBe(2);
	});

	test('a right-click elsewhere moves the menu', async () => {
		const { onOpenChange, target } = mount();
		await fireEvent.contextMenu(target, { clientX: 200, clientY: 150 });
		await waitFor(() => expect(screen.queryByRole('menu')).not.toBeNull());

		await fireEvent.contextMenu(target, { clientX: 400, clientY: 300 });
		await waitFor(() => expect(screen.queryByRole('menu')).not.toBeNull());
		expect(opens(onOpenChange)).toBe(2);
	});

	test('the browser menu is kept away from the open panel and its padding', async () => {
		const { target } = mount();
		await fireEvent.contextMenu(target, { clientX: 200, clientY: 150 });
		const menu = await screen.findByRole('menu');

		const onRow = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
		screen.getByRole('menuitem', { name: 'Copy' }).dispatchEvent(onRow);
		expect(onRow.defaultPrevented).toBe(true);

		const onPanel = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
		(menu.closest('[class*="p-"]') ?? menu).dispatchEvent(onPanel);
		expect(onPanel.defaultPrevented).toBe(true);
	});

	test('a disabled context menu lets the browser menu through', async () => {
		const { target } = mount({ disabled: true });
		const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
		target.dispatchEvent(event);
		expect(event.defaultPrevented).toBe(false);
		expect(screen.queryByRole('menu')).toBeNull();
	});
});

describe('keyboard open', () => {
	test('a11y:context-menu.keyboard Shift+F10 opens the menu with the first row highlighted', async () => {
		const { target } = mount({
			items: [
				{ type: 'option', title: 'Copy' },
				{ type: 'option', title: 'Paste' }
			]
		});
		target.focus();
		await fireEvent.keyDown(target, { key: 'F10', shiftKey: true });
		await waitFor(() => expect(screen.queryByRole('menu')).not.toBeNull());
		await waitFor(() =>
			expect(screen.getByRole('menuitem', { name: 'Copy' })).toHaveAttribute('data-highlighted')
		);
		expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Copy' }));
	});

	test('the ContextMenu key does the same, and a right-click after it focuses the menu itself', async () => {
		const { target } = mount();
		await fireEvent.keyDown(target, { key: 'ContextMenu' });
		await waitFor(() =>
			expect(screen.getByRole('menuitem', { name: 'Copy' })).toHaveAttribute('data-highlighted')
		);
		await fireEvent.contextMenu(target, { clientX: 300, clientY: 300 });
		await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('menu')));
		expect(screen.getByRole('menuitem', { name: 'Copy' })).not.toHaveAttribute('data-highlighted');
	});
});

describe('touch callout', () => {
	test('the wrapper turns the iOS callout off while the menu is enabled', () => {
		const { target } = mount();
		expect(target.parentElement?.className).toContain('[-webkit-touch-callout:none]');
	});

	test('and leaves it on for a disabled menu', () => {
		const { target } = mount({ disabled: true });
		expect(target.parentElement?.className ?? '').not.toContain('touch-callout');
	});
});
