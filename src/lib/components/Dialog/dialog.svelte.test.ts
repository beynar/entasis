import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { describe, expect, test, vi } from 'vitest';
import DialogLawHarness from './dialogLawHarness.test.svelte';

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
