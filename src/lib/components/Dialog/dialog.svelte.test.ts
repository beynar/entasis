import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/svelte';
import { describe, expect, test, vi } from 'vitest';
import DialogLawHarness from './dialogLawHarness.test.svelte';
import DialogSwapHarness from './DialogSwapHarness.test.svelte';
import DialogTriggerHarness from './DialogTriggerHarness.test.svelte';

describe('Dialog disclosure state', () => {
	test('reports each library-requested transition once', async () => {
		const onOpenChange = vi.fn();
		const onAfterOpen = vi.fn();
		const onAfterClose = vi.fn();
		render(DialogLawHarness, {
			props: { onOpenChange, onAfterOpen, onAfterClose }
		});

		const openButton = screen.getByRole('button', { name: 'Open law dialog' });
		await fireEvent.click(openButton);
		await fireEvent.click(openButton);

		expect(onOpenChange).toHaveBeenCalledTimes(1);
		// `onclick={dialog.open}` passes its click: no trigger is attached, so code opened it.
		expect(onOpenChange).toHaveBeenLastCalledWith(
			true,
			expect.objectContaining({ reason: 'imperative-action', event: expect.any(MouseEvent) })
		);
		await waitFor(() => expect(onAfterOpen).toHaveBeenCalledOnce());

		await fireEvent.click(screen.getByRole('button', { name: 'Close law dialog' }));

		expect(onOpenChange).toHaveBeenCalledTimes(2);
		expect(onOpenChange).toHaveBeenLastCalledWith(
			false,
			expect.objectContaining({ reason: 'imperative-action', event: expect.any(MouseEvent) })
		);
		await waitFor(() => expect(onAfterClose).toHaveBeenCalledOnce());
	});
});

describe('Dialog layer registration', () => {
	test('a dialog mounted as another unmounts still gets the backdrop and Escape', async () => {
		const { container } = render(DialogSwapHarness);
		await fireEvent.click(screen.getByRole('button', { name: 'Swap panels' }));
		await fireEvent.click(await screen.findByRole('button', { name: 'Open second' }));

		const dialog = await screen.findByRole('dialog', { name: 'Second' });
		expect(dialog).toBeInTheDocument();
		// The shared backdrop follows the layer stack; a dialog dropped from it gets none.
		await waitFor(() =>
			expect(document.querySelector('[aria-hidden="true"] > .backdrop-blur-xs')).not.toBeNull()
		);
		await fireEvent.keyDown(window, { key: 'Escape' });
		await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Second' })).toBeNull());
		void container;
	});

	test('the default close button is not wrapped in a second close-button element', async () => {
		render(DialogSwapHarness);
		await fireEvent.click(screen.getByRole('button', { name: 'Open first' }));
		const dialog = await screen.findByRole('dialog', { name: 'First' });
		expect(dialog.querySelectorAll('.right-1.top-1')).toHaveLength(1);
	});
});

const pressOutside = () => fireEvent.pointerDown(document.body);
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('Dialog alert', () => {
	test('a11y:dialog.alert-role an alert renders role=alertdialog with aria-modal, named by its title', async () => {
		render(DialogLawHarness, { props: { type: 'alert' } });
		await fireEvent.click(screen.getByRole('button', { name: 'Open law dialog' }));
		const dialog = await screen.findByRole('alertdialog');
		expect(dialog).toHaveAttribute('aria-modal', 'true');
		expect(dialog).toHaveAccessibleName('Disclosure law');
		expect(screen.queryByRole('dialog')).toBeNull();
	});

	test('a11y:dialog.alert-outside-press an alert ignores outside presses unless closeOnClickOutside is set', async () => {
		// Located by aria-modal rather than role, so this checks dismissal on its own.
		const modal = () => document.querySelector('[aria-modal="true"]');
		const onAfterOpen = vi.fn();
		const { unmount } = render(DialogLawHarness, { props: { type: 'alert', onAfterOpen } });
		await fireEvent.click(screen.getByRole('button', { name: 'Open law dialog' }));
		await waitFor(() => expect(onAfterOpen).toHaveBeenCalledOnce());
		await pressOutside();
		await sleep(20);
		expect(modal()).toBeInTheDocument();
		// Escape still answers an alert.
		await fireEvent.keyDown(window, { key: 'Escape' });
		await waitFor(() => expect(modal()).toBeNull());
		unmount();

		const opened = vi.fn();
		render(DialogLawHarness, {
			props: { type: 'alert', closeOnClickOutside: true, onAfterOpen: opened }
		});
		await fireEvent.click(screen.getByRole('button', { name: 'Open law dialog' }));
		await waitFor(() => expect(opened).toHaveBeenCalledOnce());
		await pressOutside();
		await waitFor(() => expect(modal()).toBeNull());
	});

	test('a modal still closes on an outside press by default', async () => {
		const onAfterOpen = vi.fn();
		render(DialogLawHarness, { props: { onAfterOpen } });
		await fireEvent.click(screen.getByRole('button', { name: 'Open law dialog' }));
		await screen.findByRole('dialog');
		await waitFor(() => expect(onAfterOpen).toHaveBeenCalledOnce());
		await pressOutside();
		await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
	});
});

