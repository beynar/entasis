// Executable entries for the proposed overlay and accessibility laws (decisions.md). Each one is a
// repro of today's behaviour and is declared `pending`: Vitest expects it to fail. The lane that
// implements the law makes it pass, which turns the run red ("Expect test to fail") until the
// lane flips `pending(` to `test(` and, when a docs chip claims the behaviour, gives it a stable
// `a11y:<component>.<law>` id. Ids stay out of pending names on purpose: the feature-chip check
// accepts any test whose name contains the id. Each describe names the lane and item that own it.
//
// Clauses that need real focus rings or input modality (law 5) live in
// `proposed-laws.browser.test.ts`, and law 14 renders on the server in `proposed-laws.test.ts`.
// Laws with no entry: 9 (disabled fields leave the Form value) because F6 made disabled fields
// skip validation (form.field.svelte.test.ts) and C8 owns leaving them out of the value; 11
// (catalog messages) lives with F6's FD-1 tests in Form/Field/field.svelte.test.ts; 13 (narrow
// Api types) because it is a compile-time property that svelte-check enforces once R2 narrows
// the types.
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { describe, expect, test, vi } from 'vitest';
import { mockNotRendered } from '$lib/testing/jsdom.test-helper.js';
import type { MenuItem } from './Menu/menu.props.js';
import ProposedLawsHarness from './ProposedLawsHarness.test.svelte';

const pending = test.fails;

type Props = Parameters<typeof ProposedLawsHarness>[1];
const mount = (scenario: Props['scenario'], props: Omit<Props, 'scenario'> = {}) =>
	render(ProposedLawsHarness, { props: { scenario, ...props } });
const escape = () => fireEvent.keyDown(window, { key: 'Escape' });
const pressOutside = () => fireEvent.pointerDown(screen.getByTestId('outside'));
const settle = () => new Promise((resolve) => setTimeout(resolve, 20));
const button = (name: string) => screen.getByRole('button', { name });
const queryButton = (name: string) => screen.queryByRole('button', { name });

describe('law 1 · open-change details (F1 · CX-1)', () => {
	test('onOpenChange receives the close reason and the originating event', async () => {
		const onOpenChange = vi.fn();
		mount('dialog-trigger', { onOpenChange });
		await fireEvent.click(button('Open dialog'));
		await screen.findByRole('dialog');
		await escape();
		expect(onOpenChange).toHaveBeenLastCalledWith(
			false,
			expect.objectContaining({ reason: 'escape-key', event: expect.any(KeyboardEvent) })
		);
	});

	test('an outside press reports the outside-press reason', async () => {
		const onOpenChange = vi.fn();
		mount('popover', { onOpenChange });
		await fireEvent.click(button('Open popover'));
		await screen.findByRole('button', { name: 'Inside popover' });
		await pressOutside();
		await waitFor(() => expect(queryButton('Inside popover')).toBeNull());
		expect(onOpenChange).toHaveBeenLastCalledWith(
			false,
			expect.objectContaining({ reason: 'outside-press', event: expect.any(Event) })
		);
	});

	test('cancelling the change keeps the overlay open', async () => {
		mount('dialog-trigger', {
			onOpenChange: (open, details) => {
				if (!open) details?.cancel?.();
			}
		});
		await fireEvent.click(button('Open dialog'));
		await screen.findByRole('dialog');
		await escape();
		await settle();
		expect(screen.getByRole('dialog')).toBeInTheDocument();
	});

	test('a cancelled Escape leaves its keydown event untouched', async () => {
		mount('dialog-trigger', {
			onOpenChange: (open, details) => {
				if (!open) details?.cancel?.();
			}
		});
		await fireEvent.click(button('Open dialog'));
		await screen.findByRole('dialog');
		const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
		window.dispatchEvent(event);
		await settle();
		expect(event.defaultPrevented).toBe(false);
	});
});

describe('law 2 · lifecycle (F1 · CX-2)', () => {
	test('a Dialog open at creation fires onAfterOpen once and dismisses on outside press', async () => {
		const onAfterOpen = vi.fn();
		mount('dialog-default-open', { onAfterOpen });
		await screen.findByRole('dialog');
		await waitFor(() => expect(onAfterOpen).toHaveBeenCalledOnce());
		await pressOutside();
		await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
	});

	test('an inline Popover open at creation fires onAfterOpen once', async () => {
		const onAfterOpen = vi.fn();
		mount('popover-inline-default-open', { onAfterOpen });
		await screen.findByRole('button', { name: 'Inside inline popover' });
		await waitFor(() => expect(onAfterOpen).toHaveBeenCalledOnce());
	});
});

