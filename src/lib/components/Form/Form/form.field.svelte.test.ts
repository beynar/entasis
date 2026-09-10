import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';
import TextArea from '../TextArea/TextArea.svelte';
import FormFieldEntry from './FormFieldEntry.test.svelte';

const scrollIntoView = Element.prototype.scrollIntoView;
beforeAll(() => {
	Element.prototype.scrollIntoView = vi.fn();
});
afterAll(() => {
	Element.prototype.scrollIntoView = scrollIntoView;
});

describe('Form field entries', () => {
	test('registers the custom control with value, submission, and accessible ids', async () => {
		const onSubmit = vi.fn();
		render(FormFieldEntry, { props: { onSubmit } });

		const control = screen.getByLabelText('Display name');
		expect(control).toHaveAttribute('required');
		expect(control).toHaveAttribute('name', 'displayName');
		expect(control.id).not.toBe('');

		await fireEvent.input(control, { target: { value: 'Ada' } });
		await waitFor(() =>
			expect(screen.getByTestId('live-value')).toHaveTextContent('{"displayName":"Ada"}')
		);

		await fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
		await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ displayName: 'Ada' }));
		expect(screen.getByText('Display only')).toBeInTheDocument();
	});

	test('uses FieldState required validation and disabled state', async () => {
		const onSubmit = vi.fn();
		render(FormFieldEntry, { props: { onSubmit, disabled: true } });

		expect(screen.getByTestId('custom-field-control')).toBeDisabled();

		await fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
		expect(onSubmit).not.toHaveBeenCalled();
		const error = await screen.findByRole('alert');
		expect(error.id).toMatch(/-errors$/);
		expect(screen.getByTestId('custom-field-control')).toHaveAttribute(
			'aria-describedby',
			error.id
		);
	});

	test('keeps textarea and Field wrapper attributes on their native owners', () => {
		render(TextArea, {
			props: {
				textareaAttrs: { 'aria-label': 'Native answer', autocomplete: 'off' },
				fieldAttrs: { 'data-testid': 'field-wrapper' }
			}
		});

		const control = screen.getByLabelText('Native answer');
		expect(control).toHaveAttribute('autocomplete', 'off');
		expect(control).not.toHaveAttribute('data-testid', 'field-wrapper');
		expect(screen.getByTestId('field-wrapper')).toContainElement(control);
	});

	test('uses defaultValue only when value is omitted and publishes edits', async () => {
		const onValueChange = vi.fn();
		const { unmount } = render(TextArea, {
			props: {
				defaultValue: 'Initial answer',
				textareaAttrs: { 'aria-label': 'Uncontrolled answer' },
				onValueChange
			}
		});

		const uncontrolled = screen.getByLabelText('Uncontrolled answer');
		expect(uncontrolled).toHaveValue('Initial answer');
		await fireEvent.input(uncontrolled, { target: { value: 'Edited answer' } });
		expect(onValueChange).toHaveBeenLastCalledWith('Edited answer');
		unmount();

		render(TextArea, {
			props: {
				value: null,
				defaultValue: 'Ignored default',
				textareaAttrs: { 'aria-label': 'Controlled answer' }
			}
		});
		expect(screen.getByLabelText('Controlled answer')).toHaveValue('');
	});

	test('keeps an explicit null custom field value ahead of its default', () => {
		render(FormFieldEntry, {
			props: { onSubmit: vi.fn(), inputValue: null, defaultInputValue: 'Ignored' }
		});
		expect(screen.getByTestId('custom-field-control')).toHaveValue('');
	});

	test('provides layout tokens and publishes every explicit controller transition once', async () => {
		const onFieldValueChange = vi.fn();
		const onValueChange = vi.fn();
		render(FormFieldEntry, {
			props: {
				onSubmit: vi.fn(),
				onFieldValueChange,
				onValueChange,
				size: 'large',
				density: 'small'
			}
		});
		const control = screen.getByTestId('custom-field-control');
		expect(control).toHaveAttribute('data-size', 'large');
		expect(control).toHaveAttribute('data-density', 'small');
		expect(onFieldValueChange).not.toHaveBeenCalled();
		await fireEvent.click(screen.getByRole('button', { name: 'Set twice' }));
		expect(onFieldValueChange.mock.calls).toEqual([['First'], ['Second']]);
		expect(onValueChange.mock.calls).toEqual([
			[{ displayName: 'First' }],
			[{ displayName: 'Second' }]
		]);
		expect(control).toHaveValue('Second');
	});

	test('accepts parent value updates without echoing control or form changes', async () => {
		const onFieldValueChange = vi.fn();
		const onValueChange = vi.fn();
		const { rerender } = render(FormFieldEntry, {
			props: {
				onSubmit: vi.fn(),
				value: { displayName: 'Initial' },
				onFieldValueChange,
				onValueChange
			}
		});
		await rerender({ value: { displayName: 'Parent update' } });
		expect(screen.getByTestId('custom-field-control')).toHaveValue('Parent update');
		expect(onFieldValueChange).not.toHaveBeenCalled();
		expect(onValueChange).not.toHaveBeenCalled();
		await fireEvent.input(screen.getByTestId('custom-field-control'), {
			target: { value: 'Edited' }
		});
		expect(onFieldValueChange).toHaveBeenCalledExactlyOnceWith('Edited');
		expect(onValueChange).toHaveBeenCalledExactlyOnceWith({ displayName: 'Edited' });
	});

	test('runs the shared custom validation and removes errors when the value is repaired', async () => {
		const onSubmit = vi.fn();
		const onValidate = vi.fn((value: string) => (value === 'Allowed' ? null : 'Use Allowed'));
		render(FormFieldEntry, { props: { onSubmit, onValidate, defaultInputValue: 'Rejected' } });
		await fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
		expect(onSubmit).not.toHaveBeenCalled();
		expect(await screen.findByRole('alert')).toHaveTextContent('Use Allowed');
		await fireEvent.input(screen.getByTestId('custom-field-control'), {
			target: { value: 'Allowed' }
		});
		expect(screen.queryByRole('alert')).not.toBeInTheDocument();
		await fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
		expect(onSubmit).toHaveBeenCalledExactlyOnceWith({ displayName: 'Allowed' });
	});
});
