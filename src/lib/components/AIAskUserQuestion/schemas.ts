import * as v from 'valibot';

export const aiAskUserQuestionToolStateSchema = v.picklist([
	'pending',
	'completed',
	'complete',
	'success',
	'submitted',
	'discarded',
	'discard',
	'cancelled',
	'canceled'
]);

const nonEmptyString = v.pipe(v.string(), v.nonEmpty());
const positiveInteger = v.pipe(v.number(), v.integer(), v.minValue(1));

export const aiQuestionOptionSchema = v.looseObject({
	id: nonEmptyString,
	label: nonEmptyString,
	description: v.optional(v.string()),
	disabled: v.optional(v.boolean())
});

const aiQuestionBaseEntries = {
	id: nonEmptyString,
	title: nonEmptyString,
	description: v.optional(v.string()),
	required: v.optional(v.boolean())
};

export const aiTextQuestionSchema = v.looseObject({
	...aiQuestionBaseEntries,
	type: v.optional(v.literal('text')),
	placeholder: v.optional(v.string()),
	rows: v.optional(positiveInteger)
});

export const aiSingleQuestionSchema = v.looseObject({
	...aiQuestionBaseEntries,
	type: v.literal('single'),
	options: v.array(aiQuestionOptionSchema),
	showOther: v.optional(v.boolean()),
	otherLabel: v.optional(v.string()),
	otherPlaceholder: v.optional(v.string())
});

export const aiMultipleQuestionSchema = v.looseObject({
	...aiQuestionBaseEntries,
	type: v.literal('multiple'),
	options: v.array(aiQuestionOptionSchema),
	showOther: v.optional(v.boolean()),
	otherLabel: v.optional(v.string()),
	otherPlaceholder: v.optional(v.string())
});

export const aiFileQuestionSchema = v.looseObject({
	...aiQuestionBaseEntries,
	type: v.literal('file'),
	accept: v.optional(v.union([v.string(), v.array(v.string())])),
	multiple: v.optional(v.boolean()),
	maxFiles: v.optional(positiveInteger),
	maxSize: v.optional(positiveInteger)
});

export const aiAskQuestionSchema = v.union([
	aiTextQuestionSchema,
	aiSingleQuestionSchema,
	aiMultipleQuestionSchema,
	aiFileQuestionSchema
]);

export const aiAskQuestionsSchema = v.array(aiAskQuestionSchema);

const aiFileAnswerSchema = v.custom<File[]>(
	(input) =>
		Array.isArray(input) &&
		typeof File !== 'undefined' &&
		input.every((file) => file instanceof File),
	'Expected an array of files.'
);

export const aiAskAnswerSchema = v.union([v.string(), v.array(v.string()), aiFileAnswerSchema]);
export const aiAskAnswersSchema = v.record(v.string(), v.optional(aiAskAnswerSchema));

export const aiAskUserQuestionValueMapSchema = v.record(v.string(), v.unknown());

export const aiAskUserQuestionToolPayloadSchema = v.looseObject({
	state: v.optional(aiAskUserQuestionToolStateSchema),
	prompt: v.optional(v.string()),
	questions: v.array(aiAskQuestionSchema),
	value: v.optional(aiAskUserQuestionValueMapSchema),
	values: v.optional(aiAskUserQuestionValueMapSchema),
	title: v.optional(v.string()),
	requester: v.optional(v.string()),
	context: v.optional(v.string()),
	submitLabel: v.optional(v.string()),
	submittingLabel: v.optional(v.string()),
	nextLabel: v.optional(v.string()),
	previousLabel: v.optional(v.string()),
	discardLabel: v.optional(v.string()),
	showOther: v.optional(v.boolean())
});

export const aiAskUserQuestionToolInputSchema = aiAskUserQuestionToolPayloadSchema;
export type AIAskUserQuestionToolPayload = v.InferOutput<typeof aiAskUserQuestionToolPayloadSchema>;

export const aiAskUserQuestionOptionSchema = aiQuestionOptionSchema;
export const aiAskUserQuestionTextQuestionSchema = aiTextQuestionSchema;
export const aiAskUserQuestionChoiceQuestionSchema = v.union([
	aiSingleQuestionSchema,
	aiMultipleQuestionSchema
]);
export const aiAskUserQuestionFileQuestionSchema = aiFileQuestionSchema;
export const aiAskUserQuestionQuestionSchema = aiAskQuestionSchema;
