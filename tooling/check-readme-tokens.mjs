// The README documents two token tables that are really two TypeScript types. Both drifted once
// already (six of twelve `designTokens` keys listed, and the engine options described as "not
// plugin options"), so the types are the source of truth and this check fails on the names the
// README is missing.
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import ts from 'typescript';
import { repositoryRoot } from './component-contract/source.mjs';

const readSource = async (relativePath) => ({
	relativePath,
	text: await readFile(path.join(repositoryRoot, relativePath), 'utf8')
});

/**
 * Every property name declared under a type alias, including the ones nested in a wrapper such as
 * `Partial<{ ... }>`. Intersected named types (`EngineOptions`, `ColorTheme`) carry no literal of
 * their own here, so each is read from the file that declares it.
 */
const declaredKeys = ({ relativePath, text }, typeName) => {
	const ast = ts.createSourceFile(relativePath, text, ts.ScriptTarget.Latest, true);
	const alias = ast.statements.find(
		(statement) => ts.isTypeAliasDeclaration(statement) && statement.name.text === typeName
	);
	if (!alias) throw new Error(`${relativePath}: no "${typeName}" type alias to read keys from.`);

	const keys = [];
	const visit = (node) => {
		if (ts.isPropertySignature(node) && node.name) keys.push(node.name.text);
		ts.forEachChild(node, visit);
	};
	visit(alias.type);
	if (keys.length === 0) throw new Error(`${relativePath}: "${typeName}" declares no keys.`);
	return keys;
};

/** The body of one `##`/`###` README section, so a key found elsewhere does not satisfy a table. */
const section = (readme, heading) => {
	const start = readme.indexOf(heading);
	if (start === -1) throw new Error(`README.md: no "${heading}" section.`);
	const rest = readme.slice(start + heading.length);
	const end = rest.search(/\n#{2,3} /);
	return end === -1 ? rest : rest.slice(0, end);
};

/** A key is documented when it opens a table row: `| \`key\` | ...`. */
const missingFrom = (body, keys) =>
	keys.filter((key) => !new RegExp(`^\\|\\s*\`${key}\`\\s*\\|`, 'm').test(body));

const readme = await readFile(path.join(repositoryRoot, 'README.md'), 'utf8');
const designTokensSource = await readSource('src/lib/components/Theme/theme.designTokens.ts');
const themeSource = await readSource('src/lib/tailwind/theme.ts');
const scalesSource = await readSource('src/lib/tailwind/scales.ts');

const designTokenKeys = declaredKeys(designTokensSource, 'ThemeDesignTokens');
// `ThemeOptions` is `Partial<{ ... }> & EngineOptions & ColorTheme`. The colour seeds of
// `ColorTheme` are a mapped type with their own README table; the two option sets are these.
const pluginKeys = [
	...declaredKeys(themeSource, 'ThemeOptions'),
	...declaredKeys(scalesSource, 'EngineOptions')
];

const errors = [];
const missingDesignTokens = missingFrom(
	section(readme, '### Runtime design tokens'),
	designTokenKeys
);
if (missingDesignTokens.length)
	errors.push(
		`README.md "### Runtime design tokens": the designTokens table is missing ${missingDesignTokens.join(', ')} — every key of ThemeDesignTokens (${designTokensSource.relativePath}) needs a row.`
	);

const missingPluginOptions = missingFrom(section(readme, '### Plugin tokens'), pluginKeys);
if (missingPluginOptions.length)
	errors.push(
		`README.md "### Plugin tokens": the plugin option table is missing ${missingPluginOptions.join(', ')} — every key of ThemeOptions (${themeSource.relativePath}, including the EngineOptions it intersects) needs a row.`
	);

if (errors.length) throw new Error(`README token check failed:\n- ${errors.join('\n- ')}`);
console.log(
	`README token check passed (${designTokenKeys.length} designTokens keys, ${pluginKeys.length} plugin options).`
);
