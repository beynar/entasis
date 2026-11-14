import { describe, expect, test } from 'vitest';
import packageJson from '../../package.json' with { type: 'json' };

// Source patterns that make the declarations svelte-package emits fail to typecheck in a consumer
// with `skipLibCheck: false`. The packed-library check finds them in the built package; these
// checks find them in seconds, and name the source file to change.

// Keyed by path relative to src/lib, without the leading `./`.
const sourceText = Object.fromEntries(
	Object.entries(
		import.meta.glob<string>('./**/*.{svelte,ts,js}', {
			query: '?raw',
			import: 'default',
			eager: true
		})
	).map(([file, text]) => [file.slice(2), text])
);
const sources = Object.keys(sourceText);

const isTest = (file: string) => /\.(test|spec|test-helper)\.|\.test\.svelte$/.test(file);
const read = (file: string) => sourceText[file];
const baseName = (file: string) => file.slice(file.lastIndexOf('/') + 1);
const scriptOf = (source: string) =>
	[...source.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map((match) => match[1]).join('\n');

// The local names an import statement binds, `type` imports included.
const importedNames = (code: string) => {
	const names: string[] = [];
	for (const [, clause] of code.matchAll(/^\s*import\s+(?:type\s+)?([^'";]+?)\s+from\s+['"]/gm)) {
		const named = clause.match(/\{([^}]*)\}/);
		const rest = clause
			.replace(/\{[^}]*\}/, '')
			.replace(/,/g, ' ')
			.trim();
		if (rest && !rest.startsWith('*')) names.push(rest.split(/\s+/)[0]);
		const namespace = rest.match(/\*\s+as\s+(\w+)/);
		if (namespace) names.push(namespace[1]);
		for (const specifier of named?.[1].split(',') ?? []) {
			const parts = specifier
				.trim()
				.replace(/^type\s+/, '')
				.split(/\s+as\s+/);
			const local = parts.at(-1)?.trim();
			if (local) names.push(local);
		}
	}
	return names;
};

// The declaration file svelte-package writes for a source file.
const declarationOf = (file: string) =>
	file.endsWith('.svelte') ? `${file}.d.ts` : file.replace(/\.(ts|js)$/, '.d.ts');

describe('sources that emit valid declarations', () => {
	test('a component never imports a binding named like itself', () => {
		// The emitted `Name.svelte.d.ts` declares `Name`; an import of the same name conflicts.
		const offenders = sources
			.filter((file) => file.endsWith('.svelte') && !isTest(file))
			.filter((file) =>
				importedNames(scriptOf(read(file))).includes(baseName(file).replace(/\.svelte$/, ''))
			);
		expect(offenders).toEqual([]);
	});

	test('no TypeScript or Svelte module imports a stylesheet for its side effect', () => {
		// TypeScript keeps such an import in the declaration, where TypeScript 6 cannot resolve it.
		const offenders = sources
			.filter((file) => !file.endsWith('.js') && !isTest(file))
			.filter((file) => {
				const code = file.endsWith('.svelte') ? scriptOf(read(file)) : read(file);
				return /^\s*import\s+['"][^'"]+\.css['"]/m.test(code);
			});
		expect(offenders).toEqual([]);
	});

	test('no module augments the global Document', () => {
		// A merged Document ships with the package and conflicts with lib.dom's own members.
		const offenders = sources
			.filter((file) => !isTest(file))
			.filter((file) =>
				/declare\s+global\s*\{[\s\S]*?\binterface\s+Document\s*\{/.test(read(file))
			);
		expect(offenders).toEqual([]);
	});

	test('no two declarations differ only by case', () => {
		// The package is built on case-insensitive disks too, where one would overwrite the other.
		const seen = new Map<string, string>();
		const collisions: string[] = [];
		for (const file of sources) {
			const declaration = declarationOf(file);
			const key = declaration.toLowerCase();
			const other = seen.get(key);
			if (other && other !== declaration) collisions.push(`${other} / ${declaration}`);
			seen.set(key, declaration);
		}
		expect(collisions).toEqual([]);
	});

	test('public props never import an optional peer', () => {
		// A consumer without that peer cannot resolve the import, even when it never renders the
		// component, as other public types (Form's, for instance) reach these props.
		const optionalPeers = Object.entries(
			(packageJson as { peerDependenciesMeta?: Record<string, { optional?: boolean }> })
				.peerDependenciesMeta ?? {}
		)
			.filter(([, meta]) => meta.optional)
			.map(([name]) => name);
		const offenders = sources
			.filter((file) => file.endsWith('.props.ts'))
			.filter((file) =>
				[...read(file).matchAll(/from\s+['"]([^'"]+)['"]/g)].some(([, specifier]) =>
					optionalPeers.some((peer) => specifier === peer || specifier.startsWith(`${peer}/`))
				)
			);
		expect(offenders).toEqual([]);
	});
});
