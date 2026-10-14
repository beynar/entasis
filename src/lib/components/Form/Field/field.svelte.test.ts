import '@testing-library/jest-dom/vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/svelte';
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';
import { flushSync, tick } from 'svelte';
import CalendarInput from '../Calendar/CalendarInput.svelte';
import Checkbox from '../Checkbox/Checkbox.svelte';
import CheckboxesInput from '../CheckboxesInput/CheckboxesInput.svelte';
import ColorPickerInput from '../ColorPicker/ColorPickerInput.svelte';
import DateSelectorInput from '../DateSelector/DateSelectorInput.svelte';
import FileInput from '../File/FileInput.svelte';
import RichTextInput from '../../RichTextInput/RichTextInput.svelte';
import Form from '../Form/Form.svelte';
import type { FormInputs } from '../Form/form.js';
import { registerFormInputs } from '../Form/form.registry.js';
import MoneyInput from '../Form/MoneyInput.test.svelte';
import RadioInput from '../RadioInput/RadioInput.svelte';
import RatingInput from '../RatingInput/RatingInput.svelte';
import Select from '../Select/Select.svelte';
import Slider from '../Slider/Slider.svelte';
import Switch from '../Switch/Switch.svelte';
import TextArea from '../TextArea/TextArea.svelte';
import TextInput from '../TextInput/TextInput.svelte';
import { renderInTheme } from '../../Theme/renderInTheme.test-helper.js';
import FieldHarness from './FieldHarness.test.svelte';
import type { FieldState } from './field.state.svelte.js';
import type { FieldType } from './field.js';
import type { LocaleCode } from '$lib/i18n/locales.js';

type HarnessProps = NonNullable<Parameters<typeof FieldHarness>[1]>;

const mountField = (props: HarnessProps = {}) => {
	let field!: FieldState<FieldType>;
	const view = renderInTheme(FieldHarness, {
		...props,
		onField: (next) => {
			field = next;
		}
	});
	return { ...view, field };
};

const errorsOf = (field: FieldState<FieldType>) => {
	flushSync();
	return field.errorMessages;
};

// Renders a Form with a submit action and returns the error text of each field after submitting.
const submitForm = async (inputs: FormInputs) => {
	const onSubmit = vi.fn();
	renderInTheme(Form, {
		inputs,
		onSubmit,
		actions: [{ children: 'Submit', onAction: (form) => form.submit() }]
	});
	await fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
	await tick();
	return onSubmit;
};

const alertOf = (control: HTMLElement) => {
	const ids = control.getAttribute('aria-describedby')?.split(' ') ?? [];
	const alert = ids.map((id) => document.getElementById(id)).find((node) => node?.role === 'alert');
	return alert?.textContent?.trim();
};

const scrollIntoView = Element.prototype.scrollIntoView;
let unregister: () => void;
beforeAll(() => {
	Element.prototype.scrollIntoView = vi.fn();
	// The `test-money` registry type is declared by form.registry.svelte.test.ts.
	unregister = registerFormInputs({
		'test-money': {
			component: MoneyInput,
			isEmpty: (value) => value?.amount === undefined
		}
	});
});
afterAll(() => {
	Element.prototype.scrollIntoView = scrollIntoView;
	unregister();
});

