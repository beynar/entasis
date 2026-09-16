// Every ```svelte / ```ts / ```css fence in the human and agent docs is compiled
// against the packaged `dist`, so a documented import path, prop or plugin option
// that does not exist fails the build instead of rotting.
//
// Opt a fence out with an info-string flag (```svelte nocheck) or a first line of
// `<!-- doc-fence: skip -->` / `// doc-fence: skip` / `/* doc-fence: skip */`.
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { parse } from 'svelte/compiler';
import { compile as compileTailwind } from 'tailwindcss';
import { loadManifest } from './component-contract/source.mjs';
import { createConsumerFixture, listFiles, repositoryRoot } from './consumer-fixture.mjs';

// `node tooling/check-doc-fences.mjs [substring…]` restricts the run to files whose path
// contains any of the substrings — handy while fixing one component's docs.
const only = process.argv.slice(2);
const documentationFiles = [
	path.join(repositoryRoot, 'README.md'),
	...(await listFiles(path.join(repositoryRoot, '.claude/skills/svelai'), (f) =>
		f.endsWith('.md')
	)),
	...(await listFiles(
		path.join(repositoryRoot, 'src/lib/components'),
		(f) => f.endsWith('.md') || f.endsWith('.mcp.ts')
	))
].filter((file) => only.length === 0 || only.some((part) => file.includes(part)));

const fenceRe = /(?:\\?`){3}(svelte|typescript|ts|css)([^\n]*)\n([\s\S]*?)(?:\\?`){3}/g;
const skipRe =
	/^\s*(?:<!--\s*doc-fence:\s*skip\s*-->|\/\/\s*doc-fence:\s*skip|\/\*\s*doc-fence:\s*skip\s*\*\/)/;

/** Tag name → package subpath, from the component contract manifest. */
const componentSubpaths = new Map();
for (const entry of await loadManifest()) {
	if (!entry.subpath || entry.subpath.includes('*')) continue;
	for (const symbol of entry.exportedSymbols ?? []) {
		if (/^[A-Z]/.test(symbol) && !componentSubpaths.has(symbol)) {
			componentSubpaths.set(symbol, `svelai${entry.subpath.slice(1)}`);
		}
	}
}

const isGlobal = (name) => name in globalThis || ['undefined', 'arguments'].includes(name);

/** Walks a Svelte AST collecting component tags, free identifiers and locally declared names. */
function analyseFragment(ast) {
	const components = new Set();
	const identifiers = new Set();
	const declared = new Set();
	const declarePattern = (pattern) => {
		if (!pattern || typeof pattern !== 'object') return;
		if (pattern.type === 'Identifier') declared.add(pattern.name);
		for (const value of Object.values(pattern)) {
			if (Array.isArray(value)) value.forEach(declarePattern);
			else if (value && typeof value === 'object' && value.type) declarePattern(value);
		}
	};
	const visit = (node, parent, key) => {
		if (!node || typeof node !== 'object') return;
		if (Array.isArray(node)) return node.forEach((child) => visit(child, parent, key));
		if (!node.type) {
			return Object.entries(node).forEach(([k, v]) => visit(v, node, k));
		}
		switch (node.type) {
			case 'Component':
				components.add(node.name.split('.')[0]);
				break;
			case 'SnippetBlock':
				declared.add(node.expression.name);
				node.parameters?.forEach(declarePattern);
				break;
			case 'EachBlock':
				declarePattern(node.context);
				if (node.index) declared.add(node.index);
				break;
			case 'ConstTag':
				declarePattern(node.declaration?.declarations?.[0]?.id);
				break;
			case 'LetDirective':
				declared.add(node.name);
				break;
			case 'Identifier':
				if (parent?.type === 'MemberExpression' && key === 'property' && !parent.computed) break;
				if (parent?.type === 'Property' && key === 'key' && !parent.computed) break;
				identifiers.add(node.name);
				break;
		}
		for (const [k, v] of Object.entries(node)) {
			if (k === 'metadata' || k === 'loc' || k === 'start' || k === 'end') continue;
			if (v && typeof v === 'object') visit(v, node, k);
		}
	};
	visit(ast.fragment, null, null);
	for (const c of components) identifiers.delete(c);
	for (const d of declared) identifiers.delete(d);
	return { components, identifiers };
}

/** Names declared at the top level of a `<script>` program (imports, vars, functions, classes). */
function declaredInScript(program) {
	const names = new Set();
	const addPattern = (pattern) => {
		if (!pattern || typeof pattern !== 'object') return;
		if (pattern.type === 'Identifier') names.add(pattern.name);
		for (const value of Object.values(pattern)) {
			if (Array.isArray(value)) value.forEach(addPattern);
			else if (value && typeof value === 'object' && value.type) addPattern(value);
		}
	};
	for (const statement of program?.body ?? []) {
		if (statement.type === 'ImportDeclaration') {
			statement.specifiers.forEach((specifier) => names.add(specifier.local.name));
		} else if (statement.type === 'VariableDeclaration') {
			statement.declarations.forEach((declaration) => addPattern(declaration.id));
		} else if (statement.type === 'FunctionDeclaration' || statement.type === 'ClassDeclaration') {
			if (statement.id) names.add(statement.id.name);
		} else if (statement.type === 'ExportNamedDeclaration' && statement.declaration) {
			const inner = statement.declaration;
			if (inner.type === 'VariableDeclaration') inner.declarations.forEach((d) => addPattern(d.id));
			else if (inner.id) names.add(inner.id.name);
		}
	}
	return names;
}

