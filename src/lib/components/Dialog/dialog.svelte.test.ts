import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
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
