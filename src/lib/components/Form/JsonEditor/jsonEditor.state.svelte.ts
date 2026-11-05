// What every row of a JsonEditor shares: the value, its problems, which of them show, and the
// commands that reach every row (open, close, focus). Rows hold only what is theirs: open or closed,
// the union branch picked, the identity of their children.
import { getContext, setContext, tick, untrack } from 'svelte';
import { SvelteSet } from 'svelte/reactivity';
import type { Messages } from '$lib/i18n/en.js';
import type { Density, Sizes } from '$lib/types/theme.js';
import type { FieldMessages } from '../Field/field.messages.js';
import type { JsonIconSnippet } from './jsonEditor.icons.js';
import { describeJsonIssue } from './jsonEditor.messages.js';
import type { JsonEditorDescriptions, JsonEditorIssue } from './jsonEditor.props.js';
import {
	jsonPathKey,
	readJsonValue,
	setJsonValue,
	type JsonPath,
	type JsonSchema
} from './jsonEditor.schema.js';
import { jsonEquals, validateJson } from './jsonEditor.validate.js';
import { inferJsonSchema } from './jsonEditor.infer.js';
import type { useJsonEditorTheme } from './jsonEditor.theme.js';

type Classes = ReturnType<typeof useJsonEditorTheme>;

/** What the component feeds the state, read lazily so it follows the props. */
export type JsonEditorStateOptions = {
	readonly value: unknown;
	readonly schema: JsonSchema | undefined;
	readonly t: Messages;
	readonly messages: FieldMessages;
	readonly classes: Classes;
	readonly size: Sizes;
	readonly density: Density;
	readonly typeIcons: boolean;
	readonly descriptions: JsonEditorDescriptions;
	readonly expandDepth: number;
	readonly keyWidth: string | undefined;
	readonly locked: boolean;
	readonly showEveryIssue: boolean;
	readonly root: HTMLElement | null;
	commit: (next: unknown) => void;
	announce: (message: string) => void;
	openMenu: (menu: JsonEditorMenu) => void;
};

/** An entry of the one menu the rows share. */
export type JsonEditorMenuItem = {
	key: string;
	label: string;
	icon?: JsonIconSnippet;
	danger?: boolean;
	disabled?: boolean;
	checked?: boolean;
	action: () => void;
};

/** The shared menu, opened against the button that asked for it. */
export type JsonEditorMenu = {
	anchor: HTMLElement;
	items: JsonEditorMenuItem[];
};

/** The value before an edit, and where that edit was: undoing shows the person what came back. */
type JsonHistoryEntry = { value: unknown; inferred: JsonSchema; path: JsonPath };

const HISTORY_LIMIT = 200;
/** Keystrokes closer than this are one edit to undo, as in any text editor. */
const TYPING_PAUSE_MS = 800;

const isTyped = (value: unknown) => typeof value === 'string' || typeof value === 'number';

const startsWith = (path: JsonPath, prefix: JsonPath) =>
	prefix.length <= path.length && prefix.every((segment, index) => path[index] === segment);