/**
 * Makes a fence self-contained so it type-checks against the package: components used in the
 * markup but never imported get their real `svelai/<subpath>` import, and free identifiers get
 * an `any` declaration. A fence with no `<script>` gets one; an existing script is extended.
 */
function completeFence(code, file) {
	const ast = parse(code, { filename: file, modern: true });
	const { components, identifiers } = analyseFragment(ast);
	const declared = new Set([
		...declaredInScript(ast.instance?.content),
		...declaredInScript(ast.module?.content)
	]);
	const lines = [];
	const unknown = [];
	for (const component of components) {
		if (declared.has(component)) continue;
		const subpath = componentSubpaths.get(component);
		if (subpath) lines.push(`import { ${component} } from '${subpath}';`);
		else unknown.push(component);
	}
	if (unknown.length) {
		throw new Error(
			`unknown component(s) ${unknown.join(', ')} — not exported by any svelai subpath`
		);
	}
	if (!ast.instance) {
		for (const identifier of identifiers) {
			if (!declared.has(identifier) && !isGlobal(identifier)) lines.push(`let ${identifier}: any;`);
		}
		return `<script lang="ts">\n${lines.join('\n')}\n</script>\n${code}`;
	}
	// Insert after the opening <script …> tag of the instance script; a plain JS script gets
	// untyped declarations (annotating it would mask a genuine "TS in a JS script" doc bug).
	const open = code.slice(ast.instance.start).match(/<script[^>]*>/);
	const isTs = /lang=["']ts["']/.test(open[0]);
	for (const identifier of identifiers) {
		if (!declared.has(identifier) && !isGlobal(identifier)) {
			lines.push(isTs ? `let ${identifier}: any;` : `let ${identifier};`);
		}
	}
	const insertAt = ast.instance.start + open[0].length;
	return `${code.slice(0, insertAt)}\n${lines.join('\n')}\n${code.slice(insertAt)}`;
}

const unescapeTemplate = (code, file) =>
	file.endsWith('.mcp.ts')
		? code.replaceAll('\\`', '`').replaceAll('\\${', '${').replaceAll('<\\/script>', '</script>')
		: code;

const fixture = await createConsumerFixture();
const failures = [];
const fenceIndex = new Map(); // fixture path → "doc file fence N"
const cssFences = [];
let total = 0;
try {
	for (const file of documentationFiles) {
		const source = await readFile(file, 'utf8');
		const relative = path.relative(repositoryRoot, file);
		let index = 0;
		for (const match of source.matchAll(fenceRe)) {
			index += 1;
			const [, language, info, raw] = match;
			const code = unescapeTemplate(raw, file);
			if (/\bnocheck\b/.test(info) || skipRe.test(code)) continue;
			total += 1;
			const label = `${relative} fence ${index}`;
			const slug = `${relative.replace(/[^a-z0-9]+/gi, '_')}_${index}`;
			try {
				if (language === 'css') {
					cssFences.push({ label, code });
				} else if (language === 'svelte') {
					const target = `src/docs/${slug}.svelte`;
					await fixture.write(target, completeFence(code, label));
					fenceIndex.set(target, { label });
				} else {
					const target = `src/docs/${slug}.ts`;
					await fixture.write(target, code);
					fenceIndex.set(target, { label, ts: true });
				}
			} catch (error) {
				failures.push(`${label}: ${error.message}`);
			}
		}
	}

	// svelte-check keeps every program in memory; ~900 fence files blow the heap, so check in batches.
	const targets = [...fenceIndex.keys()];
	const batchSize = 120;
	const diagnostics = [];
	for (let start = 0; start < targets.length; start += batchSize) {
		diagnostics.push(...(await fixture.svelteCheck(targets.slice(start, start + batchSize))));
	}
	for (const diagnostic of diagnostics) {
		if (diagnostic.type !== 'ERROR') continue;
		const fence = fenceIndex.get(diagnostic.file);
		if (!fence) continue;
		// Snippets are excerpts: an undeclared or implicitly-any name is not a documentation
		// bug. Everything else (bad import path, missing export, wrong prop, wrong type) fails.
		if ([2304, 2552, 2582, 7005, 7006, 7031, 7034, 18046].includes(diagnostic.code)) continue;
		failures.push(`${fence.label} (line ${diagnostic.line}): ${diagnostic.message}`);
	}

	const require = createRequire(path.join(fixture.root, 'package.json'));
	for (const { label, code } of cssFences) {
		try {
			await compileTailwind(code, {
				base: fixture.root,
				async loadModule(id, base) {
					const resolved = require.resolve(id, { paths: [base, fixture.root] });
					const module = await import(pathToFileURL(resolved).href);
					return { path: resolved, base: path.dirname(resolved), module: module.default ?? module };
				},
				async loadStylesheet(id, base) {
					const resolved = id.startsWith('.')
						? path.resolve(base, id)
						: require.resolve(id === 'tailwindcss' ? 'tailwindcss/index.css' : id, {
								paths: [base, fixture.root]
							});
					return {
						path: resolved,
						base: path.dirname(resolved),
						content: await readFile(resolved, 'utf8')
					};
				}
			});
		} catch (error) {
			failures.push(`${label}: ${error.message.split('\n')[0]}`);
		}
	}
} finally {
	await fixture.dispose();
}

if (failures.length) {
	console.error(
		`Documentation fences failed (${failures.length} of ${total}):\n- ${failures.join('\n- ')}`
	);
	process.exit(1);
}
console.log(`Documentation fences passed (${total} fences compiled against dist).`);
