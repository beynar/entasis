// PinInput: the shared normalization pipeline, read-only, direction, localized label, shadow DOM,
// submit on complete and grouped cells.
import '@testing-library/jest-dom/vitest';
import { fireEvent, screen, waitFor } from '@testing-library/svelte';
import { mount, tick, unmount } from 'svelte';
import { afterAll, afterEach, beforeAll, describe, expect, test, vi } from 'vitest';
import { renderInTheme } from '../../Theme/renderInTheme.test-helper.js';
import PinInput from './PinInput.svelte';
import PinInputHarness from './PinInputHarness.test.svelte';
import { PIN_INPUT_ALPHANUMERIC_PATTERN } from './pinInput.state.svelte.js';

type Props = NonNullable<Parameters<typeof PinInput>[1]>;

const scrollIntoView = Element.prototype.scrollIntoView;
beforeAll(() => {
	Element.prototype.scrollIntoView = vi.fn();
});
afterAll(() => {
	Element.prototype.scrollIntoView = scrollIntoView;
});
afterEach(() => {
	vi.restoreAllMocks();
});

const setup = (props: Partial<Props> = {}) => {
	const onComplete = vi.fn();
	const onValueChange = vi.fn();
	const onRejectInput = vi.fn();
	const view = renderInTheme(PinInput, {
		label: 'Code',
		onComplete,
		onValueChange,
		onRejectInput,
		...props
	});
	const input = screen.getByRole('textbox', { name: 'Code' }) as HTMLInputElement;
	return { ...view, input, onComplete, onValueChange, onRejectInput };
};

const paste = (input: HTMLInputElement, text: string) =>
	fireEvent.paste(input, { clipboardData: { getData: () => text } });
const type = (input: HTMLInputElement, value: string) =>
	fireEvent.input(input, { target: { value } });

describe('one normalization pipeline', () => {
	test.each(['123-456', '123 456', ' 123 - 456 ', '123.456', '123–456', '123 456'])(
		'pin-input:normalize pasting %j fills the code',
		async (text) => {
			const { input, onComplete } = setup();
			input.focus();
			await paste(input, text);
			await tick();
			expect(input).toHaveValue('123456');
			expect(onComplete).toHaveBeenCalledWith('123456');
		}
	);

	test('digits of other numeral systems become ASCII, pasted, typed and autofilled', async () => {
		const { input, onValueChange } = setup();
		input.focus();
		await paste(input, '٤٥٦');
		await tick();
		expect(input).toHaveValue('456');
		await type(input, '١٢٣٤٥٦');
		await tick();
		expect(input).toHaveValue('123456');
		await type(input, '４５６７８９');
		await tick();
		expect(input).toHaveValue('456789');
		expect(onValueChange).toHaveBeenLastCalledWith('456789');
	});

	test('pin-input:normalize pasted full-width and Arabic-Indic digits complete the code without a transformer', async () => {
		const { input, onComplete } = setup();
		input.focus();
		await paste(input, '１２３４５６');
		await tick();
		expect(input).toHaveValue('123456');
		expect(onComplete).toHaveBeenCalledWith('123456');
		await paste(input, '٤٥٦٧٨٩');
		await tick();
		expect(input).toHaveValue('456789');
		expect(onComplete).toHaveBeenLastCalledWith('456789');
	});

	test('typed or autofilled text with separators is cleaned before it is checked', async () => {
		const { input } = setup();
		input.focus();
		await type(input, '123-456');
		await tick();
		expect(input).toHaveValue('123456');
		await type(input, '12 34');
		await tick();
		expect(input).toHaveValue('1234');
	});

	test('a separator key never reaches the input', async () => {
		const { input } = setup();
		for (const key of [' ', '-', '.']) {
			const event = new KeyboardEvent('keydown', { key, cancelable: true, bubbles: true });
			input.dispatchEvent(event);
			expect(event.defaultPrevented).toBe(true);
		}
	});

	test('normalizeValue folds case for typed, pasted and controlled text', async () => {
		const normalizeValue = (text: string) => text.toUpperCase();
		const { input, rerender, onValueChange } = setup({
			length: 8,
			inputMode: 'text',
			pattern: PIN_INPUT_ALPHANUMERIC_PATTERN,
			normalizeValue
		});
		input.focus();
		const lowercaseKey = new KeyboardEvent('keydown', {
			key: 'a',
			cancelable: true,
			bubbles: true
		});
		input.dispatchEvent(lowercaseKey);
		expect(lowercaseKey.defaultPrevented).toBe(false);
		await type(input, 'ab');
		await tick();
		expect(input).toHaveValue('AB');
		await paste(input, 'cd-ef');
		await tick();
		expect(input).toHaveValue('ABCDEF');
		await rerender({ value: 'xy12' });
		await tick();
		expect(input).toHaveValue('XY12');
		expect(onValueChange).toHaveBeenLastCalledWith('XY12');
	});

	test('a controlled value is cleaned once', async () => {
		const { input, onValueChange } = setup({ value: '12-34' });
		await tick();
		expect(input).toHaveValue('1234');
		expect(onValueChange).toHaveBeenCalledWith('1234');
	});

	test('a normalizer that keeps changing its output cannot loop', async () => {
		const unstable = vi.fn((text: string) => text + 'x');
		const { input } = setup({
			value: 'ab',
			pattern: undefined,
			inputMode: 'text',
			normalizeValue: unstable,
			length: 12
		});
		await tick();
		expect(input).toHaveValue('abx');
		expect(unstable.mock.calls.length).toBeLessThan(10);
	});

	test('text that fails the pattern is refused whole and reported', async () => {
		const { input, onRejectInput, onValueChange } = setup();
		input.focus();
		await type(input, '12');
		onValueChange.mockClear();
		await paste(input, 'abc');
		expect(input).toHaveValue('12');
		expect(onRejectInput).toHaveBeenLastCalledWith({ text: 'abc', source: 'paste' });
		await type(input, '12x');
		expect(input).toHaveValue('12');
		expect(onRejectInput).toHaveBeenLastCalledWith({ text: '12x', source: 'input' });
		expect(onValueChange).not.toHaveBeenCalled();
	});

	test('a printable key the pattern refuses is reported through keydown', async () => {
		const { input, onRejectInput } = setup();
		input.focus();
		expect(await fireEvent.keyDown(input, { key: 'a' })).toBe(false);
		expect(onRejectInput).toHaveBeenLastCalledWith({ text: 'a', source: 'input' });
		onRejectInput.mockClear();
		// A separator is dropped by the pipeline, not refused.
		expect(await fireEvent.keyDown(input, { key: '-' })).toBe(false);
		expect(await fireEvent.keyDown(input, { key: ' ' })).toBe(false);
		expect(await fireEvent.keyDown(input, { key: '4' })).toBe(true);
		expect(onRejectInput).not.toHaveBeenCalled();
	});

	test('the native input leaves room for a formatted autofill before the pipeline strips it', () => {
		const { input } = setup();
		expect(Number(input.getAttribute('maxlength'))).toBeGreaterThan(7);
	});

	test('a separator the pattern accepts stays in the code', async () => {
		const { input } = setup({ pattern: '^[a-z0-9-]+$', inputMode: 'text', length: 7 });
		input.focus();
		await paste(input, 'ab-12');
		await tick();
		expect(input).toHaveValue('ab-12');
	});

	test('the paste transformer runs first, then the shared pipeline', async () => {
		const pasteTransformer = vi.fn((text: string) => text.replace('code:', ''));
		const { input } = setup({ pasteTransformer });
		input.focus();
		await paste(input, 'code:123-456');
		await tick();
		expect(pasteTransformer).toHaveBeenCalledWith('code:123-456');
		expect(input).toHaveValue('123456');
	});

	test('composed full-width text goes through the pipeline', async () => {
		const { input } = setup();
		input.focus();
		await fireEvent.compositionStart(input);
		input.value = '１２－３４';
		await fireEvent.compositionEnd(input, { data: '１２－３４' });
		await tick();
		expect(input).toHaveValue('1234');
	});
});

