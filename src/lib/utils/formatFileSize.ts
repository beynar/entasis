import type { Messages } from '$lib/i18n/en.js';

/** What a file size is written with: the catalog's locale and its unit words. */
export type FileSizeMessages = Pick<Messages, 'locale' | 'fileSizeUnits'>;

/**
 * A file size as a person reads it, in base 1024, with the locale's number format and unit words:
 * `512 B`, `1.5 KB`, `15 KB` in English, `512 o`, `1,5 Ko`, `15 Ko` in French. One decimal below 10,
 * none above, and never a trailing zero.
 */
export function formatFileSize(bytes: number, messages: FileSizeMessages): string {
	const units = messages.fileSizeUnits;
	const index =
		bytes > 0 ? Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1) : 0;
	const value = bytes / 1024 ** index;
	const number = new Intl.NumberFormat(messages.locale, {
		maximumFractionDigits: index > 0 && value < 10 ? 1 : 0
	}).format(value);
	return `${number} ${units[index]}`;
}
