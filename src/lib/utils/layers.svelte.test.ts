// The shared layer stack: dismissal reasons, the Android Back gesture through CloseWatcher
// (OV-11), and outside presses that match intent (OV-5).
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { closeWatchers } from '$lib/testing/jsdom.test-helper.js';
import LayersHarness from './LayersHarness.test.svelte';
import type { OpenChangeDetails } from './openChange.js';

type Props = Parameters<typeof LayersHarness>[1];
const mount = (props: Props) => render(LayersHarness, { props });
const settle = () => new Promise((resolve) => setTimeout(resolve, 20));
const button = (name: string) => screen.getByRole('button', { name });
const queryDialog = (name: string) => screen.queryByRole('dialog', { name });

const ANDROID =
	'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Mobile Safari/537.36';
const onAndroid = () => vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(ANDROID);
afterEach(() => vi.restoreAllMocks());

const openDialog = async (name = 'Outer dialog', trigger = 'Open dialog') => {
	await fireEvent.click(button(trigger));
	return screen.findByRole('dialog', { name });
};

describe('Android Back through CloseWatcher (OV-11)', () => {
	test('an open modal layer holds one watcher, and its close request closes the dialog', async () => {
		onAndroid();
		const onOpenChange = vi.fn();
		mount({ scenario: 'dialog', onOpenChange });
		expect(closeWatchers.active).toHaveLength(0);
		await openDialog();
		await waitFor(() => expect(closeWatchers.active).toHaveLength(1));

		expect(closeWatchers.requestClose()).toBe(true);
		await waitFor(() => expect(queryDialog('Outer dialog')).toBeNull());
		expect(onOpenChange).toHaveBeenLastCalledWith(
			false,
			expect.objectContaining({
				reason: 'close-watcher',
				event: expect.any(Event),
				// The Back gesture is user input, not code.
				interaction: 'touch'
			})
		);
		await waitFor(() => expect(closeWatchers.active).toHaveLength(0));
	});

	test('a cancelled request keeps the dialog open and the watcher alive', async () => {
		onAndroid();
		mount({
			scenario: 'dialog',
			onOpenChange: (open, details) => {
				if (!open) details.cancel();
			}
		});
		await openDialog();
		await waitFor(() => expect(closeWatchers.active).toHaveLength(1));
		const [watcher] = closeWatchers.active;

		expect(closeWatchers.requestClose()).toBe(false);
		await settle();
		expect(queryDialog('Outer dialog')).toBeInTheDocument();
		expect(closeWatchers.active).toEqual([watcher]);
	});

	test('a request the page may not refuse closes it even when cancelled', async () => {
		onAndroid();
		mount({
			scenario: 'dialog',
			onOpenChange: (open, details) => {
				if (!open) details.cancel();
			}
		});
		await openDialog();
		await waitFor(() => expect(closeWatchers.active).toHaveLength(1));
		closeWatchers.requestClose({ cancelable: false });
		await waitFor(() => expect(queryDialog('Outer dialog')).toBeNull());
	});

	test('the request closes only the top dialog; the one below keeps its watcher', async () => {
		onAndroid();
		const onOpenChange = vi.fn();
		const onInnerOpenChange = vi.fn();
		mount({ scenario: 'nested-dialogs', onOpenChange, onInnerOpenChange });
		await openDialog();
		await openDialog('Inner dialog', 'Open inner');
		await waitFor(() => expect(closeWatchers.active).toHaveLength(2));

		closeWatchers.requestClose();
		await waitFor(() => expect(queryDialog('Inner dialog')).toBeNull());
		expect(queryDialog('Outer dialog')).toBeInTheDocument();
		expect(onOpenChange).not.toHaveBeenCalledWith(false, expect.anything());
		await waitFor(() => expect(closeWatchers.active).toHaveLength(1));
	});

	test('closing with the close button destroys the watcher', async () => {
		onAndroid();
		mount({ scenario: 'dialog' });
		const dialog = await openDialog();
		await waitFor(() => expect(closeWatchers.active).toHaveLength(1));
		// The default close button is the only button in the dialog.
		await fireEvent.click(dialog.querySelector('button')!);
		await waitFor(() => expect(closeWatchers.active).toHaveLength(0));
	});

	test('a dialog Escape cannot close gets no watcher, and neither does a desktop browser', async () => {
		onAndroid();
		const { unmount } = mount({ scenario: 'dialog', closeOnEscape: false });
		await openDialog();
		await settle();
		expect(closeWatchers.active).toHaveLength(0);
		unmount();
		vi.restoreAllMocks();

		mount({ scenario: 'dialog' });
		await openDialog();
		await settle();
		expect(closeWatchers.active).toHaveLength(0);
	});

	test('a cancelled Escape that the browser turns into a close request is asked once', async () => {
		onAndroid();
		const onOpenChange = vi.fn((open: boolean, details: OpenChangeDetails) => {
			if (!open) details.cancel();
		});
		mount({ scenario: 'dialog', onOpenChange });
		await openDialog();
		await waitFor(() => expect(closeWatchers.active).toHaveLength(1));
		onOpenChange.mockClear();

		// The jsdom stub, like Chromium, forwards an Escape nobody prevented to the watcher.
		await fireEvent.keyDown(window, { key: 'Escape' });
		await settle();
		expect(onOpenChange).toHaveBeenCalledOnce();
		expect(onOpenChange).toHaveBeenCalledWith(
			false,
			expect.objectContaining({ reason: 'escape-key' })
		);
		expect(queryDialog('Outer dialog')).toBeInTheDocument();
		expect(closeWatchers.active).toHaveLength(1);
	});
});

