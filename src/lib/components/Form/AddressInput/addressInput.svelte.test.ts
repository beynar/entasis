// AddressInput as a field: the parts it shows and lets people edit, the search that fills them,
// the parts it requires, and its single entry in a Form or a native form.
import '@testing-library/jest-dom/vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/svelte';
import { describe, expect, test, vi } from 'vitest';
import type { Address, AddressProvider } from '../../Address/address.js';
import { renderInTheme } from '../../Theme/renderInTheme.test-helper.js';
import Form from '../Form/Form.svelte';
import type { FormState } from '../Form/form.state.svelte.js';
import AddressInputHarness from './AddressInputHarness.test.svelte';

const rivoli: Address = {
	line1: '12 Rue de Rivoli',
	line2: null,
	postalCode: '75004',
	city: 'Paris',
	region: 'Île-de-France',
	country: 'France',
	countryCode: 'FR',
	streetNumber: '12',
	street: 'Rue de Rivoli',
	formatted: '12 Rue de Rivoli, 75004 Paris, France',
	placeId: 'place-rivoli',
	location: { lat: 48.85, lng: 2.36 }
};

const fakeProvider = (resolved: Address | Error = rivoli) => {
	const provider = {
		search: vi.fn<AddressProvider['search']>(async () => [
			{ id: 'place-rivoli', label: '12 Rue de Rivoli', description: 'Paris, France' }
		]),
		resolve: vi.fn<AddressProvider['resolve']>(async () => {
			if (resolved instanceof Error) throw resolved;
			return resolved;
		})
	};
	return provider;
};

// The street line is a combobox while a provider searches, a textbox otherwise.
const input = (name: string) =>
	screen.queryByRole('textbox', { name: new RegExp(`^${name}`) }) ??
	screen.getByRole('combobox', { name: new RegExp(`^${name}`) });
const controls = (container: HTMLElement) =>
	[
		...within(container).queryAllByRole('textbox'),
		...within(container).queryAllByRole('combobox')
	].sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
const type = (name: string, value: string) => fireEvent.input(input(name), { target: { value } });
// The address's own alert. A missing part's input keeps its message in an error block the theme
// hides (`hidden`): jsdom loads no CSS, so those are left out by class here and checked in the
// browser test.
const addressAlert = () =>
	waitFor(() => {
		const [alert] = screen
			.getAllByRole('alert')
			.filter((node) => !node.classList.contains('hidden'));
		if (!alert) throw new Error('no address alert');
		return alert;
	});
const chooseRivoli = async () => {
	await fireEvent.focus(input('Street address'));
	await type('Street address', '12 rue de riv');
	await fireEvent.click(await screen.findByRole('option', { name: /12 Rue de Rivoli/ }));
};

