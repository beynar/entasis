import { parse } from 'svelte/compiler';
import { Node, type ObjectLiteralExpression, type Project, type SourceFile } from 'ts-morph';
import type { ComponentStructure, StructureNode, ThemePart, ThemeVariant } from './types.js';

/*
 * Svelte's compiler AST types are verbose and version-unstable, so template
 * nodes are traversed as `any`. Every access is guarded and the shapes are
 * documented inline; this is the pragmatic boundary for AST walking.
 */

type Ctx = {
	source: string;
	/** Identifier holding the theme (`const classes = $derived(useXTheme(..))`). */
	classesId: string;
	/** Local `{#snippet name}` bodies, inlined where `{@render name()}` appears. */
	snippets: Map<string, any>;
	/** Snippet names currently being inlined, to stop recursive expansion. */
	visited: Set<string>;
	/** Literal prop defaults from `$props()` destructuring, e.g. `icon` -> `math`. */
	propDefaults: Map<string, string>;
	/** Prop names from `$props()`; a `{@render prop()}` of one is a snippet-prop slot. */
	propNames: Set<string>;
};

/**
 * The unfiltered template tree, before pruning to the customization surface.
 * `each`/`if`/`snippet-ref` nodes exist only here - they're resolved by `toSurface`.
 */
type RawNode = {
	kind: 'element' | 'component' | 'slot' | 'snippet-ref' | 'each' | 'if';
	tag?: string;
	themePart?: string;
	slot?: StructureNode['slot'];
	/** True for visually-hidden elements (`sr-only`, `aria-hidden`) - pruned entirely. */
	hidden?: boolean;
	/** The iterable expression of an `{#each}`, e.g. `itemsWithId`. */
	label?: string;
	/** Child nodes for element/component/slot/each/snippet-ref. */
	children?: RawNode[];
	/** Branches for `if` (consequent, else-if…, else); `test` is undefined for the final else. */
	branches?: Branch[];
};

/**
 * One arm of an `{#if}` chain. `defaultValue` is set when this branch is the one
 * selected while props sit at their defaults (`icon === 'math'` with `icon = 'math'`).
 */
type Branch = { test?: string; defaultValue?: string; nodes: RawNode[] };

/** Build a component's structural schema from its `.svelte` source + theme parts. */
export function extractComponentStructure(
	source: string,
	componentName: string,
	parts: ThemePart[]
): ComponentStructure {
	const root: any = parse(source, { modern: true });
	const ctx: Ctx = {
		source,
		classesId: findClassesIdentifier(root.instance) ?? 'classes',
		snippets: collectSnippets(root.fragment),
		visited: new Set(),
		propDefaults: readPropDefaults(root.instance),
		propNames: readPropNames(root.instance)
	};

	// Full template tree -> customization surface (themed nodes + slots, meaningful
	// control flow) -> collapse redundant nested conditions (e.g. `if a` > `if a`).
	const tree = collapseConditions(surface(walkFragment(root.fragment, ctx)));

	const used = new Set<string>();
	collectUsedParts(tree, used);
	return { name: componentName, tree, parts: parts.map((p) => ({ ...p, used: used.has(p.name) })) };
}

/**
 * Prune the raw tree to the customization surface, keeping the *meaningful*
 * control flow as wrapper nodes:
 * - keep nodes with a `theme.<part>` or slots; drop untyped wrappers / internal snippets
 *   (their kept descendants bubble up);
 * - drop visually-hidden (`sr-only`) subtrees;
 * - `{#each}` with surviving content becomes a `control` region;
 * - `{#if}` becomes `control` region(s): a single condition wraps its branch; a real
 *   either/or (>=2 surviving branches) yields one region per branch; a lone surviving
 *   `else` (all tested branches were internal defaults) is inlined without a box.
 */
function surface(nodes: RawNode[]): StructureNode[] {
	return nodes.flatMap(surfaceNode);
}

/**
 * Merge a conditional region whose only child is another conditional into one
 * (`{#if a}` wrapping `{:else if a}` -> a single `if a`), deduping identical tests
 * and conjoining distinct ones (`a` + `b` -> `a && b`). Nested guards are common
 * when a component re-checks the same prop at an outer and inner level.
 */
