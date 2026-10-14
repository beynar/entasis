// Hover opening (MN-7): delayed hovers that ignore touch and disabled triggers, need the pointer
// still on the trigger when the delay ends, and are not set off by a trigger that merely appears
// under a resting pointer. Also the warm-up group (OV-INFRA-8).
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { tick } from 'svelte';
import { afterEach, describe, expect, test, vi } from 'vitest';
import Harness from './HoverActionHarness.test.svelte';
import DisabledAnchorHarness from '../components/DisabledAnchorHarness.test.svelte';
import NavigationKeysHarness from './NavigationKeysHarness.test.svelte';
import { HoverIntentGroup } from './hoverIntent.js';

type Props = NonNullable<Parameters<typeof Harness>[1]>;

const mount = async (props: Partial<Props> = {}) => {
	const onEnter = vi.fn();
	const onLeave = vi.fn();
	const view = render(Harness, { props: { onEnter, onLeave, ...props } });
	// Svelte's `on` attaches its listeners a microtask later.
	await tick();
	vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
	return { onEnter, onLeave, view, trigger: screen.getByRole('button', { name: /Trigger/ }) };
};

afterEach(() => {
	vi.useRealTimers();
});

const mouseEnter = async (trigger: HTMLElement, pointerType = 'mouse', at = { x: 30, y: 30 }) => {
	await fireEvent.pointerEnter(trigger, { pointerType, clientX: at.x, clientY: at.y });
	await fireEvent.mouseEnter(trigger, { clientX: at.x, clientY: at.y });
};

