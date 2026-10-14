import '@testing-library/jest-dom/vitest';
import { fireEvent, screen } from '@testing-library/svelte';
import { tick } from 'svelte';
import { afterEach, describe, expect, test, vi } from 'vitest';
import {
	PRESS_AND_HOLD_DELAY,
	PRESS_AND_HOLD_INTERVAL
} from '$lib/utils/usePressAndHold.svelte.js';
import { renderInTheme } from '../../Theme/renderInTheme.test-helper.js';
import NumberInput from './NumberInput.svelte';
import NumberInputForm from './NumberInputForm.test.svelte';

type Props = NonNullable<Parameters<typeof NumberInput>[1]>;

const setup = async (props: Partial<Props> = {}) => {
	const onValueChange = vi.fn();
	const onValueCommit = vi.fn();
	const view = renderInTheme(NumberInput, {
		label: 'Quantity',
		onValueChange,
		onValueCommit,
		...props
	});
	// Svelte's `on` attaches its listeners a microtask later.
	await tick();
	const input = screen.getByRole('spinbutton', { name: 'Quantity' }) as HTMLInputElement;
	const lastValue = () => onValueChange.mock.calls.at(-1)?.[0];
	return { ...view, input, onValueChange, onValueCommit, lastValue };
};

const type = (input: HTMLInputElement, text: string) =>
	fireEvent.input(input, { target: { value: text } });
const key = (input: HTMLElement, name: string, init: KeyboardEventInit = {}) =>
	fireEvent.keyDown(input, { key: name, ...init });
const paste = (input: HTMLInputElement, text: string) =>
	fireEvent.paste(input, { clipboardData: { getData: () => text } });

afterEach(() => {
	vi.useRealTimers();
});

