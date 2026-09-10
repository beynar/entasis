import '@testing-library/jest-dom/vitest';
import { render, waitFor } from '@testing-library/svelte';
import { describe, expect, test, vi } from 'vitest';
import Overlay from './Overlay.svelte';

describe('Overlay disclosure state', () => {
	test('waits for active animations before reporting the lifecycle transition', async () => {
		const onAfterOpen = vi.fn();
		const props = { open: false, title: 'Animated overlay', onAfterOpen };
		const { container, rerender } = render(Overlay, { props });
		const overlay = container.querySelector('[data-svelai-overlay]');
		let finishAnimation: (() => void) | undefined;
		const finished = new Promise<void>((resolve) => {
			finishAnimation = resolve;
		});
		Object.defineProperty(overlay, 'getAnimations', {
			value: () => [{ finished }]
		});

		await rerender({ ...props, open: true });
		expect(onAfterOpen).not.toHaveBeenCalled();
		finishAnimation?.();
		await waitFor(() => expect(onAfterOpen).toHaveBeenCalledOnce());
	});

	test('uses defaultOpen only as the initial uncontrolled state', () => {
		const { container } = render(Overlay, {
			props: {
				defaultOpen: false,
				title: 'Hidden overlay'
			}
		});

		expect(container.querySelector('[data-svelai-overlay]')).toHaveAttribute('data-open', 'false');
	});

	test('keeps external state changes silent and reports settled lifecycle', async () => {
		const onOpenChange = vi.fn();
		const onAfterOpen = vi.fn();
		const onAfterClose = vi.fn();
		const props = {
			open: false,
			title: 'Controlled overlay',
			onOpenChange,
			onAfterOpen,
			onAfterClose
		};
		const { rerender } = render(Overlay, { props });

		await rerender({ ...props, open: true });
		await waitFor(() => expect(onAfterOpen).toHaveBeenCalledOnce());
		expect(onOpenChange).not.toHaveBeenCalled();

		await rerender({ ...props, open: false });
		await waitFor(() => expect(onAfterClose).toHaveBeenCalledOnce());
		expect(onOpenChange).not.toHaveBeenCalled();
	});
});
