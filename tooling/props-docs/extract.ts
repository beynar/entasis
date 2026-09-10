// @ts-expect-error This build-only module runs in Node, whose ambient types are not a package dependency.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
// @ts-expect-error This build-only module runs in Node, whose ambient types are not a package dependency.
import { basename, dirname, join } from 'node:path';
import { Node, type Project, type Type, type Symbol as MorphSymbol, ts } from 'ts-morph';
import type { ComponentDocs, PropCategory, PropDoc } from './types.js';

const MAX_EXPANDED_LENGTH = 4000;
/** Above this, the resolved type text is too unwieldy for the cell - use the authored text instead. */
const MAX_VALUE_LENGTH = 80;

/**
 * `card.props.ts` -> `Card`, `checkboxesInput.props.ts` -> `CheckboxesInput`.
 * Prefers the sibling `.svelte` file's casing so acronyms survive
 * (`qrCode.props.ts` -> `QRCode.svelte` -> `QRCode`, not `QrCode`).
 */
function componentNameFromPath(filePath: string): string {
	const base = basename(filePath).replace(/\.props\.ts$/, '');
	const sibling = readdirSync(dirname(filePath)).find(
		(file: string) =>
			file.endsWith('.svelte') &&
			file.slice(0, -'.svelte'.length).toLowerCase() === base.toLowerCase()
	);
	if (sibling) return sibling.slice(0, -'.svelte'.length);
	return base.charAt(0).toUpperCase() + base.slice(1);
}

/**
 * Resolve a `.props.ts` file into a ComponentDocs by flattening its main
 * `*Props` type with the type-checker. Returns null when no matching type is
 * found (so the caller can skip it).
 */
export function extractComponentDocs(project: Project, filePath: string): ComponentDocs | null {
	const sourceFile = project.getSourceFile(filePath);
	if (!sourceFile) return null;

	const componentName = componentNameFromPath(filePath);
	const declaration = findMainType(sourceFile, componentName);
	if (!declaration) return null;

	const checker = project.getTypeChecker();
	const type = declaration.getType();
	const bindables = readBindableNames(filePath, componentName);
	const symbols = type.getProperties();
	const htmlAttributes = findInheritedHtmlAttributeTypes(declaration);
	const shouldCollapseHtmlAttributes = htmlAttributes.length > 0;

	const props = symbols
		.filter((symbol) => !shouldCollapseHtmlAttributes || !isInheritedHtmlAttribute(symbol))
		.map((symbol) => toPropDoc(symbol, declaration, checker, bindables))
		.filter((prop): prop is PropDoc => prop !== null)
		.sort((a, b) => a.name.localeCompare(b.name));

	return { name: componentName, htmlAttributes, props };
}

/** Native element attribute intersections represented once by the props table instead of flattened. */
function findInheritedHtmlAttributeTypes(declaration: Node): string[] {
	const htmlAttributes = new Set<string>();
	const visitedAliases = new Set<string>();

	visit(declaration);
	return [...htmlAttributes];

	function visit(node: Node): void {
		for (const reference of node.getDescendantsOfKind(ts.SyntaxKind.TypeReference)) {
			if (isNestedPropType(reference)) continue;
			const typeName = reference.getTypeName().getText();
			if (/^HTML\w*Attributes$/.test(typeName)) {
				htmlAttributes.add(reference.getText().replace(/\s+/g, ' '));
				continue;
			}

			const sourceFile = reference.getSourceFile();
			const alias = sourceFile.getTypeAlias(typeName) ?? sourceFile.getInterface(typeName);
			if (!alias) continue;
			const aliasKey = `${sourceFile.getFilePath()}:${typeName}`;
			if (visitedAliases.has(aliasKey)) continue;
			visitedAliases.add(aliasKey);
			visit(alias);
		}
	}

	function isNestedPropType(reference: Node): boolean {
		return reference.getAncestors().some((ancestor) => {
			if (ancestor === declaration) return false;
			if (Node.isPropertySignature(ancestor) || Node.isIndexedAccessTypeNode(ancestor)) {
				return true;
			}
			return Node.isTypeReference(ancestor) && ancestor.getTypeName().getText() === 'Pick';
		});
	}
}