describe('AddressInput', () => {
	test('a labelled fieldset of labelled parts, in the order asked, with autofill hints', () => {
		renderInTheme(AddressInputHarness, { label: 'Delivery address', provider: null });
		const group = screen.getByRole('group', { name: 'Delivery address' });
		expect(group.tagName).toBe('FIELDSET');
		const names = controls(group).map((element) => element.getAttribute('autocomplete'));
		// The country is a Combobox, which keeps the browser's own suggestions off.
		expect(names).toEqual([
			'address-line1',
			'address-line2',
			'postal-code',
			'address-level2',
			'off'
		]);
		expect(within(group).getByRole('combobox', { name: /Country/ })).toBeInTheDocument();
	});

	test('fields picks the parts and their order', () => {
		renderInTheme(AddressInputHarness, {
			label: 'Address',
			provider: null,
			fields: ['city', 'region']
		});
		const group = screen.getByRole('group', { name: 'Address' });
		expect(
			within(group)
				.getAllByRole('textbox')
				.map((element) => element.id)
		).toHaveLength(2);
		expect(input('City')).toBeInTheDocument();
		expect(input('State or region')).toBeInTheDocument();
		expect(screen.queryByRole('textbox', { name: /Street address/ })).toBeNull();
	});

	test('typing a part edits the value, in the default country', async () => {
		const onValueChange = vi.fn();
		renderInTheme(AddressInputHarness, {
			label: 'Address',
			provider: null,
			defaultCountry: 'fr',
			onValueChange
		});
		await type('City', 'Lyon');
		expect(onValueChange).toHaveBeenLastCalledWith(
			expect.objectContaining({ city: 'Lyon', countryCode: 'FR', country: 'France' })
		);
		// A defaulted country alone is no address.
		await type('City', '');
		expect(onValueChange).toHaveBeenLastCalledWith(null);
	});

	test('choosing a suggestion resolves it and fills every part, under one session', async () => {
		const provider = fakeProvider();
		const onResolve = vi.fn();
		const onValueChange = vi.fn();
		renderInTheme(AddressInputHarness, { label: 'Address', provider, onResolve, onValueChange });
		await chooseRivoli();

		await waitFor(() => expect(onResolve).toHaveBeenCalledWith(rivoli));
		expect(onValueChange).toHaveBeenLastCalledWith(rivoli);
		expect(input('Postal code')).toHaveValue('75004');
		expect(input('City')).toHaveValue('Paris');
		// A Combobox shows its selected option in place of the placeholder.
		expect(screen.getByRole('combobox', { name: /Country/ })).toHaveAttribute(
			'placeholder',
			'France'
		);

		const [query, searchRequest] = provider.search.mock.calls.at(-1)!;
		const [id, resolveRequest] = provider.resolve.mock.calls[0]!;
		expect(query).toBe('12 rue de riv');
		expect(id).toBe('place-rivoli');
		expect(resolveRequest.session).toBe(searchRequest.session);
		expect(searchRequest.language).toBe('en');
	});

	test('the search waits for three characters and passes the countries', async () => {
		const provider = fakeProvider();
		renderInTheme(AddressInputHarness, { label: 'Address', provider, countries: ['FR', 'BE'] });
		await fireEvent.focus(input('Street address'));
		await type('Street address', '12');
		await new Promise((resolve) => setTimeout(resolve, 250));
		expect(provider.search).not.toHaveBeenCalled();
		await type('Street address', '12 r');
		await waitFor(() => expect(provider.search).toHaveBeenCalled());
		expect(provider.search.mock.calls[0]![1].countries).toEqual(['FR', 'BE']);
	});

	test('a manual edit drops what no longer describes the address', async () => {
		const onValueChange = vi.fn();
		renderInTheme(AddressInputHarness, {
			label: 'Address',
			provider: null,
			defaultValue: rivoli,
			onValueChange
		});
		await type('City', 'Paris 4e');
		const edited = onValueChange.mock.calls.at(-1)![0] as Address;
		expect(edited).toMatchObject({
			city: 'Paris 4e',
			placeId: null,
			formatted: null,
			location: null
		});
		expect(edited.streetNumber).toBe('12');

		await type('Street address', '14 Rue de Rivoli');
		expect(onValueChange.mock.calls.at(-1)![0]).toMatchObject({
			line1: '14 Rue de Rivoli',
			streetNumber: null,
			street: null
		});
	});

	test('labels on the left: every part has its label on the left, on its own row, under the legend', () => {
		renderInTheme(AddressInputHarness, { label: 'Address', provider: null, labelPosition: 'left' });
		const group = screen.getByRole('group', { name: 'Address' });
		expect(group).toHaveAttribute('data-label-position', 'top');
		const parts = [...group.querySelectorAll('[data-slot="address-part"]')];
		expect(parts).toHaveLength(5);
		for (const part of parts) {
			expect(part.querySelector('[data-label-position]')).toHaveAttribute(
				'data-label-position',
				'left'
			);
			expect(part.className).not.toMatch(/@md:col-span/);
		}
	});

	test('the default layout puts the postal code and the city on one row, the city wider', () => {
		renderInTheme(AddressInputHarness, { label: 'Address', provider: null });
		const rows = [...document.querySelectorAll<HTMLElement>('[data-slot="address-row"]')];
		expect(
			rows.map((row) =>
				[...row.querySelectorAll('[data-part]')].map((part) => part.getAttribute('data-part'))
			)
		).toEqual([['line1'], ['line2'], ['postalCode', 'city'], ['country']]);
		expect(rows[2]!.style.getPropertyValue('--address-row-columns')).toBe(
			'minmax(0, 1fr) minmax(0, 2fr)'
		);
	});

	test('fields lays out custom rows, each part with its own label, hint and width', () => {
		renderInTheme(AddressInputHarness, {
			label: 'Address',
			provider: null,
			fields: [
				[
					{ field: 'line1', width: 3, label: 'Rue' },
					{ field: 'line2', label: 'Bâtiment', placeholder: 'Bât. B, 3e étage' }
				],
				['postalCode', 'city', 'region']
			]
		});
		const rows = [...document.querySelectorAll<HTMLElement>('[data-slot="address-row"]')];
		expect(rows).toHaveLength(2);
		expect(rows[0]!.style.getPropertyValue('--address-row-columns')).toBe(
			'minmax(0, 3fr) minmax(0, 1fr)'
		);
		expect(rows[1]!.style.getPropertyValue('--address-row-columns')).toBe(
			'minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr)'
		);
		expect(input('Rue')).toBeInTheDocument();
		expect(input('Bâtiment')).toHaveAttribute('placeholder', 'Bât. B, 3e étage');
		expect(screen.queryByRole('combobox', { name: /Country/ })).toBeNull();
	});

	test('a custom label names the missing part too', async () => {
		const onValueChange = vi.fn();
		renderInTheme(AddressInputHarness, {
			label: 'Address',
			provider: null,
			fields: ['line1', { field: 'city', label: 'Commune' }],
			requiredFields: ['city'],
			onValueChange
		});
		await type('Street address', '12 Rue de Rivoli');
		expect(input('Commune')).toHaveAttribute('required');
	});

	test('a part listed twice is refused', () => {
		expect(() =>
			renderInTheme(AddressInputHarness, {
				label: 'Address',
				provider: null,
				fields: ['city', ['city']]
			})
		).toThrow('AddressInput fields list the "city" part twice');
	});

	test('editableFields keeps the other parts read-only', () => {
		renderInTheme(AddressInputHarness, {
			label: 'Address',
			provider: null,
			defaultValue: rivoli,
			editableFields: ['line1', 'line2']
		});
		expect(input('Street address')).not.toHaveAttribute('readonly');
		expect(input('Apartment, suite, building')).not.toHaveAttribute('readonly');
		expect(input('Postal code')).toHaveAttribute('readonly');
		expect(input('City')).toHaveAttribute('readonly');
	});

	test('a failed resolve says so and keeps the parts editable', async () => {
		renderInTheme(AddressInputHarness, {
			label: 'Address',
			provider: fakeProvider(new Error('network'))
		});
		await chooseRivoli();
		expect(
			await screen.findByText('This address could not be loaded. Fill it in by hand.')
		).toBeInTheDocument();
		expect(input('City')).not.toHaveAttribute('readonly');
	});

	test('the search layout shows the chosen address on one line, and opens the parts on demand', async () => {
		renderInTheme(AddressInputHarness, {
			label: 'Office',
			provider: fakeProvider(),
			layout: 'search'
		});
		const search = screen.getByRole('combobox', { name: 'Search for an address' });
		expect(screen.queryByRole('textbox', { name: /City/ })).toBeNull();
		await fireEvent.focus(search);
		await fireEvent.input(search, { target: { value: '12 rue de riv' } });
		await fireEvent.click(await screen.findByRole('option', { name: /12 Rue de Rivoli/ }));
		await waitFor(() =>
			expect(search).toHaveValue('12 Rue de Rivoli, 75004 Paris, Île-de-France, France')
		);

		await fireEvent.click(screen.getByRole('button', { name: 'Enter the address manually' }));
		expect(input('City')).toHaveValue('Paris');
	});

	test('a native form submits each part under name[part]', () => {
		renderInTheme(AddressInputHarness, { label: 'Address', name: 'billing', defaultValue: rivoli });
		const data = new FormData(screen.getByTestId('form') as HTMLFormElement);
		expect(data.get('billing[line1]')).toBe('12 Rue de Rivoli');
		expect(data.get('billing[postalCode]')).toBe('75004');
		expect(data.get('billing[city]')).toBe('Paris');
		expect(data.get('billing[countryCode]')).toBe('FR');
		expect(data.get('billing[line2]')).toBeNull();
	});

	test('disabled disables every part', () => {
		renderInTheme(AddressInputHarness, { label: 'Address', provider: null, disabled: true });
		for (const element of controls(document.body)) expect(element).toBeDisabled();
	});
});