describe('read-only, direction and label', () => {
	test('a read-only code refuses typing, paste and autofill but keeps its value', async () => {
		const { input, onValueChange, onComplete, onRejectInput } = setup({
			value: '123',
			readOnly: true
		});
		input.focus();
		expect(input).toHaveAttribute('readonly');
		await type(input, '1234');
		await paste(input, '123456');
		await fireEvent.input(input, { target: { value: '654321' } });
		await tick();
		expect(input).toHaveValue('123');
		expect(onValueChange).not.toHaveBeenCalled();
		expect(onComplete).not.toHaveBeenCalled();
		expect(onRejectInput).not.toHaveBeenCalled();
	});

	test('a read-only code is still submitted by a native form', async () => {
		const onNativeSubmit = vi.fn();
		renderInTheme(PinInputHarness, {
			scenario: 'native-form',
			value: '1234',
			readOnly: true,
			length: 4,
			onNativeSubmit
		});
		const input = screen.getByLabelText('Code') as HTMLInputElement;
		expect(input).toHaveAttribute('name', 'code');
		const data = new FormData(screen.getByTestId('native-form') as HTMLFormElement);
		expect(data.get('code')).toBe('1234');
	});

	test('the cells and the input read left to right in every document direction', async () => {
		const { input, container } = setup();
		expect(input).toHaveAttribute('dir', 'ltr');
		expect(container.querySelector('[data-slot="pin-input"]')).toHaveAttribute('dir', 'ltr');
	});

	test.each([
		['en', 'One-time code'],
		['fr', 'Code à usage unique'],
		['ar', 'رمز لمرة واحدة']
	] as const)('the label fallback is localized (%s)', async (locale, name) => {
		renderInTheme(PinInputHarness, { scenario: 'locale', locale });
		expect(screen.getByRole('textbox', { name })).toBeInTheDocument();
	});
});