describe('NumberInput text entry', () => {
	test('is a text input with the spinbutton role and the value on aria-valuenow', async () => {
		const { input } = await setup({ value: 12, min: 0, max: 20 });
		expect(input).toHaveAttribute('type', 'text');
		expect(input).toHaveAttribute('inputmode', 'decimal');
		expect(input).toHaveAttribute('aria-valuenow', '12');
		expect(input).toHaveAttribute('aria-valuemin', '0');
		expect(input).toHaveAttribute('aria-valuemax', '20');
		expect(input).toHaveValue('12');
	});

	test('number-input:locale-parse a French "1 234,5" publishes 1234.5', async () => {
		const { input, lastValue } = await setup({ locale: 'fr' });
		await type(input, '1 234,5');
		expect(lastValue()).toBe(1234.5);
		expect(input).toHaveValue('1 234,5');
		await fireEvent.blur(input);
		expect(input.value.replace(/\s/g, ' ')).toBe('1 234,5');
	});

	test('a German group separator is dropped and a typed point is a group, not a decimal', async () => {
		const { input, lastValue } = await setup({ locale: 'de' });
		await type(input, '1.234,5');
		expect(lastValue()).toBe(1234.5);
	});

	test('Arabic-Indic digits parse and are shown in the locale on blur', async () => {
		const { input, lastValue } = await setup({ locale: 'ar' });
		await type(input, '١٢٣');
		expect(lastValue()).toBe(123);
		await type(input, '١٢٣٫٤');
		expect(lastValue()).toBe(123.4);
		// Persian and full-width digits read the same in any locale.
		await type(input, '۱۲');
		expect(lastValue()).toBe(12);
		await type(input, '４５');
		expect(lastValue()).toBe(45);
	});

	test('a Brazilian currency stays editable and formats on blur', async () => {
		const { input, lastValue } = await setup({
			locale: 'pt-BR',
			format: { style: 'currency', currency: 'BRL' }
		});
		await type(input, '12,5');
		expect(lastValue()).toBe(12.5);
		expect(input).toHaveValue('12,5');
		await fireEvent.blur(input);
		expect(input.value.replace(/\s/g, ' ')).toBe('R$ 12,50');
		await type(input, 'R$ 1.234,56');
		expect(lastValue()).toBe(1234.56);
	});

	test('a percent rounds to its format on blur and reports the rounded value', async () => {
		const { input, lastValue, onValueCommit } = await setup({
			format: { style: 'percent', maximumFractionDigits: 0 }
		});
		await type(input, '12.7');
		expect(lastValue()).toBeCloseTo(0.127);
		await fireEvent.blur(input);
		expect(lastValue()).toBe(0.13);
		expect(input).toHaveValue('13%');
		expect(onValueCommit).toHaveBeenCalledWith({ value: 0.13, reason: 'blur' });
	});

	test('without rounding options the value keeps its full precision', async () => {
		const { input, lastValue } = await setup({ locale: 'en' });
		await type(input, '1.23456789');
		await fireEvent.blur(input);
		expect(lastValue()).toBe(1.23456789);
		expect(input).toHaveValue('1.23456789');
	});

	test('text that is not a number yet is never published', async () => {
		const { input, onValueChange } = await setup({ value: 5 });
		await type(input, '-');
		expect(onValueChange).not.toHaveBeenCalled();
		await type(input, '.');
		expect(onValueChange).not.toHaveBeenCalled();
		expect(input).toHaveValue('.');
		await type(input, '.5');
		expect(onValueChange).toHaveBeenCalledWith(0.5);
	});

	test('a minus sign is refused when the minimum is not negative', async () => {
		const { input } = await setup({ min: 0 });
		await type(input, '5');
		await type(input, '-5');
		expect(input).toHaveValue('5');
	});

	test('partial text waits for more typing and goes back to the value on blur', async () => {
		const { input, lastValue, onValueCommit } = await setup({ value: 5 });
		await type(input, '-');
		await fireEvent.blur(input);
		expect(input).toHaveValue('5');
		expect(lastValue()).toBeUndefined();
		expect(onValueCommit).toHaveBeenCalledWith({ value: 5, reason: 'blur' });
	});

	test('letters are refused and the text stays as it was', async () => {
		const { input, onValueChange } = await setup();
		await type(input, '12');
		await type(input, '12a');
		expect(input).toHaveValue('12');
		expect(onValueChange).toHaveBeenCalledTimes(1);
	});

	test('clearing the text empties the value', async () => {
		const { input, lastValue } = await setup({ value: 5 });
		await type(input, '');
		expect(lastValue()).toBeNull();
	});

	test('a pasted number is inserted at the caret', async () => {
		const { input, lastValue } = await setup({ value: 1234 });
		input.focus();
		input.setSelectionRange(2, 2);
		await paste(input, '99');
		expect(input).toHaveValue('1,99234');
		expect(lastValue()).toBe(199234);
	});

	test('a paste replaces the selection, and a paste of text is refused', async () => {
		const { input, lastValue } = await setup({ value: 1234 });
		input.focus();
		input.setSelectionRange(0, 5);
		await paste(input, '7');
		expect(lastValue()).toBe(7);
		await paste(input, 'seven');
		expect(input).toHaveValue('7');
	});

	test('a value that changes from outside replaces the text', async () => {
		const { input, rerender } = await setup({ value: 1 });
		await rerender({ value: 1500 });
		await tick();
		expect(input).toHaveValue('1,500');
		await rerender({ value: null });
		await tick();
		expect(input).toHaveValue('');
	});

	test('typing does not rewrite the text while the value matches it', async () => {
		const { input } = await setup();
		await type(input, '1.50');
		await tick();
		expect(input).toHaveValue('1.50');
	});

	test('inputAttrs reach the input, and a consumer handler can cancel the built-in one', async () => {
		const onkeydown = vi.fn((event: KeyboardEvent) => event.preventDefault());
		const { input, lastValue } = await setup({
			value: 5,
			inputAttrs: {
				autocomplete: 'transaction-amount',
				'aria-roledescription': 'Amount',
				onkeydown
			}
		});
		expect(input).toHaveAttribute('autocomplete', 'transaction-amount');
		expect(input).toHaveAttribute('aria-roledescription', 'Amount');
		await key(input, 'ArrowUp');
		expect(onkeydown).toHaveBeenCalled();
		expect(lastValue()).toBeUndefined();
	});
});

