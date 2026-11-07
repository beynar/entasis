import { describe, expect, test } from 'vitest';
import { ar } from '$lib/i18n/ar.js';
import { en } from '$lib/i18n/en.js';
import { fr } from '$lib/i18n/fr.js';
import { formatFileSize } from './formatFileSize.js';

describe('formatFileSize', () => {
	test('base 1024, one decimal below 10, none above', () => {
		expect(formatFileSize(0, en)).toBe('0 B');
		expect(formatFileSize(512, en)).toBe('512 B');
		expect(formatFileSize(1024, en)).toBe('1 KB');
		expect(formatFileSize(1536, en)).toBe('1.5 KB');
		expect(formatFileSize(15 * 1024 + 300, en)).toBe('15 KB');
		expect(formatFileSize(1.5 * 1024 ** 2, en)).toBe('1.5 MB');
		expect(formatFileSize(3 * 1024 ** 5, en)).toBe('3,072 TB');
	});

	test('the locale writes the number and the units', () => {
		expect(formatFileSize(512, fr)).toBe('512 o');
		expect(formatFileSize(12 * 1024, fr)).toBe('12 Ko');
		expect(formatFileSize(1.5 * 1024 ** 2, fr)).toBe('1,5 Mo');
		expect(formatFileSize(1.5 * 1024 ** 2, ar)).toBe(
			`${new Intl.NumberFormat('ar', { maximumFractionDigits: 1 }).format(1.5)} م.ب`
		);
	});
});
