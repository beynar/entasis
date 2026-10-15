import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { afterEach, describe, expect, test, vi } from 'vitest';
import TooltipComponentHarness from './TooltipComponentHarness.test.svelte';
import TooltipLawHarness from './TooltipLawHarness.test.svelte';
import TooltipOptionsHarness from './TooltipOptionsHarness.test.svelte';
import TooltipTriggerHarness from './TooltipTriggerHarness.test.svelte';

// jsdom has no focus ring: tests say whether the browser would show one.
const matches = Element.prototype.matches;
const showFocusRing = (shown: () => boolean = () => true) =>
	vi.spyOn(Element.prototype, 'matches').mockImplementation(function (
		this: Element,
		selector: string
	) {
		return selector === ':focus-visible' ? shown() : matches.call(this, selector);
	});
afterEach(() => vi.restoreAllMocks());
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const button = (name: string) => screen.getByRole('button', { name });

describe('Tooltip lifecycle', () => {
	test('retains the close callback until the tooltip has finished closing', async () => {
		const onAfterOpen = vi.fn();
		const onAfterClose = vi.fn();
		render(TooltipLawHarness, { props: { onAfterOpen, onAfterClose } });
		const trigger = screen.getByRole('button', { name: 'Tooltip trigger' });
		await fireEvent.mouseEnter(trigger);
		await waitFor(() => expect(onAfterOpen).toHaveBeenCalledOnce());
		expect(screen.getByRole('tooltip')).toHaveTextContent('Tooltip content');
		expect(onAfterClose).not.toHaveBeenCalled();

		await fireEvent.mouseLeave(trigger);
		await waitFor(() => expect(onAfterClose).toHaveBeenCalledOnce());
		expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
	});
});

describe('Tooltip component', () => {
	test('opens on hover of a snippet trigger and renders its content', async () => {
		render(TooltipComponentHarness);
		const trigger = screen.getByRole('button', { name: 'Tooltip trigger' });
		expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

		await fireEvent.mouseEnter(trigger);
		await waitFor(() => expect(screen.getByRole('tooltip')).toHaveTextContent('Tooltip content'));

		await fireEvent.mouseLeave(trigger);
		await waitFor(() => expect(screen.queryByRole('tooltip')).not.toBeInTheDocument());
	});

	test('renders the tooltip immediately when open is true', async () => {
		render(TooltipComponentHarness, { props: { open: true } });
		await waitFor(() => expect(screen.getByRole('tooltip')).toHaveTextContent('Tooltip content'));
	});

	test('reports hover-driven visibility through onOpenChange', async () => {
		const onOpenChange = vi.fn();
		render(TooltipComponentHarness, { props: { onOpenChange } });
		const trigger = screen.getByRole('button', { name: 'Tooltip trigger' });

		await fireEvent.mouseEnter(trigger);
		await waitFor(() =>
			expect(onOpenChange).toHaveBeenCalledWith(
				true,
				expect.objectContaining({ reason: 'trigger-hover', trigger })
			)
		);

		await fireEvent.mouseLeave(trigger);
		await waitFor(() =>
			expect(onOpenChange).toHaveBeenCalledWith(
				false,
				expect.objectContaining({ reason: 'trigger-hover' })
			)
		);
	});
});

describe('Tooltip triggers', () => {
	test('a snippet trigger the browser cannot focus joins the tab order and shows on focus', async () => {
		render(TooltipTriggerHarness);
		const hint = screen.getByTestId('hint');
		expect(hint).toHaveAttribute('tabindex', '0');
		showFocusRing();
		await fireEvent.focusIn(hint);
		await waitFor(() => expect(screen.getByRole('tooltip')).toHaveTextContent('An explanation'));
	});

	test('an object trigger renders children instead of plain text', () => {
		render(TooltipTriggerHarness);
		const button = screen.getByRole('button', { name: 'Rich trigger' });
		expect(button.querySelector('em')).toHaveTextContent('Rich');
	});
});

describe('Tooltip open-change details', () => {
	test('a cancelled open leaves the tooltip closed', async () => {
		const onOpenChange = vi.fn((open: boolean, details: { cancel(): void }) => {
			if (open) details.cancel();
		});
		render(TooltipComponentHarness, { props: { onOpenChange } });
		await fireEvent.mouseEnter(button('Tooltip trigger'));
		await wait(30);
		expect(onOpenChange).toHaveBeenCalledWith(true, expect.anything());
		expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
	});

	test('Escape reports escape-key and a cancelled close keeps the tooltip open', async () => {
		let cancel = true;
		const onOpenChange = vi.fn((open: boolean, details: { cancel(): void }) => {
			if (!open && cancel) details.cancel();
		});
		render(TooltipComponentHarness, { props: { onOpenChange } });
		await fireEvent.mouseEnter(button('Tooltip trigger'));
		await screen.findByRole('tooltip');

		await fireEvent.keyDown(window, { key: 'Escape' });
		await wait(30);
		expect(onOpenChange).toHaveBeenLastCalledWith(
			false,
			expect.objectContaining({ reason: 'escape-key' })
		);
		expect(screen.getByRole('tooltip')).toBeInTheDocument();

		cancel = false;
		await fireEvent.keyDown(window, { key: 'Escape' });
		await waitFor(() => expect(screen.queryByRole('tooltip')).not.toBeInTheDocument());
	});
});