export class JsonEditorState {
	#options: JsonEditorStateOptions;
	/** Whether the editor has a schema of the app's, or edits freely from what the value looks like. */
	free = $derived.by(() => this.#options.schema === undefined);
	// Inferred once per value handed in from outside. Re-inferring after each edit would swap the
	// control under the user: an email being retyped stops looking like an email halfway through.
	#inferred = $state<JsonSchema>(true);
	#lastEmitted: unknown = undefined;
	// Plain arrays: nothing shows them, and every value in them shares what it did not change.
	#undoEntries: JsonHistoryEntry[] = [];
	#redoEntries: JsonHistoryEntry[] = [];
	#typing: { key: string; at: number } | null = null;
	/** The value this editor last wrote; anything else came from outside. */
	#committed: unknown = undefined;
	rootSchema = $derived.by<JsonSchema>(() => this.#options.schema ?? this.#inferred);
	value = $derived.by(() => this.#options.value);
	/**
	 * Whether the value is a list at its root, whose rows have no row above them. Every row reads this:
	 * as a derived boolean it stays still through edits, where reading the value would wake them all.
	 */
	rootIsList = $derived.by(() => Array.isArray(this.value));

	/** Every problem in the value. A free editor has none: what it holds is what it means. */
	issues = $derived.by<JsonEditorIssue[]>(() => {
		const schema = this.#options.schema;
		if (schema === undefined) return [];
		const value = this.value;
		const t = this.#options.t;
		const messages = this.#options.messages;
		const issues = validateJson(value === null ? undefined : value, schema).map((issue) => ({
			...issue,
			text: describeJsonIssue(issue, t, messages)
		}));
		// Most keystrokes change no problem. The same list stays the same list, so the rows that read
		// it have nothing to do, however many there are.
		const signature = JSON.stringify(issues);
		if (signature === this.#issueSignature) return this.#lastIssues;
		this.#issueSignature = signature;
		this.#lastIssues = issues;
		return issues;
	});
	#issueSignature = '[]';
	#lastIssues: JsonEditorIssue[] = [];

	#byPath = $derived.by(() => {
		// eslint-disable-next-line svelte/prefer-svelte-reactivity -- Rebuilt whole inside a derived.
		const map = new Map<string, JsonEditorIssue[]>();
		for (const issue of this.issues) {
			const key = jsonPathKey(issue.path);
			map.set(key, [...(map.get(key) ?? []), issue]);
		}
		return map;
	});

	#touched = new SvelteSet<string>();
	#revealed = $state(false);

	/** The problems the user should see now: of what they have been through, or all after a check. */
	shownIssues = $derived.by(() => this.issues.filter((issue) => this.#shown(issue.path)));

	/** Which rows hold a problem showing somewhere below them. */
	#shownAncestors = $derived.by(() => {
		// eslint-disable-next-line svelte/prefer-svelte-reactivity -- Rebuilt whole inside a derived.
		const counts = new Map<string, number>();
		for (const issue of this.shownIssues) {
			for (let length = 0; length < issue.path.length; length += 1) {
				const key = jsonPathKey(issue.path.slice(0, length));
				counts.set(key, (counts.get(key) ?? 0) + 1);
			}
		}
		return counts;
	});

	/** The last open-or-close-everything command. New rows follow it too. */
	expansion = $state<{ open: boolean | null; tick: number }>({ open: null, tick: 0 });
	/** Bumped when problems are revealed: rows that hold one open themselves. */
	revealTick = $state(0);
	/** A value about to take focus: the rows around it open themselves. */
	openRequest = $state<{ path: JsonPath; tick: number }>({ path: [], tick: 0 });

	constructor(options: JsonEditorStateOptions) {
		this.#options = options;
		untrack(() => {
			if (options.schema === undefined) this.#inferred = inferJsonSchema(options.value);
			this.#lastEmitted = options.value;
			this.#committed = options.value;
		});
		// An edit made outside the editor is not one it can take back, nor can it step over one.
		$effect.pre(() => {
			const value = options.value;
			untrack(() => {
				if (value === this.#committed) return;
				if (!jsonEquals(value, this.#committed)) {
					this.#undoEntries = [];
					this.#redoEntries = [];
					this.#typing = null;
				}
				this.#committed = value;
			});
		});
		$effect.pre(() => {
			const value = options.value;
			if (options.schema !== undefined) return;
			untrack(() => {
				// A parent's `$state` hands back its own proxy of what was emitted: the same value.
				if (value === this.#lastEmitted || jsonEquals(value, this.#lastEmitted)) return;
				this.#lastEmitted = value;
				this.#inferred = inferJsonSchema(value);
			});
		});
	}

	#shown(path: JsonPath) {
		if (this.#revealed || this.#options.showEveryIssue) return true;
		return this.#touched.has(jsonPathKey(path));
	}

	get t() {
		return this.#options.t;
	}
	get classes() {
		return this.#options.classes;
	}
	get size() {
		return this.#options.size;
	}
	get density() {
		return this.#options.density;
	}
	get typeIcons() {
		return this.#options.typeIcons;
	}
	get descriptions() {
		return this.#options.descriptions;
	}
	get expandDepth() {
		return this.#options.expandDepth;
	}
	/**
	 * The columns of a row when `keyWidth` moves them. Set on each row rather than as a variable on
	 * the tree: an inherited variable above the rows would make WebKit restyle them all on each mount.
	 */
	get rowColumns() {
		const width = this.#options.keyWidth;
		return width ? `minmax(0, ${width}) minmax(0, 1fr) auto` : undefined;
	}
	/** Disabled or read-only: nothing structural (add, remove, move, rename, retype) is offered. */
	get locked() {
		return this.#options.locked;
	}
	get root() {
		return this.#options.root;
	}
	/** The size of the controls in the rows. */
	get controlSize(): Sizes {
		return this.#options.size;
	}

	/** Replaces the value at `path`; `undefined` removes it. */
	set = (path: JsonPath, next: unknown) => {
		const value = untrack(() => this.value);
		// A control echoing what it was given is not an edit. Only the edited value needs comparing.
		if (jsonEquals(readJsonValue(value, path), next)) return;
		const updated = setJsonValue(value ?? undefined, path, next);
		this.#remember(value, path, isTyped(next) && isTyped(readJsonValue(value, path)));
		this.#lastEmitted = updated;
		this.#write(updated);
	};

	/** Replaces the whole value, as an edit of the JSON text does, and reads its shape again. */
	replace = (next: unknown) => {
		this.#remember(
			untrack(() => this.value),
			[],
			true
		);
		this.#write(next);
	};

	#write(next: unknown) {
		this.#options.commit(next);
		this.#committed = untrack(() => this.value);
	}

	#remember(before: unknown, path: JsonPath, typed: boolean) {
		const key = jsonPathKey(path);
		const now = Date.now();
		const typing = this.#typing;
		this.#typing = typed ? { key, at: now } : null;
		this.#redoEntries = [];
		if (typed && typing?.key === key && now - typing.at < TYPING_PAUSE_MS) return;
		this.#undoEntries.push({ value: before, inferred: this.#inferred, path });
		if (this.#undoEntries.length > HISTORY_LIMIT) this.#undoEntries.shift();
	}

	/** Takes back the last edit. False when there is none. */
	undo = () =>
		this.#travel(
			() => this.#undoEntries,
			() => this.#redoEntries,
			this.t.jsonUndone
		);

	/** Puts back the last edit taken back. False when there is none. */
	redo = () =>
		this.#travel(
			() => this.#redoEntries,
			() => this.#undoEntries,
			this.t.jsonRedone
		);

	#travel(from: () => JsonHistoryEntry[], to: () => JsonHistoryEntry[], message: string) {
		if (from().length === 0) return false;
		const active = this.#activeControl();
		// A control being edited holds its own text and reads the value again once it lets go. This
		// comes first: letting go can settle a last edit, which is then the one taken back.
		active?.blur();
		const entry = from().pop();
		if (!entry) return false;
		const current = untrack(() => this.value);
		to().push({ value: current, inferred: this.#inferred, path: entry.path });
		this.#typing = null;
		this.#lastEmitted = entry.value;
		this.#inferred = entry.inferred;
		this.#write(entry.value);
		this.announce(message);
		void this.#reveal(entry.path, active);
		return true;
	}

	#activeControl() {
		const active = this.root?.ownerDocument.activeElement;
		return active instanceof HTMLElement && active !== this.root && this.root?.contains(active)
			? active
			: null;
	}

	// Shows what came back, and keeps focus in the editor so the next press still reaches it: the row
	// that held it may be the one that just went away.
	async #reveal(path: JsonPath, active: HTMLElement | null) {
		this.openRequest = { path, tick: this.openRequest.tick + 1 };
		for (let level = 0; level <= path.length; level += 1) await tick();
		const stay = active && !this.#leaving(active) ? active : null;
		for (let length = path.length; length >= 1; length -= 1) {
			const row = this.root?.querySelector<HTMLElement>(
				`[data-json-path="${CSS.escape(jsonPathKey(path.slice(0, length)))}"]`
			);
			if (!row) continue;
			if (stay && row.parentElement?.contains(stay)) stay.focus();
			else focusFirstControl(row);
			return;
		}
		if (stay) stay.focus();
		else this.root?.focus();
	}

