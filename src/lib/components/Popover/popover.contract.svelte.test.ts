// How a popover was opened (MN-4), the trigger contract and handler composition (CX-4), and the
// wrapper of a non-dialog popup (MN-10).
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { describe, expect, test, vi } from 'vitest';
import PopoverContractHarness from './PopoverContractHarness.test.svelte';

type Props = Parameters<typeof PopoverContractHarness>[1];
const mount = (scenario: Props['scenario'], props: Omit<Props, 'scenario'> = {}) =>
	render(PopoverContractHarness, { props: { scenario, ...props } });
const settle = () => new Promise((resolve) => setTimeout(resolve, 20));
const button = (name: string) => screen.getByRole('button', { name });
const escape = () => fireEvent.keyDown(window, { key: 'Escape' });
// A pointer click: jsdom's default `detail: 0` is what Enter or a screen reader produce.
const pointerClick = (element: HTMLElement) => fireEvent.click(element, { detail: 1 });

describe('how the popover was opened (MN-4)', () => {
	test('hovering opens with openReason hover; pressing the trigger then pins it open', async () => {
		const onOpenChange = vi.fn();
		mount('hover', { onOpenChange });
		await fireEvent.mouseEnter(button('Hover trigger'));
		await waitFor(() => expect(screen.getByTestId('reason')).toHaveTextContent('hover'));
		expect(onOpenChange).toHaveBeenLastCalledWith(
			true,
			expect.objectContaining({
				reason: 'trigger-hover',
				interaction: 'mouse',
				event: expect.any(MouseEvent)
			})
		);
		expect(document.documentElement).not.toHaveAttribute('data-entasis-scroll-lock');

		await pointerClick(button('Hover trigger'));
		await settle();
		expect(screen.getByTestId('reason')).toHaveTextContent('press');
		expect(button('Hover trigger')).toHaveAttribute('aria-expanded', 'true');
		expect(onOpenChange).toHaveBeenCalledOnce();
		// Pinned by the press, it now locks scroll like any pressed-open popover.
		await waitFor(() =>
			expect(document.documentElement).toHaveAttribute('data-entasis-scroll-lock')
		);
	});

	test('open() from the click handler of a hover-opened popup pins it too (a submenu trigger)', async () => {
		const onOpenChange = vi.fn();
		mount('hover-open-call', { onOpenChange });
		await fireEvent.mouseEnter(button('Submenu trigger'));
		await waitFor(() => expect(screen.getByTestId('reason')).toHaveTextContent('hover'));

		await pointerClick(button('Submenu trigger'));
		await settle();

		expect(screen.getByTestId('reason')).toHaveTextContent('press');
		expect(onOpenChange).toHaveBeenCalledOnce();
		// Pinned, the pointer leaving no longer closes it.
		await fireEvent.mouseLeave(button('Submenu trigger'));
		await fireEvent.mouseMove(document.body, { clientX: 900, clientY: 900 });
		await settle();
		expect(screen.getByTestId('reason')).toBeInTheDocument();
	});

	test('a pointer press reports press, a keyboard activation keyboard', async () => {
		mount('hover');
		await pointerClick(button('Hover trigger'));
		await waitFor(() => expect(screen.getByTestId('reason')).toHaveTextContent('press'));
		await pointerClick(button('Hover trigger'));
		await waitFor(() => expect(screen.queryByTestId('reason')).toBeNull());
		await fireEvent.click(button('Hover trigger'), { detail: 0 });
		await waitFor(() => expect(screen.getByTestId('reason')).toHaveTextContent('keyboard'));
	});

	test('an open state set from outside is programmatic, and focus goes back to its opener', async () => {
		const onOpenChange = vi.fn();
		mount('programmatic', { onOpenChange });
		const opener = button('Open from elsewhere');
		opener.focus();
		await fireEvent.click(opener);
		const inside = await screen.findByRole('button', { name: 'Inside programmatic' });
		expect(screen.getByTestId('reason')).toHaveTextContent('programmatic');
		await waitFor(() => expect(document.activeElement).toBe(inside));

		await escape();
		await waitFor(() =>
			expect(screen.queryByRole('button', { name: 'Inside programmatic' })).toBeNull()
		);
		expect(document.activeElement).toBe(opener);
		expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(
			false,
			expect.objectContaining({ reason: 'escape-key' })
		);
	});
});

