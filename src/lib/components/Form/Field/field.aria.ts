// Roles that take aria-required / aria-readonly (ARIA 1.2, plus slider from 1.3, which axe
// accepts). Native inputs keep their own `required` and `readonly` attributes instead.
export const ARIA_REQUIRED_ROLES: ReadonlySet<string> = new Set([
	'checkbox',
	'combobox',
	'gridcell',
	'listbox',
	'radiogroup',
	'searchbox',
	'slider',
	'spinbutton',
	'switch',
	'textbox',
	'tree',
	'treegrid'
]);

export const ARIA_READONLY_ROLES: ReadonlySet<string> = new Set([
	'checkbox',
	'combobox',
	'grid',
	'gridcell',
	'listbox',
	'radiogroup',
	'searchbox',
	'slider',
	'spinbutton',
	'switch',
	'textbox',
	'treegrid'
]);

/** What Field renders around its control, which the control's attributes refer to. */
export type FieldLayout = {
	/** The label names the control through `aria-labelledby` instead of `<label for>`. */
	labelledBy: boolean;
	/** A description carrying the field's `descriptionId` is rendered. */
	description: boolean;
	/** A helper text carrying the field's `helperId` is rendered. */
	helper: boolean;
};

/** The element a control renders, described for the attributes Field computes for it. */
export type FieldAriaTarget = {
	/** The element's role, explicit or implicit: `'textbox'`, `'combobox'`, `'checkbox'`… */
	role?: string;
	/**
	 * A native input, select or textarea, which carries `required` itself. `'text'` marks one
	 * whose native `readonly` the browser honours (text, number and date entry, a textarea): it
	 * gets `readonly` rather than `aria-readonly`.
	 */
	native?: boolean | 'text';
	/** Ids the app or the control references from `aria-describedby`; they come first. */
	describedBy?: string | null;
	/** Ids the control already names itself with (an inline label); the field label joins them. */
	labelledBy?: string | null;
	/** An `aria-label` on the element, which names it instead of the field label. */
	label?: string | null;
	/**
	 * The native attributes the app passes to the element (`inputAttrs`): their
	 * `aria-describedby`, `aria-labelledby` and `aria-label` join the ones above.
	 */
	attrs?: object | null;
};

/** The attributes Field wires onto its control element. */
export type FieldAriaAttributes = {
	'aria-invalid': 'true' | undefined;
	'aria-describedby': string | undefined;
	'aria-labelledby': string | undefined;
	'aria-required': 'true' | undefined;
	'aria-readonly': 'true' | undefined;
	readonly: true | undefined;
};

export const splitIds = (value: string | null | undefined) =>
	value?.split(/\s+/).filter(Boolean) ?? [];

const joinIds = (ids: string[]) => (ids.length > 0 ? [...new Set(ids)].join(' ') : undefined);

type FieldAriaSource = {
	labelId: string;
	descriptionId: string;
	helperId: string;
	errorId: string;
	describedBy: string[];
	hasError: boolean;
	required?: boolean;
	readOnly: boolean;
};

/**
 * Computes, from state alone, the attributes Field gives its control: the server renders them
 * and the client keeps them current without reading the element back.
 */
export const fieldAriaAttributes = (
	field: FieldAriaSource,
	layout: FieldLayout,
	target: FieldAriaTarget
): FieldAriaAttributes => {
	const role = target.role;
	const attrs = (target.attrs ?? {}) as Record<string, unknown>;
	const read = (name: string) => (typeof attrs[name] === 'string' ? (attrs[name] as string) : null);
	// The app's own ids come first, then the description, the helper and the errors.
	const fieldIds = new Set([field.descriptionId, field.helperId, field.errorId]);
	const describedBy = [
		...splitIds(read('aria-describedby')),
		...splitIds(target.describedBy)
	].filter((id) => !fieldIds.has(id));
	describedBy.push(...field.describedBy);
	// An aria-label on the control names it instead of the field label.
	const labelledBy = [...splitIds(read('aria-labelledby')), ...splitIds(target.labelledBy)];
	const named = Boolean((target.label ?? read('aria-label'))?.trim());
	if (layout.labelledBy && !named) labelledBy.push(field.labelId);
	const nativeReadOnly = target.native === 'text';
	return {
		'aria-invalid': field.hasError ? 'true' : undefined,
		'aria-describedby': joinIds(describedBy),
		'aria-labelledby': joinIds(labelledBy),
		// Native controls carry `required` themselves; a role-based control announces it.
		'aria-required':
			field.required && !target.native && role && ARIA_REQUIRED_ROLES.has(role)
				? 'true'
				: undefined,
		'aria-readonly':
			field.readOnly && !nativeReadOnly && role && ARIA_READONLY_ROLES.has(role)
				? 'true'
				: undefined,
		readonly: field.readOnly && nativeReadOnly ? true : undefined
	};
};

/**
 * The id a control renders on its focusable element: the one the author passed, through the `id`
 * prop or the element's native attributes, else the generated one. The field's label `for`,
 * `aria-labelledby` and `aria-describedby` ids derive from it, so they follow the author's id.
 */
export const resolveControlId = (
	id: string | undefined,
	attrs: object | null | undefined,
	generated: string
): string => {
	if (id) return id;
	const attrId = (attrs as { id?: unknown } | null | undefined)?.id;
	return typeof attrId === 'string' && attrId !== '' ? attrId : generated;
};
