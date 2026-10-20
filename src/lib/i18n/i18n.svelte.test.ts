import '@testing-library/jest-dom/vitest';
import { render } from '@testing-library/svelte';
import { describe, expect, test } from 'vitest';
import { fr } from './fr.js';
import I18nHarness from './I18nHarness.test.svelte';

describe('I18n catalogs', () => {
	test('renders a preloaded catalog immediately', () => {
		const { getByTestId } = render(I18nHarness, { props: { locale: 'fr', catalogs: { fr } } });

		expect(getByTestId('probe')).toHaveTextContent('Précédent');
	});

	test('loads a locale missing from catalogs, showing English until it arrives', async () => {
		const { getByTestId, findByText } = render(I18nHarness, { props: { locale: 'de' } });

		expect(getByTestId('probe')).toHaveTextContent('Previous');
		expect(await findByText('Zurück')).toBe(getByTestId('probe'));
	});

	test('keeps the previous catalog while a switched-to locale loads', async () => {
		const { getByTestId, findByText, rerender } = render(I18nHarness, {
			props: { locale: 'fr', catalogs: { fr } }
		});

		await rerender({ locale: 'es', catalogs: { fr } });
		expect(getByTestId('probe')).toHaveTextContent('Précédent');
		expect(await findByText('Anterior')).toBe(getByTestId('probe'));
	});

	test('applies per-key overrides on top of the catalog', () => {
		const { getByTestId } = render(I18nHarness, {
			props: { locale: 'fr', catalogs: { fr }, messages: { previous: 'Avant' } }
		});

		expect(getByTestId('probe')).toHaveTextContent('Avant');
	});
});
