import { render } from 'svelte/server';
import { describe, expect, test, vi } from 'vitest';
import { fr } from './fr.js';
import I18nHarness from './I18nHarness.test.svelte';

describe('I18n server rendering', () => {
	test('renders a preloaded catalog on the server', () => {
		const { body } = render(I18nHarness, { props: { locale: 'fr', catalogs: { fr } } });

		expect(body).toContain('Précédent');
	});

	test('renders English for a locale without a catalog, and says how to fix it', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const { body } = render(I18nHarness, { props: { locale: 'de' } });

		expect(body).toContain('Previous');
		expect(warn).toHaveBeenCalledWith(expect.stringContaining('catalogs={{ ... }}'));
		warn.mockRestore();
	});
});