function collapseConditions(nodes: StructureNode[]): StructureNode[] {
	return nodes.map((node) => {
		let current: StructureNode = node.children
			? { ...node, children: collapseConditions(node.children) }
			: node;
		while (
			isConditional(current) &&
			current.children?.length === 1 &&
			isConditional(current.children[0])
		) {
			const inner = current.children[0];
			current = {
				kind: 'control',
				control: {
					keyword: current.control!.keyword,
					label: mergeTests(current.control!.label, inner.control!.label)
				},
				children: inner.children
			};
		}
		return current;
	});
}

/**
 * When every surviving `{#if}` branch is a single, childless node applying the
 * *same* theme part, they're one customization point rather than an either/or:
 * built-in default renderings plus (optionally) an overridable slot. Collapse to
 * one node - a slot when any branch is overridable - flagged as having a default.
 */
function groupSameThemePart(
	survivors: { test?: string; defaultValue?: string; nodes: StructureNode[] }[]
): StructureNode | null {
	if (survivors.length < 2) return null;
	if (!survivors.every((branch) => branch.nodes.length === 1)) return null;

	const leaves = survivors.map((branch) => branch.nodes[0]);
	const part = leaves[0].themePart;
	if (!part || !leaves.every((node) => node.themePart === part && !node.children?.length))
		return null;

	const slotLeaf = leaves.find((node) => node.kind === 'slot');
	const hasDefault = leaves.some((node) => node.kind !== 'slot');
	// The built-in rendered while props sit at their defaults (e.g. icon `math`).
	const defaultValue = survivors.find((branch) => branch.defaultValue)?.defaultValue;
	return {
		kind: slotLeaf ? 'slot' : 'element',
		tag: slotLeaf?.tag ?? leaves[0].tag,
		themePart: part,
		...(slotLeaf?.slot && { slot: slotLeaf.slot }),
		...(hasDefault && { hasDefault: true }),
		...(defaultValue && { defaultValue })
	};
}

function isConditional(node: StructureNode): boolean {
	return (
		node.kind === 'control' &&
		(node.control?.keyword === 'if' || node.control?.keyword === 'else if')
	);
}

function mergeTests(outer?: string, inner?: string): string | undefined {
	const parts = [...(outer?.split(' && ') ?? []), ...(inner?.split(' && ') ?? [])]
		.map((part) => part.trim())
		.filter(Boolean);
	const unique = [...new Set(parts)];
	return unique.length ? unique.join(' && ') : undefined;
}

function surfaceNode(node: RawNode): StructureNode[] {
	if (node.hidden) return [];

	if (node.kind === 'each') {
		const children = surface(node.children ?? []);
		if (!children.length) return [];
		return [{ kind: 'control', control: { keyword: 'each', label: node.label }, children }];
	}

	if (node.kind === 'if') {
		const survivors = (node.branches ?? [])
			.map((branch) => ({
				test: branch.test,
				defaultValue: branch.defaultValue,
				nodes: surface(branch.nodes)
			}))
			.filter((branch) => branch.nodes.length > 0);
		if (survivors.length === 0) return [];

		// Several branches rendering the SAME theme part are one customization point
		// (a themed slot with built-in defaults), not a user-facing either/or.
		const grouped = groupSameThemePart(survivors);
		if (grouped) return [grouped];

		// All tested branches died; only a default `else` survived (e.g. internal icon
		// fallbacks). Inline its content - the branching carried no consumer meaning.
		const tested = survivors.filter((branch) => branch.test !== undefined);
		if (tested.length === 0) return survivors.flatMap((branch) => branch.nodes);

		// A single condition, no surviving else: one optional/conditional region. But a
		// lone gate around a node that renders by default ("shown unless disabled") isn't
		// a real choice - drop the misleading condition.
		if (survivors.length === 1) {
			const only = survivors[0];
			if (only.nodes.length === 1 && only.nodes[0].hasDefault) return only.nodes;
			return [
				{ kind: 'control', control: { keyword: 'if', label: only.test }, children: only.nodes }
			];
		}

		// Genuine either/or: one region per surviving branch.
		let seenTest = false;
		return survivors.map((branch) => {
			const keyword = branch.test === undefined ? 'else' : seenTest ? 'else if' : 'if';
			seenTest ||= branch.test !== undefined;
			return {
				kind: 'control' as const,
				control: { keyword, label: branch.test },
				children: branch.nodes
			};
		});
	}

	const children = surface(node.children ?? []);
	// Keep slots, themed nodes, and child *components* (composition points the reader
	// must see, e.g. a default `<Button>` trigger). Anonymous elements/wrappers without
	// a theme part stay transparent - their kept descendants bubble up.
	const kept = node.kind === 'slot' || node.kind === 'component' || !!node.themePart;
	if (!kept) return children;

	return [
		{
			kind: node.kind === 'slot' ? 'slot' : node.kind === 'component' ? 'component' : 'element',
			tag: node.tag,
			...(node.themePart && { themePart: node.themePart }),
			...(node.slot && { slot: node.slot }),
			...(children.length && { children })
		}
	];
}