describe('Dialog data-type', () => {
	// jsdom matches no `min-width` query, so the theme resolves the `xs` (mobile) breakpoint.
	const typeAttributes = () => {
		const root = screen.getByRole('dialog');
		const panel = root.querySelector('[data-type]:not([role])');
		return [root.getAttribute('data-type'), panel?.getAttribute('data-type')];
	};

	test('a responsive modal collapsed into a mobile sheet reports drawerBottom', async () => {
		render(DialogLawHarness, { props: { responsive: true } });
		await fireEvent.click(screen.getByRole('button', { name: 'Open law dialog' }));
		await screen.findByRole('dialog');
		expect(typeAttributes()).toEqual(['drawerBottom', 'drawerBottom']);
	});

	test('a responsive type record reports the type resolved for the viewport', async () => {
		render(DialogLawHarness, { props: { type: { xs: 'drawerRight', md: 'modal' } } });
		await fireEvent.click(screen.getByRole('button', { name: 'Open law dialog' }));
		await screen.findByRole('dialog');
		expect(typeAttributes()).toEqual(['drawerRight', 'drawerRight']);
	});
});

describe('Dialog trigger contract (CX-4)', () => {
	test('{@attach dialog.trigger} makes any element a keyboard-reachable trigger with popup ARIA', async () => {
		const onOpenChange = vi.fn();
		render(DialogTriggerHarness, { props: { scenario: 'snippet-trigger', onOpenChange } });
		const card = screen.getByTestId('card');
		expect(card).toHaveAttribute('role', 'button');
		expect(card).toHaveAttribute('tabindex', '0');
		expect(card).toHaveAttribute('aria-haspopup', 'dialog');
		expect(card).toHaveAttribute('aria-expanded', 'false');
		expect(card).not.toHaveAttribute('aria-controls');

		card.focus();
		await fireEvent.keyDown(card, { key: 'Enter' });
		const dialog = await screen.findByRole('dialog', { name: 'Card details' });
		await waitFor(() => expect(card).toHaveAttribute('aria-expanded', 'true'));
		expect(card).toHaveAttribute('aria-controls', dialog.id);
		expect(onOpenChange).toHaveBeenLastCalledWith(
			true,
			expect.objectContaining({ reason: 'trigger-press', trigger: card, interaction: 'keyboard' })
		);

		// The close button reports its own reason; focus goes back to the trigger.
		await fireEvent.click(dialog.querySelector('button')!);
		await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
		expect(onOpenChange).toHaveBeenLastCalledWith(
			false,
			expect.objectContaining({ reason: 'close-press' })
		);
		expect(document.activeElement).toBe(card);
		expect(card).toHaveAttribute('aria-expanded', 'false');
	});

	test.each(['escape', 'close-button'] as const)(
		'focus returns to the trigger after an animated %s close, although the page behind was inert',
		async (how) => {
			// jsdom focuses inert elements; a browser refuses, which is what the restore must survive.
			const focus = HTMLElement.prototype.focus;
			const spy = vi.spyOn(HTMLElement.prototype, 'focus').mockImplementation(function (
				this: HTMLElement,
				...args
			) {
				if (this.closest('[inert]')) return;
				return focus.apply(this, args);
			});
			try {
				render(DialogTriggerHarness, { props: { scenario: 'animated-trigger' } });
				const opener = screen.getByTestId('opener');
				opener.focus();
				await fireEvent.click(opener);
				const dialog = await screen.findByRole('dialog', { name: 'Animated card' });
				await waitFor(() => expect(opener.closest('[inert]')).not.toBeNull());

				if (how === 'escape') await fireEvent.keyDown(window, { key: 'Escape' });
				else await fireEvent.click(dialog.querySelector('button')!);
				await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
				await waitFor(() => expect(document.activeElement).toBe(opener));
				expect(opener.closest('[inert]')).toBeNull();
			} finally {
				spy.mockRestore();
			}
		}
	);

	test('cancelling the trigger press keeps the dialog closed and the trigger collapsed', async () => {
		const onOpenChange = vi.fn((_open: boolean, details: { cancel(): void }) => details.cancel());
		render(DialogTriggerHarness, { props: { scenario: 'snippet-trigger', onOpenChange } });
		const card = screen.getByTestId('card');
		await fireEvent.click(card);
		await new Promise((resolve) => setTimeout(resolve, 20));

		expect(onOpenChange).toHaveBeenCalledOnce();
		expect(onOpenChange).toHaveBeenCalledWith(
			true,
			expect.objectContaining({ reason: 'trigger-press', trigger: card })
		);
		expect(screen.queryByRole('dialog')).toBeNull();
		expect(card).toHaveAttribute('aria-expanded', 'false');
	});

	test('DLG-2 the built-in trigger carries aria-haspopup, aria-expanded and aria-controls', async () => {
		render(DialogTriggerHarness, { props: { scenario: 'built-in-trigger' } });
		const trigger = screen.getByRole('button', { name: 'Open built-in' });
		expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
		expect(trigger).toHaveAttribute('aria-expanded', 'false');
		expect(trigger).not.toHaveAttribute('aria-controls');

		await fireEvent.click(trigger);
		const dialog = await screen.findByRole('dialog', { name: 'Built-in' });
		await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'true'));
		expect(trigger).toHaveAttribute('aria-controls', dialog.id);

		await fireEvent.click(within(dialog).getByRole('button', { name: 'Close' }));
		await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
		expect(trigger).toHaveAttribute('aria-expanded', 'false');
		expect(trigger).not.toHaveAttribute('aria-controls');
		expect(document.activeElement).toBe(trigger);
	});

	test("the built-in trigger's onclick runs first, and preventDefault keeps the dialog closed", async () => {
		const onOpenChange = vi.fn();
		render(DialogTriggerHarness, { props: { scenario: 'prevented-trigger', onOpenChange } });
		await fireEvent.click(screen.getByRole('button', { name: 'Open guarded' }));
		await new Promise((resolve) => setTimeout(resolve, 20));
		expect(onOpenChange).not.toHaveBeenCalled();
		expect(screen.queryByRole('dialog')).toBeNull();
	});
});

