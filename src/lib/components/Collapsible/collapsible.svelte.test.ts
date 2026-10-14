import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { tick } from 'svelte';
import { describe, expect, test, vi } from 'vitest';
import { mockRect } from '$lib/testing/jsdom.test-helper.js';
import CollapsibleHarness from './CollapsibleHarness.test.svelte';

const noMotion = { in: { duration: 0 }, out: { duration: 0 } };
const trigger = () => screen.getByRole('button', { name: 'Details' });
const panel = () => document.querySelector<HTMLElement>('[id$="-content"]');
const settle = () => new Promise((resolve) => setTimeout(resolve, 20));

// What the browser dispatches on a `hidden="until-found"` element when find-in-page matches inside.
const findInPage = (target: Element) => {
	const found = target.closest('[hidden]') ?? target;
	return fireEvent(found, new Event('beforematch', { bubbles: true }));
};

describe('Collapsible closed content', () => {
	test('is not in the DOM, so it cannot be read, tabbed to or found', () => {
		render(CollapsibleHarness);
		expect(screen.queryByText('Closed secret')).toBeNull();
		expect(screen.queryByRole('link', { name: 'Secret link' })).toBeNull();
		expect(panel()).toBeNull();
		// Nothing for aria-controls to point at while closed.
		expect(trigger()).not.toHaveAttribute('aria-controls');
		expect(trigger()).toHaveAttribute('aria-expanded', 'false');
	});

	test('open content is linked from the trigger', async () => {
		render(CollapsibleHarness);
		await fireEvent.click(trigger());
		expect(trigger()).toHaveAttribute('aria-expanded', 'true');
		expect(trigger().getAttribute('aria-controls')).toBe(panel()!.id);
		expect(screen.getByText('Closed secret')).toBeVisible();
		expect(panel()).toHaveAttribute('data-open', '');
	});

	test('keepMounted hides the closed content from assistive technology and the tab order', async () => {
		render(CollapsibleHarness, { keepMounted: true, transition: noMotion });
		expect(panel()).toHaveAttribute('hidden', '');
		expect(screen.queryByRole('link', { name: 'Secret link' })).toBeNull();
		expect(screen.getByText('Closed secret')).not.toBeVisible();
		expect(trigger().getAttribute('aria-controls')).toBe(panel()!.id);

		await fireEvent.click(trigger());
		expect(panel()).not.toHaveAttribute('hidden');
		expect(screen.getByRole('link', { name: 'Secret link' })).toBeVisible();
	});

	test('keepMounted keeps what the user typed across a close', async () => {
		render(CollapsibleHarness, { keepMounted: true, transition: noMotion, defaultOpen: true });
		await fireEvent.input(screen.getByRole('textbox', { name: 'Secret field' }), {
			target: { value: 'draft' }
		});
		await fireEvent.click(trigger());
		await settle();
		expect(panel()).toHaveAttribute('hidden', '');
		await fireEvent.click(trigger());
		expect(screen.getByRole('textbox', { name: 'Secret field' })).toHaveValue('draft');
	});
});

describe('Collapsible hiddenUntilFound', () => {
	test('keeps the closed content in the DOM under hidden="until-found", out of the a11y tree', () => {
		render(CollapsibleHarness, { hiddenUntilFound: true });
		expect(panel()).toHaveAttribute('hidden', 'until-found');
		expect(screen.getByText('Closed secret')).toBeInTheDocument();
		expect(screen.queryByRole('link', { name: 'Secret link' })).toBeNull();
		expect(trigger()).toHaveAttribute('aria-expanded', 'false');
	});

	test('find-in-page opens it at once and reports one change with the find-in-page reason', async () => {
		const onOpenChange = vi.fn();
		const onAfterOpen = vi.fn();
		render(CollapsibleHarness, { hiddenUntilFound: true, onOpenChange, onAfterOpen });
		await findInPage(screen.getByText('Closed secret'));
		await tick();

		expect(onOpenChange).toHaveBeenCalledOnce();
		expect(onOpenChange).toHaveBeenCalledWith(
			true,
			expect.objectContaining({ reason: 'find-in-page', interaction: 'programmatic' })
		);
		expect(trigger()).toHaveAttribute('aria-expanded', 'true');
		expect(panel()).not.toHaveAttribute('hidden');
		// The reveal plays no animation and still reports its end once.
		expect(panel()!.style.overflow).toBe('');
		await waitFor(() => expect(onAfterOpen).toHaveBeenCalledOnce());
		await settle();
		expect(onAfterOpen).toHaveBeenCalledOnce();
	});

	test('cancelling the open-change keeps it closed', async () => {
		const onOpenChange = vi.fn((_open: boolean, details: { cancel(): void }) => details.cancel());
		render(CollapsibleHarness, { hiddenUntilFound: true, onOpenChange });
		await findInPage(screen.getByText('Closed secret'));
		await waitFor(() => expect(panel()).toHaveAttribute('hidden', 'until-found'));
		expect(trigger()).toHaveAttribute('aria-expanded', 'false');
	});
});

