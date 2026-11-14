// The static import graph of the library, read from `dist/` (what consumers bundle) or from
// `src/lib` (the same graph before packaging), and the rules for modules an entry must never pull
// in. `check.mjs` runs it; the node:test suite runs it on a fixture.
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import ts from 'typescript';

/**
 * Modules no entry may bundle. A rule names what is absent (`file` matches a library file name,
 * `package` a bare specifier and its subpaths) and, with `allowFrom`, the library files that may
 * import it statically anyway. `dynamic: true` also refuses a bare `import()`, which a consumer's
 * bundler would still pull into its build.
 */
export const absentRules = [
	{
		name: 'WebMCP tools load only under <Theme webmcp>',
		// `<owner>.webmcp.ts` is reached through `useWebMCPExposure(() => import(...))`. Ask and
		// MultiStepForm compute their Form's `tool` prop from theirs during render (AGENTS.md).
		file: /\.webmcp\.(js|ts)$/,
		allowFrom: [/\/Form\/Ask\/Ask\.svelte$/, /\/Form\/MultiStepForm\/MultiStepForm\.svelte$/]
	},
	{
		name: 'MapLibre loads from a CDN at runtime',
		package: 'maplibre-gl',
		dynamic: true
	},
	{
		name: 'intl-tel-input loads from a CDN at runtime',
		package: 'intl-tel-input',
		dynamic: true
	}
];

const scriptBlock = /<script\b[^>]*>([\s\S]*?)<\/script>/g;

/** `{ static: string[], dynamic: string[] }` module specifiers of one file's code. */
export function importsOf(source, filename) {
	const code = filename.endsWith('.svelte')
		? [...source.matchAll(scriptBlock)].map((match) => match[1]).join('\n;\n')
		: source;
	const file = ts.createSourceFile(
		filename.replace(/\.svelte$/, '.svelte.ts'),
		code,
		ts.ScriptTarget.Latest,
		false,
		ts.ScriptKind.TS
	);
	const found = { static: [], dynamic: [] };
	const visit = (node) => {
		if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
			const clause = node.importClause;
			// Type-only imports vanish from emitted JavaScript (source mode reads them too).
			const typeOnly =
				clause?.isTypeOnly ||
				(clause &&
					!clause.name &&
					clause.namedBindings &&
					ts.isNamedImports(clause.namedBindings) &&
					clause.namedBindings.elements.length > 0 &&
					clause.namedBindings.elements.every((element) => element.isTypeOnly));
			if (!typeOnly) found.static.push(node.moduleSpecifier.text);
			return;
		}
		if (
			ts.isExportDeclaration(node) &&
			node.moduleSpecifier &&
			ts.isStringLiteral(node.moduleSpecifier)
		) {
			const typeOnly =
				node.isTypeOnly ||
				(node.exportClause &&
					ts.isNamedExports(node.exportClause) &&
					node.exportClause.elements.length > 0 &&
					node.exportClause.elements.every((element) => element.isTypeOnly));
			if (!typeOnly) found.static.push(node.moduleSpecifier.text);
			return;
		}
		if (
			ts.isCallExpression(node) &&
			node.expression.kind === ts.SyntaxKind.ImportKeyword &&
			node.arguments[0] &&
			ts.isStringLiteralLike(node.arguments[0])
		) {
			found.dynamic.push(node.arguments[0].text);
		}
		ts.forEachChild(node, visit);
	};
	visit(file);
	return found;
}

const files = new Map();
function isFile(filename) {
	if (!files.has(filename))
		files.set(
			filename,
			stat(filename).then(
				(info) => info.isFile(),
				() => false
			)
		);
	return files.get(filename);
}

/**
 * Resolves a relative or `$lib/` specifier to a file under `libRoot`. Source imports name `.js`
 * for `.ts` files, so both are tried; bare specifiers are packages and return undefined.
 */
export async function resolveImport(specifier, from, libRoot) {
	let base;
	if (specifier.startsWith('$lib/')) base = path.join(libRoot, specifier.slice(5));
	else if (specifier.startsWith('.')) base = path.resolve(path.dirname(from), specifier);
	else return undefined;
	const candidates = [base];
	if (base.endsWith('.js')) candidates.push(base.replace(/\.js$/, '.ts'));
	candidates.push(
		`${base}.js`,
		`${base}.ts`,
		path.join(base, 'index.js'),
		path.join(base, 'index.ts')
	);
	for (const candidate of candidates) if (await isFile(candidate)) return candidate;
	return undefined;
}

const packageOf = (specifier) =>
	specifier.startsWith('@') ? specifier.split('/').slice(0, 2).join('/') : specifier.split('/')[0];

const isBare = (specifier) => !specifier.startsWith('.') && !specifier.startsWith('$lib/');

/**
 * Walks the static graph from `entry` and reports each rule broken on the way, with the import
 * chain that reaches it. Results are cached per file across calls through `cache`.
 */
export async function checkEntry(entry, libRoot, rules = absentRules, cache = new Map()) {
	const parse = async (filename) => {
		if (!cache.has(filename)) {
			const source = await readFile(filename, 'utf8');
			cache.set(filename, importsOf(source, filename));
		}
		return cache.get(filename);
	};
	const problems = [];
	const seen = new Map([[entry, null]]);
	const chain = (filename) => {
		const steps = [];
		for (let at = filename; at; at = seen.get(at)) steps.unshift(path.relative(libRoot, at));
		return steps.join(' -> ');
	};
	const queue = [entry];
	while (queue.length) {
		const filename = queue.shift();
		const imports = await parse(filename);
		for (const [kind, specifiers] of Object.entries(imports)) {
			for (const specifier of specifiers) {
				if (isBare(specifier)) {
					for (const rule of rules) {
						if (rule.package !== packageOf(specifier)) continue;
						if (kind === 'dynamic' && !rule.dynamic) continue;
						problems.push(
							`${rule.name}: ${chain(filename)} ${kind === 'dynamic' ? 'imports()' : 'imports'} '${specifier}'`
						);
					}
					continue;
				}
				if (kind === 'dynamic') continue;
				const target = await resolveImport(specifier, filename, libRoot);
				if (!target) continue;
				const relative = `/${path.relative(libRoot, filename).split(path.sep).join('/')}`;
				const broken = rules.find(
					(rule) =>
						rule.file?.test(target) && !rule.allowFrom?.some((pattern) => pattern.test(relative))
				);
				if (broken) {
					problems.push(
						`${broken.name}: ${chain(filename)} -> ${path.relative(libRoot, target)} (static import)`
					);
					// Its own imports would only repeat the problem.
					continue;
				}
				if (!seen.has(target)) {
					seen.set(target, filename);
					queue.push(target);
				}
			}
		}
	}
	return { problems, modules: seen.size };
}
