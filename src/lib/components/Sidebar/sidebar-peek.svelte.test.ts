// Peek laws: a hover-revealed or hover-expanded Sidebar must not vanish while the user is
// still working inside it. Test names start with the stable id the docs page's verified
// feature chips reference (see tooling/check-feature-chips.mjs).
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { tick } from 'svelte';
import { afterAll, afterEach, beforeAll, describe, expect, test, vi } from 'vitest';
import SidebarPeekHarness from '../SidebarPeekHarness.test.svelte';

const scrollIntoView = Element.prototype.scrollIntoView;
beforeAll(() => {
	Element.prototype.scrollIntoView = vi.fn();
});
afterAll(() => {
	Element.prototype.scrollIntoView = scrollIntoView;
});
afterEach(() => {
	vi.useRealTimers();
});

/**
 * Only `setTimeout` is faked: Svelte's scheduler and testing-library's queries keep their real
 * microtasks, so the 120ms release grace can be skipped without stalling anything else.
 */
const useTimerControl = () => vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
/** Run past the release grace and flush the effects its timeout schedules. */
const pastGrace = async () => {
	await vi.advanceTimersByTimeAsync(200);
	await tick();
};

/** The shell root carries the peek state as data attributes. */
const shell = () => {
	const node = document.querySelector('[data-slot="sidebar"][data-display-state]');
	if (!(node instanceof HTMLElement)) throw new Error('sidebar shell not rendered');
	return node;
};
const isRevealed = () => shell().dataset.edgeRevealed === 'true';
const isHoverExpanded = () => shell().dataset.peek === 'true';
const container = () => {
	const node = document.querySelector('[data-slot="sidebar-container"]');
	if (!(node instanceof HTMLElement)) throw new Error('sidebar container not rendered');
	return node;
};
/** The group label toggle: disabled, inert and aria-hidden while the panel is icon-collapsed. */
const groupToggle = () => {
	const node = document.querySelector('[data-sidebar="group"] button');
	if (!(node instanceof HTMLElement)) throw new Error('sidebar group toggle not rendered');
	return node;
};
/** Move the pointer well away from the panel, which is what `revealSafeArea` listens for. */
const movePointerAway = () => fireEvent.pointerMove(window, { clientX: 900, clientY: 500 });

