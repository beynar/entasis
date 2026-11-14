// Contract: the id an author gives a value control names its focusable element, and the field's
// label, description and error wiring follow it. Every control is mounted with an author id and a
// description; the element carrying the id takes focus, its label points to it, and the ids it is
// described by exist. A group (a radio group, a set of checkboxes, a fieldset of inputs) has no
// single focusable element: the fieldset itself carries the id and its legend names it.
import { describe, expect, test } from 'vitest';
import type { Component } from 'svelte';
import { render } from 'vitest-browser-svelte';
import ThemeProviderHarness from '../Theme/ThemeProviderHarness.test.svelte';
import RichTextInput from '../RichTextInput/RichTextInput.svelte';
import AddressInput from './AddressInput/AddressInput.svelte';
import Autocomplete from './Autocomplete/Autocomplete.svelte';
import CalendarInput from './Calendar/CalendarInput.svelte';
import Checkbox from './Checkbox/Checkbox.svelte';
import CheckboxesInput from './CheckboxesInput/CheckboxesInput.svelte';
import ColorInput from './ColorInput/ColorInput.svelte';
import ColorPickerInput from './ColorPicker/ColorPickerInput.svelte';
import Combobox from './Combobox/Combobox.svelte';
import DateInput from './DateInput/DateInput.svelte';
import FileInput from './File/FileInput.svelte';
import JsonEditor from './JsonEditor/JsonEditor.svelte';
import KeyValueInput from './KeyValueInput/KeyValueInput.svelte';
import NumberInput from './NumberInput/NumberInput.svelte';
import PasswordInput from './PasswordInput/Password.svelte';
import PhoneInput from './PhoneInput/PhoneInput.svelte';
import PinInput from './PinInput/PinInput.svelte';
import RadioInput from './RadioInput/RadioInput.svelte';
import RatingInput from './RatingInput/RatingInput.svelte';
import Select from './Select/Select.svelte';
import SignatureInput from './SignatureInput/SignatureInput.svelte';
import Slider from './Slider/Slider.svelte';
import Switch from './Switch/Switch.svelte';
import TagGroup from './TagGroup/TagGroup.svelte';
import TagsInput from './TagsInput/TagsInput.svelte';
import TextArea from './TextArea/TextArea.svelte';
import TextInput from './TextInput/TextInput.svelte';
import TimeInput from './TimeInput/TimeInput.svelte';
import VoiceInput from './VoiceInput/VoiceInput.svelte';

/**
 * How the label reaches the element: a `<label for>`, an `aria-labelledby` reference to the
 * field label, or, for a group, the fieldset's own legend.
 */
type Labelling = 'for' | 'labelledby' | 'group';

type Case = [
	name: string,
	component: unknown,
	labelling: Labelling,
	props?: Record<string, unknown>
];

const options = [
	{ value: 'a', label: 'Alpha' },
	{ value: 'b', label: 'Beta' }
];

// DateSelectorInput is left out on purpose: its documented `id` names the selector popover.
const cases: Case[] = [
	['TextInput', TextInput, 'for'],
	['TextArea', TextArea, 'for'],
	['PasswordInput', PasswordInput, 'for'],
	['NumberInput', NumberInput, 'for'],
	['Autocomplete', Autocomplete, 'for', { items: ['Alpha', 'Beta'] }],
	['Combobox', Combobox, 'for', { items: options }],
	['Select', Select, 'labelledby', { items: options }],
	['Switch', Switch, 'for'],
	['Checkbox', Checkbox, 'for', { labelPosition: 'top' }],
	['DateInput', DateInput, 'for'],
	['TimeInput', TimeInput, 'for'],
	['PhoneInput', PhoneInput, 'for'],
	['ColorInput', ColorInput, 'for'],
	['TagsInput', TagsInput, 'for'],
	['PinInput', PinInput, 'for'],
	['RatingInput', RatingInput, 'labelledby'],
	['Slider', Slider, 'for'],
	['SignatureInput', SignatureInput, 'labelledby'],
	['VoiceInput', VoiceInput, 'for'],
	['RichTextInput', RichTextInput, 'for'],
	['RadioInput', RadioInput, 'group', { items: options }],
	['CheckboxesInput', CheckboxesInput, 'group', { items: options }],
	['TagGroup', TagGroup, 'group', { items: options }],
	['CalendarInput', CalendarInput, 'group'],
	['ColorPickerInput', ColorPickerInput, 'group'],
	['KeyValueInput', KeyValueInput, 'group'],
	['JsonEditor', JsonEditor, 'group'],
	['FileInput', FileInput, 'group'],
	['AddressInput', AddressInput, 'group']
];

const mount = (component: unknown, props: Record<string, unknown>) =>
	render(ThemeProviderHarness, {
		props: { component: component as Component<Record<string, unknown>>, ...props }
	});

const idsOf = (element: Element, attribute: string) =>
	element.getAttribute(attribute)?.split(/\s+/).filter(Boolean) ?? [];

describe('a value control renders the id its author gives it', () => {
	test.each(cases)('%s', async (name, component, labelling, props = {}) => {
		const id = `author-${name.toLowerCase()}`;
		await mount(component, { ...props, id, label: `${name} label`, description: 'Shown below' });

		await expect.poll(() => document.getElementById(id)).not.toBeNull();
		const element = document.getElementById(id)!;
		expect(document.querySelectorAll(`[id="${id}"]`)).toHaveLength(1);
		const label = document.getElementById(`${id}-label`);
		expect(label?.textContent).toContain(`${name} label`);
		// The description the field renders is referenced by its id, which follows the author's.
		// Checked before focusing: a tooltip shown on focus takes over aria-describedby meanwhile.
		await expect.poll(() => idsOf(element, 'aria-describedby')).toContain(`${id}-description`);
		expect(document.getElementById(`${id}-description`)?.textContent).toContain('Shown below');

		if (labelling === 'group') {
			expect(element.tagName).toBe('FIELDSET');
			expect(label?.tagName).toBe('LEGEND');
			expect(label?.parentElement).toBe(element);
		} else {
			element.focus();
			expect(document.activeElement).toBe(element);
			if (labelling === 'for') {
				expect(label?.tagName).toBe('LABEL');
				expect(label?.getAttribute('for')).toBe(id);
			} else {
				expect(idsOf(element, 'aria-labelledby')).toContain(`${id}-label`);
			}
		}
	});

	test('an id in the native attributes names the element too', async () => {
		await mount(TextInput, { label: 'Email', inputAttrs: { id: 'native-email' } as never });
		const input = document.getElementById('native-email');
		expect(input?.tagName).toBe('INPUT');
		expect(document.querySelector('label[for="native-email"]')?.textContent).toContain('Email');
	});
});
