// Laws for `inline` popovers: the panel stays in normal document flow instead of portaling to
// the viewport-fixed layer, so docs and visual-stress pages can show an open panel statically.
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { describe, expect, test, vi } from 'vitest';
import PopoverInlineHarness from './PopoverInlineHarness.test.svelte';
import PopoverTriggerHarness from './PopoverTriggerHarness.test.svelte';
import PopoverAnchorHarness from './PopoverAnchorHarness.test.svelte';

describe('popover inline', () => {
	test('a11y:popover.inline-in-flow renders the panel inside the component parent, not portaled', async () => {
		render(PopoverInlineHarness, { props: { inline: true, open: true } });
		const panel = await screen.findByRole('button', { name: 'Inside popover' });
		const host = screen.getByTestId('host');
		// The panel lives where the component sits…
		expect(host.contains(panel)).toBe(true);
		// …and nothing was portaled to the body.
		expect(document.body.querySelector(':scope > dialog')).toBeNull();
		expect([...document.querySelectorAll('dialog')].every((el) => host.contains(el))).toBe(true);
	});

	test('a11y:popover.inline-in-flow a floating popover still portals out of the parent', async () => {
		render(PopoverInlineHarness, { props: { inline: false, open: true } });
		const panel = await screen.findByRole('button', { name: 'Inside popover' });
		const host = screen.getByTestId('host');
		await waitFor(() => expect(host.contains(panel)).toBe(false));
		expect(document.body.querySelector(':scope > dialog')).not.toBeNull();
	});
});

describe('popover positionPanel', () => {
	test('places the panel where the callback says, with the panel and the reference', async () => {
		const positionPanel = vi.fn(() => ({ x: 12, y: 34 }));
		render(PopoverInlineHarness, { props: { open: true, positionPanel } });
		const panel = await screen.findByRole('button', { name: 'Inside popover' });
		const dialog = panel.closest('dialog')!;
		await waitFor(() => expect(dialog.style.left).toBe('12px'));
		expect(dialog.style.top).toBe('34px');
		expect(dialog.style.position).toBe('fixed');
		expect(positionPanel).toHaveBeenCalledWith({
			panel: dialog,
			reference: screen.getByRole('button', { name: 'Open popover' })
		});
	});

	test('null falls back to the floating-ui placement', async () => {
		const positionPanel = vi.fn(() => null);
		render(PopoverInlineHarness, { props: { open: true, positionPanel } });
		const panel = await screen.findByRole('button', { name: 'Inside popover' });
		const dialog = panel.closest('dialog')!;
		await waitFor(() => expect(dialog.style.visibility).toBe(''));
		expect(positionPanel).toHaveBeenCalled();
		expect(dialog.style.left).not.toBe('12px');
	});
});