describe('law 3 · handler composition (F1 · CX-4)', () => {
	test('a consumer onclick that calls preventDefault cancels the built-in toggle', async () => {
		mount('popover-prevented-trigger');
		await fireEvent.click(button('Guarded trigger'));
		await settle();
		expect(queryButton('Inside guarded popover')).toBeNull();
	});
});

describe('law 4 · trigger contract (F1 · CX-4)', () => {
	test('the Dialog trigger exposes aria-haspopup, aria-expanded and aria-controls', async () => {
		mount('dialog-trigger');
		const trigger = button('Open dialog');
		expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
		expect(trigger).toHaveAttribute('aria-expanded', 'false');
		await fireEvent.click(trigger);
		const dialog = await screen.findByRole('dialog');
		await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'true'));
		expect(trigger).toHaveAttribute('aria-controls', dialog.id);
	});

	test('of two triggers, the one that opened the popover gets focus back', async () => {
		mount('popover-two-triggers');
		const first = button('First trigger');
		first.focus();
		await fireEvent.click(first);
		await waitFor(() => expect(document.activeElement).toBe(button('Inside shared popover')));
		await escape();
		await waitFor(() => expect(queryButton('Inside shared popover')).toBeNull());
		expect(document.activeElement).toBe(first);
	});

	test('removing the trigger of an open popover closes it', async () => {
		const onOpenChange = vi.fn();
		const { rerender } = mount('popover-removable-trigger', { onOpenChange });
		await fireEvent.click(button('Removable trigger'));
		await screen.findByRole('button', { name: 'Inside removable popover' });
		await rerender({ triggerPresent: false });
		await settle();
		expect(queryButton('Inside removable popover')).toBeNull();
		expect(onOpenChange).toHaveBeenLastCalledWith(
			false,
			expect.objectContaining({ reason: 'trigger-unmount' })
		);
	});
});

describe('law 5 · focus (F3 · CX-3)', () => {
	test('when the opener is gone, closing restores focus to the last element still in the page', async () => {
		mount('removed-opener');
		const notes = screen.getByLabelText('Notes');
		notes.focus();
		const opener = button('Open and remove');
		opener.focus();
		await fireEvent.click(opener);
		await screen.findByRole('dialog');
		await escape();
		await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
		await waitFor(() => expect(document.activeElement).toBe(notes));
	});
});

describe('law 6 · hover (F5 · MN-7, C14 · DF-6, F1 · MN-4)', () => {
	// A tap fires pointer events with pointerType "touch", then compatibility mouse events,
	// mouseenter included, which hover-opening code must not take for a hover.
	const tap = async (element: HTMLElement) => {
		await fireEvent.pointerEnter(element, { pointerType: 'touch' });
		await fireEvent.pointerDown(element, { pointerType: 'touch' });
		await fireEvent.pointerUp(element, { pointerType: 'touch' });
		await fireEvent.mouseEnter(element);
	};

	test('a touch tap does not open a tooltip', async () => {
		mount('tooltip');
		await tap(button('Tooltip trigger'));
		await settle();
		expect(screen.queryByRole('tooltip')).toBeNull();
	});

	test('hovering a disabled trigger does not open its popover', async () => {
		mount('popover-hover', { triggerDisabled: true });
		await fireEvent.mouseEnter(button('Hover trigger'));
		await settle();
		expect(queryButton('Inside hover popover')).toBeNull();
	});

	test('a hover-opened popover leaves page scroll unlocked', async () => {
		mount('popover-hover');
		await fireEvent.mouseEnter(button('Hover trigger'));
		await screen.findByRole('button', { name: 'Inside hover popover' });
		await settle();
		expect(document.documentElement).not.toHaveAttribute('data-entasis-scroll-lock');
	});
});

