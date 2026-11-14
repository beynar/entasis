// `dismissible={false}`: every dismissal by gesture is refused and reported to `onDismissAttempt`
// (never to `onOpenChange`), while the close button, the dialog's own controls and code still
// close it.
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { describe, expect, test, vi } from 'vitest';
import DialogLawHarness from './dialogLawHarness.test.svelte';
import SwipeHarness from './dialogSwipeHarness.test.svelte';
import { closeWatchers } from '$lib/testing/jsdom.test-helper.js';

const ANDROID =
	'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Mobile Safari/537.36';
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const openLaw = async () => {
	await fireEvent.click(screen.getByRole('button', { name: 'Open law dialog' }));
	return screen.findByRole('dialog');
};
const stillOpen = async () => {
	await sleep(30);
	return screen.queryByRole('dialog') !== null;
};

const mount = (props: Parameters<typeof DialogLawHarness>[1] = {}) => {
	const onOpenChange = vi.fn();
	const onDismissAttempt = vi.fn();
	render(DialogLawHarness, {
		props: { dismissible: false, onOpenChange, onDismissAttempt, ...props }
	});
	return { onOpenChange, onDismissAttempt };
};

describe('Dialog dismissible={false}', () => {
	test('Escape is refused, reported to onDismissAttempt only, and left untouched', async () => {
		const { onOpenChange, onDismissAttempt } = mount();
		await openLaw();
		onOpenChange.mockClear();

		const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
		window.dispatchEvent(event);
		expect(onDismissAttempt).toHaveBeenCalledExactlyOnceWith(
			expect.objectContaining({ reason: 'escape-key', interaction: 'keyboard', event })
		);
		expect(onOpenChange).not.toHaveBeenCalled();
		expect(event.defaultPrevented).toBe(false);
		expect(await stillOpen()).toBe(true);
	});

	test('an outside press is refused and reported', async () => {
		const onAfterOpen = vi.fn();
		const { onOpenChange, onDismissAttempt } = mount({ onAfterOpen });
		await openLaw();
		await waitFor(() => expect(onAfterOpen).toHaveBeenCalledOnce());
		onOpenChange.mockClear();

		await fireEvent.pointerDown(document.body);
		expect(onDismissAttempt).toHaveBeenCalledExactlyOnceWith(
			expect.objectContaining({ reason: 'outside-press' })
		);
		expect(onOpenChange).not.toHaveBeenCalled();
		expect(await stillOpen()).toBe(true);
	});

	test('the Android Back gesture is refused, reported, and the watcher kept for the next one', async () => {
		vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(ANDROID);
		const { onOpenChange, onDismissAttempt } = mount();
		await openLaw();
		onOpenChange.mockClear();
		await waitFor(() => expect(closeWatchers.active.length).toBe(1));

		// `false`: the cancel event was prevented, so the browser keeps the watcher.
		expect(closeWatchers.requestClose()).toBe(false);
		expect(onDismissAttempt).toHaveBeenCalledExactlyOnceWith(
			expect.objectContaining({ reason: 'close-watcher' })
		);
		expect(onOpenChange).not.toHaveBeenCalled();
		expect(await stillOpen()).toBe(true);
		expect(closeWatchers.active.length).toBe(1);
	});

	test('the close button, the dialog’s own controls and code still close it', async () => {
		const { onOpenChange, onDismissAttempt } = mount();
		await openLaw();
		await fireEvent.click(screen.getByRole('button', { name: 'Close' }));
		await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
		expect(onOpenChange).toHaveBeenLastCalledWith(
			false,
			expect.objectContaining({ reason: 'close-press' })
		);

		await openLaw();
		await fireEvent.click(screen.getByRole('button', { name: 'Close law dialog' }));
		await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
		expect(onDismissAttempt).not.toHaveBeenCalled();
	});

	test('a gesture closeOnClickOutside turns off is not a dismissal and reports nothing', async () => {
		const onAfterOpen = vi.fn();
		const { onDismissAttempt } = mount({ closeOnClickOutside: false, onAfterOpen });
		await openLaw();
		await waitFor(() => expect(onAfterOpen).toHaveBeenCalledOnce());
		await fireEvent.pointerDown(document.body);
		expect(onDismissAttempt).not.toHaveBeenCalled();
		expect(await stillOpen()).toBe(true);
	});

	test('dismissible (the default) still closes on Escape without calling onDismissAttempt', async () => {
		const { onDismissAttempt } = mount({ dismissible: true });
		await openLaw();
		await fireEvent.keyDown(window, { key: 'Escape' });
		await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
		expect(onDismissAttempt).not.toHaveBeenCalled();
	});
});

describe('Drawer dismissible={false}', () => {
	const PANEL_SIZE = 400;
	const firePointer = async (node: Element, type: string, pos: number, t: number) => {
		const event = new PointerEvent(type, {
			bubbles: true,
			cancelable: true,
			pointerId: 7,
			button: 0,
			buttons: type === 'pointerup' ? 0 : 1,
			pointerType: 'touch',
			clientX: 0,
			clientY: pos
		});
		Object.defineProperty(event, 'timeStamp', { configurable: true, value: t });
		await fireEvent(node, event);
	};

	test('a swipe that would dismiss is refused, reported, and snaps back', async () => {
		// jsdom implements no pointer capture.
		for (const name of ['setPointerCapture', 'releasePointerCapture'] as const) {
			Object.defineProperty(Element.prototype, name, {
				configurable: true,
				writable: true,
				value: () => {}
			});
		}
		Object.defineProperty(Element.prototype, 'hasPointerCapture', {
			configurable: true,
			writable: true,
			value: () => false
		});
		try {
			const onOpenChange = vi.fn();
			const onDismissAttempt = vi.fn();
			render(SwipeHarness, { props: { dismissible: false, onOpenChange, onDismissAttempt } });
			const node = document.querySelector('[role="dialog"]')?.firstElementChild
				?.firstElementChild as HTMLElement;
			for (const name of ['offsetHeight', 'offsetWidth'] as const) {
				Object.defineProperty(node, name, { configurable: true, value: PANEL_SIZE });
			}
			await firePointer(node, 'pointerdown', 0, 0);
			await firePointer(node, 'pointermove', PANEL_SIZE * 0.5, 900);
			expect(screen.getByTestId('offset').textContent).toBe(`${PANEL_SIZE * 0.5}`);
			await firePointer(node, 'pointerup', PANEL_SIZE * 0.5, 1800);

			expect(onDismissAttempt).toHaveBeenCalledExactlyOnceWith(
				expect.objectContaining({ reason: 'swipe', event: expect.any(PointerEvent) })
			);
			expect(onOpenChange).not.toHaveBeenCalled();
			await waitFor(() => expect(screen.getByTestId('offset').textContent).toBe('0'));
			expect(document.querySelector('[role="dialog"]')).toBeInTheDocument();
		} finally {
			for (const name of ['setPointerCapture', 'releasePointerCapture', 'hasPointerCapture']) {
				Reflect.deleteProperty(Element.prototype, name);
			}
		}
	});
});
