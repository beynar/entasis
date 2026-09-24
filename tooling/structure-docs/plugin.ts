// @ts-expect-error This build-only module runs in Node, whose ambient types are not a package dependency.
import { readdirSync, readFileSync } from 'node:fs';
// @ts-expect-error This build-only module runs in Node, whose ambient types are not a package dependency.
import { basename, dirname, join, relative, resolve, sep } from 'node:path';
import { Project } from 'ts-morph';
import type { Plugin } from 'vite';
import {
	extractComponentStructure,
	readThemeKey,
	readThemeParts,
	readThemeSetter
} from './extract.js';
import type { StructureMap } from './types.js';

const VIRTUAL_ID = 'virtual:entasis-structure';
const RESOLVED_ID = '\0' + VIRTUAL_ID;
const COMPONENTS_DIR = 'src/lib/components';

/**
 * Internal Vite plugin: serves `virtual:entasis-structure`, a map of each
 * themeable component's rendered markup tree (from its `.svelte`), annotated
 * with slot insertion points and theme parts (from its `*.theme.ts`). Keyed by
 * component name. Never packaged - dev/docs only.
 */
/**
 * Build the structure map for every themeable component under `root`: the docs site reads it
 * through the Vite plugin below, the component-contract generator through this export.
 */
export function buildStructureMap(root: string, project: Project): StructureMap {
	const componentsRoot = resolve(root, COMPONENTS_DIR);
	const importMap = buildImportMap(root);
	const map: StructureMap = {};
	for (const themeFile of findThemeFiles(componentsRoot)) {
		const svelteFiles = findMainSvelteFiles(themeFile);
		// A component theme without a main .svelte of its own (CalendarInput, Password): no tree to
		// draw, but its parts, key and setter still belong in the reference. Presets
		// (`<consumer>.<role>.theme.ts`) are skipped: they restyle another component's parts.
		if (svelteFiles.length === 0 && basename(themeFile).split('.').length === 3) {
			const name = basename(themeFile)
				.replace(/\.theme\.ts$/, '')
				.replace(/^\w/, (first: string) => first.toUpperCase());
			try {
				const registryKey = readThemeKey(project, themeFile);
				if (registryKey) {
					const setter = readThemeSetter(project, themeFile);
					const directory = relative(componentsRoot, dirname(themeFile));
					const importPath = importMap.get(directory);
					map[name] = {
						name,
						tree: [],
						parts: readThemeParts(project, themeFile),
						...(setter && { setter }),
						registryKey,
						...(importPath && { importPath }),
						directory
					};
				}
			} catch (error) {
				console.warn(`[entasis-structure] skipped ${name}: ${(error as Error).message}`);
			}
			continue;
		}
		for (const svelteFile of svelteFiles) {
			const name = basename(svelteFile).slice(0, -'.svelte'.length);
			try {
				const parts = readThemeParts(project, themeFile);
				const source = readFileSync(svelteFile, 'utf8');
				const setter = readThemeSetter(project, themeFile);
				const registryKey = readThemeKey(project, themeFile);
				const directory = relative(componentsRoot, dirname(svelteFile));
				const importPath = importMap.get(directory);
				map[name] = {
					...extractComponentStructure(source, name, parts),
					...(setter && { setter }),
					...(registryKey && { registryKey }),
					...(importPath && { importPath }),
					directory
				};
			} catch (error) {
				// Skip a single unparseable component (surface it) rather than fail the build.
				console.warn(`[entasis-structure] skipped ${name}: ${(error as Error).message}`);
			}
		}
	}
	return map;
}

export function entasisStructureDocs(): Plugin {
	let root = '';
	let project: Project | null = null;
	let cachedMap: StructureMap | null = null;

	function getProject(): Project {
		return (project ??= new Project({ skipAddingFilesFromTsConfig: true }));
	}

	function buildMap(): StructureMap {
		return (cachedMap ??= buildStructureMap(root, getProject()));
	}

	return {
		name: 'entasis-structure-docs',
		configResolved(config) {
			root = config.root;
		},
		resolveId(id) {
			if (id === VIRTUAL_ID) return RESOLVED_ID;
		},
		load(id) {
			if (id !== RESOLVED_ID) return;
			return `export default ${JSON.stringify(buildMap())};`;
		},
		handleHotUpdate(ctx) {
			if (!affectsStructureDocs(root, ctx.file)) return;
			if (project) project.getSourceFile(ctx.file)?.refreshFromFileSystemSync();
			cachedMap = null;

			const module = ctx.server.moduleGraph.getModuleById(RESOLVED_ID);
			if (module) {
				ctx.server.moduleGraph.invalidateModule(module);
				return [module];
			}
		}
	};
}

function affectsStructureDocs(root: string, filePath: string): boolean {
	const componentsRoot = resolve(root, COMPONENTS_DIR);
	if (!filePath.startsWith(`${componentsRoot}${sep}`)) return false;
	if (filePath.endsWith('.theme.ts')) return true;
	if (!filePath.endsWith('.svelte')) return false;

	const directory = dirname(filePath);
	return readdirSync(directory)
		.filter((file: string) => file.endsWith('.theme.ts'))
		.some((themeFile: string) =>
			findMainSvelteFiles(join(directory, themeFile)).includes(filePath)
		);
}

/**
 * Map each component directory (relative to the components root, e.g. "Button",
 * "Form/Combobox") to its published import path (e.g. "entasis/button"), read from
 * `package.json` `exports`. Lets the docs show a copy-pasteable, correct import.
 */
function buildImportMap(root: string): Map<string, string> {
	const map = new Map<string, string>();
	const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8')) as {
		name?: string;
		exports?: Record<string, { svelte?: string; default?: string } | string>;
	};
	if (!pkg.name || !pkg.exports) return map;

	for (const [subpath, target] of Object.entries(pkg.exports)) {
		const entry = typeof target === 'string' ? target : (target.svelte ?? target.default);
		const dir = entry?.match(/^\.\/dist\/components\/(.+)\/index\.js$/)?.[1];
		// Keep the first (canonical) subpath when several alias the same directory.
		if (dir && !map.has(dir)) map.set(dir, pkg.name + subpath.slice(1));
	}
	return map;
}

/** All `*.theme.ts` files under the components tree. */
function findThemeFiles(dir: string): string[] {
	return readdirSync(dir, { recursive: true, encoding: 'utf8' })
		.filter((entry: string) => entry.endsWith('.theme.ts'))
		.map((entry: string) => join(dir, entry));
}

/**
 * The main `.svelte` beside a theme file: `accordion.theme.ts` -> `Accordion.svelte`
 * (case-insensitive basename match). Skips subcomponents with their own themes.
 */
function findMainSvelteFiles(themeFile: string): string[] {
	const base = basename(themeFile)
		.replace(/\.theme\.ts$/, '')
		.toLowerCase();
	const dir = dirname(themeFile);
	const siblings = (readdirSync(dir) as string[]).filter((file: string) =>
		file.endsWith('.svelte')
	);
	const direct = siblings.find(
		(file: string) => file.slice(0, -'.svelte'.length).toLowerCase() === base
	);
	if (direct) return [join(dir, direct)];
	if (!base.startsWith('ai')) return [];
	const unprefixed = base.slice(2);
	return siblings
		.filter((file: string) => {
			const name = file.slice(0, -'.svelte'.length).toLowerCase();
			return name === unprefixed || name === `${unprefixed}s`;
		})
		.map((file: string) => join(dir, file));
}
