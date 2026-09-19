import '@testing-library/jest-dom/vitest';
import { fireEvent, screen, waitFor } from '@testing-library/svelte';
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';
import TextInput from './TextInput/TextInput.svelte';
import TextArea from './TextArea/TextArea.svelte';
import KeyValueInput from './KeyValueInput/KeyValueInput.svelte';
import StandaloneField from './Field/StandaloneField.test.svelte';
import PopoverControls from './PopoverControls.test.svelte';
import RetainedTextInput from './TextInput/RetainedTextInput.test.svelte';
import Form from './Form/Form.svelte';
import MultiStepForm from './MultiStepForm/MultiStepForm.svelte';
import Slider from './Slider/Slider.svelte';
import { renderInTheme } from '../Theme/renderInTheme.test-helper.js';

const scrollTo = Element.prototype.scrollTo;
beforeAll(() => {
	Element.prototype.scrollTo = vi.fn();
});
afterAll(() => {
	Element.prototype.scrollTo = scrollTo;
});

describe('form control contracts', () => {
	test('forwards text native attributes and original events to the input', async () => {
		const oninput = vi.fn();
		const onfocus = vi.fn();
		const onblur = vi.fn();
		const onValueChange = vi.fn();
		renderInTheme(TextInput, {
			inputAttrs: { 'aria-label': 'Answer', autocomplete: 'email', oninput, onfocus, onblur },
			fieldAttrs: { 'data-testid': 'wrapper', title: 'Field wrapper' },
			onValueChange
		});

		const input = screen.getByRole('textbox', { name: 'Answer' }) as HTMLInputElement;
		const event = new InputEvent('input', { bubbles: true });
		input.value = 'Updated';
		await fireEvent(input, event);
		const focus = new FocusEvent('focus');
		await fireEvent(input, focus);
		const blur = new FocusEvent('blur');
		await fireEvent(input, blur);

		expect(oninput).toHaveBeenCalledOnce();
		expect(oninput.mock.calls[0][0] === event).toBe(true);
		expect(onfocus).toHaveBeenCalledOnce();
		expect(onfocus.mock.calls[0][0] === focus).toBe(true);
		expect(onblur).toHaveBeenCalledOnce();
		expect(onblur.mock.calls[0][0] === blur).toBe(true);
		expect(onValueChange).toHaveBeenCalledExactlyOnceWith('Updated');
		expect(input).toHaveAttribute('autocomplete', 'email');
		expect(input).not.toHaveAttribute('title');
		expect(screen.getByTestId('wrapper')).not.toHaveAttribute('autocomplete');
	});

	test('uses defaults once and does not echo parent value changes', async () => {
		const onValueChange = vi.fn();
		const { rerender } = renderInTheme(TextArea, { defaultValue: 'Initial', onValueChange });
		const textarea = screen.getByRole('textbox');
		expect(textarea).toHaveValue('Initial');
		await rerender({ defaultValue: 'Ignored' });
		expect(textarea).toHaveValue('Initial');
		await rerender({ value: 'Parent value' });
		expect(textarea).toHaveValue('Parent value');
		expect(onValueChange).not.toHaveBeenCalled();
		await fireEvent.input(textarea, { target: { value: 'Edited' } });
		expect(onValueChange).toHaveBeenCalledExactlyOnceWith('Edited');
	});

	test('retains edits when the change callback replaces the spread props', async () => {
		const onValueChange = vi.fn();
		renderInTheme(RetainedTextInput, { onValueChange });
		const input = screen.getByRole('textbox');
		await fireEvent.input(input, { target: { value: 'Retained' } });
		expect(input).toHaveValue('Retained');
		expect(onValueChange).toHaveBeenCalledExactlyOnceWith('Retained');
	});

	test('range Slider ignores a clamped no-op and publishes one keyboard edit', async () => {
		const onValueChange = vi.fn();
		renderInTheme(Slider, { mode: 'range', defaultValue: [0, 100], onValueChange });
		const [minimum] = screen.getAllByRole('slider');
		await fireEvent.keyDown(minimum, { key: 'Home' });
		expect(onValueChange).not.toHaveBeenCalled();
		await fireEvent.keyDown(minimum, { key: 'ArrowRight' });
		expect(minimum).toHaveAttribute('aria-valuenow', '1');
		expect(onValueChange).toHaveBeenCalledExactlyOnceWith([1, 100]);
	});

	test('preserves textarea keyboard events and permits native cancellation', async () => {
		const onPressEnter = vi.fn();
		const onkeydown = vi.fn((event: KeyboardEvent) => event.preventDefault());
		renderInTheme(TextArea, { onPressEnter, textareaAttrs: { onkeydown } });
		const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
		await fireEvent(screen.getByRole('textbox'), event);
		expect(onkeydown).toHaveBeenCalledOnce();
		expect(onkeydown.mock.calls[0][0] === event).toBe(true);
		expect(onPressEnter).not.toHaveBeenCalled();
	});

	test('keeps Select native trigger attributes and keyboard events on the button', async () => {
		const onkeydown = vi.fn((event: KeyboardEvent) => event.preventDefault());
		renderInTheme(PopoverControls, {
			select: {
				triggerAttrs: { 'aria-label': 'Country', title: 'Choose country', onkeydown },
				fieldAttrs: { 'data-testid': 'select-wrapper' },
				items: [{ value: 'us', label: 'United States' }]
			}
		});
		const trigger = screen.getByRole('combobox', { name: 'Country' });
		const event = new KeyboardEvent('keydown', {
			key: 'ArrowDown',
			bubbles: true,
			cancelable: true
		});
		await fireEvent(trigger, event);
		expect(onkeydown).toHaveBeenCalledOnce();
		expect(onkeydown.mock.calls[0][0] === event).toBe(true);
		expect(trigger).toHaveAttribute('title', 'Choose country');
		expect(trigger).toHaveAttribute('aria-expanded', 'false');
		expect(screen.getByTestId('select-wrapper')).not.toHaveAttribute('title');
	});

	test('updates controlled key/value rows and publishes only user edits', async () => {
		const onValueChange = vi.fn();
		const { rerender } = renderInTheme(KeyValueInput, {
			value: [{ key: 'Old key', value: 'Old value' }],
			onValueChange
		});
		await rerender({ value: [{ key: 'New key', value: 'New value' }] });
		await waitFor(() => expect(screen.getByDisplayValue('New key')).toBeInTheDocument());
		expect(onValueChange).not.toHaveBeenCalled();
		await fireEvent.input(screen.getByDisplayValue('New value'), { target: { value: 'Edited' } });
		expect(onValueChange).toHaveBeenCalledExactlyOnceWith([{ key: 'New key', value: 'Edited' }]);
	});

	test('standalone Field owns validation and updates accessible error state', async () => {
		renderInTheme(StandaloneField);
		const input = screen.getByRole('textbox', { name: 'Standalone name' });
		await fireEvent.click(screen.getByRole('button', { name: 'Validate' }));
		const alert = await screen.findByRole('alert');
		expect(input).toHaveAttribute('aria-invalid', 'true');
		expect(input).toHaveAttribute('aria-describedby', alert.id);
		await fireEvent.input(input, { target: { value: 'Ada' } });
		expect(screen.queryByRole('alert')).not.toBeInTheDocument();
		expect(input).not.toHaveAttribute('aria-invalid');
	});

	test('publishes Form actions with the form state and preserves native cancellation', async () => {
		const onAction = vi.fn();
		const onclick = vi.fn((event: MouseEvent) => event.preventDefault());
		renderInTheme(Form, {
			inputs: {},
			actions: [
				{ children: 'Cancel action', onclick, onAction },
				{ children: 'Accept action', onAction }
			]
		});
		const event = new MouseEvent('click', { bubbles: true, cancelable: true });
		await fireEvent(screen.getByRole('button', { name: 'Cancel action' }), event);
		expect(onclick).toHaveBeenCalledOnce();
		expect(onclick.mock.calls[0][0] === event).toBe(true);
		expect(onAction).not.toHaveBeenCalled();
		await fireEvent.click(screen.getByRole('button', { name: 'Accept action' }));
		expect(onAction).toHaveBeenCalledOnce();
		expect(onAction.mock.calls[0]).toHaveLength(1);
		expect(onAction.mock.calls[0][0].value).toEqual({});
	});

	test('MultiStepForm emits one step payload and can block advancement', async () => {
		const onSubmitStep = vi.fn(() => false);
		const onValueChange = vi.fn();
		renderInTheme(MultiStepForm, {
			items: [
				{
					title: 'Name',
					inputs: { name: { type: 'text', required: true, defaultValue: 'Ada' } }
				},
				{ title: 'Email', inputs: { email: { type: 'email' } } }
			],
			onSubmitStep,
			onValueChange
		});
		await fireEvent.input(screen.getByDisplayValue('Ada'), { target: { value: 'Grace' } });
		expect(onValueChange).toHaveBeenCalledOnce();
		expect(onValueChange.mock.calls[0][0]).toMatchObject({ name: 'Grace' });
		await fireEvent.click(screen.getByRole('button', { name: 'Next' }));
		await waitFor(() => expect(onSubmitStep).toHaveBeenCalledOnce());
		expect(onSubmitStep.mock.calls[0]).toEqual([
			{
				value: { name: 'Grace' },
				step: expect.objectContaining({ title: 'Name' }),
				index: 0
			}
		]);
		expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument();
	});

	test('a repeated DateSelector selection closes once without a value callback', async () => {
		const onValueChange = vi.fn();
		const onOpenChange = vi.fn();
		const date = new Date(2026, 1, 4);
		renderInTheme(PopoverControls, {
			dateSelector: {
				defaultValue: date,
				defaultOpen: true,
				closeOnSelect: true,
				presets: [{ label: 'Selected date', value: date }],
				onValueChange,
				onOpenChange
			}
		});
		expect(onOpenChange).not.toHaveBeenCalled();
		await fireEvent.click(await screen.findByRole('button', { name: 'Selected date' }));
		expect(onValueChange).not.toHaveBeenCalled();
		expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
	});
});