/**
 * Theme parts = keys of the exported `*Theme` object literal in `*.theme.ts`, each
 * carrying its `cva` definition (`base` / `variants` / `defaultVariants`). Parts map
 * to a local `const x = cva({..})` identifier; the config is resolved from that.
 */
export function readThemeParts(project: Project, themeFilePath: string): ThemePart[] {
	const sourceFile =
		project.getSourceFile(themeFilePath) ?? project.addSourceFileAtPath(themeFilePath);
	const cvaConfigs = collectCvaConfigs(sourceFile);

	for (const decl of sourceFile.getVariableDeclarations()) {
		if (!decl.isExported() || !/Theme$/.test(decl.getName())) continue;
		const init = decl.getInitializer();
		if (!init || !Node.isObjectLiteralExpression(init)) continue;

		const parts: ThemePart[] = [];
		for (const prop of init.getProperties()) {
			if (!Node.isPropertyAssignment(prop) && !Node.isShorthandPropertyAssignment(prop)) continue;
			const name = prop.getName();
			const initializer = Node.isPropertyAssignment(prop) ? prop.getInitializer() : undefined;
			const target = Node.isShorthandPropertyAssignment(prop)
				? name
				: initializer && Node.isIdentifier(initializer)
					? initializer.getText()
					: undefined;
			const config = target ? cvaConfigs.get(target) : undefined;
			parts.push({ name, used: false, ...(config ? parseCvaConfig(config) : {}) });
		}
		if (parts.length) return parts;
	}
	return [];
}

/**
 * The `set<Component>Theme` export name, i.e. the exported binding initialized with
 * `setComponentTheme<..>(..)`. Names are irregular (`setCalendarInputTheme`), so read
 * the actual declaration rather than deriving it. Returns the first such export.
 */
export function readThemeSetter(project: Project, themeFilePath: string): string | undefined {
	const sourceFile =
		project.getSourceFile(themeFilePath) ?? project.addSourceFileAtPath(themeFilePath);
	for (const decl of sourceFile.getVariableDeclarations()) {
		if (!decl.isExported()) continue;
		const init = decl.getInitializer();
		if (
			init &&
			Node.isCallExpression(init) &&
			init.getExpression().getText() === 'setComponentTheme'
		) {
			return decl.getName();
		}
	}
	return undefined;
}

/** Map of local `const name = cva({..})` declarations to their config object literal. */
function collectCvaConfigs(sourceFile: SourceFile): Map<string, ObjectLiteralExpression> {
	const configs = new Map<string, ObjectLiteralExpression>();
	for (const decl of sourceFile.getVariableDeclarations()) {
		const init = decl.getInitializer();
		if (!init || !Node.isCallExpression(init) || init.getExpression().getText() !== 'cva') continue;
		const arg = init.getArguments()[0];
		if (arg && Node.isObjectLiteralExpression(arg)) configs.set(decl.getName(), arg);
	}
	return configs;
}

/** Break a `cva({ base, variants, defaultVariants })` config into its display parts. */
function parseCvaConfig(config: ObjectLiteralExpression): Partial<ThemePart> {
	const base = stringProp(config, 'base');
	const variantsObj = objectProp(config, 'variants');
	const variants = variantsObj ? parseVariants(variantsObj) : [];
	const defaultsObj = objectProp(config, 'defaultVariants');
	const defaultVariants = defaultsObj ? parseDefaults(defaultsObj) : {};

	return {
		...(base && { base }),
		...(variants.length && { variants }),
		...(Object.keys(defaultVariants).length && { defaultVariants })
	};
}