	// By its value, not by whether it is on the page: a row that lost its value is still there while
	// its transition runs, and focus put in it would fall to the body when it ends.
	#leaving(control: HTMLElement) {
		if (!control.isConnected) return true;
		const key = control.closest('[data-json-path]')?.getAttribute('data-json-path');
		if (!key) return false;
		return (
			readJsonValue(
				untrack(() => this.value),
				JSON.parse(key) as JsonPath
			) === undefined
		);
	}

	/** The user has been through this value: its problems, and those of what holds it, may show. */
	touch = (path: JsonPath) => {
		for (let length = path.length; length >= 0; length -= 1) {
			this.#touched.add(jsonPathKey(path.slice(0, length)));
		}
	};

	/** The messages this value should show. */
	messagesFor = (path: JsonPath): string[] => {
		if (!this.#shown(path)) return [];
		return (this.#byPath.get(jsonPathKey(path)) ?? []).map((issue) => issue.text);
	};

	/** How many problems show below this value. */
	nestedIssueCount = (path: JsonPath): number => this.#shownAncestors.get(jsonPathKey(path)) ?? 0;

	/** Whether a problem exists at this value or under it, shown or not. */
	holdsIssue = (path: JsonPath): boolean =>
		this.issues.some((issue) => startsWith(issue.path, path));

	/** Shows every problem and opens the rows around them. */
	reveal = () => {
		this.#revealed = true;
		this.revealTick += 1;
	};

	setAllOpen = (open: boolean) => {
		this.expansion = { open, tick: this.expansion.tick + 1 };
	};

	openMenu = (menu: JsonEditorMenu) => this.#options.openMenu(menu);
	announce = (message: string) => this.#options.announce(message);

	/** Moves focus to the control of a value, opening the rows around it first. */
	focusPath = async (path: JsonPath): Promise<boolean> => {
		this.openRequest = { path, tick: this.openRequest.tick + 1 };
		// Each level renders the next one, so the row may be that many renders away.
		for (let level = 0; level <= path.length; level += 1) {
			await tick();
			const row = this.root?.querySelector<HTMLElement>(
				`[data-json-path="${CSS.escape(jsonPathKey(path))}"]`
			);
			if (row) return focusFirstControl(row);
		}
		return false;
	};

	/** The first control of a row, after the next render. */
	focusRow = async (rowId: string): Promise<boolean> => {
		await tick();
		// A new object or list renders its rows a render after its own.
		await tick();
		const row = this.root?.querySelector<HTMLElement>(`[data-json-row="${CSS.escape(rowId)}"]`);
		return focusFirstControl(row);
	};
}

// What takes focus in a row: something to type in first, then something to set. The buttons that
// manage rows (add, remove, the grip) never do: focus goes to where the work is.
const FIRST_FIELD = '[data-json-value] input:not([type="hidden"]), [data-json-value] textarea';
const FIRST_CONTROL = '[data-json-value] [role="switch"], [data-json-value] [role="combobox"]';

/**
 * Focuses the first field of a row or, for an object or a list, of the rows below it: they share
 * the wrapper a list gives each entry.
 */
export const focusFirstControl = (row: HTMLElement | null | undefined): boolean => {
	if (!row) return false;
	const scope =
		row.parentElement?.querySelector('[data-json-row]') === row ? row.parentElement : row;
	const target =
		scope?.querySelector<HTMLElement>(FIRST_FIELD) ??
		scope?.querySelector<HTMLElement>(FIRST_CONTROL) ??
		row.querySelector<HTMLElement>('[data-json-toggle]');
	target?.focus();
	return Boolean(target);
};

const CONTEXT = Symbol('entasis:json-editor');

export const setJsonEditor = (state: JsonEditorState) => setContext(CONTEXT, state);
export const useJsonEditor = () => getContext<JsonEditorState>(CONTEXT);

/** The identity of the rows of a list: stable while they move, so each keeps its focus and state. */
export class JsonRowIds {
	#prefix: string;
	#next = 0;
	#ids: string[] = [];

	constructor(prefix: string) {
		this.#prefix = prefix;
	}

	create = () => `${this.#prefix}-${this.#next++}`;

	/** The ids for a list of this length: an outside change keeps those that still have a row. */
	sync = (length: number): string[] => {
		while (this.#ids.length < length) this.#ids.push(this.create());
		this.#ids.length = length;
		return [...this.#ids];
	};

	insert = (index: number) => {
		const id = this.create();
		this.#ids.splice(index, 0, id);
		return id;
	};

	remove = (index: number) => {
		this.#ids.splice(index, 1);
	};

	move = (from: number, to: number) => {
		const [id] = this.#ids.splice(from, 1);
		this.#ids.splice(to, 0, id);
	};
}
