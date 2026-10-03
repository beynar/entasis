import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { describe, expect, test, vi } from 'vitest';
import DialogLawHarness from './dialogLawHarness.test.svelte';
import DialogSwapHarness from './DialogSwapHarness.test.svelte';

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
		expect(onOpenChange).toHaveBeenLastCalledWith(true);
		await waitFor(() => expect(onAfterOpen).toHaveBeenCalledOnce());

		await fireEvent.click(screen.getByRole('button', { name: 'Close law dialog' }));

		expect(onOpenChange).toHaveBeenCalledTimes(2);
		expect(onOpenChange).toHaveBeenLastCalledWith(false);
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
