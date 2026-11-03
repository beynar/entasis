// A component that starts from a `null` or `false` default does not write it into a parent's
// `undefined` binding on the server, and a bound `api` is published in the browser only. Each such
// write made Svelte render the parent's markup a second time; the HTML is the same either way.
import { createRawSnippet, type Component } from 'svelte';
import { render } from 'svelte/server';
import { describe, expect, test } from 'vitest';
import Harness from './BoundDefaultHarness.test.svelte';

const items = [
	{ value: 'a', label: 'A' },
	{ value: 'b', label: 'B' }
];
const area = createRawSnippet(() => ({ render: () => '<div>Area</div>' }));
const load = async (path: string) =>
	(await import(/* @vite-ignore */ path)).default as Component<Record<string, unknown>>;

async function serverRender(
	component: Component<Record<string, unknown>>,
	props: Record<string, unknown>,
	start: undefined | null | false,
	binding: 'value' | 'open' | 'api' = 'value'
) {
	let passes = 0;
	const { body } = await render(Harness, {
		props: { component, props, start, binding, onPass: () => (passes += 1) }
	});
	return { passes, body };
}

type Case = [name: string, path: string, props?: Record<string, unknown>];

const nullDefaults: Case[] = [
	['AddressInput', './Form/AddressInput/AddressInput.svelte'],
	['Autocomplete', './Form/Autocomplete/Autocomplete.svelte', { items }],
	['CalendarInput', './Form/Calendar/CalendarInput.svelte'],
	['ColorInput', './Form/ColorInput/ColorInput.svelte'],
	['ColorPickerInput', './Form/ColorPicker/ColorPickerInput.svelte'],
	['Combobox', './Form/Combobox/Combobox.svelte', { items }],
	['DateInput', './Form/DateInput/DateInput.svelte'],
	['DateSelectorInput', './Form/DateSelector/DateSelectorInput.svelte'],
	['FileInput', './Form/File/FileInput.svelte'],
	['KeyValueInput', './Form/KeyValueInput/KeyValueInput.svelte'],
	['NumberInput', './Form/NumberInput/NumberInput.svelte'],
	['Password', './Form/PasswordInput/Password.svelte'],
	['PhoneInput', './Form/PhoneInput/PhoneInput.svelte'],
	['PinInput', './Form/PinInput/PinInput.svelte'],
	['RadioInput', './Form/RadioInput/RadioInput.svelte', { items }],
	['RatingInput', './Form/RatingInput/RatingInput.svelte'],
	['Select', './Form/Select/Select.svelte', { items }],
	['SignatureInput', './Form/SignatureInput/SignatureInput.svelte'],
	['Switch', './Form/Switch/Switch.svelte'],
	['TagsInput', './Form/TagsInput/TagsInput.svelte'],
	['TextInput', './Form/TextInput/TextInput.svelte'],
	['TimeInput', './Form/TimeInput/TimeInput.svelte']
];

const closedByDefault: Case[] = [
	['Autocomplete', './Form/Autocomplete/Autocomplete.svelte', { label: 'Field', items }],
	['Collapsible', './Collapsible/Collapsible.svelte', { title: 'More' }],
	['Combobox', './Form/Combobox/Combobox.svelte', { label: 'Field', items }],
	['Command', './Command/Command.svelte', { items: [{ heading: 'Group', items }] }],
	['ContextMenu', './ContextMenu/ContextMenu.svelte', { items, children: area }],
	['DateSelector', './Form/DateSelector/DateSelector.svelte'],
	['Dialog', './Dialog/Dialog.svelte', { title: 'Hi' }],
	['HoverCard', './HoverCard/HoverCard.svelte'],
	['Popover', './Popover/Popover.svelte'],
	['PopupMenu', './PopupMenu/PopupMenu.svelte', { menu: { items } }],
	['Select', './Form/Select/Select.svelte', { label: 'Field', items }],
	['TagsInput', './Form/TagsInput/TagsInput.svelte', { label: 'Field' }],
	['Tooltip', './Tooltip/Tooltip.svelte', { content: 'Tip', trigger: { content: 'Open' } }]
];

describe('bound defaults on the server', () => {
	test.each(nullDefaults)(
		'%s renders once for bind:value={undefined}, as for null',
		async (_, path, extra = {}) => {
			const component = await load(path);
			const props = { label: 'Field', ...extra };
			const unset = await serverRender(component, props, undefined);
			const empty = await serverRender(component, props, null);
			expect(unset.passes).toBe(1);
			expect(unset.body).toBe(empty.body);
		}
	);

	test('a default with meaning is still written, so the parent renders with it', async () => {
		const component = await load('./Form/TextArea/TextArea.svelte');
		const { passes } = await serverRender(component, { label: 'Field' }, undefined);
		expect(passes).toBe(2);
	});

	test('Checkbox renders once for bind:value={undefined}, as for false', async () => {
		const component = await load('./Form/Checkbox/Checkbox.svelte');
		const unset = await serverRender(component, { label: 'Field' }, undefined);
		const unchecked = await serverRender(component, { label: 'Field' }, false);
		expect(unset.passes).toBe(1);
		expect(unset.body).toBe(unchecked.body);
	});

	test.each(closedByDefault)(
		'%s renders once for bind:open={undefined}, as for false',
		async (_, path, props = {}) => {
			const component = await load(path);
			const unset = await serverRender(component, props, undefined, 'open');
			const closed = await serverRender(component, props, false, 'open');
			expect(unset.passes).toBe(1);
			expect(unset.body).toBe(closed.body);
		}
	);

	test.each([
		['Stepper', './Stepper/Stepper.svelte', { items: [{ title: 'One' }, { title: 'Two' }] }],
		[
			'Tabs',
			'./Tabs/Tabs.svelte',
			{ items: [{ value: 'a', label: 'A', content: 'A' }], value: 'a' }
		],
		[
			'DataTable',
			'./DataTable/DataTable.svelte',
			{
				items: [{ id: 1 }],
				getRowId: (row: { id: number }) => String(row.id),
				columns: [{ id: 'id', accessor: 'id', header: 'Id' }]
			}
		]
	] as [string, string, Record<string, unknown>][])(
		'%s publishes bind:api in the browser only',
		async (_, path, props) => {
			const component = await load(path);
			const { passes } = await serverRender(component, props, undefined, 'api');
			expect(passes).toBe(1);
		}
	);
});
