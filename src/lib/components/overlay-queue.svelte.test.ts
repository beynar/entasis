import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/svelte';
import { describe, expect, test } from 'vitest';
import Harness from './OverlayQueueHarness.test.svelte';
import { toast } from './Toast/toast.state.svelte.js';
import { confirmation } from './Confirmation/confirmation.state.svelte.js';

describe('overlay singletons', () => {
	test('toast() queues before <Toaster /> mounts and flushes on mount', async () => {
		const queued = toast.success({ title: 'Queued toast', duration: false });
		expect(queued.toaster).toBeNull();
		render(Harness);
		await waitFor(() => expect(queued.toaster).not.toBeNull());
		expect(await screen.findByText('Queued toast')).toBeInTheDocument();
		// Toaster defaults were layered on at adoption.
		expect(queued.opts.showCloseIcon).toBe(true);
	});

	test('confirmation() queued before <Confirmation /> mounts still resolves', async () => {
		const pending = confirmation({
			title: 'Queued confirmation',
			description: 'Resolved after mount',
			confirm: 'Yes',
			cancel: 'No'
		});
		render(Harness);
		const confirm = await screen.findByRole('button', { name: 'Yes' });
		confirm.click();
		await expect(pending).resolves.toMatchObject({ confirmed: true });
	});
});
