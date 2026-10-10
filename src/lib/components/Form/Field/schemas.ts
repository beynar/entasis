// This will be a collection of schemas for the form fields

import * as v from 'valibot';
import type { InputType } from './field.js';

type Schema = v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>>;

const nonEmptyString = v.pipe(v.string(), v.nonEmpty());
const nonEmptyArray = <TSchema extends Schema>(schema: TSchema) =>
	v.pipe(v.array(schema), v.minLength(1));
const emptyStringNull = <TSchema extends Schema>(schema: TSchema) =>
	v.union([
		v.pipe(
			v.literal(''),
			v.transform(() => null)
		),
		schema
	]);

const emptyArrayNull = <TSchema extends Schema>(schema: TSchema) =>
	v.union([
		v.pipe(
			v.strictTuple([]),
			v.transform(() => null)
		),
		schema
	]);

const optional = <TSchema extends Schema>(schema: TSchema) =>
	v.optional(v.nullable(schema, null), null);
const sliderRangeValue = v.pipe(v.array(v.number()), v.minLength(2));
const tagGroupValue = v.union([nonEmptyString, nonEmptyArray(v.string())]);
const keyValuePair = v.object({ key: v.string(), value: v.string() });
const calendarRangeValue = v.strictTuple([v.nullable(v.date()), v.nullable(v.date())]);
const completeCalendarRangeValue = v.strictTuple([v.date(), v.date()]);

type Schemas = Record<InputType, Schema>;
export const schemas: {
	required: Schemas;
	optional: Schemas;
} = {
	required: {
		// Text input types
		text: nonEmptyString,
		password: v.pipe(nonEmptyString, v.minLength(6)),
		email: v.pipe(nonEmptyString, v.email()),
		url: v.pipe(nonEmptyString, v.url()),
		textarea: nonEmptyString,
		phone: nonEmptyString,
		'rich-text': nonEmptyString,
		pin: nonEmptyString,

		// Number input types
		number: v.number(),
		slider: v.number(),
		'slider-range': sliderRangeValue,

		// Rating input type
		rating: v.pipe(v.number(), v.minValue(0.5)),

		// Voice input type
		voice: v.instance(Blob),

		// Tag input type
		tag: nonEmptyArray(v.string()),
		'tag-group': tagGroupValue,

		// Key/value input type
		keyvalue: nonEmptyArray(keyValuePair),

		// Date input types
		datetime: v.date(),
		date: v.date(),

		// Color input type
		color: nonEmptyString,

		// Time input type
		time: v.number(),

		// Boolean input types
		switch: v.boolean(),
		checkbox: v.boolean(),

		// Single option input types
		select: v.string(),
		radio: v.string(),
		combobox: v.string(),

		// Multiple choice input types
		checkboxes: v.array(v.string()),

		// File input types
		file: v.instance(File),
		files: nonEmptyArray(v.instance(File)),
		// Calendar input types
		calendar: v.date(),
		'calendar-range': completeCalendarRangeValue
	},
	optional: {
		// Text input types
		text: optional(emptyStringNull(v.string())),
		password: optional(emptyStringNull(v.pipe(v.string(), v.minLength(6)))),
		email: optional(emptyStringNull(v.pipe(v.string(), v.email()))),
		url: optional(emptyStringNull(v.pipe(v.string(), v.url()))),
		textarea: optional(emptyStringNull(v.string())),
		phone: optional(emptyStringNull(v.string())),
		'rich-text': optional(emptyStringNull(v.string())),
		pin: optional(emptyStringNull(v.string())),
		// Number input types
		number: optional(v.number()),
		slider: optional(v.number()),
		'slider-range': optional(sliderRangeValue),

		// Rating input type
		rating: optional(v.number()),

		// Voice input type
		voice: optional(v.instance(Blob)),

		// Tag input type
		tag: optional(emptyArrayNull(v.array(v.string()))),
		'tag-group': optional(
			v.union([emptyStringNull(v.string()), emptyArrayNull(v.array(v.string()))])
		),

		// Key/value input type
		keyvalue: optional(emptyArrayNull(v.array(keyValuePair))),

		// Date input types
		datetime: optional(v.date()),
		date: optional(v.date()),

		// Color input type
		color: optional(emptyStringNull(v.string())),

		// Time input type
		time: optional(v.number()),

		// Boolean input types
		switch: optional(v.boolean()),
		checkbox: optional(v.boolean()),

		// Single option input types
		select: optional(v.string()),
		radio: optional(v.string()),
		combobox: optional(v.string()),

		// Multiple choice input types
		checkboxes: optional(emptyArrayNull(v.array(v.string()))),

		// File input types
		file: optional(v.instance(File)),
		files: optional(emptyArrayNull(v.array(v.instance(File)))),
		// Calendar input types
		calendar: optional(v.date()),
		'calendar-range': optional(calendarRangeValue)
	}
};