describe('Tooltip focus (DF-6)', () => {
	test('focus without a focus ring does not open the tooltip', async () => {
		showFocusRing(() => false);
		render(TooltipOptionsHarness);
		await fireEvent.focusIn(button('First'));
		await wait(30);
		expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
	});

	test('keyboard focus opens it with the trigger-focus reason and blur closes it', async () => {
		showFocusRing();
		const onOpenChange = vi.fn();
		render(TooltipOptionsHarness, { props: { first: { onOpenChange } } });
		await fireEvent.focusIn(button('First'));
		await screen.findByRole('tooltip');
		expect(onOpenChange).toHaveBeenCalledWith(
			true,
			expect.objectContaining({ reason: 'trigger-focus', interaction: 'keyboard' })
		);
		await fireEvent.focusOut(button('First'));
		await waitFor(() => expect(screen.queryByRole('tooltip')).not.toBeInTheDocument());
	});

	test('focus that returns with the window does not open it', async () => {
		showFocusRing();
		render(TooltipOptionsHarness);
		const trigger = button('First');
		trigger.focus();
		await screen.findByRole('tooltip');
		await fireEvent.focusOut(trigger);
		await fireEvent.blur(window);
		await waitFor(() => expect(screen.queryByRole('tooltip')).not.toBeInTheDocument());
		// The window's focus and the trigger's own arrive in one task.
		window.dispatchEvent(new Event('focus'));
		trigger.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
		await wait(30);
		expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
		// A later move onto the trigger is the user's again.
		await fireEvent.focusOut(trigger);
		await fireEvent.focusIn(trigger);
		await screen.findByRole('tooltip');
	});
});

describe('Tooltip state that outlives the surface', () => {
	test('the pointer left on content that went away does not hold the next tooltip open', async () => {
		showFocusRing();
		render(TooltipOptionsHarness);
		const trigger = button('First');
		await fireEvent.mouseEnter(trigger);
		await fireEvent.mouseLeave(trigger);
		await fireEvent.mouseEnter(await screen.findByRole('tooltip'));
		// Focus leaves the trigger while the pointer is on the content: it goes without a mouseleave.
		await fireEvent.focusIn(trigger);
		await fireEvent.focusOut(trigger);
		await waitFor(() => expect(screen.queryByRole('tooltip')).not.toBeInTheDocument());

		await fireEvent.mouseEnter(trigger);
		await screen.findByRole('tooltip');
		await fireEvent.mouseLeave(trigger);
		await waitFor(() => expect(screen.queryByRole('tooltip')).not.toBeInTheDocument(), {
			timeout: 1000
		});
	});

	test('closing the surface lets go of it without a proxy identity warning', async () => {
		const warn = vi.spyOn(console, 'warn');
		render(TooltipOptionsHarness);
		const trigger = button('First');
		await fireEvent.mouseEnter(trigger);
		const closed = await screen.findByRole('tooltip');
		await fireEvent.mouseLeave(trigger);
		await waitFor(() => expect(screen.queryByRole('tooltip')).not.toBeInTheDocument(), {
			timeout: 1000
		});

		await fireEvent.mouseEnter(trigger);
		await waitFor(() => expect(screen.getByRole('tooltip')).toHaveAttribute('data-open'));
		expect(screen.getByRole('tooltip')).not.toBe(closed);
		expect(
			warn.mock.calls.some((call) => String(call[0]).includes('state_proxy_equality_mismatch'))
		).toBe(false);
	});

	test('a click from code on a trigger nobody focused does not keep keyboard focus from the tooltip', async () => {
		showFocusRing();
		render(TooltipOptionsHarness);
		const trigger = button('First');
		trigger.click();
		await fireEvent.focusIn(trigger);
		await screen.findByRole('tooltip');
	});
});