describe('NumberInput native forms', () => {
	test('number-input:native-form a native form posts the raw number, not the formatted text', async () => {
		const onSubmit = vi.fn();
		renderInTheme(NumberInputForm, { onSubmit, locale: 'fr', value: 1234.5 });
		const input = screen.getByRole('spinbutton', { name: 'Quantity' }) as HTMLInputElement;
		expect(input.value.replace(/\s/g, ' ')).toBe('1 234,5');
		expect(input).not.toHaveAttribute('name');
		await fireEvent.click(screen.getByRole('button', { name: 'Send' }));
		const data = onSubmit.mock.calls[0][0] as FormData;
		expect(data.get('qty')).toBe('1234.5');
	});

	test('an empty number submits nothing, and a disabled one is left out', async () => {
		const onSubmit = vi.fn();
		const { rerender } = renderInTheme(NumberInputForm, { onSubmit });
		await fireEvent.click(screen.getByRole('button', { name: 'Send' }));
		expect((onSubmit.mock.calls[0][0] as FormData).has('qty')).toBe(false);
		await rerender({ onSubmit, value: 4, disabled: true });
		await fireEvent.click(screen.getByRole('button', { name: 'Send' }));
		expect((onSubmit.mock.calls[1][0] as FormData).has('qty')).toBe(false);
	});

	test('a read-only number is still submitted', async () => {
		const onSubmit = vi.fn();
		renderInTheme(NumberInputForm, { onSubmit, value: 8, readOnly: true });
		await fireEvent.click(screen.getByRole('button', { name: 'Send' }));
		expect((onSubmit.mock.calls[0][0] as FormData).get('qty')).toBe('8');
	});

	test('a required empty number blocks a native submit', async () => {
		const onSubmit = vi.fn();
		renderInTheme(NumberInputForm, { onSubmit, required: true });
		await fireEvent.click(screen.getByRole('button', { name: 'Send' }));
		expect(onSubmit).not.toHaveBeenCalled();
		await type(screen.getByRole('spinbutton') as HTMLInputElement, '3');
		await fireEvent.click(screen.getByRole('button', { name: 'Send' }));
		expect((onSubmit.mock.calls[0][0] as FormData).get('qty')).toBe('3');
	});
});