describe('sidebar peek', () => {
	test('a11y:sidebar.peek-keeps-focus keeps a hover-revealed sidebar open while a control inside has focus', async () => {
		render(SidebarPeekHarness);
		useTimerControl();

		const trigger = screen.getByRole('button', { name: 'Open Sidebar' });
		await fireEvent.pointerEnter(trigger);
		expect(isRevealed()).toBe(true);

		// Focus a row inside the panel, then take the pointer away entirely.
		const inbox = screen.getByRole('link', { name: /Inbox/ });
		await fireEvent.focusIn(inbox);
		await fireEvent.pointerLeave(trigger);
		await pastGrace();
		expect(isRevealed()).toBe(true);

		// Focus leaves while the pointer is still outside: the peek releases.
		await fireEvent.focusOut(inbox, { relatedTarget: screen.getByTestId('outside') });
		await pastGrace();
		expect(isRevealed()).toBe(false);
	});

	test('a11y:sidebar.peek-keeps-focus releases when focus never entered the panel', async () => {
		render(SidebarPeekHarness);
		useTimerControl();

		const trigger = screen.getByRole('button', { name: 'Open Sidebar' });
		await fireEvent.pointerEnter(trigger);
		expect(isRevealed()).toBe(true);

		// Nothing pinned this peek, so `revealSafeArea` owns the dismissal and its tolerance
		// rectangle still applies: it releases once the pointer moves away from the panel.
		await fireEvent.pointerLeave(trigger);
		await movePointerAway();
		await pastGrace();
		expect(isRevealed()).toBe(false);
	});

	test('a11y:sidebar.peek-keeps-open-menu keeps a hover-revealed sidebar open while a PopupMenu inside it is open', async () => {
		render(SidebarPeekHarness);

		const trigger = screen.getByRole('button', { name: 'Open Sidebar' });
		await fireEvent.pointerEnter(trigger);
		expect(isRevealed()).toBe(true);

		const rowTrigger = screen.getByRole('button', { name: /Row menu/ });
		await fireEvent.pointerDown(rowTrigger);
		await fireEvent.click(rowTrigger);
		await screen.findByRole('menu');

		useTimerControl();
		// The menu is portaled out of the panel, so only the layer stack can pin the peek.
		await fireEvent.pointerLeave(trigger);
		await pastGrace();
		expect(isRevealed()).toBe(true);
		expect(screen.getByRole('menu')).toBeInTheDocument();

		await fireEvent.keyDown(window, { key: 'Escape' });
		await pastGrace();
		expect(screen.queryByRole('menu')).toBeNull();

		// Escape restores focus to the row trigger, which is itself inside the panel, so the
		// peek is still pinned. It only releases once focus leaves too.
		expect(isRevealed()).toBe(true);

		await fireEvent.focusOut(rowTrigger, { relatedTarget: screen.getByTestId('outside') });
		await pastGrace();
		expect(isRevealed()).toBe(false);
	});

	test('keeps a hidden panel inert so focus cannot pin the next peek open', async () => {
		render(SidebarPeekHarness);
		useTimerControl();

		// Off screen and out of the tab order: focus can never land inside it.
		expect(container().inert).toBe(true);

		const trigger = screen.getByRole('button', { name: 'Open Sidebar' });
		await fireEvent.pointerEnter(trigger);
		expect(container().inert).toBeFalsy();

		// Even a focus event that reaches the hidden panel anyway must not latch the pin: the
		// peek still releases when the pointer leaves.
		await fireEvent.pointerLeave(trigger);
		await movePointerAway();
		await pastGrace();
		expect(isRevealed()).toBe(false);

		await fireEvent.focusIn(screen.getByRole('link', { name: /Inbox/ }));
		await fireEvent.pointerEnter(trigger);
		await fireEvent.pointerLeave(trigger);
		await movePointerAway();
		await pastGrace();
		expect(isRevealed()).toBe(false);
	});

	test('expandOnHover peeks an icon-collapsed sidebar open and lets it collapse again', async () => {
		render(SidebarPeekHarness, { props: { collapsible: 'icon', expandOnHover: true } });
		useTimerControl();

		expect(shell().dataset.displayState).toBe('collapsed');
		expect(isHoverExpanded()).toBe(false);

		await fireEvent.pointerEnter(container());
		expect(isHoverExpanded()).toBe(true);
		// The panel renders at full width over the page; the reserved column stays at icon width.
		expect(shell().dataset.collapsible).toBe('');

		await fireEvent.pointerLeave(container());
		await pastGrace();
		expect(isHoverExpanded()).toBe(false);
		expect(shell().dataset.collapsible).toBe('icon');
	});

	test('expandOnHover stays expanded while focus is inside the panel', async () => {
		render(SidebarPeekHarness, { props: { collapsible: 'icon', expandOnHover: true } });
		useTimerControl();

		await fireEvent.pointerEnter(container());
		const inbox = screen.getByRole('link', { name: /Inbox/ });
		await fireEvent.focusIn(inbox);
		await fireEvent.pointerLeave(container());
		await pastGrace();
		expect(isHoverExpanded()).toBe(true);

		await fireEvent.focusOut(inbox, { relatedTarget: screen.getByTestId('outside') });
		await pastGrace();
		expect(isHoverExpanded()).toBe(false);
	});

	test('expandOnHover renders the peeked panel with expanded semantics', async () => {
		render(SidebarPeekHarness, { props: { collapsible: 'icon', expandOnHover: true } });
		useTimerControl();

		// Icon-collapsed: the group header is present but dead, the row badge is dropped, and
		// the search box is hidden from assistive tech.
		expect(groupToggle()).toBeDisabled();
		expect(groupToggle()).toHaveAttribute('aria-hidden', 'true');
		expect(document.querySelector('[data-sidebar="menu-badge"]')).toBeNull();
		expect(screen.queryByRole('textbox', { name: 'Search workspace' })).toBeNull();

		await fireEvent.pointerEnter(container());
		expect(isHoverExpanded()).toBe(true);

		// Peeked at full width: everything the width implies is back.
		expect(groupToggle()).toBeEnabled();
		expect(groupToggle()).not.toHaveAttribute('aria-hidden');
		expect(document.querySelector('[data-sidebar="menu-badge"]')).not.toBeNull();
		expect(screen.getByRole('textbox', { name: 'Search workspace' })).toBeInTheDocument();

		await fireEvent.pointerLeave(container());
		await pastGrace();
		expect(isHoverExpanded()).toBe(false);
		expect(groupToggle()).toBeDisabled();
		expect(document.querySelector('[data-sidebar="menu-badge"]')).toBeNull();
	});

	test('expandOnHover is inert without the icon collapse mode', async () => {
		render(SidebarPeekHarness, { props: { collapsible: 'offcanvas', expandOnHover: true } });

		await fireEvent.pointerEnter(container());
		expect(isHoverExpanded()).toBe(false);
	});
});