describe('FD-1 · catalog validation messages', () => {
	test('an empty required field shows one catalog message instead of library text', () => {
		const { field } = mountField({ required: true, value: '' });
		field.validate();
		expect(errorsOf(field)).toEqual(['This field is required']);
		field.validate(null as never);
		expect(errorsOf(field)).toEqual(['This field is required']);
	});

	test('the message follows the active locale', () => {
		const { field } = mountField({ required: true, locale: 'fr' });
		field.validate();
		expect(errorsOf(field)).toEqual(['Ce champ est obligatoire']);
	});

	test('email and URL failures name what is wrong', () => {
		const email = mountField({ type: 'email', value: 'ada' }).field;
		email.validate();
		expect(errorsOf(email)).toEqual(['Enter a valid email address']);
		const url = mountField({ type: 'url', value: 'not a url' }).field;
		url.validate();
		expect(errorsOf(url)).toEqual(['Enter a valid URL']);
	});

	test('clearing an invalid required email gives exactly the required message', () => {
		const { field } = mountField({ type: 'email', required: true, value: 'ada' });
		field.validate();
		expect(errorsOf(field)).toEqual(['Enter a valid email address']);
		field.validate('' as never);
		expect(errorsOf(field)).toEqual(['This field is required']);
	});

	test('a registered input type reports required with the catalog message', () => {
		const { field } = mountField({ type: 'test-money', required: true });
		field.validate();
		expect(errorsOf(field)).toEqual(['This field is required']);
	});

	test('messages overrides replace catalog messages per field', () => {
		const required = mountField({ required: true, messages: { required: 'Enter your name' } });
		required.field.validate();
		expect(errorsOf(required.field)).toEqual(['Enter your name']);

		const short = mountField({
			value: 'ab',
			minLength: 3,
			messages: { tooShort: (min) => `Use ${min} letters or more` }
		});
		short.field.validate();
		expect(errorsOf(short.field)).toEqual(['Use 3 letters or more']);
	});

	test('true from onValidate and errors={true} read as the catalog invalid message', async () => {
		const { field, rerender } = mountField({ value: 'Ada', onValidate: () => true });
		field.validate();
		expect(errorsOf(field)).toEqual(['Enter a valid value']);
		await rerender({ errors: true });
		expect(errorsOf(field)).toEqual(['Enter a valid value']);
	});

	test('built-in controls report required, range, incomplete and length from the catalog', async () => {
		const onSubmit = await submitForm({
			accept: { type: 'switch', label: 'Accept the terms', labelPosition: 'top', required: true },
			agree: { type: 'checkbox', label: 'Agree', required: true },
			count: { type: 'number', label: 'Count', max: 10, defaultValue: 12 },
			code: { type: 'pin', label: 'Code', length: 4, required: true, defaultValue: '12' },
			secret: { type: 'password', label: 'Secret', minLength: 8, defaultValue: 'short' },
			email: { type: 'email', label: 'Email', required: true }
		});
		expect(onSubmit).not.toHaveBeenCalled();
		expect(alertOf(screen.getByRole('switch'))).toBe('Turn this on to continue');
		expect(alertOf(screen.getByRole('checkbox'))).toBe('Check this box to continue');
		expect(alertOf(screen.getByRole('spinbutton'))).toBe('Enter a value of 10 or less');
		expect(alertOf(screen.getByLabelText('Code'))).toBe('Enter all 4 characters');
		expect(alertOf(screen.getByLabelText('Secret'))).toBe('Password must be at least 8 characters');
		expect(alertOf(screen.getByLabelText('Email'))).toBe('This field is required');
		expect(document.body).not.toHaveTextContent('Invalid value');
		expect(document.body).not.toHaveTextContent('Invalid type');
	});

	test('PasswordInput applies its own minimum through the field, below the built-in six', async () => {
		const onSubmit = await submitForm({
			pin: { type: 'password', label: 'Short secret', minLength: 3, defaultValue: 'abc' }
		});
		await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ pin: 'abc' }));
	});
});

describe('FD-2 · descriptions reach screen readers', () => {
	test('description, helper then errors join aria-describedby after the app ids', async () => {
		renderInTheme(TextInput, {
			label: 'Name',
			description: 'As on your passport',
			helper: 'Up to 40 characters',
			required: true,
			inputAttrs: { 'aria-describedby': 'app-hint' }
		});
		const input = screen.getByRole('textbox', { name: 'Name' });
		const description = screen.getByText('As on your passport');
		const helper = screen.getByText('Up to 40 characters');
		expect(input.getAttribute('aria-describedby')).toBe(`app-hint ${description.id} ${helper.id}`);
		expect(input).toHaveAccessibleDescription(
			expect.stringContaining('As on your passport Up to 40 characters')
		);
	});

	test('the error container is one alert, linked last, and a labelFor={false} control gets the same ids', () => {
		const { field } = mountField({
			required: true,
			description: 'Shown to everyone',
			helper: 'Optional nickname',
			labelFor: false,
			controlRole: 'combobox'
		});
		field.validate();
		flushSync();
		const control = screen.getByTestId('control');
		const alert = screen.getByRole('alert');
		expect(alert).not.toHaveAttribute('aria-live');
		expect(control.getAttribute('aria-describedby')).toBe(
			`${field.descriptionId} ${field.helperId} ${field.errorId}`
		);
		expect(field.controlAttrs['aria-describedby']).toBe(
			`${field.descriptionId} ${field.helperId} ${field.errorId}`
		);
		expect(control).toHaveAttribute('aria-labelledby', field.labelId);
	});
});

