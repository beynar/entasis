import type { Messages } from '$lib/i18n/en.js';
import type { InputProps } from '../Field/field.js';
import type { JsonEditorThemeProps } from './jsonEditor.theme.js';
import type { JsonPath, JsonSchema, JsonValue } from './jsonEditor.schema.js';
import type { JsonIssue } from './jsonEditor.validate.js';

/** Which view a JsonEditor shows: the tree of controls, or the JSON text. */
export type JsonEditorMode = 'tree' | 'json';

/** A toolbar control of the JsonEditor. */
export type JsonEditorControl = 'expand' | 'copy' | 'mode';

/** Where a schema's `description` shows: under the control, behind an icon, or nowhere. */
export type JsonEditorDescriptions = 'inline' | 'tooltip' | 'none';

/** One problem in the value, worded for the user. */
export type JsonEditorIssue = JsonIssue & {
	/** The message the row shows. */
	text: string;
};

/** What `bind:api` publishes, in the browser. */
export type JsonEditorApi = {
	/** Every problem in the current value. */
	readonly issues: readonly JsonEditorIssue[];
	/** Shows every problem, opens the rows that hold one, and says whether the value is valid. */
	validate: () => boolean;
	/** Opens every object and array. */
	expandAll: () => void;
	/** Closes every object and array. */
	collapseAll: () => void;
	/** Moves focus to the control of a value, opening what is around it. False when it has none. */
	focus: (path: JsonPath) => Promise<boolean>;
};

export type JsonEditorProps = Omit<InputProps<'json'>, 'theme' | 'size'> & {
	/**
	 * Geometry of the rows and their controls. An editor shows many values at once, so it starts at
	 * the tight end.
	 * @default 'small'
	 */
	size?: InputProps<'json'>['size'];
	/**
	 * The JSON Schema the value is edited against: drafts 2020-12 and 7, with `$ref` inside the
	 * document, `allOf`, `oneOf`, `anyOf`, `if`, `dependentRequired` and the validation keywords.
	 * Left out, the shape is inferred from the value and every type stays changeable.
	 */
	schema?: JsonSchema;
	/**
	 * Which view shows, bindable with `bind:mode`.
	 * @default 'tree'
	 */
	mode?: JsonEditorMode;
	/** Called when the view changes. */
	onModeChange?: (mode: JsonEditorMode) => void;
	/**
	 * The toolbar: `true` for all of it, `false` for none, or the controls to keep.
	 * @default true
	 */
	controls?: boolean | readonly JsonEditorControl[];
	/**
	 * Shows an icon for the type of each value. Where a value may change type, the icon also opens
	 * the list of types, so that list stays reachable from a button when icons are off.
	 * @default true
	 */
	typeIcons?: boolean;
	/**
	 * How many levels of objects and arrays start open.
	 * @default 2
	 */
	expandDepth?: number;
	/**
	 * Where a schema's `description` shows.
	 * @default 'inline'
	 */
	descriptions?: JsonEditorDescriptions;
	/**
	 * Width of the key column, as a CSS length or percentage of the editor.
	 * @default '38%'
	 */
	keyWidth?: string;
	/** Bindable handle to validate, open and close rows, and move focus. Browser only. */
	api?: JsonEditorApi;
	/** Called when the list of problems changes, including when it empties. */
	onIssuesChange?: (issues: readonly JsonEditorIssue[]) => void;
	/** Called when the value changes. */
	onValueChange?: (value: JsonValue | null) => void;
	/** Per-instance i18n overrides merged over the global catalog. */
	i18n?: Partial<Messages>;
	/** Theme overrides for the editor's parts and its Field. */
	theme?: JsonEditorThemeProps & InputProps<'json'>['theme'];
};