describe('shadow DOM', () => {
	test('pin-input:shadow-dom cells follow the caret of an input inside a shadow root', async () => {
		const host = document.createElement('div');
		document.body.append(host);
		const shadow = host.attachShadow({ mode: 'open' });
		const app = mount(PinInput, { target: shadow, props: { label: 'Code' } });
		await tick();
		const input = shadow.querySelector('input') as HTMLInputElement;
		input.focus();
		expect(shadow.activeElement).toBe(input);
		await fireEvent.input(input, { target: { value: '12' } });
		await tick();
		// The caret mirror only exists when the input is recognised as the focused element.
		expect(input).toHaveAttribute('data-pin-input-input-mss', '2');
		const cells = shadow.querySelectorAll('[data-slot="pin-input-cell"]');
		expect(cells[2]).toHaveAttribute('data-active', 'true');
		unmount(app);
		host.remove();
	});
});

describe('submitOnComplete', () => {
	test('pin-input:submit-on-complete a completed code submits the native form', async () => {
		const onNativeSubmit = vi.fn();
		renderInTheme(PinInputHarness, {
			scenario: 'native-form',
			length: 4,
			submitOnComplete: true,
			onNativeSubmit
		});
		const input = screen.getByLabelText('Code') as HTMLInputElement;
		input.focus();
		await type(input, '123');
		await tick();
		expect(onNativeSubmit).not.toHaveBeenCalled();
		await type(input, '1234');
		await tick();
		expect(onNativeSubmit).toHaveBeenCalledTimes(1);
		// A pasted code submits again, like it reports completion again.
		await paste(input, '1234');
		await tick();
		expect(onNativeSubmit).toHaveBeenCalledTimes(2);
	});

	test('it never submits without the option, for a code the parent set, or when read-only', async () => {
		const onNativeSubmit = vi.fn();
		const view = renderInTheme(PinInputHarness, {
			scenario: 'native-form',
			length: 4,
			onNativeSubmit
		});
		const input = screen.getByLabelText('Code') as HTMLInputElement;
		input.focus();
		await type(input, '1234');
		await tick();
		expect(onNativeSubmit).not.toHaveBeenCalled();

		await view.rerender({
			scenario: 'native-form',
			length: 4,
			submitOnComplete: true,
			onNativeSubmit,
			value: '4321'
		});
		await tick();
		expect(input).toHaveValue('4321');
		expect(onNativeSubmit).not.toHaveBeenCalled();

		await view.rerender({
			scenario: 'native-form',
			length: 4,
			submitOnComplete: true,
			readOnly: true,
			onNativeSubmit,
			value: ''
		});
		await tick();
		await paste(input, '1234');
		await tick();
		expect(onNativeSubmit).not.toHaveBeenCalled();
	});

	test('inside a Form it submits through the Form, and keeps focus on an earlier invalid field', async () => {
		const onSubmit = vi.fn();
		renderInTheme(PinInputHarness, { scenario: 'form', submitOnComplete: true, onSubmit });
		const email = screen.getByLabelText('Email') as HTMLInputElement;
		const code = screen.getByLabelText('Code') as HTMLInputElement;
		code.focus();
		await type(code, '1234');
		await tick();
		expect(onSubmit).not.toHaveBeenCalled();
		await waitFor(() => expect(email).toHaveFocus());
		expect(document.activeElement).not.toBe(code);

		await type(email, 'ada@example.com');
		code.focus();
		await paste(code, '5678');
		await waitFor(() =>
			expect(onSubmit).toHaveBeenCalledWith({ email: 'ada@example.com', code: '5678' })
		);
	});
});

describe('grouped cells', () => {
	const separators = (container: HTMLElement) =>
		Array.from(container.querySelectorAll('[data-slot="pin-input-separator"]'));

	test('pin-input:groups [3, 3] puts one decorative separator between the groups', async () => {
		const { container } = setup({ groups: [3, 3] });
		const children = Array.from(
			container.querySelector('[data-slot="pin-input"]')!.children
		).filter((child) => child.getAttribute('data-slot') !== 'pin-input-input');
		const kinds = children.map((child) => child.getAttribute('data-slot'));
		expect(kinds).toEqual([
			'pin-input-cell',
			'pin-input-cell',
			'pin-input-cell',
			'pin-input-separator',
			'pin-input-cell',
			'pin-input-cell',
			'pin-input-cell'
		]);
		const [separator] = separators(container);
		expect(separator).toHaveAttribute('aria-hidden', 'true');
	});

	test('groups that overshoot the length or hold bad sizes leave no stray separator', async () => {
		const { container } = setup({ groups: [2, 0, 2, 4], length: 4 });
		expect(separators(container)).toHaveLength(1);
	});

	test('one group as long as the code needs no separator', async () => {
		const { container } = setup({ groups: [6], length: 6 });
		expect(separators(container)).toHaveLength(0);
	});

	test('no groups, no separators', async () => {
		const { container } = setup();
		expect(separators(container)).toHaveLength(0);
	});
});
