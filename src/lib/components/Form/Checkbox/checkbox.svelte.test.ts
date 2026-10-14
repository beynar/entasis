import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/svelte';
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';
import ChoiceControlsHarness from '../CheckboxesInput/ChoiceControlsHarness.test.svelte';
import { renderInTheme } from '../../Theme/renderInTheme.test-helper.js';
import Checkbox from './Checkbox.svelte';

const scrollIntoView = Element.prototype.scrollIntoView;
beforeAll(() => {
	Element.prototype.scrollIntoView = vi.fn();
});
afterAll(() => {
	Element.prototype.scrollIntoView = scrollIntoView;
});

const nativeForm = () => screen.getByTestId('native-form') as HTMLFormElement;
const terms = () => within(nativeForm()).getByRole('checkbox', { name: 'Terms' });
const press = (element: Element, key: string) => {
	const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
	element.dispatchEvent(event);
	return event;
};

describe('CC-1 · Enter', () => {
	test('a11y:checkbox.enter-continues-form does not toggle the checkbox or report a change', () => {
		const onTermsChange = vi.fn();
		render(ChoiceControlsHarness, { props: { onTermsChange } });

		const event = press(terms(), 'Enter');

		expect(event.defaultPrevented).toBe(true);
		expect(terms()).toHaveAttribute('aria-checked', 'false');
		expect(onTermsChange).not.toHaveBeenCalled();
	});

	test('submits the surrounding <form> through its default button', () => {
		const onNativeSubmit = vi.fn();
		render(ChoiceControlsHarness, { props: { onNativeSubmit } });

		press(terms(), 'Enter');

		expect(onNativeSubmit).toHaveBeenCalledOnce();
		expect(onNativeSubmit.mock.calls[0][0].has('terms')).toBe(false);
	});

	test('a modified or repeated Enter is left alone', () => {
		const onNativeSubmit = vi.fn();
		render(ChoiceControlsHarness, { props: { onNativeSubmit } });

		for (const init of [{ shiftKey: true }, { ctrlKey: true }, { repeat: true }]) {
			const event = new KeyboardEvent('keydown', {
				key: 'Enter',
				bubbles: true,
				cancelable: true,
				...init
			});
			terms().dispatchEvent(event);
			expect(event.defaultPrevented).toBe(false);
		}
		expect(onNativeSubmit).not.toHaveBeenCalled();
	});

	test('a handler in inputAttrs that cancels the key keeps the built-in behaviour away', async () => {
		const onkeydown = vi.fn((event: KeyboardEvent) => event.preventDefault());
		renderInTheme(Checkbox, { label: 'Agree', inputAttrs: { onkeydown } });
		const checkbox = screen.getByRole('checkbox', { name: 'Agree' });

		await fireEvent.keyDown(checkbox, { key: 'Enter' });

		expect(onkeydown).toHaveBeenCalledOnce();
	});

	test('inside an entasis Form it moves to the next field', async () => {
		render(ChoiceControlsHarness, { props: { scenario: 'entasis', radioDefault: 'pro' } });
		const checkbox = screen.getByRole('checkbox', { name: 'Terms' });
		checkbox.focus();

		press(checkbox, 'Enter');

		// The next visible field is the plan group: its tab stop takes focus.
		await waitFor(() => expect(screen.getByRole('radio', { name: 'Pro' })).toHaveFocus());
		expect(checkbox).toHaveAttribute('aria-checked', 'false');
	});

	test('Space keeps toggling: a click flips the value once', async () => {
		const onTermsChange = vi.fn();
		render(ChoiceControlsHarness, { props: { onTermsChange } });

		await fireEvent.click(terms());

		expect(terms()).toHaveAttribute('aria-checked', 'true');
		expect(onTermsChange).toHaveBeenCalledExactlyOnceWith(true);
	});
});

