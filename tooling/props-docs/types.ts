/**
 * How a prop is used, for grouping in the docs:
 * - `slot`: a `Slot`/`Snippet` render target.
 * - `event`: a callback (function-typed prop, e.g. `onChange`).
 * - `binding`: declared `$bindable()` in the component (usable with `bind:`).
 * - `prop`: a plain input prop.
 */
export type PropCategory = 'prop' | 'binding' | 'slot' | 'event';

export type PropDoc = {
	/** The prop name, e.g. "variant". */
	name: string;
	/** True when the prop is optional (`?` token or a union including `undefined`). */
	optional: boolean;
	/** Short type text, e.g. "CardVariant" or "'sm' | 'md'". */
	value: string;
	/** JSDoc description read from the comment above the prop. */
	description: string;
	/** Grouping bucket used by the props table. */
	category: PropCategory;
	/**
	 * Expanded type definition for a hovercard, present only when `value` refers
	 * to a named alias, object, or literal union worth expanding.
	 */
	type?: string;
};

export type ComponentDocs = {
	/** PascalCase component name, e.g. "Card". */
	name: string;
	/** Native attribute types inherited from `svelte/elements`, including their element generic. */
	htmlAttributes: string[];
	props: PropDoc[];
};

/** Keyed by component name (e.g. "Card", "Select"). */
export type PropsMap = Record<string, ComponentDocs>;
