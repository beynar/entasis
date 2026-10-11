import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';
import { renderInTheme } from '../Theme/renderInTheme.test-helper.js';
import Command from './Command.svelte';
import CommandLocaleHarness from './CommandLocaleHarness.test.svelte';

const scrollIntoView = Element.prototype.scrollIntoView;
beforeAll(() => {
	Element.prototype.scrollIntoView = vi.fn();
});
afterAll(() => {
	Element.prototype.scrollIntoView = scrollIntoView;
});

const items = [
	{
		heading: 'Desserts',
		items: [
			{ value: 'eclair', label: 'Éclair au café' },
			{ value: 'creme', label: 'Crème brûlée', keywords: ['custard'] },
			{ value: 'tart', label: 'Lemon tart' }
		]
	}
];

const optionLabels = () =>
	screen.queryAllByRole('option').map((option) => option.textContent?.trim());

describe('Command default filter', () => {
	test('ignores case and accents in labels, keywords and values', async () => {
		renderInTheme(Command, { items });
		const input = screen.getByRole('combobox');

		await fireEvent.input(input, { target: { value: 'CAFE' } });
		expect(optionLabels()).toEqual(['Éclair au café']);

		await fireEvent.input(input, { target: { value: 'brulee' } });
		expect(optionLabels()).toEqual(['Crème brûlée']);

		await fireEvent.input(input, { target: { value: 'CUSTARD' } });
		expect(optionLabels()).toEqual(['Crème brûlée']);

		await fireEvent.input(input, { target: { value: 'tárt' } });
		expect(optionLabels()).toEqual(['Lemon tart']);

		await fireEvent.input(input, { target: { value: 'pie' } });
		expect(optionLabels()).toEqual([]);
	});

	test('a custom filter still replaces the default', async () => {
		const filter = vi.fn((item: { value: string }, search: string) => item.value === search);
		renderInTheme(Command, { items, filter });
		await fireEvent.input(screen.getByRole('combobox'), { target: { value: 'tart' } });
		expect(optionLabels()).toEqual(['Lemon tart']);
		expect(filter).toHaveBeenCalled();
	});
});

describe('Command default filter locale', () => {
	const drinks = [
		{
			heading: 'Drinks',
			items: [
				{ value: 'colada', label: 'Piña colada' },
				{ value: 'punch', label: 'Planter punch' }
			]
		}
	];

	test('compares text in the active I18n locale', async () => {
		// English reads ñ as an accented n; Spanish sorts it as a letter of its own.
		const { unmount } = render(CommandLocaleHarness, { locale: 'en', items: drinks });
		await fireEvent.input(screen.getByRole('combobox'), { target: { value: 'pina' } });
		expect(optionLabels()).toEqual(['Piña colada']);
		unmount();

		render(CommandLocaleHarness, { locale: 'es', items: drinks });
		const input = screen.getByRole('combobox');
		await fireEvent.input(input, { target: { value: 'pina' } });
		expect(optionLabels()).toEqual([]);
		await fireEvent.input(input, { target: { value: 'PIÑA' } });
		expect(optionLabels()).toEqual(['Piña colada']);
	});
});
