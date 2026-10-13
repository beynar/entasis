// Open-change reporting for ImageZoom (CX-1): every path the component drives asks onOpenChange
// first, with a reason and the event, and a cancelled change leaves the lightbox as it was.
import '@testing-library/jest-dom/vitest';
import { fireEvent, screen, waitFor } from '@testing-library/svelte';
import { describe, expect, test, vi } from 'vitest';
import { renderInTheme } from '../Theme/renderInTheme.test-helper.js';
import type { OpenChangeDetails } from '$lib/utils/openChange.js';
import ImageZoom from './ImageZoom.svelte';

const src =
	'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"></svg>';

const mount = (props: Record<string, unknown> = {}) => {
	const onOpenChange = vi.fn<(open: boolean, details: OpenChangeDetails) => void>();
	const onAfterOpen = vi.fn();
	const onAfterClose = vi.fn();
	renderInTheme(ImageZoom, {
		src,
		alt: 'Mountain',
		width: 400,
		height: 300,
		zoomWidth: 800,
		zoomHeight: 600,
		onOpenChange,
		onAfterOpen,
		onAfterClose,
		...props
	});
	const trigger = screen.getByRole('button', { name: /zoom/i });
	return { onOpenChange, onAfterOpen, onAfterClose, trigger };
};

const outer = () => document.querySelector<HTMLElement>('.lg-outer');
const isOpen = () => !!outer()?.classList.contains('lg-visible');
const settle = () => new Promise((resolve) => setTimeout(resolve, 30));
/** The `[open, reason]` pairs each `onOpenChange` call reported. */
const log = (fn: { mock: { calls: unknown[][] } }) =>
	fn.mock.calls.map(([open, details]) => [open, (details as OpenChangeDetails).reason]);

/** Presses the trigger and waits for the open animation: LightGallery ignores input until then. */
const openZoom = async (trigger: HTMLElement) => {
	await fireEvent.click(trigger);
	await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'true'));
	await new Promise((resolve) => setTimeout(resolve, 700));
};

describe('ImageZoom open changes', () => {
	test('pressing the trigger reports trigger-press with the click and the trigger', async () => {
		const { onOpenChange, trigger } = mount();
		await fireEvent.click(trigger);

		await waitFor(() => expect(onOpenChange).toHaveBeenCalledTimes(1));
		expect(onOpenChange).toHaveBeenCalledWith(
			true,
			expect.objectContaining({ reason: 'trigger-press', event: expect.any(MouseEvent), trigger })
		);
		await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'true'));
	});

	test('a cancelled trigger press keeps the zoom closed', async () => {
		const { onOpenChange, trigger } = mount();
		onOpenChange.mockImplementation((_open, details) => details.cancel());
		await fireEvent.click(trigger);
		await settle();

		expect(onOpenChange).toHaveBeenCalledTimes(1);
		expect(trigger).toHaveAttribute('aria-expanded', 'false');
		expect(isOpen()).toBe(false);
	});

	test('Escape reports escape-key once and closes; a cancelled Escape keeps it open', async () => {
		const { onOpenChange, trigger } = mount();
		await fireEvent.click(trigger);
		await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'true'));

		onOpenChange.mockImplementationOnce((_open, details) => details.cancel());
		await fireEvent.keyDown(window, { key: 'Escape' });
		await settle();
		expect(log(onOpenChange)).toEqual([
			[true, 'trigger-press'],
			[false, 'escape-key']
		]);
		expect(trigger).toHaveAttribute('aria-expanded', 'true');

		await fireEvent.keyDown(window, { key: 'Escape' });
		await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'false'));
		expect(log(onOpenChange).at(-1)).toEqual([false, 'escape-key']);
	});

	test('a click on the zoomed image reports close-press', async () => {
		const { onOpenChange, trigger } = mount();
		await openZoom(trigger);

		// LightGallery marks the zoomed image once it has loaded; jsdom never loads it.
		const image = document.querySelector('.lg-item img') as HTMLElement;
		image.classList.add('lg-object');
		await fireEvent.click(image);

		await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'false'));
		expect(onOpenChange).toHaveBeenLastCalledWith(
			false,
			expect.objectContaining({ reason: 'close-press', event: expect.any(MouseEvent) })
		);
	});

	test('a click around the image reports outside-press, and does nothing without closeOnClickOutside', async () => {
		const { onOpenChange, trigger } = mount({ closeOnClickOutside: false });
		await openZoom(trigger);

		await fireEvent.click(document.querySelector('.lg-content')!);
		await settle();
		expect(log(onOpenChange)).toEqual([[true, 'trigger-press']]);
		expect(trigger).toHaveAttribute('aria-expanded', 'true');
	});

	test('an outside click closes with outside-press, and a cancelled one keeps it open', async () => {
		const { onOpenChange, trigger } = mount();
		await openZoom(trigger);

		onOpenChange.mockImplementationOnce((_open, details) => details.cancel());
		await fireEvent.click(document.querySelector('.lg-content')!);
		await settle();
		expect(trigger).toHaveAttribute('aria-expanded', 'true');

		await fireEvent.click(document.querySelector('.lg-content')!);
		await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'false'));
		expect(log(onOpenChange)).toEqual([
			[true, 'trigger-press'],
			[false, 'outside-press'],
			[false, 'outside-press']
		]);
	});
});
