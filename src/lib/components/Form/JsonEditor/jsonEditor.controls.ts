// How a string's format maps to a control, and to and from what that control holds. Dates stay the
// text they are in JSON: the editor reads and writes their digits and never passes them through a
// time zone, so `2024-05-01T23:30:00+02:00` keeps its offset whatever the browser's zone is.
import type { JsonSchemaObject } from './jsonEditor.schema.js';

/** The control for a string. */
export type JsonStringControl =
	'text' | 'textarea' | 'email' | 'url' | 'password' | 'date' | 'date-time' | 'time' | 'color';

const LONG_TEXT = 80;

/** Picks the control. A text that already has several lines, or runs long, gets the taller one. */
export const stringControl = (schema: JsonSchemaObject, value: unknown): JsonStringControl => {
	switch (schema.format) {
		case 'date':
			return 'date';
		case 'date-time':
			return 'date-time';
		case 'time':
			return 'time';
		case 'email':
		case 'idn-email':
			return 'email';
		case 'uri':
		case 'url':
		case 'iri':
			return 'url';
		case 'password':
			return 'password';
		case 'color':
			return 'color';
		case 'textarea':
		case 'multiline':
			return 'textarea';
	}
	if (schema.writeOnly) return 'password';
	if (schema.contentMediaType?.startsWith('text/')) return 'textarea';
	if ((schema.maxLength ?? 0) >= 200) return 'textarea';
	if (typeof value === 'string' && (value.includes('\n') || value.length > LONG_TEXT)) {
		return 'textarea';
	}
	return 'text';
};

const pad = (value: number, length = 2) => String(value).padStart(length, '0');

/** A `YYYY-MM-DD` as the local date a date picker holds, or `null`. */
export const dateFromJson = (text: string): Date | null => {
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
	if (!match) return null;
	const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
	return Number.isNaN(date.getTime()) ? null : date;
};

/** A date picker's local date as `YYYY-MM-DD`, or `''`. */
export const dateToJson = (date: Date | null): string =>
	date && !Number.isNaN(date.getTime())
		? `${pad(date.getFullYear(), 4)}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
		: '';

/** The seconds since midnight of a `HH:MM[:SS]`, or `null`. */
export const secondsFromTime = (text: string): number | null => {
	const match = /^(\d{2}):(\d{2})(?::(\d{2}))?/.exec(text);
	if (!match) return null;
	return Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3] ?? 0);
};

/** Seconds since midnight as `HH:MM:SS`. */
export const timeFromSeconds = (seconds: number): string =>
	`${pad(Math.floor(seconds / 3600))}:${pad(Math.floor((seconds % 3600) / 60))}:${pad(seconds % 60)}`;

/** The parts of a date-time; `suffix` is what follows the time: fractions, `Z`, an offset. */
export const splitDateTime = (text: string): { date: string; time: string; suffix: string } => {
	const match = /^(\d{4}-\d{2}-\d{2})(?:[Tt ](\d{2}:\d{2}(?::\d{2})?)(.*))?$/.exec(text);
	if (!match) return { date: '', time: '', suffix: '' };
	return { date: match[1], time: match[2] ?? '', suffix: match[3] ?? '' };
};

/** A date-time from its parts. Without a date there is nothing to hold; a new one is in UTC. */
export const joinDateTime = (date: string, time: string, suffix: string): string => {
	if (!date) return '';
	const clock = time || '00:00:00';
	return `${date}T${clock.length === 5 ? `${clock}:00` : clock}${suffix || 'Z'}`;
};
