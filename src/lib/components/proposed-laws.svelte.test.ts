// Executable entries for the proposed overlay and accessibility laws (decisions.md). Each one is a
// repro of today's behaviour and is declared `pending`: Vitest expects it to fail. The lane that
// implements the law makes it pass, which turns the run red ("Expect test to fail") until the
// lane flips `pending(` to `test(` and, when a docs chip claims the behaviour, gives it a stable
// `a11y:<component>.<law>` id. Ids stay out of pending names on purpose: the feature-chip check
// accepts any test whose name contains the id.
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { describe, expect, test, vi } from 'vitest';
import { mockNotRendered } from '$lib/testing/jsdom.test-helper.js';
import ProposedLawsHarness from './ProposedLawsHarness.test.svelte';

const pending = test.fails;

type Props = Parameters<typeof ProposedLawsHarness>[1];
const mount = (scenario: Props['scenario'], props: Omit<Props, 'scenario'> = {}) =>
	render(ProposedLawsHarness, { props: { scenario, ...props } });
const escape = () => fireEvent.keyDown(window, { key: 'Escape' });
const pressOutside = () => fireEvent.pointerDown(screen.getByTestId('outside'));

describe('law 1 · open-change details (F1 · CX-1)', () => {
	pending('onOpenChange receives the close reason and the originating event', async () => {
		const onOpenChange = vi.fn();
		mount('dialog-trigger', { onOpenChange });
		await fireEvent.click(screen.getByRole('button', { name: 'Open dialog' }));
		await screen.findByRole('dialog');
		await escape();
		expect(onOpenChange).toHaveBeenLastCalledWith(
			false,
			expect.objectContaining({ reason: 'escape-key', event: expect.any(KeyboardEvent) })
		);
	});

	pending('cancelling the change keeps the overlay open', async () => {
		mount('dialog-trigger', {
			onOpenChange: (open, details) => {
				if (!open) details?.cancel?.();
			}
		});
		await fireEvent.click(screen.getByRole('button', { name: 'Open dialog' }));
		await screen.findByRole('dialog');
		await escape();
		await new Promise((resolve) => setTimeout(resolve, 20));
		expect(screen.getByRole('dialog')).toBeInTheDocument();
	});
});

describe('law 2 · lifecycle (F1 · CX-2)', () => {
	pending(
		'a Dialog open at creation fires onAfterOpen once and dismisses on outside press',
		async () => {
			const onAfterOpen = vi.fn();
			mount('dialog-default-open', { onAfterOpen });
			await screen.findByRole('dialog');
			await waitFor(() => expect(onAfterOpen).toHaveBeenCalledOnce());
			await pressOutside();
			await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
		}
	);

	pending('an inline Popover open at creation fires onAfterOpen once', async () => {
		const onAfterOpen = vi.fn();
		mount('popover-inline-default-open', { onAfterOpen });
		await screen.findByRole('button', { name: 'Inside inline popover' });
		await waitFor(() => expect(onAfterOpen).toHaveBeenCalledOnce());
	});
});

describe('law 3 · handler composition (F1 · CX-4)', () => {
	pending('a consumer onclick that calls preventDefault cancels the built-in toggle', async () => {
		mount('popover-prevented-trigger');
		await fireEvent.click(screen.getByRole('button', { name: 'Guarded trigger' }));
		await new Promise((resolve) => setTimeout(resolve, 20));
		expect(screen.queryByRole('button', { name: 'Inside guarded popover' })).toBeNull();
	});
});

describe('law 4 · trigger contract (F1 · CX-4)', () => {
	pending('the Dialog trigger exposes aria-haspopup, aria-expanded and aria-controls', async () => {
		mount('dialog-trigger');
		const trigger = screen.getByRole('button', { name: 'Open dialog' });
		expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
		expect(trigger).toHaveAttribute('aria-expanded', 'false');
		await fireEvent.click(trigger);
		const dialog = await screen.findByRole('dialog');
		await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'true'));
		expect(trigger).toHaveAttribute('aria-controls', dialog.id);
	});
});

describe('law 5 · focus (F3 · CX-3)', () => {
	pending(
		'when the opener is gone, closing restores focus to the last element still in the page',
		async () => {
			mount('removed-opener');
			const notes = screen.getByLabelText('Notes');
			notes.focus();
			const opener = screen.getByRole('button', { name: 'Open and remove' });
			opener.focus();
			await fireEvent.click(opener);
			await screen.findByRole('dialog');
			await escape();
			await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
			await waitFor(() => expect(document.activeElement).toBe(notes));
		}
	);
});

describe('law 7 · keyboard lists (F4a · CX-7)', () => {
	// `mockNotRendered` gives the item no client rects, which is how `isTabbable` and a CSS-hidden
	// element look to the focus helpers; the real-CSS variant belongs in a `*.browser.test.ts`.
	pending('arrow keys skip an item that is not rendered', async () => {
		mount('menu');
		const [archive, copy] = screen.getAllByRole('menuitem');
		mockNotRendered(copy);
		archive.focus();
		await fireEvent.focusIn(archive);
		await fireEvent.keyDown(archive, { key: 'ArrowDown' });
		await waitFor(() => expect(document.activeElement).toHaveTextContent('Cut'));
	});
});