describe('Tooltip closeOnClick and disabled (DF-7)', () => {
	test('a press closes it and hovering in place does not reopen it', async () => {
		const onOpenChange = vi.fn();
		render(TooltipOptionsHarness, { props: { first: { onOpenChange } } });
		const trigger = button('First');
		await fireEvent.mouseEnter(trigger);
		await screen.findByRole('tooltip');

		await fireEvent.pointerDown(trigger, { pointerType: 'mouse', button: 0 });
		await waitFor(() => expect(screen.queryByRole('tooltip')).not.toBeInTheDocument());
		expect(onOpenChange).toHaveBeenLastCalledWith(
			false,
			expect.objectContaining({ reason: 'trigger-press' })
		);
		await fireEvent.mouseEnter(trigger);
		await wait(30);
		expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

		await fireEvent.mouseLeave(trigger);
		await fireEvent.pointerEnter(trigger, { pointerType: 'mouse' });
		await fireEvent.mouseEnter(trigger);
		await screen.findByRole('tooltip');
	});

	test('closeOnClick false leaves it open after a press', async () => {
		render(TooltipOptionsHarness, { props: { first: { closeOnClick: false } } });
		const trigger = button('First');
		await fireEvent.mouseEnter(trigger);
		await screen.findByRole('tooltip');
		await fireEvent.pointerDown(trigger, { pointerType: 'mouse', button: 0 });
		await fireEvent.click(trigger, { detail: 1 });
		await wait(30);
		expect(screen.getByRole('tooltip')).toBeInTheDocument();
		// A press elsewhere still dismisses it.
		await fireEvent.pointerDown(button('After'), { pointerType: 'mouse', button: 0 });
		await waitFor(() => expect(screen.queryByRole('tooltip')).not.toBeInTheDocument());
	});

	test('keyboard activation closes it too', async () => {
		showFocusRing();
		render(TooltipOptionsHarness);
		const trigger = button('First');
		trigger.focus();
		await screen.findByRole('tooltip');
		await fireEvent.click(trigger, { detail: 0 });
		await waitFor(() => expect(screen.queryByRole('tooltip')).not.toBeInTheDocument());
	});

	test('a disabled tooltip opens on neither hover nor focus', async () => {
		showFocusRing();
		render(TooltipOptionsHarness, { props: { first: { disabled: true } } });
		await fireEvent.mouseEnter(button('First'));
		await fireEvent.focusIn(button('First'));
		await wait(30);
		expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
		expect(button('First')).not.toHaveAttribute('aria-describedby');
	});

	test('disabling an open tooltip closes it and drops aria-describedby', async () => {
		const { rerender } = render(TooltipComponentHarness);
		const trigger = button('Tooltip trigger');
		await fireEvent.mouseEnter(trigger);
		await screen.findByRole('tooltip');
		expect(trigger).toHaveAttribute('aria-describedby');

		await rerender({ options: { disabled: true } });
		await waitFor(() => expect(screen.queryByRole('tooltip')).not.toBeInTheDocument());
		expect(trigger).not.toHaveAttribute('aria-describedby');
		await fireEvent.mouseLeave(trigger);
		await fireEvent.mouseEnter(trigger);
		await wait(30);
		expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
	});
});

describe('Tooltip without a mouseleave', () => {
	// A trigger re-rendered or removed under the pointer may never send `mouseleave`.
	test('a pointer move away from the trigger and content closes a hover tooltip', async () => {
		render(TooltipOptionsHarness);
		const trigger = button('First');
		await fireEvent.mouseEnter(trigger);
		await screen.findByRole('tooltip');

		await fireEvent.pointerMove(button('After'));
		await waitFor(() => expect(screen.queryByRole('tooltip')).not.toBeInTheDocument());

		// The stale hover is dropped: hovering again opens it again. (jsdom puts every event at 0,0,
		// so the enter reads as a resting pointer and waits for a move on the trigger.)
		await fireEvent.mouseEnter(trigger);
		await fireEvent.mouseMove(trigger);
		expect(await screen.findByRole('tooltip')).toHaveTextContent('First content');
	});

	test('moves on the trigger or onto the content keep it open', async () => {
		render(TooltipOptionsHarness);
		const trigger = button('First');
		await fireEvent.mouseEnter(trigger);
		const tooltip = await screen.findByRole('tooltip');
		await fireEvent.pointerMove(trigger);
		await fireEvent.pointerMove(tooltip);
		await wait(250);
		expect(screen.getByRole('tooltip')).toBe(tooltip);
	});

	test('a trigger removed while its tooltip shows closes it on the next move', async () => {
		render(TooltipOptionsHarness);
		const trigger = button('First');
		await fireEvent.mouseEnter(trigger);
		await screen.findByRole('tooltip');
		trigger.remove();

		await fireEvent.pointerMove(document.body);
		await waitFor(() => expect(screen.queryByRole('tooltip')).not.toBeInTheDocument());
	});

	test('a tooltip opened by keyboard focus ignores pointer moves elsewhere', async () => {
		showFocusRing();
		render(TooltipOptionsHarness);
		await fireEvent.focusIn(button('First'));
		await screen.findByRole('tooltip');
		await fireEvent.pointerMove(button('After'));
		await wait(250);
		expect(screen.getByRole('tooltip')).toBeInTheDocument();
	});
});