describe('useHoverAction', () => {
	test('opens once the delay elapses, and leaving first cancels it', async () => {
		const { onEnter, onLeave, trigger } = await mount();
		await mouseEnter(trigger);
		vi.advanceTimersByTime(99);
		expect(onEnter).not.toHaveBeenCalled();
		vi.advanceTimersByTime(1);
		expect(onEnter).toHaveBeenCalledOnce();
		await tick();
		expect(screen.getByTestId('hovered')).toHaveTextContent('true');

		await fireEvent.mouseLeave(trigger);
		expect(onLeave).toHaveBeenCalledOnce();
		await mouseEnter(trigger);
		await fireEvent.mouseLeave(trigger);
		vi.advanceTimersByTime(200);
		expect(onEnter).toHaveBeenCalledOnce();
	});

	test('a mouseout to outside the trigger cancels the pending open when mouseleave never comes', async () => {
		// Chrome can drop the trigger's mouseleave when a hovered row restyles; mouseout survives.
		const { onEnter, onLeave, trigger } = await mount();
		await mouseEnter(trigger);
		await fireEvent.mouseOut(trigger, { relatedTarget: screen.getByTestId('outside') });
		expect(onLeave).toHaveBeenCalledOnce();
		vi.advanceTimersByTime(200);
		expect(onEnter).not.toHaveBeenCalled();
		// A mouseleave that does arrive afterwards is the same leave, not a second one.
		await fireEvent.mouseLeave(trigger);
		expect(onLeave).toHaveBeenCalledOnce();
	});

	test('a mouseout between the trigger and its descendants keeps the hover', async () => {
		const { onEnter, trigger } = await mount();
		await mouseEnter(trigger);
		await fireEvent.mouseOut(trigger, { relatedTarget: screen.getByTestId('child') });
		await fireEvent.mouseOut(screen.getByTestId('child'), { relatedTarget: trigger });
		vi.advanceTimersByTime(100);
		expect(onEnter).toHaveBeenCalledOnce();
	});

	test('a touch tap’s compatibility mouseenter is not a hover; a mouse or pen hover is', async () => {
		const { onEnter, onLeave, trigger } = await mount({ delay: 0 });
		await fireEvent.pointerDown(trigger, { pointerType: 'touch' });
		await mouseEnter(trigger, 'touch');
		await fireEvent.mouseLeave(trigger);
		expect(onEnter).not.toHaveBeenCalled();
		expect(onLeave).not.toHaveBeenCalled();

		await mouseEnter(trigger, 'pen', { x: 31, y: 31 });
		expect(onEnter).toHaveBeenCalledOnce();
		await fireEvent.mouseLeave(trigger);
		await mouseEnter(trigger, 'mouse', { x: 32, y: 32 });
		expect(onEnter).toHaveBeenCalledTimes(2);
	});

	test.each([
		['disabled', { disabled: true }],
		['aria-disabled', { ariaDisabled: true }],
		['data-disabled', { dataDisabled: '' }]
	])('a %s trigger never opens', async (_name, props) => {
		const { onEnter, trigger } = await mount(props);
		await mouseEnter(trigger);
		vi.advanceTimersByTime(200);
		expect(onEnter).not.toHaveBeenCalled();
	});

	test('a trigger disabled while the delay runs does not open, and data-disabled="false" is enabled', async () => {
		const { onEnter, trigger, view } = await mount({ dataDisabled: 'false' });
		await mouseEnter(trigger);
		await view.rerender({ disabled: true });
		vi.advanceTimersByTime(200);
		expect(onEnter).not.toHaveBeenCalled();
		await view.rerender({ disabled: false });
		await fireEvent.mouseLeave(trigger);
		await mouseEnter(trigger, 'mouse', { x: 40, y: 40 });
		vi.advanceTimersByTime(100);
		expect(onEnter).toHaveBeenCalledOnce();
	});

	test('skipDisabled: false lets a disabled trigger open (tooltips)', async () => {
		const { onEnter, trigger } = await mount({ ariaDisabled: true, skipDisabled: false });
		await mouseEnter(trigger);
		vi.advanceTimersByTime(100);
		expect(onEnter).toHaveBeenCalledOnce();
	});

	test('a trigger that appears under a resting pointer waits for the pointer to move', async () => {
		const { onEnter, trigger } = await mount();
		// The pointer last moved to (40, 40); the trigger then shows up beneath it.
		await fireEvent.pointerMove(window, { clientX: 40, clientY: 40 });
		await mouseEnter(trigger, 'mouse', { x: 40, y: 40 });
		vi.advanceTimersByTime(500);
		expect(onEnter).not.toHaveBeenCalled();
		// Moving on it is a hover, delay included.
		await fireEvent.mouseMove(trigger, { clientX: 41, clientY: 40 });
		vi.advanceTimersByTime(99);
		expect(onEnter).not.toHaveBeenCalled();
		vi.advanceTimersByTime(1);
		expect(onEnter).toHaveBeenCalledOnce();
	});

	test('a pointer that travelled onto the trigger opens it as usual', async () => {
		const { onEnter, trigger } = await mount();
		await fireEvent.pointerMove(window, { clientX: 10, clientY: 40 });
		await mouseEnter(trigger, 'mouse', { x: 40, y: 40 });
		vi.advanceTimersByTime(100);
		expect(onEnter).toHaveBeenCalledOnce();
	});

	test('an owner inactive when the pointer arrives starts nothing', async () => {
		const { onEnter, trigger, view } = await mount({ active: false });
		await mouseEnter(trigger);
		await view.rerender({ active: true });
		await fireEvent.mouseMove(trigger, { clientX: 35, clientY: 35 });
		vi.advanceTimersByTime(300);
		expect(onEnter).not.toHaveBeenCalled();
	});

	test('a warm group skips the delay, and an open owner keeps its group warm', async () => {
		const group = new HoverIntentGroup();
		const { onEnter, trigger, view } = await mount({ group });
		await mouseEnter(trigger);
		expect(onEnter).not.toHaveBeenCalled();
		vi.advanceTimersByTime(100);
		expect(onEnter).toHaveBeenCalledOnce();
		await fireEvent.mouseLeave(trigger);

		await view.rerender({ open: true });
		expect(group.isWarm()).toBe(true);
		await mouseEnter(trigger, 'mouse', { x: 50, y: 50 });
		expect(onEnter).toHaveBeenCalledTimes(2);

		await view.rerender({ open: false });
		expect(group.lastClosedAt).not.toBeNull();
		vi.advanceTimersByTime(group.windowMs);
		expect(group.isWarm()).toBe(false);
	});

	test('a submenu trigger enabled after mounting hover-opens', async () => {
		vi.useRealTimers();
		const view = render(DisabledAnchorHarness, { props: { scenario: 'menu', disabled: true } });
		await tick();
		const trigger = screen.getByRole('menuitem', { name: 'Disabled submenu' });
		await mouseEnter(trigger);
		expect(trigger).toHaveAttribute('aria-expanded', 'false');
		await view.rerender({ scenario: 'menu', disabled: false });
		await fireEvent.mouseLeave(trigger);
		await mouseEnter(trigger, 'mouse', { x: 60, y: 60 });
		await vi.waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'true'));
	});

	test('a menu reopened under a resting pointer does not open the submenu that lands beneath it', async () => {
		vi.useRealTimers();
		render(NavigationKeysHarness, {
			props: {
				scenario: 'popup',
				items: [
					{ type: 'option', title: 'New file' },
					{
						type: 'submenu',
						title: 'Share',
						delay: 0,
						menu: [{ type: 'option', title: 'Copy link' }]
					}
				]
			}
		});
		await tick();
		// The pointer rests at (50, 50); the menu then opens from the keyboard and its Share row
		// lands under the pointer, which the browser reports as an enter at that same point.
		await fireEvent.pointerMove(window, { clientX: 50, clientY: 50 });
		await fireEvent.click(screen.getByRole('button', { name: 'Open' }));
		const share = await screen.findByRole('menuitem', { name: 'Share' });
		await mouseEnter(share, 'mouse', { x: 50, y: 50 });
		await new Promise((resolve) => setTimeout(resolve, 150));
		expect(share).toHaveAttribute('aria-expanded', 'false');
		expect(screen.queryByRole('menuitem', { name: 'Copy link' })).toBeNull();

		// Moving the pointer over it is a hover.
		await fireEvent.mouseMove(share, { clientX: 52, clientY: 50 });
		await vi.waitFor(() => expect(share).toHaveAttribute('aria-expanded', 'true'));
	});
});