describe('trigger contract (CX-4)', () => {
	test('a wrapper trigger hands focus back to the control pressed inside it', async () => {
		mount('wrapper-trigger');
		const country = button('Country');
		country.focus();
		await pointerClick(country);
		const search = await screen.findByRole('textbox', { name: 'Search countries' });
		await waitFor(() => expect(document.activeElement).toBe(search));

		await fireEvent.keyDown(search, { key: 'Escape' });
		await waitFor(() =>
			expect(screen.queryByRole('textbox', { name: 'Search countries' })).toBeNull()
		);
		expect(document.activeElement).toBe(country);
	});

	test('a press the trigger refuses (a loading Button) opens nothing', async () => {
		const onOpenChange = vi.fn();
		mount('loading-trigger', { onOpenChange });
		const share = button('Share');
		await pointerClick(share);
		share.focus();
		await fireEvent.keyDown(share, { key: 'Enter' });
		await fireEvent.click(share, { detail: 0 });
		await settle();
		expect(onOpenChange).not.toHaveBeenCalled();
		expect(screen.queryByRole('button', { name: 'Inside loading' })).toBeNull();
	});

	test("a snippet trigger's own onclick that calls preventDefault cancels the toggle", async () => {
		const onOpenChange = vi.fn();
		mount('prevented-snippet', { onOpenChange });
		await pointerClick(button('Guarded'));
		await settle();
		expect(onOpenChange).not.toHaveBeenCalled();
		expect(screen.queryByRole('button', { name: 'Inside guarded' })).toBeNull();
	});

	test('the pressed trigger anchors the panel; pressing another one moves it there', async () => {
		const onOpenChange = vi.fn();
		mount('two-triggers', { onOpenChange });
		await pointerClick(button('First'));
		await waitFor(() => expect(screen.getByTestId('anchor')).toHaveTextContent('First'));
		expect(button('First')).toHaveAttribute('aria-expanded', 'true');
		expect(button('Second')).toHaveAttribute('aria-expanded', 'false');
		expect(onOpenChange).toHaveBeenLastCalledWith(
			true,
			expect.objectContaining({ reason: 'trigger-press', trigger: button('First') })
		);

		await pointerClick(button('Second'));
		await waitFor(() => expect(screen.getByTestId('anchor')).toHaveTextContent('Second'));
		expect(button('Second')).toHaveAttribute('aria-expanded', 'true');
		expect(button('First')).toHaveAttribute('aria-expanded', 'false');
		expect(onOpenChange).toHaveBeenCalledOnce();
	});

	test('removing the trigger that opened it closes it, though another trigger remains', async () => {
		const onOpenChange = vi.fn();
		const { rerender } = mount('two-triggers', { onOpenChange });
		await pointerClick(button('Second'));
		await screen.findByTestId('anchor');

		await rerender({ secondPresent: false });
		await waitFor(() => expect(screen.queryByTestId('anchor')).toBeNull());
		expect(onOpenChange).toHaveBeenLastCalledWith(
			false,
			expect.objectContaining({ reason: 'trigger-unmount' })
		);
	});

	test('removing another trigger leaves the popover open', async () => {
		const onOpenChange = vi.fn();
		const { rerender } = mount('two-triggers', { onOpenChange });
		await pointerClick(button('First'));
		await screen.findByTestId('anchor');

		await rerender({ secondPresent: false });
		await settle();
		expect(screen.getByTestId('anchor')).toHaveTextContent('First');
		expect(onOpenChange).toHaveBeenCalledOnce();
	});
});

describe('cancelling an open change (CX-1)', () => {
	test('a cancelled trigger press keeps the popover closed', async () => {
		const onOpenChange = vi.fn((_open: boolean, details: { cancel(): void }) => details.cancel());
		mount('two-triggers', { onOpenChange, secondPresent: false });
		await pointerClick(button('First'));
		await settle();

		expect(onOpenChange).toHaveBeenCalledOnce();
		expect(onOpenChange).toHaveBeenCalledWith(
			true,
			expect.objectContaining({ reason: 'trigger-press', trigger: button('First') })
		);
		expect(screen.queryByTestId('anchor')).toBeNull();
		expect(button('First')).toHaveAttribute('aria-expanded', 'false');
	});

	test('a cancelled outside press keeps it open; the next one closes it', async () => {
		const onOpenChange = vi.fn((open: boolean, details: { reason: string; cancel(): void }) => {
			if (!open && onOpenChange.mock.calls.length === 2) details.cancel();
		});
		mount('two-triggers', { onOpenChange, secondPresent: false });
		await pointerClick(button('First'));
		await screen.findByTestId('anchor');

		await fireEvent.pointerDown(screen.getByTestId('outside'));
		await fireEvent.click(screen.getByTestId('outside'));
		await settle();
		expect(onOpenChange).toHaveBeenLastCalledWith(
			false,
			expect.objectContaining({ reason: 'outside-press' })
		);
		expect(screen.getByTestId('anchor')).toBeInTheDocument();

		await fireEvent.pointerDown(screen.getByTestId('outside'));
		await fireEvent.click(screen.getByTestId('outside'));
		await waitFor(() => expect(screen.queryByTestId('anchor')).toBeNull());
		expect(onOpenChange).toHaveBeenCalledTimes(3);
	});
});

describe('non-dialog popups (MN-10)', () => {
	test('a menu popup renders a plain wrapper; aria-controls points at the menu, labelled by the trigger', async () => {
		mount('menu');
		const trigger = button('Actions');
		await pointerClick(trigger);
		const menu = await screen.findByRole('menu');
		expect(document.querySelector('dialog')).toBeNull();
		await waitFor(() => expect(trigger).toHaveAttribute('aria-controls', menu.id));
		expect(menu.id).not.toBe('');
		expect(menu).toHaveAttribute('aria-labelledby', trigger.id);
		expect(menu).toHaveAccessibleName('Actions');
	});

	test('a PopupMenu trigger controls its role="menu" element, which it names', async () => {
		mount('popup-menu');
		const trigger = button('File');
		await pointerClick(trigger);
		const menu = await screen.findByRole('menu');
		expect(menu.closest('dialog')).toBeNull();
		await waitFor(() => expect(trigger).toHaveAttribute('aria-controls', menu.id));
		expect(menu).toHaveAccessibleName('File');
	});
});