describe('Dialog lifecycle (CX-2)', () => {
	test('a dialog created open renders once mounted, animates in and reports onAfterOpen once', async () => {
		const onAfterOpen = vi.fn();
		render(DialogTriggerHarness, { props: { scenario: 'default-open', onAfterOpen } });
		await screen.findByRole('dialog', { name: 'Open at creation' });
		// The intro plays: the open completes on its end, not right away.
		expect(onAfterOpen).not.toHaveBeenCalled();
		await waitFor(() => expect(onAfterOpen).toHaveBeenCalledOnce());
		await new Promise((resolve) => setTimeout(resolve, 80));
		expect(onAfterOpen).toHaveBeenCalledOnce();
	});
});

const escapeKey = () => fireEvent.keyDown(window, { key: 'Escape' });
const openLaw = async () => {
	await fireEvent.click(screen.getByRole('button', { name: 'Open law dialog' }));
	return screen.findByRole('dialog');
};
const stillOpen = async () => {
	await sleep(30);
	return screen.queryByRole('dialog') !== null;
};

describe('Dialog close requests (OV-1)', () => {
	const veto = () =>
		vi.fn((open: boolean, details: { cancel(): void }) => {
			if (!open) details.cancel();
		});

	test('a cancelled Escape keeps the dialog open and leaves the key untouched', async () => {
		const onOpenChange = veto();
		render(DialogLawHarness, { props: { onOpenChange } });
		await openLaw();
		onOpenChange.mockClear();

		const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
		window.dispatchEvent(event);
		expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(
			false,
			expect.objectContaining({ reason: 'escape-key', interaction: 'keyboard' })
		);
		expect(event.defaultPrevented).toBe(false);
		expect(await stillOpen()).toBe(true);
	});

	test('a cancelled outside press keeps the dialog open', async () => {
		const onOpenChange = veto();
		const onAfterOpen = vi.fn();
		render(DialogLawHarness, { props: { onOpenChange, onAfterOpen } });
		await openLaw();
		await waitFor(() => expect(onAfterOpen).toHaveBeenCalledOnce());
		onOpenChange.mockClear();

		await pressOutside();
		expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(
			false,
			expect.objectContaining({ reason: 'outside-press' })
		);
		expect(await stillOpen()).toBe(true);
	});

	test('a cancelled close button keeps the dialog open', async () => {
		const onOpenChange = veto();
		render(DialogLawHarness, { props: { onOpenChange } });
		await openLaw();
		onOpenChange.mockClear();

		await fireEvent.click(screen.getByRole('button', { name: 'Close' }));
		expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(
			false,
			expect.objectContaining({ reason: 'close-press', event: expect.any(MouseEvent) })
		);
		expect(await stillOpen()).toBe(true);
	});

	test('once the veto is lifted every path closes it', async () => {
		let blocked = true;
		const onOpenChange = vi.fn((open: boolean, details: { cancel(): void }) => {
			if (!open && blocked) details.cancel();
		});
		render(DialogLawHarness, { props: { onOpenChange } });
		await openLaw();
		await escapeKey();
		expect(await stillOpen()).toBe(true);
		blocked = false;
		await escapeKey();
		await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
	});
});

