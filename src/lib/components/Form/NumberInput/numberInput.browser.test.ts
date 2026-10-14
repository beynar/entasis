// NumberInput in real engines: the stepper buttons keep focus in the input and out of the tab
// order, the arrow keys keep working after a click, and the wheel only steps when asked to.
import { expect, test } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import type { Component } from 'svelte';
import { render } from 'vitest-browser-svelte';
import ThemeProviderHarness from '../../Theme/ThemeProviderHarness.test.svelte';
import NumberInputForm from './NumberInputForm.test.svelte';

type HarnessProps = NonNullable<Parameters<typeof NumberInputForm>[1]>;

const mount = (props: HarnessProps = {}) =>
	render(ThemeProviderHarness, {
		props: {
			component: NumberInputForm as unknown as Component<Record<string, unknown>>,
			...props
		}
	});

const inputOf = () => page.getByRole('spinbutton', { name: 'Quantity' });
const valueOf = () => (inputOf().element() as HTMLInputElement).value;

test('clicking a stepper keeps the caret in the input and the arrow keys keep working', async () => {
	await mount({ value: 5 });
	await userEvent.click(page.getByRole('button', { name: 'Increase value' }));
	await expect.element(inputOf()).toHaveFocus();
	expect(valueOf()).toBe('6');
	await userEvent.keyboard('{ArrowUp}');
	expect(valueOf()).toBe('7');
	await userEvent.click(page.getByRole('button', { name: 'Decrease value' }));
	await expect.element(inputOf()).toHaveFocus();
	expect(valueOf()).toBe('6');
});

test('the steppers add no tab stops', async () => {
	await mount({ value: 5 });
	await userEvent.click(inputOf());
	await userEvent.tab();
	// WebKit does not tab to buttons by default, so the claim is only that no stepper takes focus.
	const focused = document.activeElement;
	for (const name of ['Decrease value', 'Increase value']) {
		expect(focused).not.toBe(page.getByRole('button', { name }).element());
	}
	expect(focused).not.toBe(inputOf().element());
});

test('holding a stepper repeats until the pointer is released', async () => {
	await mount({ value: 0 });
	const plus = page.getByRole('button', { name: 'Increase value' }).element();
	const box = plus.getBoundingClientRect();
	const init = {
		pointerType: 'mouse',
		button: 0,
		clientX: box.left + box.width / 2,
		clientY: box.top + box.height / 2,
		bubbles: true,
		cancelable: true
	};
	plus.dispatchEvent(new PointerEvent('pointerdown', init));
	await expect.poll(() => Number(valueOf())).toBeGreaterThan(2);
	window.dispatchEvent(new PointerEvent('pointerup', init));
	const stopped = valueOf();
	await new Promise((resolve) => setTimeout(resolve, 300));
	expect(valueOf()).toBe(stopped);
});

test('the wheel scrolls past a focused input unless wheelStep is set', async () => {
	await mount({ value: 5 });
	const input = inputOf().element() as HTMLInputElement;
	input.focus();
	const wheel = () => {
		const event = new WheelEvent('wheel', { deltaY: -100, bubbles: true, cancelable: true });
		input.dispatchEvent(event);
		return event.defaultPrevented;
	};
	expect(wheel()).toBe(false);
	await new Promise((resolve) => setTimeout(resolve, 50));
	expect(valueOf()).toBe('5');
});

test('wheelStep steps a focused input and takes the wheel from the page', async () => {
	await mount({ value: 5, wheelStep: true });
	const input = inputOf().element() as HTMLInputElement;
	const wheel = () => {
		const event = new WheelEvent('wheel', { deltaY: -100, bubbles: true, cancelable: true });
		input.dispatchEvent(event);
		return event.defaultPrevented;
	};
	expect(wheel()).toBe(false);
	input.focus();
	expect(wheel()).toBe(true);
	await expect.poll(valueOf).toBe('6');
});

test('typing in a locale formats on blur', async () => {
	await mount({ locale: 'fr' });
	await userEvent.click(inputOf());
	await userEvent.keyboard('1234,5');
	await userEvent.tab();
	expect(valueOf().replace(/\s/g, ' ')).toBe('1 234,5');
});
