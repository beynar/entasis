import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/svelte';
import { describe, expect, test, vi } from 'vitest';
import ConfirmationHarness from './ConfirmationHarness.test.svelte';
import { confirmation } from './confirmation.state.svelte.js';

type RejectionListener = (reason: unknown) => void;
// Node's process, typed locally: the project ships no Node ambient types.
const nodeProcess = (
	globalThis as unknown as {
		process: {
			listeners(event: 'unhandledRejection'): RejectionListener[];
			removeAllListeners(event: 'unhandledRejection'): void;
			on(event: 'unhandledRejection', listener: RejectionListener): void;
		};
	}
).process;

/** Runs `body` while unhandled rejections go to `listener` instead of failing the run. */
const withUnhandledRejections = async (listener: RejectionListener, body: () => Promise<void>) => {
	const previous = nodeProcess.listeners('unhandledRejection');
	nodeProcess.removeAllListeners('unhandledRejection');
	nodeProcess.on('unhandledRejection', listener);
	try {
		await body();
	} finally {
		nodeProcess.removeAllListeners('unhandledRejection');
		for (const restore of previous) nodeProcess.on('unhandledRejection', restore);
	}
};

const ask = (onConfirm?: () => unknown) =>
	confirmation({
		title: 'Delete project',
		description: 'This cannot be undone.',
		confirm: 'Delete',
		cancel: 'Keep',
		onConfirm
	});