describe('Collapsible disabled with hiddenUntilFound', () => {
	test('is not findable and find-in-page never opens it', async () => {
		const onOpenChange = vi.fn();
		render(CollapsibleHarness, { hiddenUntilFound: true, disabled: true, onOpenChange });
		const hidden = screen.getByText('Closed secret').closest('[hidden]')!;
		expect(hidden).toHaveAttribute('hidden', '');
		await fireEvent(hidden, new Event('beforematch', { bubbles: true }));
		await settle();
		expect(onOpenChange).not.toHaveBeenCalled();
		expect(trigger()).toHaveAttribute('aria-expanded', 'false');
	});
});

describe('Collapsible onOpenChange', () => {
	test('runs before the state changes with the press reason, the event and the trigger', async () => {
		let expandedInside: string | null = null;
		const onOpenChange = vi.fn(() => {
			expandedInside = trigger().getAttribute('aria-expanded');
		});
		render(CollapsibleHarness, { onOpenChange });
		await fireEvent.click(trigger());
		expect(expandedInside).toBe('false');
		expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(
			true,
			expect.objectContaining({
				reason: 'trigger-press',
				trigger: trigger(),
				event: expect.any(MouseEvent)
			})
		);
		expect(trigger()).toHaveAttribute('aria-expanded', 'true');
	});

	test('cancel() keeps it closed', async () => {
		const onOpenChange = vi.fn((_open: boolean, details: { cancel(): void }) => details.cancel());
		render(CollapsibleHarness, { onOpenChange });
		await fireEvent.click(trigger());
		expect(onOpenChange).toHaveBeenCalledOnce();
		expect(trigger()).toHaveAttribute('aria-expanded', 'false');
		expect(panel()).toBeNull();
	});

	test('a disabled collapsible does not ask', async () => {
		const onOpenChange = vi.fn();
		render(CollapsibleHarness, { disabled: true, onOpenChange });
		await fireEvent.click(trigger());
		expect(onOpenChange).not.toHaveBeenCalled();
	});
});

describe('Collapsible onAfterOpen and onAfterClose', () => {
	test('fire once each when no animation plays', async () => {
		const onAfterOpen = vi.fn();
		const onAfterClose = vi.fn();
		render(CollapsibleHarness, { onAfterOpen, onAfterClose, transition: noMotion });
		await fireEvent.click(trigger());
		expect(onAfterOpen).toHaveBeenCalledOnce();
		expect(onAfterClose).not.toHaveBeenCalled();
		await fireEvent.click(trigger());
		await settle();
		expect(onAfterClose).toHaveBeenCalledOnce();
		expect(onAfterOpen).toHaveBeenCalledOnce();
		expect(panel()).toBeNull();
	});

	test('fire after the animation, once, and not for the initial state', async () => {
		const onAfterOpen = vi.fn();
		const onAfterClose = vi.fn();
		render(CollapsibleHarness, { onAfterOpen, onAfterClose, defaultOpen: true });
		await settle();
		expect(onAfterOpen).not.toHaveBeenCalled();
		await fireEvent.click(trigger());
		await waitFor(() => expect(onAfterClose).toHaveBeenCalledOnce());
		await fireEvent.click(trigger());
		await waitFor(() => expect(onAfterOpen).toHaveBeenCalledOnce());
		await settle();
		expect(onAfterOpen).toHaveBeenCalledOnce();
		expect(onAfterClose).toHaveBeenCalledOnce();
	});

	test('the peek variant reports its changes too, once', async () => {
		const onAfterOpen = vi.fn();
		const onAfterClose = vi.fn();
		render(CollapsibleHarness, {
			variant: 'peek',
			onAfterOpen,
			onAfterClose,
			transition: noMotion
		});
		await fireEvent.click(trigger());
		await waitFor(() => expect(onAfterOpen).toHaveBeenCalledOnce());
		await fireEvent.click(trigger());
		await waitFor(() => expect(onAfterClose).toHaveBeenCalledOnce());
		await settle();
		expect(onAfterOpen).toHaveBeenCalledOnce();
		expect(onAfterClose).toHaveBeenCalledOnce();
	});
});

describe('Collapsible peek variant', () => {
	test('closed, controls below the visible preview are inert and reachable again once open', async () => {
		render(CollapsibleHarness, { variant: 'peek', transition: noMotion });
		const clip = document.querySelector<HTMLElement>('[id$="-content"]')!;
		const near = screen.getByRole('link', { name: 'Secret link' });
		const field = screen.getByRole('textbox', { name: 'Secret field' });
		const far = screen.getByRole('link', { name: 'Far link' });
		mockRect(clip, { y: 0, width: 300, height: 80 });
		mockRect(near, { y: 10, width: 100, height: 20 });
		mockRect(field, { y: 100, width: 100, height: 20 });
		mockRect(far, { y: 160, width: 100, height: 20 });

		// The preview height changes, which re-reads the layout.
		await fireEvent.click(trigger());
		await fireEvent.click(trigger());
		await waitFor(() => expect(far).toHaveAttribute('inert'));
		expect(near).not.toHaveAttribute('inert');
		expect(field).toHaveAttribute('inert');

		await fireEvent.click(trigger());
		await waitFor(() => expect(far).not.toHaveAttribute('inert'));
		expect(field).not.toHaveAttribute('inert');
	});
});