describe('RO-1 · read-only fields', () => {
	test('a read-only text field is focusable, says so, refuses edits and still validates', async () => {
		const onValueChange = vi.fn();
		renderInTheme(TextInput, {
			label: 'Name',
			readOnly: true,
			required: true,
			defaultValue: 'Ada',
			onValueChange
		});
		const input = screen.getByRole('textbox', { name: 'Name' });
		expect(input).toHaveAttribute('readonly');
		expect(input).not.toBeDisabled();
		expect(input.closest('[data-readonly]')).not.toBeNull();
		await fireEvent.input(input, { target: { value: 'Grace' } });
		expect(onValueChange).not.toHaveBeenCalled();
	});

	test('a read-only field still submits its value through Form', async () => {
		const onSubmit = await submitForm({
			name: { type: 'text', label: 'Name', readOnly: true, required: true, defaultValue: 'Ada' }
		});
		await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ name: 'Ada' }));
	});

	test('role-based controls get aria-readonly and refuse clicks', async () => {
		const onValueChange = vi.fn();
		renderInTheme(Checkbox, { label: 'Agree', readOnly: true, onValueChange });
		const checkbox = screen.getByRole('checkbox', { name: 'Agree' });
		expect(checkbox).toHaveAttribute('aria-readonly', 'true');
		expect(checkbox).not.toBeDisabled();
		await fireEvent.click(checkbox);
		expect(checkbox).toHaveAttribute('aria-checked', 'false');
		expect(onValueChange).not.toHaveBeenCalled();
	});

	test("RatingInput's deprecated readonly spelling still works", async () => {
		renderInTheme(RatingInput, { label: 'Score', readonly: true, defaultValue: 2 });
		const rating = screen.getByRole('slider', { name: 'Score' });
		expect(rating).toHaveAttribute('aria-readonly', 'true');
		expect(rating).toHaveAttribute('tabindex', '0');
		await fireEvent.keyDown(rating, { key: 'ArrowRight' });
		expect(rating).toHaveAttribute('aria-valuenow', '2');
	});
});

describe('FD-INFRA-3 · disabled and read-only groups', () => {
	test('a disabled Form disables every field and skips their validation', async () => {
		const onSubmit = vi.fn();
		renderInTheme(FieldHarness, {
			scenario: 'form',
			formDisabled: true,
			requiredEmpty: true,
			onSubmit
		});
		const outside = screen.getByRole('textbox', { name: 'Outside' });
		expect(outside).toBeDisabled();
		expect(screen.getByRole('textbox', { name: 'Email' })).toBeDisabled();
		expect(screen.getByRole('textbox', { name: 'Nickname' })).toBeDisabled();
		expect(outside.closest('[data-disabled]')).not.toBeNull();
		await fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
		await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
		expect(screen.queryByRole('alert')).not.toBeInTheDocument();
	});

	test('a FormGroup disables or locks only its own fields, as a native fieldset', async () => {
		const { rerender } = renderInTheme(FieldHarness, { scenario: 'form', groupDisabled: true });
		const email = screen.getByRole('textbox', { name: 'Email' });
		const outside = screen.getByRole('textbox', { name: 'Outside' });
		expect(email.closest('fieldset')).toBeDisabled();
		expect(email).toBeDisabled();
		expect(outside).not.toBeDisabled();

		await rerender({ groupDisabled: false, groupReadOnly: true });
		expect(email).not.toBeDisabled();
		expect(email).toHaveAttribute('readonly');
		expect(outside).not.toHaveAttribute('readonly');
	});

	test('a read-only Form makes every field read-only, still validates and submits', async () => {
		const onSubmit = vi.fn();
		const { rerender } = renderInTheme(FieldHarness, {
			scenario: 'form',
			formReadOnly: true,
			requiredEmpty: true,
			onSubmit
		});
		expect(screen.getByRole('textbox', { name: 'Outside' })).toHaveAttribute('readonly');
		await fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
		expect(await screen.findByRole('alert')).toHaveTextContent('This field is required');
		expect(onSubmit).not.toHaveBeenCalled();
		await rerender({ requiredEmpty: false });
		await fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
		await waitFor(() =>
			expect(onSubmit).toHaveBeenCalledWith({ outside: 'Ada', email: 'ada@example.com' })
		);
	});

	test('a disabled fieldset Field disables the fields inside it', async () => {
		const { rerender } = mountField({ scenario: 'fieldset' });
		const nested = screen.getByRole('textbox', { name: 'Nested' });
		expect(nested).not.toBeDisabled();
		await rerender({ disabled: true });
		expect(screen.getByTestId('field-root')).toBeDisabled();
		expect(nested).toBeDisabled();
	});
});

