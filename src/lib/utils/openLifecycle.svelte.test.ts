// The shared open/close lifecycle (CX-2): onAfterOpen and onAfterClose fire exactly once per open
// and close, including when no transition plays.
import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/svelte';
import { tick } from 'svelte';
import { describe, expect, test, vi } from 'vitest';
import OpenLifecycleHarness from './OpenLifecycleHarness.test.svelte';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const status = () => screen.getByTestId('status').textContent;
// Past the flush and the tick after it, where a phase with no transition completes, but before
// any macrotask: jsdom's `animate` stub ends a real transition a few macrotasks later.
const settleFlush = async () => {
	await tick();
	for (let index = 0; index < 10; index += 1) await Promise.resolve();
};

describe('useOpenLifecycle', () => {
	test('a surface open at creation, which Svelte never animates, reports its open once', async () => {
		const onAfterOpen = vi.fn();
		render(OpenLifecycleHarness, { props: { open: true, duration: 50, onAfterOpen } });
		await waitFor(() => expect(onAfterOpen).toHaveBeenCalledOnce());
		expect(status()).toBe('open');
		await sleep(60);
		expect(onAfterOpen).toHaveBeenCalledOnce();
	});

	test('closed at creation reports nothing', async () => {
		const onAfterOpen = vi.fn();
		const onAfterClose = vi.fn();
		render(OpenLifecycleHarness, { props: { onAfterOpen, onAfterClose } });
		await sleep(20);
		expect(status()).toBe('closed');
		expect(onAfterOpen).not.toHaveBeenCalled();
		expect(onAfterClose).not.toHaveBeenCalled();
	});

	test('waits for a playing transition, entering → open → exiting → closed', async () => {
		const onAfterOpen = vi.fn();
		const onAfterClose = vi.fn();
		const { rerender } = render(OpenLifecycleHarness, {
			props: { duration: 50, onAfterOpen, onAfterClose }
		});
		void rerender({ open: true });
		await settleFlush();
		expect(status()).toBe('entering');
		expect(onAfterOpen).not.toHaveBeenCalled();
		await waitFor(() => expect(onAfterOpen).toHaveBeenCalledOnce());
		expect(status()).toBe('open');

		void rerender({ open: false });
		expect(status()).toBe('exiting');
		expect(screen.getByTestId('surface')).toBeInTheDocument();
		expect(onAfterClose).not.toHaveBeenCalled();
		await waitFor(() => expect(onAfterClose).toHaveBeenCalledOnce());
		expect(status()).toBe('closed');
		expect(screen.queryByTestId('surface')).toBeNull();
	});

	test('a surface with no transition completes each phase on its own', async () => {
		const onAfterOpen = vi.fn();
		const onAfterClose = vi.fn();
		const { rerender } = render(OpenLifecycleHarness, {
			props: { animated: false, onAfterOpen, onAfterClose }
		});
		await rerender({ open: true });
		await waitFor(() => expect(onAfterOpen).toHaveBeenCalledOnce());
		await rerender({ open: false });
		await waitFor(() => expect(onAfterClose).toHaveBeenCalledOnce());
		expect(status()).toBe('closed');
	});

	test('a zero-length transition still reports each phase once', async () => {
		const onAfterOpen = vi.fn();
		const onAfterClose = vi.fn();
		const { rerender } = render(OpenLifecycleHarness, { props: { onAfterOpen, onAfterClose } });
		await rerender({ open: true });
		await rerender({ open: false });
		await rerender({ open: true });
		await sleep(20);
		expect(onAfterOpen).toHaveBeenCalledTimes(2);
		expect(onAfterClose).toHaveBeenCalledOnce();
	});

	test('reopening during the exit cancels the close: no onAfterClose, one more onAfterOpen', async () => {
		const onAfterOpen = vi.fn();
		const onAfterClose = vi.fn();
		const { rerender } = render(OpenLifecycleHarness, {
			props: { duration: 80, onAfterOpen, onAfterClose }
		});
		await rerender({ open: true });
		await waitFor(() => expect(onAfterOpen).toHaveBeenCalledOnce());

		// Reopened in the same task: the exit transition is still running.
		void rerender({ open: false });
		expect(status()).toBe('exiting');
		void rerender({ open: true });
		expect(status()).toBe('entering');
		await waitFor(() => expect(onAfterOpen).toHaveBeenCalledTimes(2));
		await sleep(120);
		expect(onAfterClose).not.toHaveBeenCalled();
		expect(onAfterOpen).toHaveBeenCalledTimes(2);
		expect(status()).toBe('open');
	});
});