describe('NumberInput keyboard stepping', () => {
	test('arrows step by the step and the buttons agree with them', async () => {
		const { input, lastValue } = await setup({ value: 10, step: 2 });
		await key(input, 'ArrowUp');
		expect(lastValue()).toBe(12);
		await key(input, 'ArrowDown');
		await key(input, 'ArrowDown');
		expect(lastValue()).toBe(8);
		await fireEvent.click(screen.getByRole('button', { name: 'Increase value' }), { detail: 0 });
		expect(lastValue()).toBe(10);
		expect(input).toHaveValue('10');
	});

	test('number-input:large-step Shift and the Page keys step by ten times the step', async () => {
		const { input, lastValue } = await setup({ value: 0 });
		await key(input, 'ArrowUp', { shiftKey: true });
		expect(lastValue()).toBe(10);
		await key(input, 'PageUp');
		expect(lastValue()).toBe(20);
		await key(input, 'PageDown');
		await key(input, 'PageDown');
		expect(lastValue()).toBe(0);
	});

	test('largeStep and smallStep replace the defaults, and Alt steps by a tenth', async () => {
		const { input, lastValue } = await setup({ value: 1, largeStep: 25 });
		await key(input, 'PageUp');
		expect(lastValue()).toBe(26);
		await key(input, 'ArrowDown', { altKey: true });
		expect(lastValue()).toBe(25.9);
		await key(input, 'ArrowUp', { altKey: true });
		await key(input, 'ArrowUp', { altKey: true });
		expect(lastValue()).toBe(26.1);
	});

	test('Home and End go to the bounds', async () => {
		const { input, lastValue } = await setup({ value: 5, min: 0, max: 9 });
		await key(input, 'End');
		expect(lastValue()).toBe(9);
		await key(input, 'Home');
		expect(lastValue()).toBe(0);
	});

	test('Home and End are left to the caret without bounds', async () => {
		const { input, onValueChange } = await setup({ value: 5 });
		const event = new KeyboardEvent('keydown', { key: 'Home', cancelable: true });
		input.dispatchEvent(event);
		expect(event.defaultPrevented).toBe(false);
		expect(onValueChange).not.toHaveBeenCalled();
	});

	test('a bound that is not on the step grid stays reachable', async () => {
		const { input, lastValue } = await setup({ value: 1, min: 0.5 });
		await key(input, 'ArrowDown');
		expect(lastValue()).toBe(0.5);
		await key(input, 'ArrowDown');
		expect(lastValue()).toBe(0.5);
	});

	test('snapOnStep moves to the next point of the step grid', async () => {
		const { input, lastValue } = await setup({ value: 7, step: 5, snapOnStep: true });
		await key(input, 'ArrowUp');
		expect(lastValue()).toBe(10);
		await type(input, '7');
		await key(input, 'ArrowDown');
		expect(lastValue()).toBe(5);
		await key(input, 'ArrowDown');
		expect(lastValue()).toBe(0);
	});

	test('snapOnStep counts the grid from the minimum and clamps after snapping', async () => {
		const { input, lastValue } = await setup({
			value: 3,
			min: 1,
			max: 9,
			step: 4,
			snapOnStep: true
		});
		await key(input, 'ArrowUp');
		expect(lastValue()).toBe(5);
		await key(input, 'ArrowUp');
		expect(lastValue()).toBe(9);
		await key(input, 'ArrowUp');
		expect(lastValue()).toBe(9);
	});

	test('a step of 0.0001 advances without floating point noise', async () => {
		const { input, lastValue } = await setup({ value: 0, step: 0.0001 });
		await key(input, 'ArrowUp');
		await key(input, 'ArrowUp');
		await key(input, 'ArrowUp');
		expect(lastValue()).toBe(0.0003);
	});

	test('stepping an empty input up starts at the minimum', async () => {
		const { input, lastValue } = await setup({ min: 3 });
		await key(input, 'ArrowUp');
		expect(lastValue()).toBe(3);
	});

	test('stepping an empty input down starts at the maximum', async () => {
		const { input, lastValue } = await setup({ max: 8 });
		await key(input, 'ArrowDown');
		expect(lastValue()).toBe(8);
	});

	test('number-input:localized-range an out-of-range value reports the bound in the locale', async () => {
		const { input } = await setup({
			max: 1000,
			locale: 'de',
			validationMode: 'change'
		});
		await type(input, '2000');
		await tick();
		expect(screen.getByRole('alert')).toHaveTextContent('Enter a value of 1.000 or less');
		await type(input, '500');
		await tick();
		expect(screen.queryByRole('alert')).toBeNull();
	});

	test('a lower bound reports its own message with the formatted bound', async () => {
		const { input } = await setup({
			min: 10,
			format: { style: 'currency', currency: 'EUR' },
			locale: 'fr',
			validationMode: 'change'
		});
		await type(input, '4');
		await tick();
		expect(screen.getByRole('alert').textContent?.replace(/\s/g, ' ')).toBe(
			'Enter a value of 10,00 € or more'
		);
	});

	test('stepping does nothing while read-only or disabled', async () => {
		const readOnly = await setup({ value: 5, readOnly: true });
		await key(readOnly.input, 'ArrowUp');
		await key(readOnly.input, 'End');
		await paste(readOnly.input, '9');
		expect(readOnly.onValueChange).not.toHaveBeenCalled();
		expect(readOnly.input).toHaveValue('5');
		expect(readOnly.input).toHaveAttribute('readonly');
		expect(readOnly.input).toHaveAttribute('aria-readonly', 'true');
	});

	test('Enter formats typed text and reports a keyboard commit; arrows commit each step', async () => {
		const { input, onValueCommit } = await setup({ format: { maximumFractionDigits: 1 } });
		await type(input, '2.26');
		await key(input, 'Enter');
		expect(input).toHaveValue('2.3');
		expect(onValueCommit).toHaveBeenLastCalledWith({ value: 2.3, reason: 'keyboard' });
		await key(input, 'ArrowUp');
		expect(onValueCommit).toHaveBeenLastCalledWith({ value: 3.3, reason: 'keyboard' });
		expect(onValueCommit).toHaveBeenCalledTimes(2);
	});

	test('a blur without typing reports no commit', async () => {
		const { input, onValueCommit } = await setup({ value: 3 });
		input.focus();
		await fireEvent.blur(input);
		expect(onValueCommit).not.toHaveBeenCalled();
	});
});

describe('NumberInput wheel', () => {
	const wheel = (input: HTMLElement, init: WheelEventInit) =>
		fireEvent.wheel(input, { cancelable: true, ...init });

	test('number-input:wheel the wheel never changes the value by default', async () => {
		const { input, onValueChange } = await setup({ value: 5 });
		input.focus();
		await wheel(input, { deltaY: -100 });
		expect(onValueChange).not.toHaveBeenCalled();
	});

	test('wheelStep steps a focused input on vertical scrolls', async () => {
		const { input, lastValue, onValueCommit } = await setup({ value: 5, wheelStep: true });
		await wheel(input, { deltaY: -100 });
		expect(lastValue()).toBeUndefined();
		input.focus();
		await wheel(input, { deltaY: -100 });
		expect(lastValue()).toBe(6);
		await wheel(input, { deltaY: 100 });
		expect(lastValue()).toBe(5);
		expect(onValueCommit).toHaveBeenLastCalledWith({ value: 5, reason: 'wheel' });
	});

	test('a horizontal drift leaves the value alone, and Shift makes it a step', async () => {
		const { input, lastValue } = await setup({ value: 5, wheelStep: true });
		input.focus();
		await wheel(input, { deltaX: -40, deltaY: 3 });
		expect(lastValue()).toBeUndefined();
		await wheel(input, { deltaX: -40, deltaY: 0, shiftKey: true });
		expect(lastValue()).toBe(6);
	});
});