describe('AddressInput in a Form', () => {
	const renderForm = (inputs: Record<string, unknown>, onSubmit = vi.fn()) => {
		renderInTheme(Form, {
			inputs: inputs as never,
			actions: [{ children: 'Submit', onAction: (form: FormState) => form.submit() }],
			onSubmit
		});
		return onSubmit;
	};
	const submit = () => fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

	test('the address is the only entry: its part inputs are not Form fields', async () => {
		const onSubmit = renderForm({
			address: { type: 'address', label: 'Address', defaultValue: rivoli }
		});
		await submit();
		await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
		expect(onSubmit.mock.calls[0]![0]).toEqual({ address: rivoli });
	});

	test('a required address must be entered', async () => {
		const onSubmit = renderForm({
			address: { type: 'address', label: 'Address', provider: null, required: true }
		});
		await submit();
		expect(onSubmit).not.toHaveBeenCalled();
		expect(await addressAlert()).toHaveTextContent('This field is required');
		// Each required part is marked, with its own message.
		expect(input('City')).toHaveAttribute('aria-invalid', 'true');
		expect(input('City')).toHaveAccessibleDescription('Required: City');
		expect(input('Apartment, suite, building')).not.toHaveAttribute('aria-invalid');
	});

	test('a started address names the required parts it misses, and marks their inputs', async () => {
		const onSubmit = renderForm({
			address: { type: 'address', label: 'Address', provider: null, required: true }
		});
		await type('Street address', '12 Rue de Rivoli');
		await submit();
		expect(onSubmit).not.toHaveBeenCalled();
		const alert = await addressAlert();
		expect(alert).toHaveTextContent('Required: Postal code');
		expect(alert).toHaveTextContent('Required: City');
		expect(alert).toHaveTextContent('Required: Country');
		expect(input('Postal code')).toHaveAttribute('aria-invalid', 'true');
		expect(input('Street address')).not.toHaveAttribute('aria-invalid');
	});

	test('requiredFields chooses the parts that must be filled', async () => {
		const onSubmit = renderForm({
			address: { type: 'address', label: 'Address', provider: null, requiredFields: ['city'] }
		});
		await type('Street address', '12 Rue de Rivoli');
		await submit();
		expect(await addressAlert()).toHaveTextContent('Required: City');
		await type('City', 'Paris');
		await submit();
		await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
	});
});

