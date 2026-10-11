// Every validation message a field shows comes from the i18n catalog (decision D8): the
// validation library describes what failed, this module says it to the user in the active
// locale. Entries override individual messages through `messages`.
import type { BaseIssue } from 'valibot';
import type { Messages } from '$lib/i18n/en.js';
import { isEmptyValue } from '$lib/utils/values.js';
import type { FieldType } from './field.js';

/** The validation messages a field shows, resolved for the active locale. */
export type FieldMessages = {
	/** A required field left empty; for a checkbox or switch, left off. */
	required: string;
	/** A value rejected without a more specific message, including `true` from `onValidate`. */
	invalid: string;
	/** A value that is not an email address. */
	email: string;
	/** A value that is not a URL. */
	url: string;
	/** Text shorter than the field's minimum length. */
	tooShort: (min: number) => string;
	/** Text longer than the field's maximum length. */
	tooLong: (max: number) => string;
	/** A value below the field's minimum. */
	rangeUnderflow: (min: number | string) => string;
	/** A value above the field's maximum. */
	rangeOverflow: (max: number | string) => string;
	/** A code with fewer characters than its length, such as a partly entered PinInput. */
	incomplete: (length: number) => string;
};

type MessageOverride<Message> = Message extends (...args: infer Args) => string
	? string | ((...args: Args) => string)
	: string;

/**
 * Per-entry message overrides, the entasis form of a per-constraint error message: a string, or
 * for the parameterized messages a function receiving the same constraint value.
 */
export type FieldMessageOverrides = {
	[Key in keyof FieldMessages]?: MessageOverride<FieldMessages[Key]>;
};

const override = <Args extends unknown[]>(
	value: string | ((...args: Args) => string) | undefined,
	fallback: (...args: Args) => string
): ((...args: Args) => string) =>
	value === undefined ? fallback : typeof value === 'string' ? () => value : value;

/**
 * The catalog messages for one field type, with the entry's overrides applied. A checkbox or
 * switch is "required" when it must be on, a PinInput that is too short is incomplete, and a
 * password uses the password wording.
 */
export const resolveFieldMessages = (
	t: Messages,
	type: FieldType,
	overrides: FieldMessageOverrides = {}
): FieldMessages => {
	const required =
		type === 'checkbox'
			? t.fieldMustBeChecked
			: type === 'switch'
				? t.fieldMustBeOn
				: t.fieldRequired;
	const incomplete = override(overrides.incomplete, t.fieldIncomplete);
	const defaultTooShort =
		type === 'password' ? t.passwordTooShort : type === 'pin' ? incomplete : t.fieldTooShort;
	return {
		required: overrides.required ?? required,
		invalid: overrides.invalid ?? t.fieldInvalid,
		email: overrides.email ?? t.fieldInvalidEmail,
		url: overrides.url ?? t.fieldInvalidUrl,
		tooShort: override(overrides.tooShort, defaultTooShort),
		tooLong: override(overrides.tooLong, t.fieldTooLong),
		rangeUnderflow: override(overrides.rangeUnderflow, t.fieldRangeUnderflow),
		rangeOverflow: override(overrides.rangeOverflow, t.fieldRangeOverflow),
		incomplete
	};
};

/** The part of a validation issue the message mapping reads. */
export type FieldIssue = Pick<BaseIssue<unknown>, 'kind' | 'type' | 'input' | 'requirement'>;

const formatRequirement = (requirement: unknown, locale: string): number | string => {
	if (typeof requirement === 'number') return requirement;
	if (requirement instanceof Date) return requirement.toLocaleDateString(locale);
	return String(requirement);
};

/**
 * Turns one validation issue into the catalog message for what failed. A missing value (a type
 * mismatch on `null`, an empty string or array) reads as required; anything unrecognised reads as
 * invalid, so library wording never reaches the user.
 */
export const describeFieldIssue = (
	issue: FieldIssue,
	messages: FieldMessages,
	locale = 'en'
): string => {
	switch (issue.type) {
		case 'non_empty':
			return messages.required;
		case 'email':
			return messages.email;
		case 'url':
			return messages.url;
		case 'min_length':
			return typeof issue.input === 'string'
				? messages.tooShort(Number(issue.requirement))
				: messages.required;
		case 'max_length':
			return typeof issue.input === 'string'
				? messages.tooLong(Number(issue.requirement))
				: messages.invalid;
		case 'min_value':
			return messages.rangeUnderflow(formatRequirement(issue.requirement, locale));
		case 'max_value':
			return messages.rangeOverflow(formatRequirement(issue.requirement, locale));
	}
	return issue.kind === 'schema' && isEmptyValue(issue.input)
		? messages.required
		: messages.invalid;
};