/** Each variant axis (`size`) with the non-empty options it defines (`small` -> classes). */
function parseVariants(variantsObj: ObjectLiteralExpression): ThemeVariant[] {
	const variants: ThemeVariant[] = [];
	for (const prop of variantsObj.getProperties()) {
		if (!Node.isPropertyAssignment(prop)) continue;
		const optionsObj = prop.getInitializer();
		if (!optionsObj || !Node.isObjectLiteralExpression(optionsObj)) continue;

		const options = optionsObj
			.getProperties()
			.filter(Node.isPropertyAssignment)
			.map((option) => ({
				value: option.getName(),
				classes: literalString(option.getInitializer()) ?? ''
			}))
			.filter((option) => option.classes.length > 0);
		if (options.length) variants.push({ name: prop.getName(), options });
	}
	return variants;
}

/** `defaultVariants` as a `variant -> value` string map (`size: 'normal'`, `disabled: false`). */
function parseDefaults(defaultsObj: ObjectLiteralExpression): Record<string, string> {
	const defaults: Record<string, string> = {};
	for (const prop of defaultsObj.getProperties()) {
		if (!Node.isPropertyAssignment(prop)) continue;
		const value = literalString(prop.getInitializer()) ?? prop.getInitializer()?.getText();
		if (value) defaults[prop.getName()] = value;
	}
	return defaults;
}

function stringProp(obj: ObjectLiteralExpression, name: string): string | undefined {
	const prop = obj.getProperty(name);
	return prop && Node.isPropertyAssignment(prop) ? literalString(prop.getInitializer()) : undefined;
}

function objectProp(
	obj: ObjectLiteralExpression,
	name: string
): ObjectLiteralExpression | undefined {
	const prop = obj.getProperty(name);
	if (!prop || !Node.isPropertyAssignment(prop)) return undefined;
	const init = prop.getInitializer();
	return init && Node.isObjectLiteralExpression(init) ? init : undefined;
}

/** The string value of a string or no-substitution template literal, else undefined. */
function literalString(node: Node | undefined): string | undefined {
	if (Node.isStringLiteral(node) || Node.isNoSubstitutionTemplateLiteral(node))
		return node.getLiteralValue();
	return undefined;
}

// --- template walking ---------------------------------------------------

function walkFragment(fragment: any, ctx: Ctx): RawNode[] {
	const out: RawNode[] = [];
	for (const node of fragment?.nodes ?? []) out.push(...walkNode(node, ctx));
	return out;
}

function walkNode(node: any, ctx: Ctx): RawNode[] {
	switch (node.type) {
		case 'RegularElement':
		case 'SvelteElement': {
			const tag = node.type === 'SvelteElement' ? 'svelte:element' : node.name;
			return [element('element', tag, node, ctx)];
		}
		case 'Component':
		case 'SvelteComponent':
		case 'SvelteSelf': {
			const name = node.name ?? 'svelte:self';
			if (name === 'Slot') return [buildSlotNode(node, ctx)];
			return [element('component', name, node, ctx)];
		}
		case 'EachBlock':
			return [
				{ kind: 'each', label: raw(ctx, node.expression), children: walkFragment(node.body, ctx) }
			];
		case 'IfBlock':
			return [{ kind: 'if', branches: flattenIf(node, ctx) }];
		case 'RenderTag':
			return walkRenderTag(node, ctx);
		case 'KeyBlock':
			return walkFragment(node.fragment, ctx);
		case 'SnippetBlock':
			return []; // definition only; inlined at its `{@render}` site
		default:
			// Unknown blocks (await, etc.): stay transparent, surface their children.
			return childFragments(node).flatMap((frag) => walkFragment(frag, ctx));
	}
}

