import structureMap from 'virtual:svelai-structure';
import type { ThemePart, ThemeVariant } from '../../tooling/structure-docs/types.js';

export type ThemeSnippetMode = 'default' | 'empty';

const INDENT = '  ';

/**
 * A ready-to-use `set<Component>Theme({..})` override snippet for a component.
 * `default` ships the current default classes; `empty` yields a blank scaffold to
 * fill in. Boolean variants are omitted — `setComponentTheme` types them as booleans,
 * so they take no string class map.
 */
export function buildThemeSnippet(component: string, mode: ThemeSnippetMode): string {
	const structure = structureMap[component];
	if (!structure) return '';

	const setter = structure.setter ?? `set${component}Theme`;
	const importPath = structure.importPath ?? 'svelai';
	const parts = structure.parts.filter(
		(part: ThemePart) =>
			part.base !== undefined ||
			part.variants?.some((variant: ThemeVariant) => !isBooleanVariant(variant))
	);

	const body = parts.map((part: ThemePart) => renderPart(part, mode)).join(',\n');
	return `import { ${setter} } from '${importPath}';\n\n${setter}({\n${body}\n});`;
}

/** One `partName: { base, variant: { value: classes } }` block, indented under the setter. */
function renderPart(part: ThemePart, mode: ThemeSnippetMode): string {
	const lines = [`${INDENT.repeat(2)}base: ${quote(mode === 'empty' ? '' : (part.base ?? ''))}`];

	for (const variant of part.variants ?? []) {
		if (isBooleanVariant(variant)) continue;
		const options = variant.options
			.map(
				(option) =>
					`${INDENT.repeat(3)}${key(option.value)}: ${quote(mode === 'empty' ? '' : option.classes)}`
			)
			.join(',\n');
		lines.push(`${INDENT.repeat(2)}${key(variant.name)}: {\n${options}\n${INDENT.repeat(2)}}`);
	}

	return `${INDENT}${key(part.name)}: {\n${lines.join(',\n')}\n${INDENT}}`;
}

/** A boolean variant (`{ true, false }`) can't be typed as a string map, so it's skipped. */
function isBooleanVariant(variant: ThemeVariant): boolean {
	return variant.options.every((option) => option.value === 'true' || option.value === 'false');
}

/** An object key, bare when it's a valid identifier, quoted otherwise. */
function key(name: string): string {
	return /^[A-Za-z_$][\w$]*$/.test(name) ? name : quote(name);
}

function quote(value: string): string {
	return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}