describe('NumberInput stepper buttons', () => {
	const press = (button: HTMLElement) =>
		fireEvent.pointerDown(button, { pointerType: 'mouse', button: 0, clientX: 4, clientY: 4 });
	const release = () =>
		fireEvent.pointerUp(window, { pointerType: 'mouse', clientX: 4, clientY: 4 });
	const withTimers = () => vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });

	test('are skipped by Tab and point at the input', async () => {
		const { input } = await setup();
		for (const name of ['Decrease value', 'Increase value']) {
			const button = screen.getByRole('button', { name });
			expect(button).toHaveAttribute('tabindex', '-1');
			expect(button).toHaveAttribute('aria-controls', input.id);
		}
	});

	test('number-input:hold-step pressing and holding repeats and stops at the maximum', async () => {
		const { input, lastValue } = await setup({ value: 0, max: 4 });
		const plus = screen.getByRole('button', { name: 'Increase value' });
		withTimers();
		await press(plus);
		expect(lastValue()).toBe(1);
		// The press moved focus to the input, where the arrow keys keep working.
		expect(input).toHaveFocus();
		vi.advanceTimersByTime(PRESS_AND_HOLD_DELAY + PRESS_AND_HOLD_INTERVAL * 10);
		expect(lastValue()).toBe(4);
		await release();
		expect(input).toHaveValue('4');
	});

	test('a whole press-and-hold produces one commit, on release', async () => {
		const { onValueCommit } = await setup({ value: 0 });
		const plus = screen.getByRole('button', { name: 'Increase value' });
		withTimers();
		await press(plus);
		vi.advanceTimersByTime(PRESS_AND_HOLD_DELAY + PRESS_AND_HOLD_INTERVAL * 3);
		expect(onValueCommit).not.toHaveBeenCalled();
		await release();
		expect(onValueCommit).toHaveBeenCalledTimes(1);
		expect(onValueCommit).toHaveBeenCalledWith({ value: 4, reason: 'step' });
		// The click that ends the press does not step again.
		await fireEvent.click(plus, { detail: 1 });
		expect(onValueCommit).toHaveBeenCalledTimes(1);
	});

	test('a keyboard click on a stepper steps once and commits', async () => {
		const { lastValue, onValueCommit } = await setup({ value: 3 });
		await fireEvent.click(screen.getByRole('button', { name: 'Decrease value' }), { detail: 0 });
		expect(lastValue()).toBe(2);
		expect(onValueCommit).toHaveBeenCalledWith({ value: 2, reason: 'step' });
	});

	test('becoming read-only mid-hold stops it', async () => {
		const { lastValue, rerender } = await setup({ value: 0 });
		const plus = screen.getByRole('button', { name: 'Increase value' });
		withTimers();
		await press(plus);
		vi.advanceTimersByTime(PRESS_AND_HOLD_DELAY + PRESS_AND_HOLD_INTERVAL);
		expect(lastValue()).toBe(2);
		await rerender({ readOnly: true });
		vi.advanceTimersByTime(1000);
		expect(lastValue()).toBe(2);
		await release();
	});

	test('the buttons are disabled at the bounds and while read-only', async () => {
		const { rerender } = await setup({ value: 9, max: 9, min: 0 });
		expect(screen.getByRole('button', { name: 'Increase value' })).toBeDisabled();
		expect(screen.getByRole('button', { name: 'Decrease value' })).toBeEnabled();
		await rerender({ readOnly: true });
		expect(screen.getByRole('button', { name: 'Decrease value' })).toBeDisabled();
	});

	test('showControls={false} renders no buttons', async () => {
		await setup({ showControls: false });
		expect(screen.queryByRole('button')).toBeNull();
	});
});