describe('CC-3 · names and descriptions', () => {
	test('the description describes the checkbox and is not part of its name', () => {
		renderInTheme(Checkbox, { label: 'Accept terms', description: 'Read the full text first' });

		const checkbox = screen.getByRole('checkbox', { name: 'Accept terms' });
		expect(checkbox).toHaveAccessibleDescription('Read the full text first');
	});

	test('an aria-label in inputAttrs names the checkbox instead of its label', () => {
		renderInTheme(Checkbox, {
			label: 'Accept terms',
			description: 'Read the full text first',
			inputAttrs: { 'aria-label': 'Accept the terms of service' }
		});

		const checkbox = screen.getByRole('checkbox', { name: 'Accept the terms of service' });
		expect(checkbox).not.toHaveAttribute('aria-labelledby');
		expect(checkbox).toHaveAccessibleDescription('Read the full text first');
	});

	test('descriptions from inputAttrs are kept next to the painted one', () => {
		renderInTheme(Checkbox, {
			label: 'Accept terms',
			description: 'Read the full text first',
			inputAttrs: { 'aria-describedby': 'external-hint' }
		});

		const checkbox = screen.getByRole('checkbox', { name: 'Accept terms' });
		expect(checkbox.getAttribute('aria-describedby')?.split(' ')).toContain('external-hint');
		expect(checkbox.getAttribute('aria-describedby')?.split(' ')).toHaveLength(2);
	});
});

describe('CC-4 · hidden input', () => {
	const input = () => nativeForm().querySelector<HTMLInputElement>('input[name="terms"]')!;

	test('sits beside the button, never inside it', () => {
		render(ChoiceControlsHarness);

		expect(input()).not.toBeNull();
		expect(input().closest('button')).toBeNull();
		expect(nativeForm().querySelectorAll('button input')).toHaveLength(0);
	});

	test('submits inputValue only while checked', async () => {
		const onNativeSubmit = vi.fn();
		render(ChoiceControlsHarness, { props: { onNativeSubmit } });

		await fireEvent.click(terms());
		nativeForm().requestSubmit();
		expect(onNativeSubmit.mock.calls[0][0].get('terms')).toBe('true');

		await fireEvent.click(terms());
		nativeForm().requestSubmit();
		expect(onNativeSubmit.mock.calls[1][0].has('terms')).toBe(false);
	});

	test('a custom inputValue is the submitted value', async () => {
		const onSubmit = vi.fn();
		renderInTheme(Checkbox, { name: 'newsletter', label: 'News', inputValue: 'yes', value: true });
		const hidden = document.querySelector<HTMLInputElement>('input[name="newsletter"]')!;

		expect(hidden).toBeChecked();
		expect(hidden.value).toBe('yes');
		expect(onSubmit).not.toHaveBeenCalled();
	});

	test('a required checkbox blocks a native submit until it is checked', async () => {
		const onSubmit = vi.fn((event: Event) => event.preventDefault());
		const { container } = renderInTheme(Checkbox, {
			name: 'terms',
			label: 'Terms',
			required: true
		});
		const hidden = container.querySelector<HTMLInputElement>('input[name="terms"]')!;

		expect(hidden).toBeRequired();
		expect(hidden.validity.valid).toBe(false);
		await fireEvent.click(screen.getByRole('checkbox', { name: 'Terms' }));
		expect(hidden.validity.valid).toBe(true);
		expect(onSubmit).not.toHaveBeenCalled();
	});
});

describe('CC-2 · read-only', () => {
	test('a11y:checkbox.read-only stays focusable and announced, and ignores clicks', async () => {
		const onTermsChange = vi.fn();
		render(ChoiceControlsHarness, { props: { readOnly: true, onTermsChange } });

		expect(terms()).toHaveAttribute('aria-readonly', 'true');
		expect(terms()).toHaveAttribute('data-readonly');
		expect(terms()).not.toBeDisabled();
		terms().focus();
		expect(terms()).toHaveFocus();
		await fireEvent.click(terms());
		expect(terms()).toHaveAttribute('aria-checked', 'false');
		expect(onTermsChange).not.toHaveBeenCalled();
	});

	test('a read-only checkbox that is checked still submits', () => {
		const onNativeSubmit = vi.fn();
		const { container } = renderInTheme(Checkbox, {
			name: 'terms',
			label: 'Terms',
			readOnly: true,
			value: true
		});
		const hidden = container.querySelector<HTMLInputElement>('input[name="terms"]')!;

		expect(hidden).toBeChecked();
		expect(hidden).not.toBeDisabled();
		expect(onNativeSubmit).not.toHaveBeenCalled();
	});
});

describe('indeterminate', () => {
	test('a mixed checkbox that holds true turns off on click instead of doing nothing', async () => {
		const onValueChange = vi.fn();
		renderInTheme(Checkbox, {
			label: 'Select all',
			indeterminate: true,
			value: true,
			onValueChange
		});
		const checkbox = screen.getByRole('checkbox', { name: 'Select all' });
		expect(checkbox).toHaveAttribute('aria-checked', 'mixed');

		await fireEvent.click(checkbox);

		expect(onValueChange).toHaveBeenCalledExactlyOnceWith(false);
	});
});