describe('Popover triggers', () => {
	test('popover.trigger makes any element a keyboard-reachable trigger', async () => {
		render(PopoverTriggerHarness);
		const profile = screen.getByTestId('profile');
		expect(profile).toHaveAttribute('role', 'button');
		expect(profile).toHaveAttribute('tabindex', '0');
		expect(profile).toHaveAttribute('aria-expanded', 'false');

		await fireEvent.click(profile);
		await waitFor(() => expect(profile).toHaveAttribute('aria-expanded', 'true'));
		expect(screen.getByText('Profile details')).toBeInTheDocument();

		await fireEvent.keyDown(profile, { key: 'Enter' });
		await waitFor(() => expect(profile).toHaveAttribute('aria-expanded', 'false'));
		await fireEvent.keyDown(profile, { key: ' ' });
		await waitFor(() => expect(profile).toHaveAttribute('aria-expanded', 'true'));
	});

	test("the element's own click handler wins over popover.trigger's default toggle", async () => {
		render(PopoverTriggerHarness);
		// Let the deferred default run before judging the state it would have flipped.
		const settle = () => new Promise((resolve) => setTimeout(resolve, 10));

		const legacy = screen.getByRole('button', { name: 'Legacy' });
		await fireEvent.click(legacy);
		await settle();
		expect(legacy).toHaveAttribute('aria-expanded', 'true');

		const opener = screen.getByRole('button', { name: 'Opener' });
		await fireEvent.click(opener);
		await settle();
		await fireEvent.click(opener);
		await settle();
		expect(opener).toHaveAttribute('aria-expanded', 'true');
	});

	test('an object trigger renders children instead of plain text', () => {
		render(PopoverTriggerHarness);
		const button = screen.getByRole('button', { name: 'Rich body' });
		expect(button.querySelector('strong')).toHaveTextContent('Rich');
	});
});

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('Popover hover', () => {
	test('openOnHover waits for delay before opening', async () => {
		render(PopoverAnchorHarness, { props: { openOnHover: true, delay: 150 } });
		const trigger = screen.getByRole('button', { name: 'Anchor trigger' });
		await fireEvent.mouseEnter(trigger);
		await sleep(60);
		expect(trigger).toHaveAttribute('aria-expanded', 'false');
		expect(screen.queryByRole('button', { name: 'Inside popover' })).toBeNull();
		await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'true'));
		expect(screen.getByRole('button', { name: 'Inside popover' })).toBeInTheDocument();
	});

	test('leaving the trigger before the delay cancels the hover open', async () => {
		render(PopoverAnchorHarness, { props: { openOnHover: true, delay: 80 } });
		const trigger = screen.getByRole('button', { name: 'Anchor trigger' });
		await fireEvent.mouseEnter(trigger);
		await sleep(20);
		await fireEvent.mouseLeave(trigger);
		await sleep(120);
		expect(trigger).toHaveAttribute('aria-expanded', 'false');
	});

	test('without a delay prop the hover open waits the 100 ms default', async () => {
		render(PopoverAnchorHarness, { props: { openOnHover: true } });
		const trigger = screen.getByRole('button', { name: 'Anchor trigger' });
		await fireEvent.mouseEnter(trigger);
		await sleep(50);
		expect(trigger).toHaveAttribute('aria-expanded', 'false');
		await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'true'));
	});

	test('a click that closes the popover during a pending hover open keeps it closed', async () => {
		render(PopoverAnchorHarness, { props: { openOnHover: true, delay: 100 } });
		const trigger = screen.getByRole('button', { name: 'Anchor trigger' });
		// The pointer arrives, then clicks open and closed again before the hover delay elapses.
		await fireEvent.mouseEnter(trigger);
		await fireEvent.click(trigger);
		expect(trigger).toHaveAttribute('aria-expanded', 'true');
		await fireEvent.click(trigger);
		expect(trigger).toHaveAttribute('aria-expanded', 'false');
		await sleep(180);
		expect(trigger).toHaveAttribute('aria-expanded', 'false');
	});

	test('re-entering an open popover’s trigger and clicking it closed keeps it closed', async () => {
		render(PopoverAnchorHarness, { props: { openOnHover: true, delay: 100 } });
		const trigger = screen.getByRole('button', { name: 'Anchor trigger' });
		await fireEvent.click(trigger);
		expect(trigger).toHaveAttribute('aria-expanded', 'true');
		// Into the panel and back onto the trigger, then a click to close.
		await fireEvent.mouseLeave(trigger);
		await fireEvent.mouseEnter(trigger);
		await fireEvent.click(trigger);
		expect(trigger).toHaveAttribute('aria-expanded', 'false');
		await sleep(180);
		expect(trigger).toHaveAttribute('aria-expanded', 'false');
	});

	test('a popover that starts open still opens on hover once closed', async () => {
		render(PopoverAnchorHarness, { props: { openOnHover: true, delay: 20, defaultOpen: true } });
		const trigger = screen.getByRole('button', { name: 'Anchor trigger' });
		await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'true'));
		await fireEvent.click(trigger);
		await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'false'));
		await fireEvent.mouseLeave(trigger);
		await fireEvent.mouseEnter(trigger);
		await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'true'));
	});
});

