import { describe, expect, test } from 'vitest';
import { completeInline, normalizeItems, normalizeSource } from './autocomplete.items.js';

describe('normalizeItems', () => {
	test('turns strings into options and keeps options, groups and their order', () => {
		const option = { value: 'x', label: 'Ex', description: 'Letter', data: { n: 1 } };
		const other = { value: 'y', label: 'Why' };
		expect(normalizeItems(['Plain', option, { label: 'Group', items: ['Inside', other] }])).toEqual(
			[
				{ value: 'Plain', label: 'Plain' },
				option,
				{
					label: 'Group',
					items: [{ value: 'Inside', label: 'Inside' }, other]
				}
			]
		);
	});

	test('a repeated value keeps its first entry, across groups too, and drops emptied groups', () => {
		expect(
			normalizeItems([
				'Paris',
				'Paris',
				{ label: 'Recent', items: ['Paris', 'Pau'] },
				{ label: 'Again', items: ['Pau'] },
				{ label: 'None', items: [] }
			])
		).toEqual([
			{ value: 'Paris', label: 'Paris' },
			{ label: 'Recent', items: [{ value: 'Pau', label: 'Pau' }] },
			{ label: 'None', items: [] }
		]);
	});

	test('an async source has its result normalized and receives the text and signal', async () => {
		const seen: unknown[] = [];
		const source = normalizeSource(async (query, request) => {
			seen.push(query, request.signal);
			return ['One'];
		});
		expect(typeof source).toBe('function');
		const signal = new AbortController().signal;
		const items = await (source as (q: string, r: { signal: AbortSignal }) => unknown)('o', {
			signal
		});
		expect(items).toEqual([{ value: 'One', label: 'One' }]);
		expect(seen).toEqual(['o', signal]);
		expect(normalizeSource(undefined)).toBeUndefined();
	});
});

describe('completeInline', () => {
	test('a label that continues the text keeps the typed letters and selects the rest', () => {
		expect(completeInline('Apple', 'ap', 'en')).toEqual({
			text: 'apple',
			selectionStart: 2,
			selectionEnd: 5,
			continues: true
		});
	});

	test('accents and case do not stop a label from continuing the text', () => {
		const completion = completeInline('Éclair', 'ecl', 'en');
		expect(completion).toMatchObject({ text: 'eclair', selectionStart: 3, selectionEnd: 6 });
		expect(completion?.continues).toBe(true);
	});

	test('a label that only contains the text replaces it, with the caret at the end', () => {
		expect(completeInline('Mango', 'ang', 'en')).toEqual({
			text: 'Mango',
			selectionStart: 5,
			selectionEnd: 5,
			continues: false
		});
	});

	test('nothing is previewed when the label reads the same as the text', () => {
		expect(completeInline('Apple', 'apple', 'en')).toBeNull();
	});

	test('empty text does not count as continued', () => {
		expect(completeInline('Apple', '', 'en')).toMatchObject({ text: 'Apple', continues: false });
	});
});