describe('FD-INFRA-2 · FD-4 · interaction state', () => {
	test('focus on any part of the field drives focused, and leaving sets touched', async () => {
		renderInTheme(TextArea, { label: 'Notes' });
		const textarea = screen.getByRole('textbox', { name: 'Notes' });
		const root = textarea.closest('[data-label-position]') as HTMLElement;
		textarea.focus();
		await tick();
		expect(root).toHaveAttribute('data-focused');
		expect(root).not.toHaveAttribute('data-touched');
		textarea.blur();
		await tick();
		expect(root).not.toHaveAttribute('data-focused');
		expect(root).toHaveAttribute('data-touched');
	});

	test('dirty and filled follow the value, with empty values equal', async () => {
		const { field } = mountField({ value: null });
		const control = screen.getByTestId('control');
		const root = screen.getByTestId('field-root');
		await tick();
		expect(root).not.toHaveAttribute('data-dirty');
		expect(root).not.toHaveAttribute('data-filled');
		await fireEvent.input(control, { target: { value: 'Ada' } });
		expect(root).toHaveAttribute('data-dirty');
		expect(root).toHaveAttribute('data-filled');
		await fireEvent.input(control, { target: { value: '' } });
		expect(field.dirty).toBe(false);
		expect(root).not.toHaveAttribute('data-dirty');
		expect(root).not.toHaveAttribute('data-filled');
	});

	test('a parent value update refreshes filled and dirty, and reset re-baselines', async () => {
		const { field, rerender } = mountField({ value: 'Ada' });
		await tick();
		expect(field.filled).toBe(true);
		expect(field.dirty).toBe(false);
		await rerender({ value: 'Grace' });
		expect(field.dirty).toBe(true);
		field.reset();
		flushSync();
		expect(field.value).toBe('Ada');
		expect(field.dirty).toBe(false);
		field.reset('Grace' as never);
		flushSync();
		expect(field.value).toBe('Grace');
		expect(field.dirty).toBe(false);
		expect(field.touched).toBe(false);
	});

	test('a checkbox is filled only while checked; data-invalid marks an errored field', async () => {
		renderInTheme(Checkbox, { label: 'Agree', errors: ['Needed'] });
		const checkbox = screen.getByRole('checkbox', { name: 'Agree' });
		const root = checkbox.closest('[data-label-position]') as HTMLElement;
		expect(root).toHaveAttribute('data-invalid');
		expect(root).not.toHaveAttribute('data-filled');
		await fireEvent.click(checkbox);
		expect(root).toHaveAttribute('data-filled');
	});
});

describe('CX-13a · focus state clears when the control is disabled or removed', () => {
	test('disabling the focused control clears focused', async () => {
		const { field, rerender } = mountField({});
		const control = screen.getByTestId('control');
		control.focus();
		await tick();
		expect(field.focused).toBe(true);
		await rerender({ disabled: true });
		expect(field.focused).toBe(false);
	});

	test('removing the focused control clears focused', async () => {
		const { field, rerender } = mountField({});
		screen.getByTestId('control').focus();
		await tick();
		expect(field.focused).toBe(true);
		await rerender({ showControl: false });
		await Promise.resolve();
		await tick();
		expect(field.focused).toBe(false);
	});
});

