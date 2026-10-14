// Press-and-hold repetition (FD-INFRA-7): a press steps at once and repeats after a delay until
// release, cancel, a bound or `disabled`; pen behaves like mouse, touch waits for intent.
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { tick } from 'svelte';
import { afterEach, describe, expect, test, vi } from 'vitest';
import Harness from './PressAndHoldHarness.test.svelte';
import { PRESS_AND_HOLD_DELAY, PRESS_AND_HOLD_INTERVAL } from './usePressAndHold.svelte.js';

type Props = NonNullable<Parameters<typeof Harness>[1]>;

const mount = async (props: Partial<Props> = {}) => {
	const onStop = vi.fn();
	const view = render(Harness, { props: { onStop, ...props } });
	// Svelte's `on` attaches its listeners a microtask later.
	await tick();
	vi.useFakeTimers({
		toFake: ['setTimeout', 'clearTimeout']
	});
	return { onStop, view, button: screen.getByRole('button', { name: 'Increment' }) };
};

afterEach(() => {
	vi.useRealTimers();
});

const value = async () => {
	await tick();
	return Number(screen.getByTestId('value').textContent);
};
const press = (button: HTMLElement, pointerType = 'mouse') =>
	fireEvent.pointerDown(button, { pointerType, button: 0, clientX: 10, clientY: 10 });
const release = (pointerType = 'mouse') =>
	fireEvent.pointerUp(window, { pointerType, clientX: 10, clientY: 10 });

describe('usePressAndHold', () => {
	test('a mouse press steps at once, then repeats after the delay until release', async () => {
		const { button, onStop } = await mount();
		await press(button);
		expect(await value()).toBe(1);
		vi.advanceTimersByTime(PRESS_AND_HOLD_DELAY - 1);
		expect(await value()).toBe(1);
		vi.advanceTimersByTime(1 + PRESS_AND_HOLD_INTERVAL * 3);
		expect(await value()).toBe(4);
		await release();
		expect(onStop).toHaveBeenCalledOnce();
		// The click that ends the press does not step again.
		await fireEvent.click(button, { detail: 1 });
		vi.advanceTimersByTime(1000);
		expect(await value()).toBe(4);
	});

	test('keyboard activation steps once through the click', async () => {
		const { button } = await mount();
		await fireEvent.click(button, { detail: 0 });
		expect(await value()).toBe(1);
	});

	test('repeating stops at the bound', async () => {
		const { button } = await mount({ max: 3 });
		await press(button);
		vi.advanceTimersByTime(PRESS_AND_HOLD_DELAY + PRESS_AND_HOLD_INTERVAL * 10);
		expect(await value()).toBe(3);
		await release();
	});

	test('becoming disabled mid-hold stops it, and a disabled button never starts one', async () => {
		const { button, view } = await mount();
		await press(button);
		vi.advanceTimersByTime(PRESS_AND_HOLD_DELAY + PRESS_AND_HOLD_INTERVAL);
		expect(await value()).toBe(2);
		await view.rerender({ disabled: true });
		vi.advanceTimersByTime(1000);
		expect(await value()).toBe(2);
		await release();

		await press(button);
		vi.advanceTimersByTime(1000);
		expect(await value()).toBe(2);
		await release();
	});

	test('pointercancel stops the hold', async () => {
		const { button, onStop } = await mount();
		await press(button);
		await fireEvent.pointerCancel(window, { pointerType: 'mouse' });
		expect(onStop).toHaveBeenCalledOnce();
		vi.advanceTimersByTime(1000);
		expect(await value()).toBe(1);
	});

	test('a pen press behaves like a mouse press', async () => {
		const { button } = await mount();
		await press(button, 'pen');
		expect(await value()).toBe(1);
		vi.advanceTimersByTime(PRESS_AND_HOLD_DELAY + PRESS_AND_HOLD_INTERVAL);
		expect(await value()).toBe(2);
		await release('pen');
		await fireEvent.click(button, { detail: 1 });
		expect(await value()).toBe(2);
	});

	test('a quick touch tap steps once through its click', async () => {
		const { button } = await mount();
		await press(button, 'touch');
		expect(await value()).toBe(0);
		await fireEvent.pointerUp(button, { pointerType: 'touch' });
		vi.advanceTimersByTime(100);
		await fireEvent.click(button, { detail: 1 });
		expect(await value()).toBe(1);
	});

	test('a touch hold starts after its intent check, and the click it ends with is skipped', async () => {
		const { button } = await mount();
		await press(button, 'touch');
		vi.advanceTimersByTime(50);
		expect(await value()).toBe(1);
		vi.advanceTimersByTime(PRESS_AND_HOLD_DELAY + PRESS_AND_HOLD_INTERVAL);
		expect(await value()).toBe(2);
		await release('touch');
		await fireEvent.click(button, { detail: 1 });
		expect(await value()).toBe(2);
	});

	test('a touch press that starts scrolling never steps', async () => {
		const { button } = await mount();
		await press(button, 'touch');
		await fireEvent.pointerMove(button, { pointerType: 'touch', clientX: 10, clientY: 30 });
		vi.advanceTimersByTime(1000);
		expect(await value()).toBe(0);
		await release('touch');
	});

	test('moving off the button pauses the hold and coming back resumes it', async () => {
		const { button } = await mount();
		await press(button);
		await fireEvent.pointerLeave(button, { pointerType: 'mouse' });
		vi.advanceTimersByTime(1000);
		expect(await value()).toBe(1);
		await fireEvent.pointerEnter(button, { pointerType: 'mouse', buttons: 1 });
		expect(await value()).toBe(2);
		vi.advanceTimersByTime(PRESS_AND_HOLD_DELAY + PRESS_AND_HOLD_INTERVAL);
		expect(await value()).toBe(3);
		await release();
		await fireEvent.pointerEnter(button, { pointerType: 'mouse' });
		expect(await value()).toBe(3);
	});

	test('coming back onto the button after a lost pointerup ends the press', async () => {
		const { button, onStop } = await mount();
		await press(button);
		await fireEvent.pointerLeave(button, { pointerType: 'mouse' });
		// The release landed where no pointerup reached the page: re-entering has no button held.
		await fireEvent.pointerEnter(button, { pointerType: 'mouse', buttons: 0 });
		vi.advanceTimersByTime(2000);
		expect(await value()).toBe(1);
		expect(onStop).toHaveBeenCalledOnce();
	});

	test('keyboard activation after a touch hold still steps', async () => {
		const { button } = await mount();
		await press(button, 'touch');
		vi.advanceTimersByTime(50);
		expect(await value()).toBe(1);
		await release('touch');
		await fireEvent.click(button, { detail: 1 });
		expect(await value()).toBe(1);
		await fireEvent.click(button, { detail: 0 });
		expect(await value()).toBe(2);
	});

	test('stop() ends a running hold', async () => {
		const { button, onStop } = await mount();
		await press(button);
		await fireEvent.click(screen.getByRole('button', { name: 'Stop' }));
		expect(onStop).toHaveBeenCalledOnce();
		vi.advanceTimersByTime(1000);
		expect(await value()).toBe(1);
	});
});