describe('outside presses that match intent (OV-5)', () => {
	const outside = () => screen.getByTestId('outside');
	const openPopover = async () => {
		await fireEvent.click(button('Open popover'));
		await screen.findByRole('button', { name: 'Inside popover' });
	};
	const touch = (type: string, init: PointerEventInit = {}) =>
		fireEvent(
			outside(),
			new PointerEvent(type, { bubbles: true, pointerType: 'touch', pointerId: 7, ...init })
		);
	const isOpen = () => !!screen.queryByRole('button', { name: 'Inside popover' });

	test('a tap outside a popover dismisses it once the finger lifts', async () => {
		const onOpenChange = vi.fn();
		mount({ scenario: 'popover', onOpenChange });
		await openPopover();
		await touch('pointerdown', { clientX: 10, clientY: 10 });
		await settle();
		expect(isOpen()).toBe(true);
		await touch('pointerup', { clientX: 12, clientY: 11 });
		await waitFor(() => expect(isOpen()).toBe(false));
		expect(onOpenChange).toHaveBeenLastCalledWith(
			false,
			expect.objectContaining({ reason: 'outside-press', interaction: 'touch' })
		);
	});

	test('a finger that starts scrolling the page leaves the popover open', async () => {
		mount({ scenario: 'popover' });
		await openPopover();
		// The browser takes the touch over for scrolling.
		await touch('pointerdown', { clientX: 10, clientY: 10 });
		await touch('pointercancel');
		await touch('pointerup', { clientX: 10, clientY: 10 });
		await settle();
		expect(isOpen()).toBe(true);

		// A drag past the slop before lifting.
		await touch('pointerdown', { clientX: 10, clientY: 10 });
		await touch('pointermove', { clientX: 10, clientY: 40 });
		await touch('pointerup', { clientX: 10, clientY: 40 });
		await settle();
		expect(isOpen()).toBe(true);
	});

	test('a mouse press outside dismisses at once, even right after opening', async () => {
		mount({ scenario: 'popover' });
		await fireEvent.click(button('Open popover'));
		await fireEvent.pointerDown(outside(), { pointerType: 'mouse' });
		await waitFor(() => expect(isOpen()).toBe(false));
	});

	test('a press that began before the popover opened does not dismiss it', async () => {
		mount({ scenario: 'popover' });
		const early = new PointerEvent('pointerdown', { bubbles: true, pointerType: 'mouse' });
		await new Promise((resolve) => setTimeout(resolve, 5));
		await openPopover();
		outside().dispatchEvent(early);
		await settle();
		expect(isOpen()).toBe(true);
	});

	test('a Dialog dismisses on an outside press right after it opens (no transition gate)', async () => {
		const onOpenChange = vi.fn();
		mount({ scenario: 'dialog', onOpenChange });
		await openDialog();
		await fireEvent.pointerDown(outside());
		await waitFor(() => expect(queryDialog('Outer dialog')).toBeNull());
		expect(onOpenChange).toHaveBeenLastCalledWith(
			false,
			expect.objectContaining({ reason: 'outside-press' })
		);
	});
});