describe('sidebar activity bar', () => {
	const activityItems = () =>
		Array.from(document.querySelectorAll<HTMLElement>('[data-slot="sidebar-activity-bar-item"]'));

	test('a11y:sidebar.activity-bar moves focus between items with the arrow keys and marks the active item', async () => {
		render(SidebarPeekHarness, { props: { scenario: 'activity-bar' } });

		expect(screen.getByRole('navigation', { name: 'Workspaces' })).toBeInTheDocument();

		const items = activityItems();
		// A badge is invisible to assistive tech on its own, so it joins the accessible name.
		expect(items.map((item) => item.getAttribute('aria-label'))).toEqual([
			'Files',
			'Search',
			'Extensions, 3',
			'Account'
		]);

		// The current page is announced, and only that item.
		expect(items[1]).toHaveAttribute('aria-current', 'page');
		expect(items.filter((item) => item.hasAttribute('aria-current'))).toHaveLength(1);

		items[0].focus();
		expect(document.activeElement).toBe(items[0]);

		await fireEvent.keyDown(items[0], { key: 'ArrowDown' });
		expect(document.activeElement).toBe(items[1]);

		await fireEvent.keyDown(items[1], { key: 'End' });
		expect(document.activeElement).toBe(items[3]);

		// Vertical navigation loops, so ArrowDown past the pinned item returns to the first.
		await fireEvent.keyDown(items[3], { key: 'ArrowDown' });
		expect(document.activeElement).toBe(items[0]);

		await fireEvent.keyDown(items[0], { key: 'ArrowUp' });
		expect(document.activeElement).toBe(items[3]);

		await fireEvent.keyDown(items[3], { key: 'Home' });
		expect(document.activeElement).toBe(items[0]);
	});

	test('a11y:sidebar.activity-bar keeps one roving tab stop and reports selections', async () => {
		const onSelect = vi.fn();
		render(SidebarPeekHarness, { props: { scenario: 'activity-bar', onSelect } });

		const items = activityItems();
		// Tab lands on the current page, not on the first item.
		expect(items.filter((item) => item.getAttribute('tabindex') === '0')).toHaveLength(1);
		expect(items[1]).toHaveAttribute('tabindex', '0');

		await fireEvent.click(items[2]);
		expect(onSelect).toHaveBeenCalledWith('Extensions', 2);

		await fireEvent.click(items[3]);
		expect(onSelect).toHaveBeenLastCalledWith('Account', 3);
	});
});
