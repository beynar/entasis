import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { tick } from 'svelte';
import { afterEach, describe, expect, test, vi } from 'vitest';
import PinInput from './PinInput.svelte';
import { PIN_INPUT_ALPHANUMERIC_PATTERN } from './pinInput.state.svelte.js';

type RenderProps = Parameters<typeof PinInput>[1];

const setup = (props: Partial<RenderProps> = {}) => {
	const onComplete = vi.fn();
	const onValueChange = vi.fn();
	const view = render(PinInput, {
		props: { label: 'Code', onComplete, onValueChange, ...props }
	});
	const input = screen.getByRole('textbox', { name: 'Code' }) as HTMLInputElement;
	const cellText = () =>
		Array.from(view.container.querySelectorAll('[data-slot="pin-input-cell"]'))
			.map((cell) => cell.textContent?.trim() ?? '')
			.join('');
	return { ...view, input, onComplete, onValueChange, cellText };
};

const paste = (input: HTMLInputElement, text: string) =>
	fireEvent.paste(input, { clipboardData: { getData: () => text } });

const type = (input: HTMLInputElement, value: string) =>
	fireEvent.input(input, { target: { value } });

/** Sets the input text the way an input method does mid-composition. */
const compose = (input: HTMLInputElement, value: string) => {
	input.value = value;
	return fireEvent(
		input,
		new InputEvent('input', {
			bubbles: true,
			isComposing: true,
			inputType: 'insertCompositionText'
		})
	);
};

/** Fills the input the way browser and OS one-time-code autofill does: one whole-value input. */
const autofill = (input: HTMLInputElement, value: string) => {
	input.value = value;
	return fireEvent(input, new Event('input', { bubbles: true }));
};

afterEach(() => {
	vi.restoreAllMocks();
});

describe('pin input paste', () => {
	test('pin-input:full-paste a full-length paste after a partial entry replaces the value', async () => {
		const { input, onComplete } = setup();
		input.focus();
		await type(input, '12');
		expect(input).toHaveValue('12');

		await paste(input, '123456');
		await tick();

		expect(input).toHaveValue('123456');
		expect(onComplete).toHaveBeenCalledTimes(1);
		expect(onComplete).toHaveBeenLastCalledWith('123456');
	});

	test('a full-length paste onto a complete code replaces it and reports completion', async () => {
		const { input, onComplete, onValueChange } = setup({
			value: 'abcdef',
			pattern: PIN_INPUT_ALPHANUMERIC_PATTERN,
			inputMode: 'text'
		});
		input.focus();
		// Focus selects the last cell, which used to splice the paste into it.
		expect([input.selectionStart, input.selectionEnd]).toEqual([5, 6]);

		await paste(input, '123456');
		await tick();

		expect(input).toHaveValue('123456');
		expect(onValueChange).toHaveBeenLastCalledWith('123456');
		expect(onComplete).toHaveBeenCalledTimes(1);
		expect(onComplete).toHaveBeenLastCalledWith('123456');
	});

	test('re-pasting the same complete code reports completion every time', async () => {
		const { input, onComplete, onValueChange } = setup();
		input.focus();

		await paste(input, '123456');
		await tick();
		expect(onComplete).toHaveBeenCalledTimes(1);

		await paste(input, '123456');
		await tick();
		expect(onComplete).toHaveBeenCalledTimes(2);

		await paste(input, '123456');
		await tick();
		expect(onComplete).toHaveBeenCalledTimes(3);
		expect(onComplete).toHaveBeenLastCalledWith('123456');
		// The value never changed after the first paste, so only one change is published.
		expect(onValueChange).toHaveBeenCalledTimes(1);
	});

	test('a longer paste is clamped to the configured length', async () => {
		const { input, onComplete } = setup({ length: 4 });
		input.focus();
		await type(input, '9');

		await paste(input, '123456');
		await tick();

		expect(input).toHaveValue('1234');
		expect(onComplete).toHaveBeenCalledOnce();
	});

	test('the paste transformer runs before the full-length check', async () => {
		const { input, onComplete } = setup({
			pasteTransformer: (text: string) => text.replace(/\D/g, '')
		});
		input.focus();
		await type(input, '98');

		await paste(input, '123-456');
		await tick();

		expect(input).toHaveValue('123456');
		expect(onComplete).toHaveBeenCalledWith('123456');
	});

	test('a short paste still inserts at the caret without reporting completion', async () => {
		const { input, onComplete } = setup();
		input.focus();
		await type(input, '12');

		await paste(input, '34');
		await tick();

		expect(input).toHaveValue('1234');
		expect(onComplete).not.toHaveBeenCalled();
	});

	test('a rejected full-length paste leaves the value alone', async () => {
		const { input, onComplete, onValueChange } = setup();
		input.focus();
		await type(input, '12');
		onValueChange.mockClear();

		await paste(input, 'abcdef');
		await tick();

		expect(input).toHaveValue('12');
		expect(onValueChange).not.toHaveBeenCalled();
		expect(onComplete).not.toHaveBeenCalled();
	});

	test('autofilling a new code over a complete code reports completion', async () => {
		const { input, onComplete } = setup({ value: '111111' });
		input.focus();

		await autofill(input, '654321');
		await tick();

		expect(input).toHaveValue('654321');
		expect(onComplete).toHaveBeenCalledTimes(1);
		expect(onComplete).toHaveBeenLastCalledWith('654321');
	});

	test('typing the last cell reports completion once, and retyping a complete code does not', async () => {
		const { input, onComplete } = setup();
		input.focus();
		await type(input, '12345');
		await tick();
		expect(onComplete).not.toHaveBeenCalled();

		await type(input, '123456');
		await tick();
		expect(onComplete).toHaveBeenCalledTimes(1);

		// Overwriting one cell of a complete code is an edit, not a new code.
		input.setSelectionRange(2, 3);
		await type(input, '129456');
		await tick();
		expect(input).toHaveValue('129456');
		expect(onComplete).toHaveBeenCalledTimes(1);
	});

	test('a parent value that becomes complete still reports completion once', async () => {
		const { rerender, onComplete } = setup({ value: '12' });
		await rerender({ value: '123456' });
		await tick();
		expect(onComplete).toHaveBeenCalledTimes(1);
		expect(onComplete).toHaveBeenLastCalledWith('123456');
	});
});

