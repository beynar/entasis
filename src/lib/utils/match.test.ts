import { describe, expect, test } from 'vitest';
import { createItemMatcher, getItemSearchTexts, matchItem } from './match.js';

describe('matchItem', () => {
	test('searches label, keywords and value, ignoring case and accents', () => {
		const item = { label: 'Crème brûlée', keywords: ['dessert', 'custard'], value: 'creme-brulee' };
		expect(matchItem(item, 'BRULEE')).toBe(true);
		expect(matchItem(item, 'custard')).toBe(true);
		expect(matchItem(item, 'creme-b')).toBe(true);
		expect(matchItem(item, 'tarte')).toBe(false);
		expect(matchItem(item, '')).toBe(true);
	});

	test('reads label, keywords and value as one text', () => {
		expect(matchItem({ label: 'Launch', keywords: ['deploy'] }, 'launch deploy')).toBe(true);
		expect(matchItem({ label: 'Launch', value: 'rocket' }, 'launch rocket')).toBe(true);
	});

	test('prefers textValue over a label', () => {
		expect(matchItem({ label: 'Ignored', textValue: 'Café' }, 'cafe')).toBe(true);
		expect(matchItem({ label: 'Ignored', textValue: 'Café' }, 'ignored')).toBe(false);
	});

	test('lists the searched fields in order', () => {
		expect(getItemSearchTexts({ label: 'A', keywords: ['b', ''], value: 3 })).toEqual([
			'A',
			'b',
			'3'
		]);
		expect(getItemSearchTexts({ value: '' })).toEqual([]);
	});
});

describe('createItemMatcher', () => {
	test('startsWith matches the start of any field', () => {
		const match = createItemMatcher({ mode: 'startsWith', locale: 'en' });
		const item = { label: 'Pain au chocolat', keywords: ['viennoiserie'] };
		expect(match(item, 'pain')).toBe(true);
		expect(match(item, 'vienn')).toBe(true);
		expect(match(item, 'chocolat')).toBe(false);
	});

	test('follows its locale', () => {
		expect(createItemMatcher({ locale: 'tr' })({ label: 'Isparta' }, 'isparta')).toBe(false);
		expect(createItemMatcher({ locale: 'en' })({ label: 'Isparta' }, 'isparta')).toBe(true);
	});
});
