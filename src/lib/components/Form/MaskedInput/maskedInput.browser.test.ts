// MaskedInput in real engines (Chromium and WebKit): typing goes through Maskito's beforeinput
// handling, so the caret, multi-character insertions, the placeholder and native form
// submission are measured as a person meets them.
import { describe, expect, test, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import Harness from './MaskedInputHarness.test.svelte';

type Props = NonNullable<Parameters<typeof Harness>[1]>;
const mount = (props: Props = {}) => render(Harness, { props });
const input = () => page.getByRole('textbox', { name: /Plate/ }).element() as HTMLInputElement;
const caret = () => [input().selectionStart, input().selectionEnd];
const shown = () => input().value;
const bound = () => JSON.parse(page.getByTestId('value').element().textContent ?? 'null');

const focusAt = async (position: number) => {
	await userEvent.click(input());
	input().setSelectionRange(position, position);
};

/**
 * Inserts several characters in one edit, as a paste does: the browser fires one trusted
 * beforeinput with all of them, which Maskito masks as a whole.
 */
const insertText = (text: string) => {
	document.execCommand('insertText', false, text);
};

describe('typing', () => {
	test('masked-input:typing separators are written as the user types, and the value stays raw', async () => {
		const onValueChange = vi.fn();
		const onMaskedChange = vi.fn();
		mount({ onValueChange, onMaskedChange });
		await userEvent.click(input());
		await userEvent.keyboard('ab123cd');
		expect(shown()).toBe('ab-123-cd');
		expect(bound()).toBe('ab123cd');
		expect(onValueChange).toHaveBeenLastCalledWith('ab123cd');
		expect(onMaskedChange).toHaveBeenLastCalledWith({
			masked: 'ab-123-cd',
			raw: 'ab123cd',
			complete: true
		});
	});

	test('characters a slot refuses are not written', async () => {
		mount();
		await userEvent.click(input());
		await userEvent.keyboard('1a!b2');
		expect(shown()).toBe('ab-2');
		expect(bound()).toBe('ab2');
	});

	test('token transforms rewrite what is typed', async () => {
		mount({ mask: 'XX-###', tokens: { X: { pattern: /[A-Z]/, transform: 'upper' } } });
		await userEvent.click(input());
		await userEvent.keyboard('ab12');
		expect(shown()).toBe('AB-12');
		expect(bound()).toBe('AB12');
	});

	test('a numeric mask asks for the numeric keyboard', async () => {
		mount({ mask: '### ### ### #####' });
		expect(input().inputMode).toBe('numeric');
		expect(input().placeholder).toBe('___ ___ ___ _____');
	});
});

describe('caret', () => {
	const siret = { mask: '### ### ### #####' };

	test('masked-input:caret a character inserted in the middle leaves the caret after it', async () => {
		mount(siret);
		await userEvent.click(input());
		await userEvent.keyboard('73282932000074');
		expect(shown()).toBe('732 829 320 00074');
		await focusAt(5);
		await userEvent.keyboard('1');
		expect(shown()).toBe('732 812 932 00007');
		expect(caret()).toEqual([6, 6]);
	});

	test('typing before a separator jumps over it', async () => {
		mount(siret);
		await userEvent.click(input());
		await userEvent.keyboard('732829');
		await focusAt(3);
		await userEvent.keyboard('1');
		expect(shown()).toBe('732 182 9');
		expect(caret()).toEqual([5, 5]);
	});

	test('Backspace in the middle removes one character and keeps the caret there', async () => {
		mount(siret);
		await userEvent.click(input());
		await userEvent.keyboard('73282932000074');
		await focusAt(6);
		await userEvent.keyboard('{Backspace}');
		expect(shown()).toBe('732 893 200 0074');
		expect(caret()).toEqual([5, 5]);
		expect(bound()).toBe('7328932000074');
	});

	test('Backspace right after a separator steps over it without deleting', async () => {
		mount(siret);
		await userEvent.click(input());
		await userEvent.keyboard('732829');
		await focusAt(4);
		await userEvent.keyboard('{Backspace}');
		expect(shown()).toBe('732 829');
		expect(caret()).toEqual([3, 3]);
	});
});

describe('multi-character insertion', () => {
	test('masked-input:paste raw characters are formatted', async () => {
		mount();
		await userEvent.click(input());
		insertText('AB123CD');
		await expect.poll(shown).toBe('AB-123-CD');
		expect(bound()).toBe('AB123CD');
	});

	test('formatted text reads the same as raw characters', async () => {
		mount();
		await userEvent.click(input());
		insertText('AB-123-CD');
		await expect.poll(shown).toBe('AB-123-CD');
		expect(bound()).toBe('AB123CD');
	});

	test('text past the end of the first mask moves to the next one', async () => {
		mount({ mask: ['(###) ###-####', '+## # ## ## ## ##'] });
		await userEvent.click(input());
		await userEvent.keyboard('0612345678');
		expect(shown()).toBe('(061) 234-5678');
		await userEvent.keyboard('9');
		expect(shown()).toBe('+06 1 23 45 67 89');
		expect(bound()).toBe('06123456789');
	});
});

describe('showMask', () => {
	test('masked-input:show-mask always shows the empty slots, and the value ignores them', async () => {
		mount({ showMask: 'always' });
		expect(shown()).toBe('__-___-__');
		await userEvent.click(input());
		await expect.poll(caret).toEqual([0, 0]);
		await userEvent.keyboard('ab1');
		expect(shown()).toBe('ab-1__-__');
		expect(caret()).toEqual([4, 4]);
		expect(bound()).toBe('ab1');
		await userEvent.keyboard('{Backspace}');
		expect(shown()).toBe('ab-___-__');
		expect(bound()).toBe('ab');
	});

	test('focus shows the slots only while the input has focus', async () => {
		mount({ showMask: 'focus' });
		expect(shown()).toBe('');
		expect(input().placeholder).toBe('__-___-__');
		await userEvent.click(input());
		await expect.poll(shown).toBe('__-___-__');
		await userEvent.keyboard('ab1');
		expect(shown()).toBe('ab-1__-__');
		await userEvent.tab();
		await expect.poll(shown).toBe('ab-1');
		expect(bound()).toBe('ab1');
	});

	test('never keeps the input to what was typed', async () => {
		mount({ showMask: 'never' });
		await userEvent.click(input());
		expect(shown()).toBe('');
		await userEvent.keyboard('ab1');
		expect(shown()).toBe('ab-1');
	});

	test('a custom placeholder character', async () => {
		mount({ showMask: 'always', placeholderChar: '•' });
		expect(shown()).toBe('••-•••-••');
	});
});

describe('value contract', () => {
	test('masked-input:value-format masked holds the text as shown', async () => {
		const onValueChange = vi.fn();
		const onMaskedChange = vi.fn();
		mount({ valueFormat: 'masked', onValueChange, onMaskedChange });
		await userEvent.click(input());
		await userEvent.keyboard('ab12');
		expect(bound()).toBe('ab-12');
		expect(onValueChange).toHaveBeenLastCalledWith('ab-12');
		expect(onMaskedChange).toHaveBeenLastCalledWith({
			masked: 'ab-12',
			raw: 'ab12',
			complete: false
		});
	});

	test('a value set from outside is formatted and calls nothing', async () => {
		const onValueChange = vi.fn();
		mount({ scenario: 'controlled', externalValue: 'XY987ZT', onValueChange });
		await userEvent.click(page.getByRole('button', { name: 'Set value' }));
		await expect.poll(shown).toBe('XY-987-ZT');
		expect(onValueChange).not.toHaveBeenCalled();
	});

	test('a default value shows formatted', async () => {
		mount({ defaultValue: 'AB123CD' });
		expect(shown()).toBe('AB-123-CD');
		expect(bound()).toBe('AB123CD');
	});

	test('masked-input:read-only refuses edits and keeps its value', async () => {
		const onValueChange = vi.fn();
		mount({ readOnly: true, defaultValue: 'AB123CD', showMask: 'focus', onValueChange });
		expect(input().readOnly).toBe(true);
		await userEvent.click(input());
		// No Backspace: WebKit reads it on a read-only input as "go back" and leaves the page.
		await userEvent.keyboard('9{Delete}');
		insertText('XY');
		expect(shown()).toBe('AB-123-CD');
		expect(bound()).toBe('AB123CD');
		expect(onValueChange).not.toHaveBeenCalled();
	});

	test('disabled refuses focus and edits', async () => {
		mount({ disabled: true, defaultValue: 'AB1' });
		expect(input().disabled).toBe(true);
		expect(shown()).toBe('AB-1');
	});
});

describe('native forms', () => {
	const form = () => page.getByTestId('form').element() as HTMLFormElement;

	test('masked-input:native-form submits the value from a hidden input beside the control', async () => {
		mount({ scenario: 'native-form' });
		await userEvent.click(input());
		await userEvent.keyboard('ab123cd');
		expect(input().name).toBe('');
		expect(new FormData(form()).getAll('plate')).toEqual(['ab123cd']);
		const hidden = form().querySelector<HTMLInputElement>('input[name="plate"]')!;
		expect(hidden.closest('button')).toBeNull();
	});

	test('masked format submits the text as shown', async () => {
		mount({ scenario: 'native-form', valueFormat: 'masked', defaultValue: 'AB123CD' });
		expect(new FormData(form()).get('plate')).toBe('AB-123-CD');
	});

	test('a read-only field still submits, a disabled one does not', async () => {
		mount({ scenario: 'native-form', readOnly: true, defaultValue: 'AB123CD' });
		expect(new FormData(form()).get('plate')).toBe('AB123CD');
	});

	test('a disabled field submits nothing', async () => {
		mount({ scenario: 'native-form', disabled: true, defaultValue: 'AB123CD' });
		expect(new FormData(form()).has('plate')).toBe(false);
	});

	test('a required empty field blocks the native submit', async () => {
		mount({ scenario: 'native-form', required: true });
		expect(form().checkValidity()).toBe(false);
		await userEvent.click(input());
		await userEvent.keyboard('ab123cd');
		expect(form().checkValidity()).toBe(true);
	});
});

describe('validation', () => {
	test('masked-input:incomplete an incomplete value shows the catalog message', async () => {
		mount({ validationMode: 'blur' });
		await userEvent.click(input());
		await userEvent.keyboard('ab12');
		await userEvent.tab();
		await expect.element(page.getByText('Enter the complete value')).toBeVisible();
		await userEvent.click(input());
		await userEvent.keyboard('3cd');
		await expect.poll(() => document.querySelector('[role="alert"]')).toBeNull();
	});

	test('the message follows the locale', async () => {
		mount({ validationMode: 'blur', locale: 'fr' });
		await userEvent.click(input());
		await userEvent.keyboard('ab');
		await userEvent.tab();
		await expect.element(page.getByText('Saisissez la valeur complète')).toBeVisible();
	});

	test('messages.incomplete replaces it for one field', async () => {
		mount({
			validationMode: 'blur',
			messages: { incomplete: (length) => `Type all ${length} characters` }
		});
		await userEvent.click(input());
		await userEvent.keyboard('ab');
		await userEvent.tab();
		await expect.element(page.getByText('Type all 7 characters')).toBeVisible();
	});

	test('an empty field that is not required is valid', async () => {
		mount({ validationMode: 'blur' });
		await userEvent.click(input());
		await userEvent.tab();
		await new Promise((resolve) => setTimeout(resolve, 50));
		expect(document.querySelector('[role="alert"]')).toBeNull();
	});

	test('in a Form, an incomplete value blocks Enter from submitting', async () => {
		const onSubmit = vi.fn();
		mount({ scenario: 'form', onSubmit });
		await userEvent.click(input());
		await userEvent.keyboard('ab1{Enter}');
		await expect.element(page.getByText('Enter the complete value')).toBeVisible();
		expect(onSubmit).not.toHaveBeenCalled();
		await userEvent.keyboard('23cd{Enter}');
		await expect.poll(() => onSubmit.mock.calls.length).toBe(1);
		expect(onSubmit.mock.calls[0][0]).toMatchObject({ plate: 'ab123cd' });
	});
});