describe('law 7 · keyboard lists (F4a · CX-7)', () => {
	// `mockNotRendered` gives the item no client rects, which is how `isTabbable` and a CSS-hidden
	// element look to the focus helpers; the real-CSS variant is in `useNavigation.browser.test.ts`.
	test('arrow keys skip an item that is not rendered', async () => {
		mount('menu');
		const [archive, copy] = screen.getAllByRole('menuitem');
		mockNotRendered(copy);
		archive.focus();
		await fireEvent.focusIn(archive);
		await fireEvent.keyDown(archive, { key: 'ArrowDown' });
		await waitFor(() => expect(document.activeElement).toHaveTextContent('Cut'));
	});

	test('removing an item before the focused one keeps arrow keys on track', async () => {
		const segments = ['Archive', 'Copy', 'Cut', 'Delete'].map((label) => ({ value: label, label }));
		const { rerender } = mount('segmented', { segments });
		const cut = screen.getByRole('radio', { name: 'Cut' });
		await fireEvent.click(cut);
		await waitFor(() => expect(document.activeElement).toBe(cut));
		// Remove "Copy", which sits before the focused "Cut".
		await rerender({ segments: segments.filter((_, index) => index !== 1) });
		await settle();
		expect(document.activeElement).toBe(cut);
		// The single tab stop stays on the focused item, not on the item that slid into its index.
		const tabStops = screen.getAllByRole('radio').filter((radio) => radio.tabIndex === 0);
		expect(tabStops).toEqual([cut]);
		await fireEvent.keyDown(cut, { key: 'ArrowRight' });
		await waitFor(() => expect(document.activeElement).toHaveTextContent('Delete'));
	});

	test('a disabled menu item is never an arrow-key target', async () => {
		mount('menu', {
			menuItems: [
				{ type: 'option', title: 'Archive' },
				{ type: 'option', title: 'Copy', disabled: true },
				{ type: 'option', title: 'Cut' }
			]
		});
		const archive = screen.getByRole('menuitem', { name: 'Archive' });
		archive.focus();
		await fireEvent.keyDown(archive, { key: 'ArrowDown' });
		await waitFor(() => expect(document.activeElement).toHaveTextContent('Cut'));
	});
});

// Menu keys its rows by identity (`menuItemKeys`: an explicit `key`, else the row's text), so
// after "Copy" is removed the focused row node is still "Cut" and the next ArrowDown reaches
// "Delete". The tab stop itself follows the element (above).
describe('law 7 · Menu rows keep their node through removals (C3 · CX-7)', () => {
	test('removing an item before the focused one keeps arrow keys on track', async () => {
		const items = ['Archive', 'Copy', 'Cut', 'Delete'].map((title): MenuItem => ({
			type: 'option',
			title
		}));
		const { rerender } = mount('menu', { menuItems: items });
		const archive = screen.getByRole('menuitem', { name: 'Archive' });
		archive.focus();
		await fireEvent.focusIn(archive);
		await fireEvent.keyDown(archive, { key: 'ArrowDown' });
		await fireEvent.keyDown(document.activeElement!, { key: 'ArrowDown' });
		await waitFor(() => expect(document.activeElement).toHaveTextContent('Cut'));
		// Remove "Copy", which sits before the focused "Cut".
		await rerender({ menuItems: items.filter((_, index) => index !== 1) });
		await settle();
		await fireEvent.keyDown(document.activeElement!, { key: 'ArrowDown' });
		await waitFor(() => expect(document.activeElement).toHaveTextContent('Delete'));
	});
});

describe('law 8 · read-only (F6 · RO-1, C5 · SC-4)', () => {
	test('a read-only RatingInput stays focusable, says so and refuses key changes', async () => {
		mount('rating-read-only');
		const rating = screen.getByRole('slider', { name: 'Score' });
		expect(rating).toHaveAttribute('tabindex', '0');
		expect(rating).toHaveAttribute('aria-readonly', 'true');
		rating.focus();
		await fireEvent.keyDown(rating, { key: 'ArrowRight' });
		expect(rating).toHaveAttribute('aria-valuenow', '3');
	});

	test('a read-only Select says so and still submits its value', async () => {
		mount('select-read-only');
		const select = screen.getByRole('combobox', { name: 'Plan' });
		expect(select).toHaveAttribute('aria-readonly', 'true');
		const form = screen.getByTestId('form') as HTMLFormElement;
		expect(new FormData(form).get('plan')).toBe('pro');
	});
});

describe('law 10 · native forms (B7 · CX-13b)', () => {
	test('a disabled Select leaves its value out of the native form', () => {
		mount('select-disabled');
		const form = screen.getByTestId('form') as HTMLFormElement;
		expect(new FormData(form).has('plan')).toBe(false);
	});
});

describe('law 12 · styling hooks (R1 · CX-6)', () => {
	pending('an open Popover marks its panel data-open and its trigger data-popup-open', async () => {
		mount('popover');
		const trigger = button('Open popover');
		await fireEvent.click(trigger);
		const inside = await screen.findByRole('button', { name: 'Inside popover' });
		expect(inside.closest('[data-open]')).not.toBeNull();
		expect(trigger).toHaveAttribute('data-popup-open');
	});
});
