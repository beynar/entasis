import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';
import PhoneInputCountryPickerHarness from './PhoneInputCountryPickerHarness.test.svelte';
import type { PhoneCountryOption } from './phoneInputCountry.js';

const countries: PhoneCountryOption[] = [
	{ iso2: 'fr', name: 'France', dialCode: '33', flag: '🇫🇷', searchText: 'france fr +33' },
	{ iso2: 'de', name: 'Germany', dialCode: '49', flag: '🇩🇪', searchText: 'germany de +49' }
];

const scrollIntoView = Element.prototype.scrollIntoView;
beforeAll(() => {
	Element.prototype.scrollIntoView = vi.fn();
});
afterAll(() => {
	Element.prototype.scrollIntoView = scrollIntoView;
});

const renderPicker = () =>
	render(PhoneInputCountryPickerHarness, {
		props: {
			id: 'picker',
			countries,
			selectedCountry: null,
			searchPlaceholder: 'Search countries',
			onSelectCountry: () => {}
		}
	});

const listbox = () => document.getElementById('picker-listbox')!;

describe('PhoneInput country listbox', () => {
	test('owns only options while countries match', () => {
		renderPicker();

		const children = Array.from(listbox().children);
		expect(children).toHaveLength(2);
		expect(children.every((child) => child.getAttribute('role') === 'option')).toBe(true);
		expect(screen.getByRole('status')).toBeEmptyDOMElement();
	});

	test('announces an empty search through a status outside the listbox', async () => {
		renderPicker();
		// The live region exists, empty, before the search empties the list: screen readers skip a
		// region that mounts already filled.
		const status = screen.getByRole('status');
		expect(status).toBeEmptyDOMElement();

		await fireEvent.input(screen.getByPlaceholderText('Search countries'), {
			target: { value: 'atlantis' }
		});

		await waitFor(() => expect(status).toHaveTextContent('No countries found'));
		expect(screen.getByRole('status')).toBe(status);
		expect(listbox().contains(status)).toBe(false);
		// The empty listbox stays mounted for the search input's aria-controls, but hidden.
		await waitFor(() => expect(listbox()).toHaveAttribute('hidden'));
		expect(listbox().children).toHaveLength(0);
	});

	test('collapses the search combobox while the listbox is hidden', async () => {
		renderPicker();
		const input = screen.getByPlaceholderText('Search countries');
		await waitFor(() => expect(input).toHaveAttribute('aria-expanded', 'true'));
		expect(input).toHaveAttribute('aria-controls', 'picker-listbox');

		await fireEvent.input(input, { target: { value: 'atlantis' } });
		await waitFor(() => expect(listbox()).toHaveAttribute('hidden'));
		expect(input).toHaveAttribute('aria-expanded', 'false');
		expect(input).not.toHaveAttribute('aria-activedescendant');

		await fireEvent.input(input, { target: { value: 'fra' } });
		await waitFor(() => expect(listbox()).not.toHaveAttribute('hidden'));
		expect(input).toHaveAttribute('aria-expanded', 'true');
	});
});