/** Flatten an `{#if}/{:else if}/{:else}` chain into an ordered list of branches. */
function flattenIf(node: any, ctx: Ctx): Branch[] {
	const branches: Branch[] = [];
	let current = node;
	while (current) {
		branches.push({
			test: raw(ctx, current.test),
			...(defaultBranchValue(current.test, ctx.propDefaults) && {
				defaultValue: defaultBranchValue(current.test, ctx.propDefaults)
			}),
			nodes: walkFragment(current.consequent, ctx)
		});
		const alternate = current.alternate;
		if (!alternate?.nodes?.length) break;
		const elseif =
			alternate.nodes.length === 1 && alternate.nodes[0].type === 'IfBlock'
				? alternate.nodes[0]
				: null;
		if (elseif?.elseif) {
			current = elseif;
		} else {
			branches.push({ nodes: walkFragment(alternate, ctx) });
			break;
		}
	}
	return branches;
}

/** A `{@render x()}`: inline a local snippet transparently, mark `children`/icon snippets. */
function walkRenderTag(node: any, ctx: Ctx): RawNode[] {
	const call = node.expression;
	// `call` may be a ChainExpression (`children?.(…)`); leadingIdentifier unwraps it.
	const name = leadingIdentifier(call);

	if (name && ctx.snippets.has(name) && !ctx.visited.has(name)) {
		ctx.visited.add(name);
		const children = walkFragment(ctx.snippets.get(name), ctx);
		ctx.visited.delete(name);
		return children; // transparent - the snippet's kept nodes bubble up
	}
	// A rendered snippet *prop* (`children`, `trigger`, …) is a customization slot.
	if (name && ctx.propNames.has(name)) {
		return [{ kind: 'slot', tag: '@render', slot: { name, source: raw(ctx, call) } }];
	}
	// A non-local snippet (e.g. a built-in icon) can still apply a theme part via a
	// class argument: `{@render caretDownIcon({ class: classes.icon(...) })}`.
	const themePart = call ? findClassesMember(call, ctx.classesId) : undefined;
	return [{ kind: 'snippet-ref', tag: name ?? raw(ctx, call), ...(themePart && { themePart }) }];
}

function buildSlotNode(node: any, ctx: Ctx): RawNode {
	const renderAttr = getAttr(node, 'render');
	const renderExpr = attrExpression(renderAttr);
	const payloadAttr = getAttr(node, 'payload');
	const asAttr = getAttr(node, 'as');

	const themePart = themePartOf(node, ctx);
	const children = walkFragment(node.fragment, ctx);
	return {
		kind: 'slot',
		tag: 'Slot',
		...(themePart && { themePart }),
		...(isHidden(node) && { hidden: true }),
		slot: {
			name: renderExpr ? leadingIdentifier(renderExpr) : undefined,
			source: renderAttr ? attrRaw(renderAttr, ctx) : '',
			payload: payloadAttr ? attrRaw(payloadAttr, ctx) : undefined,
			as: asAttr ? attrLiteralOrRaw(asAttr, ctx) : undefined
		},
		...(children.length && { children })
	};
}

// --- attributes ---------------------------------------------------------

/** The theme part applied via `class={classes.<part>()}` on a node, if any. */
function themePartOf(node: any, ctx: Ctx): string | undefined {
	const classAttr = node.attributes?.find((a: any) => a.type === 'Attribute' && a.name === 'class');
	if (!classAttr) return undefined;
	for (const value of normAttrValue(classAttr.value)) {
		if (value?.type !== 'ExpressionTag') continue;
		const part = findClassesMember(value.expression, ctx.classesId);
		if (part) return part;
	}
	return undefined;
}

/** First `classes.<part>` member access in an ESTree expression. */
function findClassesMember(expr: any, classesId: string): string | undefined {
	let found: string | undefined;
	walkEstree(expr, (n) => {
		if (
			!found &&
			n.type === 'MemberExpression' &&
			n.object?.type === 'Identifier' &&
			n.object.name === classesId &&
			n.property?.type === 'Identifier'
		) {
			found = n.property.name;
		}
	});
	return found;
}

function getAttr(node: any, name: string): any {
	return node.attributes?.find((a: any) => a.type === 'Attribute' && a.name === name);
}

function attrExpression(attr: any): any {
	if (!attr) return undefined;
	return normAttrValue(attr.value).find((v) => v?.type === 'ExpressionTag')?.expression;
}