describe('pin input IME composition', () => {
	test('pin-input:ime-composition full-width digits commit once on compositionend', async () => {
		const { input, onComplete, onValueChange, cellText } = setup({ length: 4 });
		input.focus();

		await fireEvent.compositionStart(input, { data: '' });
		await compose(input, '１');
		// The in-progress text is left to the input method and shown in the cells.
		expect(input).toHaveValue('１');
		expect(cellText()).toBe('１');
		await compose(input, '１２');
		expect(input).toHaveValue('１２');
		expect(cellText()).toBe('１２');
		expect(onValueChange).not.toHaveBeenCalled();

		await fireEvent.compositionEnd(input, { data: '１２' });
		await tick();

		expect(input).toHaveValue('12');
		expect(cellText()).toBe('12');
		expect(onValueChange).toHaveBeenCalledTimes(1);
		expect(onValueChange).toHaveBeenLastCalledWith('12');
		expect(onComplete).not.toHaveBeenCalled();
	});

	test('the trailing input event some browsers send after compositionend is idempotent', async () => {
		const { input, onValueChange } = setup({ length: 4 });
		input.focus();
		await type(input, '12');
		onValueChange.mockClear();

		await fireEvent.compositionStart(input, { data: '' });
		await compose(input, '12３４');
		await fireEvent.compositionEnd(input, { data: '３４' });
		await fireEvent(
			input,
			new InputEvent('input', { bubbles: true, inputType: 'insertCompositionText' })
		);
		await tick();

		expect(input).toHaveValue('1234');
		expect(onValueChange).toHaveBeenCalledTimes(1);
		expect(onValueChange).toHaveBeenLastCalledWith('1234');
	});

	test('a composition that completes the code reports completion', async () => {
		const { input, onComplete } = setup({ length: 4 });
		input.focus();
		await type(input, '12');

		await fireEvent.compositionStart(input, { data: '' });
		await compose(input, '12３４５');
		await fireEvent.compositionEnd(input, { data: '３４５' });
		await tick();

		// The composition overfilled the cells; the commit is clamped to the length.
		expect(input).toHaveValue('1234');
		expect(onComplete).toHaveBeenCalledOnce();
		expect(onComplete).toHaveBeenLastCalledWith('1234');
	});

	test('composing over a selected cell overwrites that cell', async () => {
		const { input, onValueChange } = setup({ value: '123456' });
		input.focus();
		input.setSelectionRange(2, 3);

		await fireEvent.compositionStart(input, { data: '' });
		await compose(input, '12９456');
		await fireEvent.compositionEnd(input, { data: '９' });
		await tick();

		expect(input).toHaveValue('129456');
		expect(onValueChange).toHaveBeenLastCalledWith('129456');
	});

	test('the selection is left to the input method while composing', async () => {
		const { input } = setup({ value: '123456' });
		input.focus();
		input.setSelectionRange(2, 3);

		await fireEvent.compositionStart(input, { data: '' });
		await compose(input, '12９456');
		input.setSelectionRange(3, 3);
		const setSelectionRange = vi.spyOn(input, 'setSelectionRange');

		await fireEvent.keyUp(input, { key: 'Process' });
		await fireEvent.click(input);
		await fireEvent.pointerDown(input, { clientX: 0 });
		await fireEvent(document, new Event('selectionchange'));

		expect(setSelectionRange).not.toHaveBeenCalled();
		expect([input.selectionStart, input.selectionEnd]).toEqual([3, 3]);
	});

	test('a parent value set mid-composition replaces the composed text', async () => {
		const { input, rerender, cellText, onValueChange } = setup({ value: '12', length: 4 });
		input.focus();

		await fireEvent.compositionStart(input, { data: '' });
		await compose(input, '12３');
		expect(cellText()).toBe('12３');

		await rerender({ value: '9' });
		await tick();
		expect(input).toHaveValue('9');
		expect(cellText()).toBe('9');

		await fireEvent.compositionEnd(input, { data: '３' });
		await tick();
		expect(input).toHaveValue('9');
		expect(onValueChange).not.toHaveBeenCalled();
	});

	test('a composition whose compositionend never arrived is dropped on the next focus', async () => {
		const { input, cellText, onValueChange } = setup({ length: 4 });
		input.focus();

		await fireEvent.compositionStart(input, { data: '' });
		await compose(input, '１');
		input.blur();
		input.value = '';
		input.focus();
		await tick();
		expect(cellText()).toBe('');

		await type(input, '7');
		expect(input).toHaveValue('7');
		expect(onValueChange).toHaveBeenLastCalledWith('7');
	});

	test('a rejected composition restores the previous value and selection', async () => {
		const { input, onValueChange } = setup({ value: '123456' });
		input.focus();
		input.setSelectionRange(2, 3);

		await fireEvent.compositionStart(input, { data: '' });
		await compose(input, '12あ456');
		await fireEvent.compositionEnd(input, { data: 'あ' });
		await tick();

		expect(input).toHaveValue('123456');
		expect([input.selectionStart, input.selectionEnd]).toEqual([2, 3]);
		expect(onValueChange).not.toHaveBeenCalled();
	});

	test('a compositionend without data commits the text the input holds', async () => {
		const { input, onValueChange } = setup({ value: '12', length: 4 });
		input.focus();

		await fireEvent.compositionStart(input, { data: '' });
		await compose(input, '12３');
		await fireEvent.compositionEnd(input, { data: '' });
		await tick();

		expect(input).toHaveValue('123');
		expect(onValueChange).toHaveBeenLastCalledWith('123');
	});

	test('a cancelled composition keeps the previous value', async () => {
		const { input, onValueChange, cellText } = setup({ value: '12' });
		input.focus();

		await fireEvent.compositionStart(input, { data: '' });
		await compose(input, '12３');
		await compose(input, '12');
		await fireEvent.compositionEnd(input, { data: '' });
		await tick();

		expect(input).toHaveValue('12');
		expect(cellText()).toBe('12');
		expect(onValueChange).not.toHaveBeenCalled();
	});

	test('IME keystrokes are not filtered by the pattern', async () => {
		const { input } = setup();
		input.focus();
		const event = new KeyboardEvent('keydown', {
			key: '１',
			keyCode: 229,
			bubbles: true,
			cancelable: true
		});
		input.dispatchEvent(event);
		expect(event.defaultPrevented).toBe(false);

		const plain = new KeyboardEvent('keydown', { key: 'a', bubbles: true, cancelable: true });
		input.dispatchEvent(plain);
		expect(plain.defaultPrevented).toBe(true);
	});

	test('Android keyboards that always compose keep committing on input', async () => {
		vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(
			'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Mobile Safari/537.36'
		);
		const { input, onValueChange } = setup({ length: 4 });
		input.focus();

		await fireEvent.compositionStart(input, { data: '' });
		await compose(input, '1');
		expect(onValueChange).toHaveBeenLastCalledWith('1');
		await compose(input, '12');
		expect(onValueChange).toHaveBeenLastCalledWith('12');
		await fireEvent.compositionEnd(input, { data: '12' });
		await tick();

		expect(input).toHaveValue('12');
		expect(onValueChange).toHaveBeenCalledTimes(2);
	});
});