describe('Confirmation', () => {
	test('a11y:confirmation.alertdialog renders an alertdialog named by its title', async () => {
		render(ConfirmationHarness);
		void ask();
		const dialog = await screen.findByRole('alertdialog');
		expect(dialog).toHaveAttribute('aria-modal', 'true');
		expect(dialog).toHaveAccessibleName('Delete project');
		expect(dialog).toHaveAccessibleDescription('This cannot be undone.');
		await fireEvent.click(screen.getByRole('button', { name: 'Keep' }));
	});

	test("a button's own onclick runs first, and preventDefault keeps the question open", async () => {
		render(ConfirmationHarness);
		const onConfirm = vi.fn();
		const guard = vi.fn((event: MouseEvent) => event.preventDefault());
		const answer = confirmation({
			title: 'Delete project',
			description: 'This cannot be undone.',
			confirm: { text: 'Delete', onclick: guard },
			cancel: 'Keep',
			onConfirm
		});
		await screen.findByRole('alertdialog');

		await fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
		await new Promise((resolve) => setTimeout(resolve, 20));
		expect(guard).toHaveBeenCalledOnce();
		expect(onConfirm).not.toHaveBeenCalled();
		expect(screen.getByRole('alertdialog')).toBeInTheDocument();

		await fireEvent.click(screen.getByRole('button', { name: 'Keep' }));
		await expect(answer).resolves.toEqual({ confirmed: false });
	});

	test('a rejected onConfirm ends loading and keeps the dialog open, so Cancel still answers', async () => {
		render(ConfirmationHarness);
		const failure = new Error('Network down');
		let rejectAction: (reason: unknown) => void = () => {};
		const onConfirm = vi.fn(
			() =>
				new Promise((_, reject) => {
					rejectAction = reject;
				})
		);
		const pending = ask(onConfirm);
		const settled = vi.fn();
		void pending.then(settled);
		await screen.findByRole('alertdialog');
		const cancel = screen.getByRole('button', { name: 'Keep' });

		const unhandled = vi.fn();
		await withUnhandledRejections(unhandled, async () => {
			await fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
			expect(onConfirm).toHaveBeenCalledOnce();
			await waitFor(() => expect(cancel).toBeDisabled());

			rejectAction(failure);
			// The error still surfaces like any event handler's.
			await waitFor(() => expect(unhandled).toHaveBeenCalledWith(failure, expect.anything()));
		});

		await waitFor(() => expect(cancel).not.toBeDisabled());
		expect(screen.getByRole('alertdialog')).toBeInTheDocument();
		expect(settled).not.toHaveBeenCalled();

		await fireEvent.click(cancel);
		await expect(pending).resolves.toEqual({ confirmed: false, result: undefined });
	});

	test('a resolved onConfirm closes the dialog and returns its result', async () => {
		render(ConfirmationHarness);
		const pending = ask(async () => 'deleted');
		await screen.findByRole('alertdialog');
		await fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
		await expect(pending).resolves.toEqual({ confirmed: true, result: 'deleted' });
		await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
	});

	test('a synchronously throwing onConfirm keeps the dialog open with Cancel enabled', async () => {
		render(ConfirmationHarness);
		const failure = new Error('Invalid state');
		const onConfirm = vi.fn(() => {
			throw failure;
		});
		const pending = ask(onConfirm);
		const settled = vi.fn();
		void pending.then(settled);
		await screen.findByRole('alertdialog');
		const cancel = screen.getByRole('button', { name: 'Keep' });

		const unhandled = vi.fn();
		await withUnhandledRejections(unhandled, async () => {
			await fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
			expect(onConfirm).toHaveBeenCalledOnce();
			await waitFor(() => expect(unhandled).toHaveBeenCalledWith(failure, expect.anything()));
		});

		expect(cancel).not.toBeDisabled();
		expect(screen.getByRole('alertdialog')).toBeInTheDocument();
		expect(settled).not.toHaveBeenCalled();

		await fireEvent.click(cancel);
		await expect(pending).resolves.toEqual({ confirmed: false, result: undefined });
	});

	test('unmounting the host while an accepted onConfirm runs still reports the confirmation', async () => {
		const { unmount } = render(ConfirmationHarness);
		let finishAction: (value: string) => void = () => {};
		const pending = ask(
			() =>
				new Promise<string>((resolve) => {
					finishAction = resolve;
				})
		);
		const settled = vi.fn();
		void pending.then(settled);
		await screen.findByRole('alertdialog');
		await fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
		await waitFor(() => expect(screen.getByRole('button', { name: 'Keep' })).toBeDisabled());

		// The action navigates away, which unmounts the host before the action finishes.
		unmount();
		await Promise.resolve();
		expect(settled).not.toHaveBeenCalled();

		finishAction('deleted');
		await expect(pending).resolves.toEqual({ confirmed: true, result: 'deleted' });
	});

	test('an accepted onConfirm that rejects after the host unmounted settles as declined', async () => {
		const { unmount } = render(ConfirmationHarness);
		const failure = new Error('Network down');
		let rejectAction: (reason: unknown) => void = () => {};
		const pending = ask(
			() =>
				new Promise((_, reject) => {
					rejectAction = reject;
				})
		);
		await screen.findByRole('alertdialog');
		await fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
		await waitFor(() => expect(screen.getByRole('button', { name: 'Keep' })).toBeDisabled());
		unmount();

		const unhandled = vi.fn();
		await withUnhandledRejections(unhandled, async () => {
			rejectAction(failure);
			// Nobody is left to retry or cancel, so the request ends as declined.
			await expect(pending).resolves.toEqual({ confirmed: false, result: undefined });
			await waitFor(() => expect(unhandled).toHaveBeenCalledWith(failure, expect.anything()));
		});
	});

	test('unmounting the host settles its open requests as declined', async () => {
		const { unmount } = render(ConfirmationHarness);
		const pending = ask();
		await screen.findByRole('alertdialog');
		unmount();
		await expect(pending).resolves.toEqual({ confirmed: false, result: undefined });
	});

	test('a11y:confirmation.escape-cancels Escape answers the question as declined and closes it', async () => {
		render(ConfirmationHarness);
		const onConfirm = vi.fn();
		const pending = ask(onConfirm);
		await screen.findByRole('alertdialog');

		await fireEvent.keyDown(window, { key: 'Escape' });
		await expect(pending).resolves.toEqual({ confirmed: false, result: undefined });
		expect(onConfirm).not.toHaveBeenCalled();
		await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
	});

	test('Escape does nothing while the confirmed action is running', async () => {
		render(ConfirmationHarness);
		let finishAction: (value: string) => void = () => {};
		const pending = ask(
			() =>
				new Promise<string>((resolve) => {
					finishAction = resolve;
				})
		);
		const settled = vi.fn();
		void pending.then(settled);
		await screen.findByRole('alertdialog');
		await fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
		await waitFor(() => expect(screen.getByRole('button', { name: 'Keep' })).toBeDisabled());

		const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
		window.dispatchEvent(event);
		await new Promise((resolve) => setTimeout(resolve, 30));
		expect(screen.getByRole('alertdialog')).toBeInTheDocument();
		expect(settled).not.toHaveBeenCalled();
		// A refused Escape stays available to whatever else handles it.
		expect(event.defaultPrevented).toBe(false);

		finishAction('deleted');
		await expect(pending).resolves.toEqual({ confirmed: true, result: 'deleted' });
	});

	test('an outside press leaves the question open', async () => {
		render(ConfirmationHarness);
		const pending = ask();
		const dialog = await screen.findByRole('alertdialog');
		await new Promise((resolve) => setTimeout(resolve, 50));
		await fireEvent.pointerDown(document.body);
		await new Promise((resolve) => setTimeout(resolve, 30));
		expect(dialog).toBeInTheDocument();
		await fireEvent.click(screen.getByRole('button', { name: 'Keep' }));
		await expect(pending).resolves.toEqual({ confirmed: false, result: undefined });
	});

	test('the only controls are the two answers: no close button, visible or hidden', async () => {
		render(ConfirmationHarness);
		void ask();
		const dialog = await screen.findByRole('alertdialog');
		expect(
			within(dialog)
				.getAllByRole('button')
				.map((button) => button.textContent?.trim())
		).toEqual(['Keep', 'Delete']);
		await fireEvent.click(screen.getByRole('button', { name: 'Keep' }));
	});
});