describe('Dialog close button for screen readers (OV-18)', () => {
	test('a11y:dialog.close-button-named the default close button is named Close', async () => {
		render(DialogLawHarness);
		const dialog = await openLaw();
		const button = within(dialog).getByRole('button', { name: 'Close' });
		expect(button).not.toHaveClass('sr-only');
	});

	test('a11y:dialog.hidden-close a suppressed close button leaves a hidden one that closes the dialog', async () => {
		const onOpenChange = vi.fn();
		render(DialogLawHarness, { props: { closeButton: false, onOpenChange } });
		const dialog = await openLaw();

		const hidden = within(dialog).getByRole('button', { name: 'Close' });
		expect(hidden).toHaveClass('sr-only');
		// Reachable by a screen reader's virtual cursor, but not a stop in the Tab order.
		expect(hidden).toHaveAttribute('tabindex', '-1');
		// At the end of the panel, after the content.
		const buttons = within(dialog).getAllByRole('button');
		expect(buttons.at(-1)).toBe(hidden);

		await fireEvent.click(hidden);
		expect(onOpenChange).toHaveBeenLastCalledWith(
			false,
			expect.objectContaining({ reason: 'close-press' })
		);
		await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
	});

	test('a close button snippet that renders nothing is treated as suppressed', async () => {
		render(DialogLawHarness, { props: { emptyClose: true } });
		const dialog = await openLaw();
		expect(within(dialog).getAllByRole('button', { name: 'Close' })).toHaveLength(1);
		expect(within(dialog).getByRole('button', { name: 'Close' })).toHaveClass('sr-only');
	});

	test('no hidden button for a dialog that is not closable or an alert', async () => {
		const { unmount } = render(DialogLawHarness, {
			props: { closeButton: false, closable: false }
		});
		let dialog = await openLaw();
		expect(within(dialog).queryByRole('button', { name: 'Close' })).toBeNull();
		unmount();

		render(DialogLawHarness, { props: { closeButton: false, type: 'alert' } });
		await fireEvent.click(screen.getByRole('button', { name: 'Open law dialog' }));
		dialog = await screen.findByRole('alertdialog');
		expect(within(dialog).queryByRole('button', { name: 'Close' })).toBeNull();
	});
});

describe('Dialog non-modal (DLG-3)', () => {
	const backdrop = () => document.querySelector('[aria-hidden="true"] > .backdrop-blur-xs');
	const lockAttribute = () => document.documentElement.hasAttribute('data-entasis-scroll-lock');

	test('a modal makes the page inert, dims it and locks scroll', async () => {
		render(DialogLawHarness);
		const dialog = await openLaw();
		expect(dialog).toHaveAttribute('aria-modal', 'true');
		await waitFor(() =>
			expect(screen.getByTestId('page-button').closest('[inert]')).not.toBeNull()
		);
		expect(backdrop()).not.toBeNull();
		expect(lockAttribute()).toBe(true);
	});

	test('a non-modal dialog leaves the page interactive: no inert, no backdrop, no scroll lock', async () => {
		render(DialogLawHarness, { props: { modal: false } });
		const dialog = await openLaw();
		expect(dialog).not.toHaveAttribute('aria-modal');
		expect(dialog).toHaveAttribute('data-modal', 'false');
		await sleep(30);
		expect(screen.getByTestId('page-button').closest('[inert]')).toBeNull();
		expect(backdrop()).toBeNull();
		expect(lockAttribute()).toBe(false);
		// The viewport-sized root lets presses through to the page; the panel takes them.
		expect(dialog).toHaveClass('pointer-events-none');
		expect(dialog.querySelector('[data-type]')).toHaveClass('pointer-events-auto');
	});

	test('a non-modal dialog ignores outside presses by default and still answers Escape and its button', async () => {
		const onAfterOpen = vi.fn();
		const { unmount } = render(DialogLawHarness, { props: { modal: false, onAfterOpen } });
		await openLaw();
		await waitFor(() => expect(onAfterOpen).toHaveBeenCalledOnce());
		await pressOutside();
		expect(await stillOpen()).toBe(true);
		await escapeKey();
		await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
		unmount();

		render(DialogLawHarness, { props: { modal: false } });
		await openLaw();
		await fireEvent.click(screen.getByRole('button', { name: 'Close' }));
		await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
	});

	test('closeOnClickOutside opts a non-modal dialog into outside dismissal', async () => {
		const onAfterOpen = vi.fn();
		render(DialogLawHarness, { props: { modal: false, closeOnClickOutside: true, onAfterOpen } });
		await openLaw();
		await waitFor(() => expect(onAfterOpen).toHaveBeenCalledOnce());
		await pressOutside();
		await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
	});
});

