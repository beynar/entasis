// Popover features of the Base UI adoption plan, lane C2: modal popovers (OV-18b), accessible
// names (POP-1), focus leaving (OV-14b), the arrow (POP-2) and one popup for many triggers (POP-3).
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { describe, expect, test, vi } from 'vitest';
import PopoverFeaturesHarness from './PopoverFeaturesHarness.test.svelte';

type Props = Parameters<typeof PopoverFeaturesHarness>[1];
const mount = (props: Props) => render(PopoverFeaturesHarness, { props });
const button = (name: string) => screen.getByRole('button', { name });
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const open = async (name: string) => {
	await fireEvent.pointerDown(button(name));
	await fireEvent.click(button(name));
};
const hidden = (name: string) => screen.queryByRole('button', { name });
const panel = () => document.querySelector('dialog[open]');
/** Placement lands a tick after the panel mounts; the bridge and the arrow wait for it. */
const placed = () =>
	waitFor(() => expect(panel()?.getAttribute('data-side') ?? panel()).toBeTruthy());

describe('modal popover (OV-18b)', () => {
	test('a11y:popover.modal-inert a modal popover opens with focus inside, the page inert and a screen reader close button', async () => {
		mount({ scenario: 'plain', popover: { modal: true } });
		await open('Open popover');
		await screen.findByRole('button', { name: 'First' });
		await waitFor(() => expect(document.activeElement).toBe(button('First')));

		const dialog = panel()!;
		expect(dialog).toHaveAttribute('aria-modal', 'true');
		// Everything beside the panel's own branch of <body> is inert, trigger included.
		const page = button('Before').closest('[inert]');
		expect(page).not.toBeNull();
		expect(button('Open popover').closest('[inert]')).not.toBeNull();
		expect(dialog.closest('[inert]')).toBeNull();

		const close = screen.getByRole('button', { name: 'Close', hidden: true });
		expect(close).toHaveClass('sr-only');
		expect(close).toHaveAttribute('tabindex', '-1');
		expect(dialog.contains(close)).toBe(true);
	});

	test('the hidden close button closes it with the close-press reason', async () => {
		const onOpenChange = vi.fn();
		mount({ scenario: 'plain', popover: { modal: true }, onOpenChange });
		await open('Open popover');
		await screen.findByRole('button', { name: 'First' });
		await fireEvent.click(screen.getByRole('button', { name: 'Close', hidden: true }));
		await waitFor(() => expect(hidden('First')).toBeNull());
		expect(onOpenChange).toHaveBeenLastCalledWith(
			false,
			expect.objectContaining({ reason: 'close-press' })
		);
	});

	test('Tab stays inside the panel and wraps from the last control to the first', async () => {
		mount({ scenario: 'plain', popover: { modal: true } });
		await open('Open popover');
		await waitFor(() => expect(document.activeElement).toBe(button('First')));
		await fireEvent.keyDown(button('First'), { key: 'Tab' });
		expect(document.activeElement).toBe(button('Second'));
		await fireEvent.keyDown(button('Second'), { key: 'Tab' });
		expect(document.activeElement).toBe(button('First'));
		await fireEvent.keyDown(button('First'), { key: 'Tab', shiftKey: true });
		expect(document.activeElement).toBe(button('Second'));
	});

	test('closing releases the page and gives focus back to the trigger', async () => {
		mount({ scenario: 'plain', popover: { modal: true } });
		await open('Open popover');
		await waitFor(() => expect(document.activeElement).toBe(button('First')));
		await fireEvent.keyDown(window, { key: 'Escape' });
		await waitFor(() => expect(hidden('First')).toBeNull());
		await waitFor(() => expect(document.querySelector('[inert]')).toBeNull());
		expect(document.activeElement).toBe(button('Open popover'));
	});

	test('a popover that is not modal leaves the page usable and has no close button', async () => {
		mount({ scenario: 'plain' });
		await open('Open popover');
		await screen.findByRole('button', { name: 'First' });
		expect(document.querySelector('[inert]')).toBeNull();
		expect(panel()).not.toHaveAttribute('aria-modal');
		expect(screen.queryByRole('button', { name: 'Close', hidden: true })).toBeNull();
	});

	test('a modal popover with no way to dismiss it renders no close button', async () => {
		mount({
			scenario: 'plain',
			popover: { modal: true, closeOnEscape: false, closeOnClickOutside: false }
		});
		await open('Open popover');
		await screen.findByRole('button', { name: 'First' });
		expect(screen.queryByRole('button', { name: 'Close', hidden: true })).toBeNull();
	});

	test('a modal popover does not open on hover', async () => {
		mount({ scenario: 'plain', popover: { modal: true, openOnHover: true, delay: 0 } });
		await fireEvent.pointerEnter(button('Open popover'), { pointerType: 'mouse' });
		await fireEvent.mouseEnter(button('Open popover'), { clientX: 5, clientY: 5 });
		await sleep(40);
		expect(hidden('First')).toBeNull();
	});

	test('the modal panel owns Tab: no aria-owns bridge to the trigger', async () => {
		mount({ scenario: 'plain', popover: { modal: true } });
		await open('Open popover');
		await screen.findByRole('button', { name: 'First' });
		await sleep(30);
		expect(document.querySelector('[aria-owns]')).toBeNull();
	});
});