describe('CC-INFRA-3 · Field owns aria-required', () => {
	test('role-based controls announce required; native inputs keep required', () => {
		renderInTheme(Checkbox, { label: 'Agree', required: true });
		renderInTheme(Switch, { label: 'Alerts', labelPosition: 'top', required: true });
		renderInTheme(RadioInput, {
			label: 'Plan',
			required: true,
			items: [
				{ label: 'Free', value: 'free' },
				{ label: 'Pro', value: 'pro' }
			]
		});
		renderInTheme(Slider, { label: 'Volume', required: true });
		renderInTheme(TextInput, { label: 'Name', required: true });
		expect(screen.getByRole('checkbox', { name: 'Agree' })).toHaveAttribute(
			'aria-required',
			'true'
		);
		expect(screen.getByRole('switch', { name: 'Alerts' })).toHaveAttribute('aria-required', 'true');
		const group = screen.getByRole('radiogroup');
		expect(group).toHaveAttribute('aria-required', 'true');
		for (const radio of within(group).getAllByRole('radio')) {
			expect(radio).not.toHaveAttribute('aria-required');
		}
		expect(screen.getByRole('slider')).toHaveAttribute('aria-required', 'true');
		const name = screen.getByRole('textbox', { name: 'Name' });
		expect(name).toHaveAttribute('required');
		expect(name).not.toHaveAttribute('aria-required');
	});
});

describe('CC-INFRA-6 · accessible-name channel', () => {
	test('an aria-label on the control replaces the automatic aria-labelledby', () => {
		renderInTheme(Switch, {
			label: 'Email alerts',
			labelPosition: 'top',
			inputAttrs: { 'aria-label': 'Email: new comment' }
		});
		const control = screen.getByRole('switch', { name: 'Email: new comment' });
		expect(control).not.toHaveAttribute('aria-labelledby');
	});

	test('Field links a labelFor={false} label unless the control names itself', async () => {
		const { field, rerender } = mountField({ labelFor: false, controlRole: 'combobox' });
		const control = screen.getByTestId('control');
		expect(control).toHaveAttribute('aria-labelledby', field.labelId);
		await rerender({ controlLabel: 'Search people' });
		expect(control).not.toHaveAttribute('aria-labelledby');
		expect(control).toHaveAccessibleName('Search people');
	});

	test('a labelled Switch is named by its label element, with no aria-labelledby to repeat', () => {
		renderInTheme(Switch, { label: 'Notifications', labelPosition: 'top' });
		const control = screen.getByRole('switch', { name: 'Notifications' });
		expect(control).not.toHaveAttribute('aria-labelledby');
	});

	test('Checkbox forwards inputAttrs to its button', async () => {
		const onclick = vi.fn();
		renderInTheme(Checkbox, {
			label: 'Agree',
			inputAttrs: { 'aria-label': 'Agree to the terms', title: 'Terms', onclick }
		});
		const checkbox = screen.getByRole('checkbox', { name: 'Agree to the terms' });
		expect(checkbox).toHaveAttribute('title', 'Terms');
		await fireEvent.click(checkbox);
		expect(onclick).toHaveBeenCalledOnce();
		expect(checkbox).toHaveAttribute('aria-checked', 'true');
	});
});

