import { describe, expect, test, vi } from 'vitest';
import { createListFilter } from './listFilter.js';

describe('createListFilter', () => {
	test('ignores case and accents', () => {
		const { contains, startsWith, equals } = createListFilter({ locale: 'en' });
		expect(contains('Éclair au chocolat', 'eclair')).toBe(true);
		expect(contains('Crème brûlée', 'BRULEE')).toBe(true);
		expect(contains('Crème brûlée', 'creme b')).toBe(true);
		expect(contains('Crème brûlée', 'tarte')).toBe(false);
		expect(startsWith('Éclair', 'ecl')).toBe(true);
		expect(startsWith('Crème brûlée', 'brulee')).toBe(false);
		expect(equals('Ångström', 'angstrom')).toBe(true);
		expect(equals('Ångström', 'angstro')).toBe(false);
	});

	test('matches composed and decomposed accents alike', () => {
		const { contains } = createListFilter({ locale: 'fr' });
		expect(contains('café noir', 'café')).toBe(true);
		expect(contains('café noir', 'café')).toBe(true);
	});

	test('follows the locale: Turkish dotted and dotless i', () => {
		const tr = createListFilter({ locale: 'tr' });
		expect(tr.contains('İzmir', 'izmir')).toBe(true);
		expect(tr.contains('Isparta', 'isparta')).toBe(false);
		expect(tr.contains('Isparta', 'ısparta')).toBe(true);

		const en = createListFilter({ locale: 'en' });
		expect(en.contains('İzmir', 'izmir')).toBe(true);
		expect(en.contains('Isparta', 'isparta')).toBe(true);
	});

	test('combining marks the sensitivity ignores do not shift the compared text', () => {
		const ar = createListFilter({ locale: 'ar' });
		expect(ar.contains('مُحَمَّد', 'محمد')).toBe(true);
		expect(ar.contains('النبي مُحَمَّد', 'محمد')).toBe(true);
		expect(ar.contains('محمد', 'مُحَمَّد')).toBe(true);
		expect(ar.startsWith('مُحَمَّد علي', 'محمد')).toBe(true);
		expect(ar.startsWith('علي مُحَمَّد', 'محمد')).toBe(false);
		expect(ar.contains('مُحَمَّد', 'احمد')).toBe(false);
		expect(createListFilter({ locale: 'he' }).contains('שָׁלוֹם', 'שלום')).toBe(true);
		// Marks that carry meaning at this sensitivity still count: Devanagari vowel signs.
		const hi = createListFilter({ locale: 'hi' });
		expect(hi.contains('कीमत', 'कि')).toBe(false);
		expect(hi.contains('नकिता', 'कि')).toBe(true);
		// And every mark counts once the sensitivity keeps accents.
		expect(
			createListFilter({ locale: 'ar', sensitivity: 'accent' }).contains('مُحَمَّد', 'محمد')
		).toBe(false);
	});

	test('respects a stricter sensitivity', () => {
		const accents = createListFilter({ locale: 'en', sensitivity: 'accent' });
		expect(accents.contains('Éclair', 'eclair')).toBe(false);
		expect(accents.contains('Éclair', 'écLAIR')).toBe(true);
		const exact = createListFilter({ locale: 'en', sensitivity: 'variant' });
		expect(exact.contains('Éclair', 'éclair')).toBe(false);
	});

	test('an empty query matches everything', () => {
		const { contains, startsWith } = createListFilter();
		expect(contains('anything', '')).toBe(true);
		expect(startsWith('', '')).toBe(true);
	});

	test('filters items in order through their texts, up to the limit', () => {
		const filter = createListFilter({ locale: 'en' });
		const items = [
			{ label: 'Éclair', keywords: ['pastry'] },
			{ label: 'Croissant', keywords: ['pastry', 'butter'] },
			{ label: 'Baguette', keywords: ['bread'] },
			{ label: 'Pain au chocolat', keywords: ['pastry'] }
		];
		const text = (item: (typeof items)[number]) => [item.label, ...item.keywords];
		expect(filter.filter(items, 'PASTRY', { text }).map((item) => item.label)).toEqual([
			'Éclair',
			'Croissant',
			'Pain au chocolat'
		]);
		expect(filter.filter(items, 'pastry', { text, limit: 2 })).toHaveLength(2);
		expect(filter.filter(items, 'b', { text, match: 'startsWith' }).map((i) => i.label)).toEqual([
			'Croissant',
			'Baguette'
		]);
		expect(filter.filter(['Éclair', 'Tarte'], 'eclair')).toEqual(['Éclair']);
		expect(filter.filter(items, 'pastry', { text, limit: 0 })).toEqual([]);
	});

	test('stops calling the predicate once the limit is reached', () => {
		const filter = createListFilter();
		const match = vi.fn(() => true);
		const results = filter.filter(
			Array.from({ length: 1000 }, (_, i) => `item ${i}`),
			'x',
			{
				match,
				limit: 5
			}
		);
		expect(results).toEqual(['item 0', 'item 1', 'item 2', 'item 3', 'item 4']);
		expect(match).toHaveBeenCalledTimes(5);
	});

	test('an option given as undefined keeps the default and shares its filter', () => {
		const forwarded = createListFilter({ locale: 'en-GB', sensitivity: undefined });
		expect(forwarded.contains('Éclair', 'eclair')).toBe(true);
		expect(createListFilter({ locale: 'en-GB' })).toBe(forwarded);
		expect(createListFilter({ locale: 'en-GB' }).contains('Éclair', 'eclair')).toBe(true);
	});

	test('shares one filter per locale and options', () => {
		expect(createListFilter({ locale: 'de' })).toBe(createListFilter({ locale: 'de' }));
		expect(createListFilter({ locale: 'de' })).not.toBe(createListFilter({ locale: 'fr' }));
		expect(createListFilter({ locale: 'de' }).locale).toBe('de');
	});
});
