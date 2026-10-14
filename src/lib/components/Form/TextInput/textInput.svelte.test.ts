import '@testing-library/jest-dom/vitest';
import { fireEvent, screen } from '@testing-library/svelte';
import { describe, expect, test, vi } from 'vitest';
import TextInput from './TextInput.svelte';
import { renderInTheme } from '../../Theme/renderInTheme.test-helper.js';
import AIModelSelector from '../../AIModelSelector/AIModelSelector.svelte';
import DataTable from '../../DataTable/DataTable.svelte';
import type { DataTableProps } from '../../DataTable/dataTable.props.js';
import PhoneInputCountryPicker from '../PhoneInput/PhoneInputCountryPicker.svelte';

describe('TextInput password-manager interop', () => {
	test('leaves password managers and autofill enabled by default', () => {
		renderInTheme(TextInput, { label: 'Email', type: 'email' });

		expect(screen.getByRole('textbox', { name: 'Email' })).not.toHaveAttribute('data-1p-ignore');
	});

	test('honours an opt-out passed through inputAttrs', () => {
		renderInTheme(TextInput, {
			label: 'Search the docs',
			inputAttrs: { 'data-1p-ignore': true, autocomplete: 'off' }
		});

		const input = screen.getByRole('textbox', { name: 'Search the docs' });
		expect(input).toHaveAttribute('data-1p-ignore');
		expect(input).toHaveAttribute('autocomplete', 'off');
	});

	test('forwards the autocomplete token a sign-in form needs', () => {
		renderInTheme(TextInput, {
			label: 'Email',
			type: 'email',
			inputAttrs: { autocomplete: 'username' }
		});

		expect(screen.getByRole('textbox', { name: 'Email' })).toHaveAttribute(
			'autocomplete',
			'username'
		);
	});
});

type Person = { id: string; name: string };

// DataTable is generic, and `renderInTheme` cannot carry its row type through, so the props are
// checked against DataTableProps<Person> here.
const renderPeopleTable = (props: Omit<DataTableProps<Person>, 'items' | 'getRowId'>) =>
	renderInTheme(DataTable, {
		items: [{ id: '1', name: 'Ada' }],
		getRowId: (row: Person) => row.id,
		virtualize: false,
		...props
	} as unknown as DataTableProps<object>);

// TextInput no longer opts out of password managers, so the library's own search fields, which
// are not credentials and sit beside their own listboxes, keep the opt-out explicitly.
describe('library search fields built on TextInput', () => {
	test('the PhoneInput country search keeps the 1Password opt-out', () => {
		renderInTheme(PhoneInputCountryPicker, {
			countries: [{ iso2: 'fr', name: 'France', dialCode: '33', flag: '' }],
			selectedCountry: null,
			searchPlaceholder: 'Search countries',
			onSelectCountry: vi.fn()
		});

		expect(screen.getByPlaceholderText('Search countries')).toHaveAttribute('data-1p-ignore');
	});

	test('the AIModelSelector search keeps the 1Password opt-out', () => {
		renderInTheme(AIModelSelector, {
			models: [{ id: 'small', label: 'Small model' }],
			defaultOpen: true,
			labels: { searchPlaceholder: 'Search models' }
		});

		expect(screen.getByPlaceholderText('Search models')).toHaveAttribute('data-1p-ignore');
	});

	test('the DataTable toolbar search keeps the 1Password opt-out', () => {
		renderPeopleTable({
			columns: [{ id: 'name', accessor: 'name', header: 'Name' }],
			search: { placeholder: 'Search people' }
		});

		expect(screen.getByPlaceholderText('Search people')).toHaveAttribute('data-1p-ignore');
	});

	test('the DataTable column filter and cell editor keep the 1Password opt-out', async () => {
		renderPeopleTable({
			columns: [
				{
					id: 'name',
					accessor: 'name',
					header: 'Name',
					filter: { type: 'text', placeholder: 'Filter names' },
					editor: { type: 'text', placeholder: 'Edit name' }
				}
			],
			search: false,
			onCellCommit: vi.fn()
		});

		await fireEvent.click(screen.getByRole('button', { name: 'Column options for Name' }));
		expect(await screen.findByPlaceholderText('Filter names')).toHaveAttribute('data-1p-ignore');

		await fireEvent.dblClick(screen.getByText('Ada'));
		expect(await screen.findByPlaceholderText('Edit name')).toHaveAttribute('data-1p-ignore');
	});
});