describe('Tooltip hoverable content (TT-1)', () => {
	test('stays open while the pointer is over the content, closes when it leaves', async () => {
		render(TooltipOptionsHarness);
		const trigger = button('First');
		await fireEvent.mouseEnter(trigger);
		const tooltip = await screen.findByRole('tooltip');
		await fireEvent.mouseLeave(trigger);
		await fireEvent.mouseEnter(tooltip);
		await wait(250);
		expect(screen.getByRole('tooltip')).toBe(tooltip);

		await fireEvent.mouseLeave(tooltip);
		await waitFor(() => expect(screen.queryByRole('tooltip')).not.toBeInTheDocument());
	});

	test('returning to the trigger before the grace ends keeps it open', async () => {
		render(TooltipOptionsHarness);
		const trigger = button('First');
		await fireEvent.mouseEnter(trigger);
		await screen.findByRole('tooltip');
		await fireEvent.mouseLeave(trigger);
		await wait(40);
		await fireEvent.mouseEnter(trigger);
		await wait(250);
		expect(screen.getByRole('tooltip')).toBeInTheDocument();
	});

	test('hoverable false closes at once and lets the pointer through the content', async () => {
		render(TooltipOptionsHarness, { props: { first: { hoverable: false } } });
		const trigger = button('First');
		await fireEvent.mouseEnter(trigger);
		const tooltip = await screen.findByRole('tooltip');
		expect(tooltip.style.pointerEvents).toBe('none');
		await fireEvent.mouseLeave(trigger);
		await waitFor(() => expect(screen.queryByRole('tooltip')).not.toBeInTheDocument(), {
			timeout: 90
		});
	});
});

describe('Tooltip handoff and closeDelay (DF-8)', () => {
	test('moving to the next trigger keeps the surface and swaps the content', async () => {
		const afterFirst = { onAfterOpen: vi.fn(), onAfterClose: vi.fn() };
		const afterSecond = { onAfterOpen: vi.fn(), onAfterClose: vi.fn() };
		const firstChange = vi.fn();
		render(TooltipOptionsHarness, {
			props: {
				first: { ...afterFirst, onOpenChange: firstChange },
				second: afterSecond
			}
		});
		await fireEvent.mouseEnter(button('First'));
		const surface = await screen.findByRole('tooltip');
		expect(surface).toHaveTextContent('First content');
		await waitFor(() => expect(afterFirst.onAfterOpen).toHaveBeenCalledOnce());

		await fireEvent.mouseLeave(button('First'));
		await fireEvent.mouseEnter(button('Second'));
		await waitFor(() => expect(screen.getByRole('tooltip')).toHaveTextContent('Second content'));
		// The same element: the surface was never closed and reopened.
		expect(screen.getByRole('tooltip')).toBe(surface);
		expect(surface).toHaveAttribute('data-instant');
		expect(afterFirst.onAfterClose).toHaveBeenCalledOnce();
		expect(afterSecond.onAfterOpen).toHaveBeenCalledOnce();
		expect(afterSecond.onAfterClose).not.toHaveBeenCalled();
		// The tooltip pushed off the surface hears a close it cannot cancel.
		const [open, details] = firstChange.mock.calls.at(-1)!;
		expect(open).toBe(false);
		expect(details.reason).toBe('trigger-hover');
		details.cancel();
		expect(details.isCanceled).toBe(false);
		expect(button('First')).not.toHaveAttribute('aria-describedby');
		expect(button('Second')).toHaveAttribute('aria-describedby', surface.id);
	});

	test('closeDelay waits before closing and a re-entry cancels the close', async () => {
		render(TooltipOptionsHarness, { props: { first: { closeDelay: 300, hoverable: false } } });
		const trigger = button('First');
		await fireEvent.mouseEnter(trigger);
		await screen.findByRole('tooltip');
		await fireEvent.mouseLeave(trigger);
		await wait(120);
		expect(screen.getByRole('tooltip')).toBeInTheDocument();
		await fireEvent.mouseEnter(trigger);
		await wait(300);
		expect(screen.getByRole('tooltip')).toBeInTheDocument();
		await fireEvent.mouseLeave(trigger);
		await waitFor(() => expect(screen.queryByRole('tooltip')).not.toBeInTheDocument());
	});
});