/** Raw source of an attribute's expression, e.g. `title || resolve(item, key)`. */
function attrRaw(attr: any, ctx: Ctx): string {
	const expr = attrExpression(attr);
	if (expr) return raw(ctx, expr);
	const text = normAttrValue(attr.value).find((v) => v?.type === 'Text');
	return text?.data ?? '';
}

/** A string literal attribute (`as="span"`) as its value, else the raw expression. */
function attrLiteralOrRaw(attr: any, ctx: Ctx): string {
	const text = normAttrValue(attr.value).find((v) => v?.type === 'Text');
	return text ? text.data : attrRaw(attr, ctx);
}

function normAttrValue(value: any): any[] {
	if (value === true) return [];
	return Array.isArray(value) ? value : [value];
}

// --- helpers ------------------------------------------------------------

function findClassesIdentifier(instance: any): string | undefined {
	for (const stmt of instance?.content?.body ?? []) {
		if (stmt.type !== 'VariableDeclaration') continue;
		for (const decl of stmt.declarations) {
			if (decl.id?.type === 'Identifier' && callsThemeHook(decl.init)) return decl.id.name;
		}
	}
	return undefined;
}

/** Literal defaults from `let { icon = 'math', ... } = $props()` -> `{ icon: 'math' }`. */
function readPropDefaults(instance: any): Map<string, string> {
	const defaults = new Map<string, string>();
	for (const stmt of instance?.content?.body ?? []) {
		if (stmt.type !== 'VariableDeclaration') continue;
		for (const decl of stmt.declarations) {
			const init = decl.init;
			const isProps =
				init?.type === 'CallExpression' &&
				init.callee?.type === 'Identifier' &&
				init.callee.name === '$props';
			if (!isProps || decl.id?.type !== 'ObjectPattern') continue;
			for (const prop of decl.id.properties) {
				const value = prop.type === 'Property' ? prop.value : undefined;
				if (
					value?.type === 'AssignmentPattern' &&
					value.left?.type === 'Identifier' &&
					value.right?.type === 'Literal'
				) {
					defaults.set(value.left.name, String(value.right.value));
				}
			}
		}
	}
	return defaults;
}

/** All prop identifiers destructured from `$props()` (`{ children, trigger, ... }`). */
function readPropNames(instance: any): Set<string> {
	const names = new Set<string>();
	for (const stmt of instance?.content?.body ?? []) {
		if (stmt.type !== 'VariableDeclaration') continue;
		for (const decl of stmt.declarations) {
			const init = decl.init;
			const isProps =
				init?.type === 'CallExpression' &&
				init.callee?.type === 'Identifier' &&
				init.callee.name === '$props';
			if (!isProps || decl.id?.type !== 'ObjectPattern') continue;
			for (const prop of decl.id.properties) {
				if (prop.type === 'Property') {
					const value = prop.value;
					if (value?.type === 'Identifier') names.add(value.name);
					else if (value?.type === 'AssignmentPattern' && value.left?.type === 'Identifier')
						names.add(value.left.name);
				}
			}
		}
	}
	return names;
}

/**
 * The literal a branch tests for when it matches a prop's default value, i.e. the
 * branch rendered "by default". `icon === 'math'` with `icon = 'math'` -> `math`.
 */
function defaultBranchValue(test: any, defaults: Map<string, string>): string | undefined {
	let found: string | undefined;
	walkEstree(test, (node) => {
		if (
			found ||
			node.type !== 'BinaryExpression' ||
			(node.operator !== '===' && node.operator !== '==')
		)
			return;
		const pair = comparedLiteral(node.left, node.right) ?? comparedLiteral(node.right, node.left);
		if (pair && defaults.get(pair.name) === pair.value) found = pair.value;
	});
	return found;
}

function comparedLiteral(a: any, b: any): { name: string; value: string } | null {
	if (a?.type === 'Identifier' && b?.type === 'Literal')
		return { name: a.name, value: String(b.value) };
	return null;
}