describe('FD-8 · SC-19 · labels and containers focus the control', () => {
	test('clicking a non-native label focuses the control without activating it', async () => {
		renderInTheme(RatingInput, { label: 'Score' });
		await fireEvent.click(screen.getByText('Score'));
		expect(screen.getByRole('slider', { name: 'Score' })).toHaveFocus();
	});

	test('clicking a Select label focuses the trigger without opening it', async () => {
		renderInTheme(Select, {
			label: 'Plan',
			items: [
				{ value: 'free', label: 'Free' },
				{ value: 'pro', label: 'Pro' }
			]
		});
		const trigger = screen.getByRole('combobox', { name: 'Plan' });
		await fireEvent.click(screen.getByText('Plan'));
		expect(trigger).toHaveFocus();
		expect(trigger).toHaveAttribute('aria-expanded', 'false');
	});

	test('a press on the container padding focuses the text control; buttons keep theirs', async () => {
		mountField({});
		const control = screen.getByTestId('control');
		const container = control.parentElement as HTMLElement;
		const press = new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 0 });
		container.dispatchEvent(press);
		expect(press.defaultPrevented).toBe(true);
		expect(control).toHaveFocus();

		control.blur();
		const action = screen.getByRole('button', { name: 'Action' });
		const buttonPress = new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 0 });
		action.dispatchEvent(buttonPress);
		expect(buttonPress.defaultPrevented).toBe(false);
		expect(control).not.toHaveFocus();
	});
});

describe('review fixes · read-only primitives refuse their own edits', () => {
	test('a read-only CalendarInput keeps its selection and marks the grid read-only', async () => {
		const onValueChange = vi.fn();
		const { container } = renderInTheme(CalendarInput, {
			type: 'calendar',
			readOnly: true,
			defaultValue: new Date(2026, 9, 5, 12),
			onValueChange
		});
		const selected = () =>
			[...container.querySelectorAll('[data-selected]')].map((cell) =>
				cell.getAttribute('data-date')
			);
		expect(selected()).toEqual(['2026-10-05']);
		expect(container.querySelector('[role="grid"]')).toHaveAttribute('aria-readonly', 'true');
		await fireEvent.click(container.querySelector('[data-date="2026-10-20"]') as HTMLElement);
		expect(selected()).toEqual(['2026-10-05']);
		expect(onValueChange).not.toHaveBeenCalled();
	});

	test('an editable CalendarInput still selects', async () => {
		const onValueChange = vi.fn();
		const { container } = renderInTheme(CalendarInput, {
			type: 'calendar',
			defaultValue: new Date(2026, 9, 5, 12),
			onValueChange
		});
		await fireEvent.click(container.querySelector('[data-date="2026-10-20"]') as HTMLElement);
		expect(onValueChange).toHaveBeenCalledTimes(1);
		expect(container.querySelector('[role="grid"]')).not.toHaveAttribute('aria-readonly');
	});

	test('a read-only DateSelectorInput opens but keeps its date', async () => {
		const onValueChange = vi.fn();
		renderInTheme(DateSelectorInput, {
			readOnly: true,
			defaultOpen: true,
			defaultValue: new Date(2026, 9, 5, 12),
			onValueChange
		});
		const cell = await waitFor(() => {
			const node = document.querySelector('[data-date="2026-10-20"]');
			expect(node).not.toBeNull();
			return node as HTMLElement;
		});
		await fireEvent.click(cell);
		expect(onValueChange).not.toHaveBeenCalled();
		expect(document.querySelector('[data-selected]')?.getAttribute('data-date')).toBe('2026-10-05');
	});

	test('a read-only ColorPickerInput refuses typed colors and drags', async () => {
		const onValueChange = vi.fn();
		const { container } = renderInTheme(ColorPickerInput, {
			readOnly: true,
			defaultValue: '#ff0000',
			onValueChange
		});
		const hex = container.querySelector(
			'input[aria-label$="Value"], input[type="text"]'
		) as HTMLInputElement;
		expect(hex).toHaveAttribute('readonly');
		expect(hex.value).toBe('#ff0000');
		await fireEvent.focus(hex);
		await fireEvent.input(hex, { target: { value: '#00ff00' } });
		await fireEvent.keyDown(hex, { key: 'Enter' });
		expect(onValueChange).not.toHaveBeenCalled();
		expect(hex.value).toBe('#ff0000');
		const area = container.querySelector('[role="slider"]') as HTMLElement;
		expect(area).toHaveAttribute('aria-readonly', 'true');
		await fireEvent.keyDown(area, { key: 'ArrowLeft' });
		expect(onValueChange).not.toHaveBeenCalled();
	});

	test('a read-only RichTextInput is not content-editable', async () => {
		renderInTheme(RichTextInput, { readOnly: true, defaultValue: 'Hello', toolbar: 'fixed' });
		const editor = await screen.findByRole('textbox');
		await waitFor(() => expect(editor).toHaveAttribute('contenteditable', 'false'));
		expect(editor).toHaveAttribute('aria-readonly', 'true');
		expect(editor).toHaveAttribute('tabindex', '0');
		expect(document.querySelector('[data-slot="rich-text-input-toolbar"]')).toBeNull();
	});

	test('a read-only FileInput neither opens the chooser nor offers removal', async () => {
		const file = new File(['x'], 'notes.txt', { type: 'text/plain' });
		const { container } = renderInTheme(FileInput, {
			readOnly: true,
			clickable: true,
			defaultValue: file
		});
		const input = container.querySelector('input[type="file"]') as HTMLInputElement;
		const click = vi.spyOn(input, 'click');
		await fireEvent.click(container.querySelector('fieldset') as HTMLElement);
		expect(click).not.toHaveBeenCalled();
		const remove = container.querySelector('fieldset button') as HTMLButtonElement;
		expect(remove).toBeDisabled();
	});

	test('a read-only CheckboxesInput announces every option as read-only', () => {
		renderInTheme(CheckboxesInput, {
			label: 'Toppings',
			readOnly: true,
			items: [
				{ label: 'Cheese', value: 'cheese' },
				{ label: 'Olives', value: 'olives' }
			]
		});
		for (const box of screen.getAllByRole('checkbox')) {
			expect(box).toHaveAttribute('aria-readonly', 'true');
		}
	});
});