describe('popover name (POP-1)', () => {
	test('a11y:popover.label label names the dialog', async () => {
		mount({ scenario: 'plain', popover: { label: 'Share settings' } });
		await open('Open popover');
		expect(await screen.findByRole('dialog', { name: 'Share settings' })).toBeInTheDocument();
	});

	test('labelledBy points the dialog at a visible heading', async () => {
		mount({
			scenario: 'plain',
			popover: { labelledBy: 'first-heading' }
		});
		const heading = document.createElement('h2');
		heading.id = 'first-heading';
		heading.textContent = 'Heading name';
		document.body.append(heading);
		await open('Open popover');
		expect(await screen.findByRole('dialog', { name: 'Heading name' })).toHaveAttribute(
			'aria-labelledby',
			'first-heading'
		);
		heading.remove();
	});

	test('an unnamed popover stays unnamed', async () => {
		mount({ scenario: 'plain' });
		await open('Open popover');
		await screen.findByRole('button', { name: 'First' });
		expect(panel()).not.toHaveAttribute('aria-label');
		expect(panel()).not.toHaveAttribute('aria-labelledby');
	});

	test('a menu popup names the element with the menu role, not the wrapper', async () => {
		mount({ scenario: 'menu', popover: { label: 'File actions' } });
		await open('Open menu');
		const menu = await screen.findByRole('menu', { name: 'File actions' });
		expect(menu).toHaveAttribute('aria-label', 'File actions');
		expect(menu).not.toHaveAttribute('aria-labelledby');
		expect(document.querySelector('dialog')).toBeNull();
	});

	test('a menu popup follows label and labelledBy while it is open', async () => {
		const { rerender } = mount({ scenario: 'menu', label: 'First name' });
		await open('Open menu');
		const menu = await screen.findByRole('menu', { name: 'First name' });
		await rerender({ scenario: 'menu', label: 'Second name' });
		await waitFor(() => expect(menu).toHaveAttribute('aria-label', 'Second name'));
		await rerender({ scenario: 'menu', label: '' });
		await waitFor(() => expect(menu).not.toHaveAttribute('aria-label'));
		expect(menu).toHaveAttribute('aria-labelledby', button('Open menu').id);
	});

	test('a menu popup without label is still named by its trigger', async () => {
		mount({ scenario: 'menu' });
		await open('Open menu');
		expect(await screen.findByRole('menu', { name: 'Open menu' })).toBeInTheDocument();
	});

	test('the mobile sheet dialog takes the name', async () => {
		mount({ scenario: 'sheet', popover: { label: 'Sheet name' } });
		await open('Open sheet');
		expect(await screen.findByRole('dialog', { name: 'Sheet name' })).toBeInTheDocument();
	});
});