describe('Popover anchor lifetime', () => {
	test('unmounting the trigger closes the popover and reports it once', async () => {
		const onOpenChange = vi.fn();
		const { rerender } = render(PopoverAnchorHarness, { props: { onOpenChange } });
		await fireEvent.click(screen.getByRole('button', { name: 'Anchor trigger' }));
		await screen.findByRole('button', { name: 'Inside popover' });
		expect(onOpenChange).toHaveBeenLastCalledWith(true);

		await rerender({ onOpenChange, showTrigger: false });
		await waitFor(() => expect(onOpenChange).toHaveBeenLastCalledWith(false));
		await waitFor(() =>
			expect(screen.queryByRole('button', { name: 'Inside popover' })).toBeNull()
		);
		await sleep(20);
		expect(onOpenChange.mock.calls.filter(([open]) => open === false)).toHaveLength(1);
	});

	test('a trigger swapped for a new element keeps the popover open on the new one', async () => {
		const onOpenChange = vi.fn();
		const { rerender } = render(PopoverAnchorHarness, { props: { onOpenChange } });
		await fireEvent.click(screen.getByRole('button', { name: 'Anchor trigger' }));
		await screen.findByRole('button', { name: 'Inside popover' });
		const first = screen.getByRole('button', { name: 'Anchor trigger' });

		await rerender({ onOpenChange, triggerKey: 1 });
		await sleep(20);
		const second = screen.getByRole('button', { name: 'Anchor trigger' });
		expect(second).not.toBe(first);
		expect(onOpenChange).not.toHaveBeenCalledWith(false);
		expect(screen.getByRole('button', { name: 'Inside popover' })).toBeInTheDocument();
		await waitFor(() => expect(second).toHaveAttribute('aria-expanded', 'true'));
	});

	test('unmounting the whole popover does not report a close', async () => {
		const onOpenChange = vi.fn();
		const { rerender } = render(PopoverAnchorHarness, { props: { onOpenChange } });
		await fireEvent.click(screen.getByRole('button', { name: 'Anchor trigger' }));
		await screen.findByRole('button', { name: 'Inside popover' });

		await rerender({ onOpenChange, showPopover: false });
		await sleep(20);
		expect(onOpenChange).not.toHaveBeenCalledWith(false);
	});

	test('unmounting the trigger closes a mobile sheet popover', async () => {
		const onOpenChange = vi.fn();
		const { rerender } = render(PopoverAnchorHarness, {
			props: { onOpenChange, mobileSheet: true }
		});
		await fireEvent.click(screen.getByRole('button', { name: 'Anchor trigger' }));
		await screen.findByRole('button', { name: 'Inside popover' });

		await rerender({ onOpenChange, mobileSheet: true, showTrigger: false });
		await waitFor(() => expect(onOpenChange).toHaveBeenLastCalledWith(false));
		await waitFor(() =>
			expect(screen.queryByRole('button', { name: 'Inside popover' })).toBeNull()
		);
		await sleep(20);
		expect(onOpenChange.mock.calls.filter(([open]) => open === false)).toHaveLength(1);
	});

	test('unmounting the trigger closes an inline popover', async () => {
		const onOpenChange = vi.fn();
		const { rerender } = render(PopoverAnchorHarness, { props: { onOpenChange, inline: true } });
		await fireEvent.click(screen.getByRole('button', { name: 'Anchor trigger' }));
		await screen.findByRole('button', { name: 'Inside popover' });

		await rerender({ onOpenChange, inline: true, showTrigger: false });
		await waitFor(() => expect(onOpenChange).toHaveBeenLastCalledWith(false));
		await waitFor(() =>
			expect(screen.queryByRole('button', { name: 'Inside popover' })).toBeNull()
		);
		await sleep(20);
		expect(onOpenChange.mock.calls.filter(([open]) => open === false)).toHaveLength(1);
	});

	test('a bind:this ref that unmounts closes the popover, which stays closed when it returns', async () => {
		const onOpenChange = vi.fn();
		const { rerender } = render(PopoverAnchorHarness, { props: { onOpenChange, boundRef: true } });
		await screen.findByRole('button', { name: 'Inside bound popover' });

		// Svelte resets the bound ref to null; with zero-duration transitions the panel leaves
		// in the same flush, before any floating-ui observer could notice the detached anchor.
		await rerender({ onOpenChange, boundRef: true, showAnchor: false });
		await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
		expect(screen.queryByRole('button', { name: 'Inside bound popover' })).toBeNull();

		await rerender({ onOpenChange, boundRef: true, showAnchor: true });
		await screen.findByTestId('bound-anchor');
		await sleep(20);
		expect(screen.queryByRole('button', { name: 'Inside bound popover' })).toBeNull();
		expect(onOpenChange.mock.calls.filter(([open]) => open === false)).toHaveLength(1);
	});

	test('a ref element that leaves the document closes the popover anchored to it', async () => {
		const onOpenChange = vi.fn();
		render(PopoverAnchorHarness, { props: { onOpenChange, externalRef: true } });
		await screen.findByRole('button', { name: 'Inside anchored popover' });

		screen.getByTestId('anchor').remove();
		// floating-ui's autoUpdate re-runs on resize; the reference is gone, so it closes.
		window.dispatchEvent(new Event('resize'));
		await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
		await waitFor(() =>
			expect(screen.queryByRole('button', { name: 'Inside anchored popover' })).toBeNull()
		);
	});
});
