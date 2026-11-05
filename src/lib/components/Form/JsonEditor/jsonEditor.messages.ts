// Says a validator issue to the user, from the i18n catalog (law 11). The schema's own
// `errorMessage` wins, as the app's wording for that value.
import type { Messages } from '$lib/i18n/en.js';
import type { FieldMessages } from '../Field/field.messages.js';
import type { JsonType } from './jsonEditor.schema.js';
import type { JsonIssue } from './jsonEditor.validate.js';

/** The catalog's name for a JSON type. */
export const jsonTypeLabel = (type: JsonType, t: Messages): string => {
	switch (type) {
		case 'string':
			return t.jsonTypeString;
		case 'number':
			return t.jsonTypeNumber;
		case 'integer':
			return t.jsonTypeInteger;
		case 'boolean':
			return t.jsonTypeBoolean;
		case 'object':
			return t.jsonTypeObject;
		case 'array':
			return t.jsonTypeArray;
		case 'null':
			return t.jsonTypeNull;
	}
};

/** The message for one issue. */
export const describeJsonIssue = (
	issue: JsonIssue,
	t: Messages,
	messages: FieldMessages
): string => {
	if (issue.message) return issue.message;
	const limit = issue.params?.limit ?? 0;
	switch (issue.code) {
		case 'required':
			return messages.required;
		case 'dependentRequired':
			return t.jsonIssueDependent(issue.params?.key ?? '');
		case 'type': {
			const expected = String(issue.params?.expected ?? '').split('|') as JsonType[];
			return t.jsonIssueType(expected.map((type) => jsonTypeLabel(type, t)).join(' / '));
		}
		case 'enum':
			return t.jsonIssueEnum;
		case 'const':
			return t.jsonIssueConst(issue.params?.expected ?? '');
		case 'minLength':
			return messages.tooShort(Number(limit));
		case 'maxLength':
			return messages.tooLong(Number(limit));
		case 'pattern':
		case 'format':
			return t.jsonIssueFormat;
		case 'email':
			return messages.email;
		case 'url':
			return messages.url;
		case 'minimum':
			return messages.rangeUnderflow(limit);
		case 'maximum':
			return messages.rangeOverflow(limit);
		case 'exclusiveMinimum':
			return t.jsonIssueAbove(limit);
		case 'exclusiveMaximum':
			return t.jsonIssueBelow(limit);
		case 'multipleOf':
			return t.jsonIssueMultipleOf(limit);
		case 'minItems':
			return t.jsonIssueMinItems(limit);
		case 'maxItems':
			return t.jsonIssueMaxItems(limit);
		case 'uniqueItems':
			return t.jsonIssueUnique;
		case 'contains':
			return t.jsonIssueContains;
		case 'additionalItems':
			return t.jsonIssueNotAllowed;
		case 'minProperties':
			return t.jsonIssueMinProperties(limit);
		case 'maxProperties':
			return t.jsonIssueMaxProperties(limit);
		case 'additionalProperties':
			return t.jsonIssueNotAllowed;
		case 'propertyNames':
			return t.jsonIssueKeyInvalid;
		case 'noVariant':
			return t.jsonIssueNoVariant;
		case 'not':
			return t.jsonIssueNotAllowed;
	}
};