/**
 * Names declared with `$bindable()` in the component's `.svelte`, so the docs
 * can flag which props support `bind:`. Reads the sibling `${Component}.svelte`
 * (falling back to any `.svelte` in the folder) since ts-morph can't parse Svelte.
 */
function readBindableNames(propsFilePath: string, componentName: string): Set<string> {
	const dir = dirname(propsFilePath);
	const mainFile = join(dir, `${componentName}.svelte`);
	const files = existsSync(mainFile)
		? [mainFile]
		: readdirSync(dir)
				.filter((file: string) => file.endsWith('.svelte'))
				.map((file: string) => join(dir, file));

	const names = new Set<string>();
	for (const file of files) {
		const source = readFileSync(file, 'utf8');
		for (const match of source.matchAll(/(\w+)\s*=\s*\$bindable(?:\s*<[^;\n=]*>)?\s*\(/g)) {
			names.add(match[1]);
		}
	}
	return names;
}

/** Prefer the type/interface named `${Component}Props`, else the first exported `*Props`. */
function findMainType(
	sourceFile: ReturnType<Project['getSourceFile']> & object,
	componentName: string
) {
	const preferredName = `${componentName}Props`;
	const alias = sourceFile.getTypeAlias(preferredName) ?? sourceFile.getInterface(preferredName);
	if (alias) return alias;

	const fallbackAlias = sourceFile
		.getTypeAliases()
		.find((a) => a.isExported() && a.getName().endsWith('Props'));
	if (fallbackAlias) return fallbackAlias;

	return (
		sourceFile.getInterfaces().find((i) => i.isExported() && i.getName().endsWith('Props')) ?? null
	);
}

function toPropDoc(
	symbol: MorphSymbol,
	location: Node,
	checker: ReturnType<Project['getTypeChecker']>,
	bindables: Set<string>
): PropDoc | null {
	const name = symbol.getName();
	// Skip index signatures / symbol keys (e.g. WithAttachments' [key: symbol]).
	if (!name || name.startsWith('__')) return null;

	const propType = symbol.getTypeAtLocation(location);
	const { value, type } = describeType(symbol, propType, location, checker);

	return {
		name,
		optional: isOptional(symbol, propType),
		value,
		description: getDescription(symbol, checker),
		category: classify(name, propType, bindables),
		...(type ? { type } : {})
	};
}

function isInheritedHtmlAttribute(symbol: MorphSymbol): boolean {
	const declarations = symbol.getDeclarations();
	return (
		declarations.length > 0 &&
		declarations.every((declaration) =>
			declaration.getSourceFile().getFilePath().includes('/node_modules/svelte/elements')
		)
	);
}

/**
 * Bucket a prop for grouping. Structural roles (slot, callback) win over
 * `binding`, which then covers the remaining `$bindable()` data props.
 */
function classify(name: string, propType: Type, bindables: Set<string>): PropCategory {
	if (isSlotType(propType)) return 'slot';
	if (hasCallableMember(propType)) return 'event';
	if (bindables.has(name)) return 'binding';
	return 'prop';
}

function hasCallableMember(propType: Type): boolean {
	const members = propType.isUnion() ? propType.getUnionTypes() : [propType];
	return members.some(
		(member) => !member.isNull() && !member.isUndefined() && member.getCallSignatures().length > 0
	);
}

function isOptional(symbol: MorphSymbol, propType: Type): boolean {
	const hasOptionalFlag = (symbol.getFlags() & ts.SymbolFlags.Optional) !== 0;
	if (hasOptionalFlag) return true;
	if (propType.isUnion()) return propType.getUnionTypes().some((t) => t.isUndefined());
	return false;
}

function getDescription(
	symbol: MorphSymbol,
	checker: ReturnType<Project['getTypeChecker']>
): string {
	const parts = symbol.compilerSymbol.getDocumentationComment(checker.compilerObject);
	return ts.displayPartsToString(parts).trim();
}

/**
 * Produce the short `value` (with the redundant `undefined` from optionality
 * dropped) and, only when `value` is a bare alias identifier that hides its
 * definition (e.g. `Sizes`, `SelectThemeProps`), an `expanded` string for the
 * hovercard. Inline unions/functions already show their shape in `value`.
 */
function describeType(
	symbol: MorphSymbol,
	propType: Type,
	location: Node,
	checker: ReturnType<Project['getTypeChecker']>
): { value: string; type?: string } {
	if (isSlotType(propType)) return describeSlot(symbol, propType, location, checker);

	const resolved = typeText(propType, location, checker);

	// Deep structural types (e.g. theme intersections) are unreadable inline -
	// show the developer-authored type and keep the full structure for the hovercard.
	const authored = authoredTypeText(symbol);
	if (resolved.length > MAX_VALUE_LENGTH && authored && authored.length < resolved.length) {
		return { value: authored, type: truncate(resolved) };
	}

	if (isBareIdentifier(resolved)) {
		const expanded = expandAlias(propType, location, checker);
		if (expanded && normalize(expanded) !== normalize(resolved)) {
			// Short, single-line expansions (simple literal unions like `FitMode`) read fine
			// inline - show them directly rather than hiding them behind a hovercard. Keep the
			// alias + popover only for long unions (e.g. `Colors`) or multi-line object shapes.
			const isMultiline = expanded.includes('\n');
			if (!isMultiline && expanded.length <= MAX_VALUE_LENGTH) {
				return { value: expanded };
			}
			return { value: resolved, type: truncate(expanded) };
		}
	}

	return { value: resolved };
}

/**
 * Slots (`Slot`/`Snippet`, possibly unioned with an object or `string`). Drops
 * the noisy empty payload (`Slot<undefined>` -> `Slot`) from the cell and, when
 * the snippet receives arguments, expands those payloads into the hovercard.
 */
function describeSlot(
	symbol: MorphSymbol,
	propType: Type,
	location: Node,
	checker: ReturnType<Project['getTypeChecker']>
): { value: string; type?: string } {
	const resolved = simplifyEmptyPayload(typeText(propType, location, checker));
	const authored = authoredTypeText(symbol);
	const value =
		resolved.length > MAX_VALUE_LENGTH && authored && authored.length < resolved.length
			? simplifyEmptyPayload(authored)
			: resolved;

	const payload = slotPayloadDescription(propType, location, checker);
	if (payload && normalize(payload) !== normalize(value)) {
		return { value, type: truncate(payload) };
	}
	// Value had to be shortened but there's no distinct payload - keep the full form on hover.
	if (value !== resolved) return { value, type: truncate(resolved) };
	return { value };
}

/** True when any member of the (possibly unioned) type is a `Slot`/`Snippet`. */
function isSlotType(propType: Type): boolean {
	const members = propType.isUnion() ? propType.getUnionTypes() : [propType];
	return members.some((member) => {
		const name = (member.getAliasSymbol() ?? member.getSymbol())?.getName();
		return name === 'Snippet' || name === 'Slot' || name === 'SnippetSlot';
	});
}

/**
 * The snippet's arguments, one per line, expanding each into its shape when it
 * is a named object/union worth unfolding. Returns undefined for payload-less
 * slots (their `[]`/`undefined` args carry nothing to describe).
 */
function slotPayloadDescription(
	propType: Type,
	location: Node,
	checker: ReturnType<Project['getTypeChecker']>
): string | undefined {
	const payloads = slotPayloads(propType);
	if (payloads.length === 0) return undefined;

	const parts = payloads.map((payload) => {
		const text = typeText(payload, location, checker);
		const expanded = expandAlias(payload, location, checker);
		return expanded && normalize(expanded) !== normalize(text) ? `${text} = ${expanded}` : text;
	});
	return parts.join('\n\n');
}

/** The tuple element types a slot's snippet is called with (empty when payload-less). */
function slotPayloads(propType: Type): Type[] {
	const members = propType.isUnion() ? propType.getUnionTypes() : [propType];
	for (const member of members) {
		const name = (member.getAliasSymbol() ?? member.getSymbol())?.getName();
		if (name === 'Snippet') {
			const tuple = member.getTypeArguments()[0];
			if (!tuple) return [];
			return tuple.isTuple() ? tuple.getTupleElements() : [tuple];
		}
		if (name === 'Slot' || name === 'SnippetSlot') {
			const payload = member.getAliasTypeArguments()[0] ?? member.getTypeArguments()[0];
			return payload && !payload.isUndefined() ? [payload] : [];
		}
	}
	return [];
}

/** `Slot<undefined>` -> `Slot`, `Snippet<[]>` -> `Snippet`: no payload, no noise. */
function simplifyEmptyPayload(text: string): string {
	return text
		.replace(/\bSlot<undefined>/g, 'Slot')
		.replace(/\bSnippetSlot<undefined>/g, 'Snippet')
		.replace(/\bSnippet<\[\s*\]>/g, 'Snippet');
}

/** The type as written in source (e.g. `SelectThemeProps & InputProps<'select'>['theme']`). */
function authoredTypeText(symbol: MorphSymbol): string | undefined {
	const declaration = symbol.getDeclarations()[0];
	if (!declaration || !Node.isPropertySignature(declaration)) return undefined;
	const typeNode = declaration.getTypeNode();
	return typeNode ? cleanImports(typeNode.getText()) : undefined;
}

/** Expand a named alias into its union members or one-level object shape. */
function expandAlias(
	propType: Type,
	location: Node,
	checker: ReturnType<Project['getTypeChecker']>
): string | undefined {
	if (propType.isUnion()) {
		const members = propType.getUnionTypes().filter((t) => !t.isUndefined() && !t.isNull());
		// `boolean` is a `true | false` union under the hood - not worth expanding.
		if (members.length === 0 || members.every((m) => m.isBooleanLiteral())) return undefined;
		if (members.length === 1) return expandAlias(members[0], location, checker);
		return members.map((member) => typeText(member, location, checker)).join(' | ');
	}

	if (isNamedObject(propType) && !isExternalType(propType)) {
		const members = propType.getProperties().map((member) => {
			const memberType = member.getTypeAtLocation(location);
			const optional = (member.getFlags() & ts.SymbolFlags.Optional) !== 0;
			return `  ${member.getName()}${optional ? '?' : ''}: ${typeText(memberType, location, checker)};`;
		});
		if (members.length === 0) return undefined;
		return `{\n${members.join('\n')}\n}`;
	}

	return undefined;
}

/** Checker type text without expanding generic conditional types, cleaned for display. */
function typeText(
	type: Type,
	location: Node,
	checker: ReturnType<Project['getTypeChecker']>
): string {
	return stripUndefined(
		cleanImports(checker.getTypeText(type, location, ts.TypeFormatFlags.NoTypeReduction))
	);
}

/** Strip `import("path").` prefixes the checker emits for out-of-scope types (e.g. `Slot`). */
function cleanImports(text: string): string {
	return text.replace(/import\((?:"[^"]*"|'[^']*')\)\./g, '');
}

/** A named object alias (e.g. a theme type) worth expanding - not an inline `__type` or array. */
function isNamedObject(propType: Type): boolean {
	if (!propType.isObject() || propType.isArray()) return false;
	const alias = propType.getAliasSymbol();
	if (alias) return true;
	const symbol = propType.getSymbol();
	const symbolName = symbol?.getName();
	return !!symbolName && symbolName !== '__type' && symbolName !== '__object';
}

function isExternalType(propType: Type): boolean {
	const symbol = propType.getAliasSymbol() ?? propType.getSymbol();
	const declarations = symbol?.getDeclarations() ?? [];
	return (
		declarations.length > 0 &&
		declarations.every((declaration) =>
			declaration.getSourceFile().getFilePath().includes('/node_modules/')
		)
	);
}

/** Remove the `undefined` union member that optionality adds, so values read cleanly. */
function stripUndefined(text: string): string {
	const members = text.split(' | ').filter((part) => part.trim() !== 'undefined');
	return members.join(' | ');
}

/** True for a single type name like `Sizes` or `SelectThemeProps` (no unions, generics, or literals). */
function isBareIdentifier(text: string): boolean {
	return /^[A-Za-z_$][\w$]*$/.test(text);
}

function normalize(text: string): string {
	return text.replace(/\s+/g, ' ').trim();
}

function truncate(text: string): string {
	if (text.length <= MAX_EXPANDED_LENGTH) return text;
	return `${text.slice(0, MAX_EXPANDED_LENGTH)}\n… (truncated)`;
}
