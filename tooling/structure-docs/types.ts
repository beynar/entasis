/**
 * Structural schema of a component, extracted statically from its `.svelte`
 * template + `*.theme.ts`. Powers docs that show *where slots render* and
 * *where each theme part's classes land* in the composed markup.
 */

/**
 * What a node in the rendered tree is. The tree is pruned to the *customization
 * surface*: themed elements, slots, and the *meaningful* control flow wrapping
 * them survive; internal wrappers, hidden (`sr-only`) branches, and non-slot
 * snippets (icons, etc.) are dropped.
 */
export type NodeKind =
	/** A themed DOM element (`div`, `button`) carrying a `theme.<part>`. */
	| 'element'
	/** A themed child component. */
	| 'component'
	/** A slot insertion point (`<Slot render={..} />` or `{@render children()}`). */
	| 'slot'
	/** A control-flow region (`{#each}` / `{#if}`) enclosing its content. */
	| 'control';

/** Control-flow region label for a `kind === 'control'` node. */
export type ControlInfo = {
	keyword: 'each' | 'if' | 'else if' | 'else';
	/** The iterable (`each`) or condition (`if`/`else if`); absent for `else`. */
	label?: string;
};

export type SlotInfo = {
	/** Best-effort slot/prop name (leading identifier of the render expression). */
	name?: string;
	/** Raw render expression as authored, e.g. `title || resolve(item, titleKey)`. */
	source: string;
	/** Payload expression passed to the snippet, e.g. `{ item }`. */
	payload?: string;
	/** Wrapper element the `Slot` renders into (`as` prop), when set. */
	as?: string;
};

export type StructureNode = {
	kind: NodeKind;
	/** Element tag or component name (`div`, `button`, `Slot`, `caretDownIcon`). */
	tag?: string;
	/** Theme part applied here, read from `class={classes.<part>(...)}`. */
	themePart?: string;
	/** Present when `kind === 'slot'`. */
	slot?: SlotInfo;
	/** Present when `kind === 'control'`. */
	control?: ControlInfo;
	/**
	 * A slot/element that renders a built-in default (e.g. the icon shows a default
	 * glyph unless overridden). Set when several control-flow branches render the
	 * same theme part and one of them is an overridable slot.
	 */
	hasDefault?: boolean;
	/** The specific default rendered while props sit at their defaults, e.g. `math`. */
	defaultValue?: string;
	children?: StructureNode[];
};

/** One value of a `cva` variant, e.g. `size` -> `small` carrying its classes. */
export type ThemeVariantOption = {
	/** The variant value (`small`, `true`), a key of `variants.<name>`. */
	value: string;
	/**
	 * Utility classes applied for this value; empty options are dropped upstream.
	 * On a `motion` part this is the variant's spec as authored (`{}` when it only
	 * inherits the base), and empty options are kept.
	 */
	classes: string;
};

/** A `cva` / `motion()` variant axis, e.g. `size` with its `small`/`normal`/`large` options. */
export type ThemeVariant = {
	name: string;
	options: ThemeVariantOption[];
};

/**
 * What a theme part carries: utility classes from a `cva()` definition, or a
 * transition spec from a `motion()` preset (the reserved `motion` slot).
 */
export type ThemePartKind = 'classes' | 'motion';

/** A themeable part declared in `*.theme.ts` (a key of the exported `*Theme` object). */
export type ThemePart = {
	name: string;
	/**
	 * Whether the part carries classes (`cva`) or a transition preset (`motion`).
	 * Absent means `classes`, so existing consumers keep working unchanged.
	 */
	kind?: ThemePartKind;
	/** Whether the extracted tree actually applies this part somewhere. */
	used: boolean;
	/**
	 * The part's `cva` base classes (always applied), when resolvable. For a
	 * `motion` part, the base spec as authored, e.g. `{ in: { scale: 0.98 }, out: {..} }`.
	 */
	base?: string;
	/** The part's `cva` / `motion()` variant axes, absent when the part has none. */
	variants?: ThemeVariant[];
	/** The `defaultVariants` map (variant name -> selected value). */
	defaultVariants?: Record<string, string>;
};

export type ComponentStructure = {
	/** PascalCase component name, e.g. "Accordion". */
	name: string;
	/** The rendered markup tree (top-level nodes). */
	tree: StructureNode[];
	/** Catalog of theme parts from `*.theme.ts`, flagged by whether they're placed. */
	parts: ThemePart[];
	/** The `set<Component>Theme` export name, e.g. "setAccordionTheme". */
	setter?: string;
	/** Package subpath the setter is imported from, e.g. "entasis/accordion". */
	importPath?: string;
};

/** Keyed by component name (e.g. "Accordion"). */
export type StructureMap = Record<string, ComponentStructure>;