describe('AddressInput’s built-in search', () => {
	const respond = (body: unknown, status = 200) =>
		new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

	test('without a provider it searches Google Places through /api/places', async () => {
		const fetch = vi.fn(async (url: string) =>
			url.endsWith('places:autocomplete')
				? respond({
						suggestions: [
							{
								placePrediction: {
									placeId: 'place-rivoli',
									structuredFormat: {
										mainText: { text: '12 Rue de Rivoli' },
										secondaryText: { text: 'Paris, France' }
									}
								}
							}
						]
					})
				: respond({
						id: 'place-rivoli',
						formattedAddress: '12 Rue de Rivoli, 75004 Paris, France',
						addressComponents: [
							{ longText: '12', types: ['street_number'] },
							{ longText: 'Rue de Rivoli', types: ['route'] },
							{ longText: 'Paris', types: ['locality'] },
							{ longText: '75004', types: ['postal_code'] },
							{ longText: 'France', shortText: 'FR', types: ['country'] }
						]
					})
		);
		vi.stubGlobal('fetch', fetch);
		try {
			renderInTheme(AddressInputHarness, { label: 'Address' });
			await chooseRivoli();
			await waitFor(() => expect(input('City')).toHaveValue('Paris'));
			expect(fetch.mock.calls[0]![0]).toBe('/api/places/places:autocomplete');
			expect(String(fetch.mock.calls.at(-1)![0])).toMatch(/^\/api\/places\/places\/place-rivoli\?/);
		} finally {
			vi.unstubAllGlobals();
		}
	});

	test('provider={null} turns the search off: the street line is a plain input', () => {
		renderInTheme(AddressInputHarness, { label: 'Address', provider: null });
		expect(screen.getByRole('textbox', { name: /Street address/ })).toBeInTheDocument();
		expect(screen.queryByRole('combobox', { name: /Street address/ })).toBeNull();
	});
});