/** True for `useXTheme(..)` or `$derived(useXTheme(..))`. */
function callsThemeHook(init: any): boolean {
	let call = init;
	if (call?.type === 'CallExpression' && call.callee?.name === '$derived')
		call = call.arguments?.[0];
	const name = call?.type === 'CallExpression' ? call.callee?.name : undefined;
	return !!name && (/^use[A-Z]\w*Theme$/.test(name) || name === 'useComponentTheme');
}

function collectSnippets(fragment: any): Map<string, any> {
	const map = new Map<string, any>();
	walkAll(fragment, (node) => {
		if (node.type === 'SnippetBlock' && node.expression?.name)
			map.set(node.expression.name, node.body);
	});
	return map;
}

/** Leftmost identifier name of an expression (`title` from `title || resolve()`). */
function leadingIdentifier(expr: any): string | undefined {
	if (!expr) return undefined;
	switch (expr.type) {
		case 'Identifier':
			return expr.name;
		case 'ChainExpression':
			return leadingIdentifier(expr.expression);
		case 'LogicalExpression':
			return leadingIdentifier(expr.left);
		case 'ConditionalExpression':
			return leadingIdentifier(expr.consequent);
		case 'CallExpression':
			return leadingIdentifier(expr.callee);
		case 'MemberExpression':
			return leadingIdentifier(expr.object);
		default:
			return undefined;
	}
}

function collectUsedParts(nodes: StructureNode[], used: Set<string>): void {
	for (const node of nodes) {
		if (node.themePart) used.add(node.themePart);
		if (node.children) collectUsedParts(node.children, used);
	}
}

function raw(ctx: Ctx, node: any): string {
	if (typeof node?.start !== 'number' || typeof node?.end !== 'number') return '';
	return ctx.source.slice(node.start, node.end);
}

/** Sub-fragments a template node can hold, across element/block kinds. */
function childFragments(node: any): any[] {
	return [
		node.fragment,
		node.body,
		node.fallback,
		node.consequent,
		node.alternate,
		node.pending,
		node.then,
		node.catch
	].filter((frag) => frag?.nodes);
}

function walkAll(fragment: any, visit: (node: any) => void): void {
	for (const node of fragment?.nodes ?? []) {
		visit(node);
		for (const frag of childFragments(node)) walkAll(frag, visit);
	}
}

/** Depth-first walk of an ESTree expression's child nodes. */
function walkEstree(node: any, visit: (node: any) => void): void {
	if (!node || typeof node.type !== 'string') return;
	visit(node);
	for (const key of Object.keys(node)) {
		if (key === 'start' || key === 'end' || key === 'loc' || key === 'range') continue;
		const value = node[key];
		if (Array.isArray(value)) value.forEach((child) => walkEstree(child, visit));
		else if (value && typeof value === 'object') walkEstree(value, visit);
	}
}

function element(kind: 'element' | 'component', tag: string, node: any, ctx: Ctx): RawNode {
	const themePart = themePartOf(node, ctx);
	// `{#snippet name}` blocks nested in a child component are that component's slot
	// content authored here (e.g. `<Popover>{#snippet children}…`). walkNode skips
	// SnippetBlocks (they're definitions), so expand their bodies inline as children.
	const slotBodies =
		kind === 'component'
			? (node.fragment?.nodes ?? [])
					.filter((child: any) => child.type === 'SnippetBlock')
					.flatMap((block: any) => walkFragment(block.body, ctx))
			: [];
	return {
		kind,
		tag,
		...(themePart && { themePart }),
		...(isHidden(node) && { hidden: true }),
		children: [...walkFragment(node.fragment, ctx), ...slotBodies]
	};
}

/** Visually-hidden elements (`class="sr-only"`, `aria-hidden`) aren't part of the visual surface. */
function isHidden(node: any): boolean {
	const classAttr = getAttr(node, 'class');
	if (classAttr) {
		for (const value of normAttrValue(classAttr.value)) {
			if (
				value?.type === 'Text' &&
				String(value.data ?? '')
					.split(/\s+/)
					.includes('sr-only')
			)
				return true;
		}
	}
	const ariaHidden = getAttr(node, 'aria-hidden');
	if (ariaHidden) {
		const values = normAttrValue(ariaHidden.value);
		if (values.some((v) => v?.type === 'Text' && String(v.data ?? '').trim() === 'true'))
			return true;
	}
	return false;
}