describe('Dialog indent hooks (DLG-4)', () => {
	const root = document.documentElement;

	test('a modal dialog sets data-dialog-open and --dialog-depth on <html> while it is open', async () => {
		render(DialogLawHarness);
		expect(root).not.toHaveAttribute('data-dialog-open');
		await openLaw();
		await waitFor(() => expect(root).toHaveAttribute('data-dialog-open'));
		expect(root.style.getPropertyValue('--dialog-depth')).toBe('1');

		await escapeKey();
		await waitFor(() => expect(root).not.toHaveAttribute('data-dialog-open'));
		expect(root.style.getPropertyValue('--dialog-depth')).toBe('');
	});

	test('the depth counts stacked modal dialogs', async () => {
		render(DialogSwapHarness);
		await fireEvent.click(screen.getByRole('button', { name: 'Open first' }));
		await screen.findByRole('dialog', { name: 'First' });
		await waitFor(() => expect(root.style.getPropertyValue('--dialog-depth')).toBe('1'));
		await escapeKey();
		await waitFor(() => expect(root).not.toHaveAttribute('data-dialog-open'));
	});

	test('a non-modal dialog does not move the page back', async () => {
		render(DialogLawHarness, { props: { modal: false } });
		await openLaw();
		await sleep(30);
		expect(root).not.toHaveAttribute('data-dialog-open');
	});
});

describe('Dialog bottom sheet and the on-screen keyboard (OV-13)', () => {
	const align = () => screen.getByRole('dialog').firstElementChild as HTMLElement;
	const scrollIntoView = vi.fn();
	const root = document.documentElement;

	test('a focused field makes room for the keyboard, released a frame after focus leaves', async () => {
		render(DialogLawHarness, { props: { type: 'drawerBottom' } });
		await openLaw();
		expect(align().className).not.toContain('--keyboard-inset');

		const field = screen.getByLabelText('Draft');
		field.focus();
		await waitFor(() => expect(align().className).toContain('--keyboard-inset'));

		// Moving focus to another field never lets the sheet drop in between.
		screen.getByRole('button', { name: 'Close law dialog' }).focus();
		await waitFor(() => expect(align().className).not.toContain('--keyboard-inset'));
	});

	test('it is a bottom sheet behaviour: other types keep their padding', async () => {
		render(DialogLawHarness, { props: { type: 'drawerRight' } });
		await openLaw();
		screen.getByLabelText('Draft').focus();
		await sleep(50);
		expect(align().className).not.toContain('--keyboard-inset');
	});

	test('the field is brought into view once the keyboard has covered the viewport', async () => {
		const original = Element.prototype.scrollIntoView;
		Element.prototype.scrollIntoView = scrollIntoView;
		root.style.setProperty('--keyboard-inset', '300px');
		try {
			render(DialogLawHarness, { props: { type: 'drawerBottom' } });
			await openLaw();
			const field = screen.getByLabelText('Draft');
			field.focus();
			expect(scrollIntoView).not.toHaveBeenCalled();
			await waitFor(
				() => expect(scrollIntoView).toHaveBeenCalledWith({ block: 'center', inline: 'nearest' }),
				{
					timeout: 1500
				}
			);
		} finally {
			Element.prototype.scrollIntoView = original;
			root.style.removeProperty('--keyboard-inset');
		}
	});

	test('with no keyboard (inset 0) the field is left where it is', async () => {
		const original = Element.prototype.scrollIntoView;
		scrollIntoView.mockClear();
		Element.prototype.scrollIntoView = scrollIntoView;
		try {
			render(DialogLawHarness, { props: { type: 'drawerBottom' } });
			await openLaw();
			screen.getByLabelText('Draft').focus();
			await sleep(600);
			expect(scrollIntoView).not.toHaveBeenCalled();
		} finally {
			Element.prototype.scrollIntoView = original;
		}
	});
});
