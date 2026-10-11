import { describe, expect, test } from 'vitest';
import { en } from '$lib/i18n/en.js';
import { de } from '$lib/i18n/de.js';
import { describeFieldIssue, resolveFieldMessages } from './field.messages.js';

const messages = resolveFieldMessages(en, 'text');

describe('resolveFieldMessages', () => {
	test('a checkbox or switch is required when it must be on', () => {
		expect(resolveFieldMessages(en, 'checkbox').required).toBe('Check this box to continue');
		expect(resolveFieldMessages(en, 'switch').required).toBe('Turn this on to continue');
		expect(resolveFieldMessages(de, 'text').required).toBe('Dieses Feld ist erforderlich');
	});

	test('passwords and codes word their minimum length for what they are', () => {
		expect(resolveFieldMessages(en, 'password').tooShort(8)).toBe(
			'Password must be at least 8 characters'
		);
		expect(resolveFieldMessages(en, 'pin').tooShort(6)).toBe('Enter all 6 characters');
		expect(messages.tooShort(1)).toBe('Enter at least 1 character');
	});

	test('overrides accept a string or a function', () => {
		const custom = resolveFieldMessages(en, 'number', {
			required: 'Pick a number',
			rangeOverflow: (max) => `At most ${max}`,
			tooShort: 'Too short'
		});
		expect(custom.required).toBe('Pick a number');
		expect(custom.rangeOverflow(10)).toBe('At most 10');
		expect(custom.tooShort(3)).toBe('Too short');
		expect(custom.invalid).toBe('Enter a valid value');
	});
});

describe('describeFieldIssue', () => {
	test('maps validation issues to catalog messages', () => {
		const issue = (type: string, input: unknown, requirement?: unknown, kind = 'validation') =>
			describeFieldIssue(
				{ kind, type, input, requirement } as Parameters<typeof describeFieldIssue>[0],
				messages
			);
		expect(issue('non_empty', '')).toBe('This field is required');
		expect(issue('email', 'ada')).toBe('Enter a valid email address');
		expect(issue('url', 'x')).toBe('Enter a valid URL');
		expect(issue('min_length', 'ab', 3)).toBe('Enter at least 3 characters');
		expect(issue('min_length', [], 1)).toBe('This field is required');
		expect(issue('max_length', 'abcd', 3)).toBe('Enter no more than 3 characters');
		expect(issue('min_value', 0, 0.5)).toBe('Enter a value of 0.5 or more');
		expect(issue('max_value', 12, 10)).toBe('Enter a value of 10 or less');
		expect(issue('string', null, undefined, 'schema')).toBe('This field is required');
		expect(issue('string', 42, undefined, 'schema')).toBe('Enter a valid value');
		expect(issue('custom', 'x')).toBe('Enter a valid value');
	});
});
