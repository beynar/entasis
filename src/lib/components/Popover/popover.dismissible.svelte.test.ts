// `dismissible={false}` on Popover: Escape, outside presses, the Android Back gesture and focus
// moving away are refused and reported to `onDismissAttempt` (never to `onOpenChange`), while the
// trigger, the panel's own controls and code still close it.
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { describe, expect, test, vi } from 'vitest';
import PopoverDismissHarness from './PopoverDismissHarness.test.svelte';
import { closeWatchers } from '$lib/testing/jsdom.test-helper.js';

type Props = NonNullable<Parameters<typeof PopoverDismissHarness>[1]>;
const ANDROID =
	'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Mobile Safari/537.36';
const settle = () => new Promise((resolve) => setTimeout(resolve, 30));
const button = (name: string) => screen.getByRole('button', { name });
const isOpen = () => button('Open popover').getAttribute('aria-expanded') === 'true';

const mount = async (props: Props = {}) => {
	const onOpenChange = vi.fn();
	const onDismissAttempt = vi.fn();
	render(PopoverDismissHarness, { props: { onOpenChange, onDismissAttempt, ...props } });
	await fireEvent.click(button('Open popover'), { detail: 1 });
	await waitFor(() => expect(isOpen()).toBe(true));
	await settle();
	onOpenChange.mockClear();
	return { onOpenChange, onDismissAttempt };
};

describe('Popover dismissible={false}', () => {
	test('Escape is refused, reported to onDismissAttempt only, and left untouched', async () => {
		const { onOpenChange, onDismissAttempt } = await mount();
		const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
		window.dispatchEvent(event);
		expect(onDismissAttempt).toHaveBeenCalledExactlyOnceWith(
			expect.objectContaining({ reason: 'escape-key', event })
		);
		expect(onOpenChange).not.toHaveBeenCalled();
		expect(event.defaultPrevented).toBe(false);
		await settle();
		expect(isOpen()).toBe(true);
	});

	test('an outside press is refused and reported', async () => {
		const { onOpenChange, onDismissAttempt } = await mount();
		await fireEvent.pointerDown(document.body);
		expect(onDismissAttempt).toHaveBeenCalledExactlyOnceWith(
			expect.objectContaining({ reason: 'outside-press' })
		);
		expect(onOpenChange).not.toHaveBeenCalled();
		await settle();
		expect(isOpen()).toBe(true);
	});

	test('focus moving away is refused and reported', async () => {
		const { onOpenChange, onDismissAttempt } = await mount();
		screen.getByLabelText('Inside field').focus();
		await settle();
		button('Page control').focus();
		await waitFor(() =>
			expect(onDismissAttempt).toHaveBeenCalledWith(
				expect.objectContaining({ reason: 'focus-out' })
			)
		);
		expect(onOpenChange).not.toHaveBeenCalled();
		expect(isOpen()).toBe(true);
	});

	test('the Android Back gesture is refused on a modal popover and reported', async () => {
		vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(ANDROID);
		const { onOpenChange, onDismissAttempt } = await mount({ modal: true });
		await waitFor(() => expect(closeWatchers.active.length).toBe(1));
		expect(closeWatchers.requestClose()).toBe(false);
		expect(onDismissAttempt).toHaveBeenCalledExactlyOnceWith(
			expect.objectContaining({ reason: 'close-watcher' })
		);
		expect(onOpenChange).not.toHaveBeenCalled();
		await settle();
		expect(isOpen()).toBe(true);
	});

	test('the trigger and a control inside the panel still close it', async () => {
		const { onOpenChange, onDismissAttempt } = await mount();
		await fireEvent.click(button('Done'));
		await waitFor(() => expect(isOpen()).toBe(false));
		expect(onOpenChange).toHaveBeenLastCalledWith(
			false,
			expect.objectContaining({ reason: 'close-press' })
		);

		await fireEvent.click(button('Open popover'), { detail: 1 });
		await waitFor(() => expect(isOpen()).toBe(true));
		await fireEvent.click(button('Open popover'), { detail: 1 });
		await waitFor(() => expect(isOpen()).toBe(false));
		expect(onDismissAttempt).not.toHaveBeenCalled();
	});

	test('a gesture closeOnClickOutside turns off reports nothing', async () => {
		const { onDismissAttempt } = await mount({ closeOnClickOutside: false });
		await fireEvent.pointerDown(document.body);
		await settle();
		expect(onDismissAttempt).not.toHaveBeenCalled();
		expect(isOpen()).toBe(true);
	});

	test('a dismissible popover (the default) closes on Escape without onDismissAttempt', async () => {
		const { onDismissAttempt } = await mount({ dismissible: true });
		await fireEvent.keyDown(window, { key: 'Escape' });
		await waitFor(() => expect(isOpen()).toBe(false));
		expect(onDismissAttempt).not.toHaveBeenCalled();
	});
});