describe('focus leaving (OV-14b)', () => {
	test('a11y:popover.focus-out focus that was on the trigger moving on closes the popover with the focus-out reason', async () => {
		const onOpenChange = vi.fn();
		mount({ scenario: 'plain', onOpenChange });
		button('Open popover').focus();
		await open('Open popover');
		await screen.findByRole('button', { name: 'First' });
		button('After').focus();
		await waitFor(() => expect(hidden('First')).toBeNull());
		expect(onOpenChange).toHaveBeenLastCalledWith(
			false,
			expect.objectContaining({ reason: 'focus-out' })
		);
		// Focus that moved on by itself is not taken back.
		expect(document.activeElement).toBe(button('After'));
	});

	test('focus inside the panel moving out closes it', async () => {
		mount({ scenario: 'plain', popover: { focusOnOpen: 'first' } });
		await open('Open popover');
		await waitFor(() => expect(document.activeElement).toBe(button('First')));
		button('Before').focus();
		await waitFor(() => expect(hidden('First')).toBeNull());
	});

	test('focus that never entered the popover is left alone', async () => {
		mount({ scenario: 'plain' });
		await open('Open popover');
		await screen.findByRole('button', { name: 'First' });
		button('After').focus();
		await sleep(40);
		expect(hidden('First')).not.toBeNull();
	});

	test('moving between the panel and a popover opened from it keeps both open', async () => {
		mount({ scenario: 'nested', popover: { focusOnOpen: 'first' } });
		await open('Open outer');
		await waitFor(() => expect(document.activeElement).toBe(button('Outer first')));
		await open('Open inner');
		await screen.findByRole('button', { name: 'Inner first' });
		button('Inner first').focus();
		await sleep(40);
		expect(hidden('Inner first')).not.toBeNull();
		expect(hidden('Outer first')).not.toBeNull();
		button('Outer first').focus();
		await sleep(40);
		expect(hidden('Outer first')).not.toBeNull();
		button('After').focus();
		await waitFor(() => expect(hidden('Outer first')).toBeNull());
	});

	test('closeOnFocusOut={false} keeps it open', async () => {
		mount({ scenario: 'plain', popover: { closeOnFocusOut: false, focusOnOpen: 'first' } });
		await open('Open popover');
		await waitFor(() => expect(document.activeElement).toBe(button('First')));
		button('After').focus();
		await sleep(40);
		expect(hidden('First')).not.toBeNull();
	});

	test('a popover that ignores outside presses ignores focus moving on too', async () => {
		mount({ scenario: 'plain', popover: { closeOnClickOutside: false, focusOnOpen: 'first' } });
		await open('Open popover');
		await waitFor(() => expect(document.activeElement).toBe(button('First')));
		button('After').focus();
		await sleep(40);
		expect(hidden('First')).not.toBeNull();
	});

	test('closeOnFocusOut closes a popover that ignores outside presses when set', async () => {
		mount({
			scenario: 'plain',
			popover: { closeOnClickOutside: false, closeOnFocusOut: true, focusOnOpen: 'first' }
		});
		await open('Open popover');
		await waitFor(() => expect(document.activeElement).toBe(button('First')));
		button('After').focus();
		await waitFor(() => expect(hidden('First')).toBeNull());
	});

	test('a menu popup steers focus itself and stays open', async () => {
		mount({ scenario: 'menu', popover: { focusOnOpen: 'first' } });
		await open('Open menu');
		await screen.findByRole('menuitem', { name: 'Item' });
		await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('menuitem')));
		button('After').focus();
		await sleep(40);
		expect(screen.queryByRole('menuitem', { name: 'Item' })).not.toBeNull();
	});
});

