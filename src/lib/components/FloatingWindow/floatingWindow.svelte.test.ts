import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { describe, expect, test, vi } from 'vitest';
import FloatingWindowHarness from './FloatingWindowHarness.test.svelte';

const mount = (props: Parameters<typeof FloatingWindowHarness>[1] = {}) =>
	render(FloatingWindowHarness, { props });

const settle = () => new Promise((resolve) => setTimeout(resolve, 30));
const closeButton = () => screen.getByRole('button', { name: /close/i });

describe('FloatingWindow open-change details and lifecycle', () => {
	test('a window open at creation reports onAfterOpen once, though no intro plays', async () => {
		const onAfterOpen = vi.fn();
		mount({ onAfterOpen });
		await waitFor(() => expect(onAfterOpen).toHaveBeenCalledOnce());
		await settle();
		expect(onAfterOpen).toHaveBeenCalledOnce();
	});

	test('the close button reports close-press with its event before the window closes', async () => {
		const onOpenChange = vi.fn();
		const onAfterClose = vi.fn();
		mount({ onOpenChange, onAfterClose });
		await fireEvent.click(closeButton());
		expect(onOpenChange).toHaveBeenCalledWith(
			false,
			expect.objectContaining({ reason: 'close-press', event: expect.any(MouseEvent) })
		);
		await waitFor(() => expect(onAfterClose).toHaveBeenCalledOnce());
	});

	test('cancel() keeps the window open and reports no close', async () => {
		const onAfterClose = vi.fn();
		mount({ onAfterClose, onOpenChange: (_open, details) => details.cancel() });
		await fireEvent.click(closeButton());
		await settle();
		expect(screen.getByRole('dialog')).toBeInTheDocument();
		expect(onAfterClose).not.toHaveBeenCalled();
	});

	test('Escape reports escape-key, and a cancelled one stays open', async () => {
		const onOpenChange = vi.fn((_open: boolean, details: { cancel(): void }) => details.cancel());
		mount({ onOpenChange });
		const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
		window.dispatchEvent(event);
		await settle();
		expect(onOpenChange).toHaveBeenCalledWith(
			false,
			expect.objectContaining({ reason: 'escape-key' })
		);
		expect(event.defaultPrevented).toBe(false);
		expect(screen.getByRole('dialog')).toBeInTheDocument();
	});

	test('minimizing to the dock and restoring report no extra onAfterOpen or onAfterClose', async () => {
		const onAfterOpen = vi.fn();
		const onAfterClose = vi.fn();
		const onOpenChange = vi.fn();
		mount({ onAfterOpen, onAfterClose, onOpenChange });
		await waitFor(() => expect(onAfterOpen).toHaveBeenCalledOnce());

		await fireEvent.click(screen.getByRole('button', { name: /minimize/i }));
		await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
		await settle();
		await fireEvent.click(screen.getAllByRole('button', { name: /restore/i })[0]);
		await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
		await settle();

		expect(onAfterOpen).toHaveBeenCalledOnce();
		expect(onAfterClose).not.toHaveBeenCalled();
		expect(onOpenChange).not.toHaveBeenCalled();
	});
});