describe('review fixes · attributes the control also writes', () => {
	test('turning readOnly off clears aria-readonly on a Rating', async () => {
		const view = renderInTheme(RatingInput, { label: 'Score', readOnly: true, defaultValue: 2 });
		const rating = screen.getByRole('slider', { name: 'Score' });
		expect(rating).toHaveAttribute('aria-readonly', 'true');
		await view.rerender({ readOnly: false });
		await tick();
		expect(rating).not.toHaveAttribute('aria-readonly');
		await view.rerender({ readOnly: true });
		await tick();
		expect(rating).toHaveAttribute('aria-readonly', 'true');
	});

	test('turning required off clears aria-required on a Switch', async () => {
		const view = renderInTheme(Switch, { label: 'Alerts', labelPosition: 'top', required: true });
		const control = screen.getByRole('switch', { name: 'Alerts' });
		expect(control).toHaveAttribute('aria-required', 'true');
		await view.rerender({ required: false });
		await tick();
		expect(control).not.toHaveAttribute('aria-required');
	});
});

describe('review fixes · focused and locale', () => {
	test('a control writing focused=false while focus is still in the field does not clear it', async () => {
		const { field } = mountField({});
		const control = screen.getByTestId('control');
		control.focus();
		await tick();
		expect(field.focused).toBe(true);
		// A control blur handler fires before focus lands on the next part of the field.
		field.focused = false;
		expect(field.focused).toBe(true);
		screen.getByRole('button', { name: 'Action' }).focus();
		await tick();
		expect(field.focused).toBe(true);
		screen.getByRole('button', { name: 'After' }).focus();
		await tick();
		expect(field.focused).toBe(false);
		expect(field.touched).toBe(true);
	});

	test('a shown validation message is written again when the locale changes', async () => {
		let setLocale!: (locale: LocaleCode) => void;
		const { field } = mountField({
			required: true,
			onLocale: (next: (locale: LocaleCode) => void) => (setLocale = next)
		});
		field.validate();
		expect(errorsOf(field)).toEqual(['This field is required']);
		setLocale('fr');
		await tick();
		expect(errorsOf(field)).toEqual(['Ce champ est obligatoire']);
	});

	test('errors an app set are left alone when the locale changes', async () => {
		let setLocale!: (locale: LocaleCode) => void;
		const { field } = mountField({
			errors: ['Taken already'],
			onLocale: (next: (locale: LocaleCode) => void) => (setLocale = next)
		});
		setLocale('fr');
		await tick();
		expect(errorsOf(field)).toEqual(['Taken already']);
	});
});