describe('tab bridge opt-out (OV-14b)', () => {
	test('a dialog popover bridges Tab to its trigger with aria-owns', async () => {
		mount({ scenario: 'plain' });
		await open('Open popover');
		await screen.findByRole('button', { name: 'First' });
		await waitFor(() => expect(document.querySelector('[aria-owns]')).not.toBeNull());
	});

	test('tabBridge={false} leaves the panel out of the trigger’s Tab order', async () => {
		mount({ scenario: 'plain', popover: { tabBridge: false } });
		await open('Open popover');
		await screen.findByRole('button', { name: 'First' });
		await placed();
		await sleep(40);
		expect(document.querySelector('[aria-owns]')).toBeNull();
	});

	test('a menu popup is never bridged', async () => {
		mount({ scenario: 'menu' });
		await open('Open menu');
		await screen.findByRole('menuitem', { name: 'Item' });
		await sleep(40);
		expect(document.querySelector('[aria-owns]')).toBeNull();
	});
});

describe('arrow (POP-2)', () => {
	test('a panel with an arrow draws one that reports the side it sits on', async () => {
		mount({ scenario: 'plain', popover: { arrow: true, position: 'bottom' } });
		await open('Open popover');
		await screen.findByRole('button', { name: 'First' });
		const arrow = await waitFor(() => {
			const node = panel()!.querySelector<HTMLElement>('[aria-hidden="true"][data-side]');
			expect(node).not.toBeNull();
			return node!;
		});
		// The arrow sits on the panel edge that faces the trigger: the top edge for a bottom panel.
		expect(arrow.getAttribute('data-side')).toBe('bottom');
		expect(arrow.style.top).not.toBe('');
		expect(arrow.style.bottom).toBe('');
	});

	test('no arrow unless asked for', async () => {
		mount({ scenario: 'plain', popover: { position: 'bottom' } });
		await open('Open popover');
		await screen.findByRole('button', { name: 'First' });
		await sleep(40);
		expect(panel()!.querySelector('[aria-hidden="true"]')).toBeNull();
	});
});

describe('one popup for many triggers (POP-3)', () => {
	test('the payload follows the trigger that opened the shared popup', async () => {
		mount({ scenario: 'rows' });
		await open('Open Ada');
		expect(await screen.findByTestId('payload')).toHaveTextContent('Ada');
		expect(document.querySelectorAll('dialog[open]')).toHaveLength(1);

		// Pressing another trigger moves the one popup to it and stays open.
		await open('Open Grace');
		await waitFor(() => expect(screen.getByTestId('payload')).toHaveTextContent('Grace'));
		expect(document.querySelectorAll('dialog[open]')).toHaveLength(1);
		expect(button('Open Grace')).toHaveAttribute('aria-expanded', 'true');
		expect(button('Open Ada')).toHaveAttribute('aria-expanded', 'false');
	});

	test('the payload is read live, without re-attaching the trigger', async () => {
		mount({ scenario: 'rows' });
		await open('Open Ada');
		expect(await screen.findByTestId('payload')).toHaveTextContent('Ada');
		const trigger = button('Open Ada');
		await fireEvent.click(button('Rename Ada'));
		await waitFor(() => expect(screen.getByTestId('payload')).toHaveTextContent('Ada!'));
		// Same element: the trigger was not removed and re-added (which would close the popover).
		expect(button('Open Ada!')).toBe(trigger);
		expect(trigger.isConnected).toBe(true);
		expect(trigger).toHaveAttribute('aria-expanded', 'true');
	});

	test('Escape closes the shared popup and clears its payload', async () => {
		mount({ scenario: 'rows' });
		await open('Open Ada');
		await screen.findByTestId('payload');
		await open('Open Grace');
		await waitFor(() => expect(screen.getByTestId('payload')).toHaveTextContent('Grace'));
		await fireEvent.keyDown(window, { key: 'Escape' });
		await waitFor(() => expect(screen.queryByTestId('payload')).toBeNull());
	});
});
