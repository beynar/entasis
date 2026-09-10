// @ts-expect-error This build-only module runs in Node, whose ambient types are not a package dependency.
import { resolve } from 'node:path';
import { Project, type SourceFile } from 'ts-morph';
import type { Plugin } from 'vite';
import { extractComponentDocs } from './extract.js';
import type { PropsMap } from './types.js';

const VIRTUAL_ID = 'virtual:svelai-props';
const RESOLVED_ID = '\0' + VIRTUAL_ID;

/**
 * Internal Vite plugin: serves `virtual:svelai-props`, a map of every
 * component's resolved props (from their `*.props.ts`), keyed by component name.
 * Never packaged - it lives outside `src/` and is only wired into vite.config.
 */
export function svelaiPropsDocs(): Plugin {
	let root = '';
	let project: Project | null = null;
	let cachedMap: PropsMap | null = null;

	function getProject(): Project {
		if (project) return project;
		// tsconfig for compiler options only; the svelte-kit include pulls in
		// `.svelte` files ts-morph can't parse, so we add the `.ts` sources
		// ourselves and let dependency resolution load the rest.
		project = new Project({
			tsConfigFilePath: resolve(root, 'tsconfig.json'),
			skipAddingFilesFromTsConfig: true
		});
		project.addSourceFilesAtPaths(resolve(root, 'src/**/*.ts'));
		return project;
	}

	function buildMap(): PropsMap {
		if (cachedMap) return cachedMap;
		const proj = getProject();
		const map: PropsMap = {};
		for (const file of proj.getSourceFiles()) {
			const filePath = file.getFilePath();
			if (!filePath.endsWith('.props.ts')) continue;
			const docs = extractComponentDocs(proj, filePath);
			if (docs && (docs.props.length > 0 || docs.htmlAttributes.length > 0)) {
				map[docs.name] = docs;
			}
		}
		cachedMap = map;
		return map;
	}

	return {
		name: 'svelai-props-docs',
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
			if (!ctx.file.endsWith('.ts')) return;

			if (!project) return;
			const sourceFile = project.getSourceFile(ctx.file);
			if (!sourceFile || !affectsPropsDocs(sourceFile)) return;
			sourceFile.refreshFromFileSystemSync();
			cachedMap = null;

			const module = ctx.server.moduleGraph.getModuleById(RESOLVED_ID);
			if (module) {
				ctx.server.moduleGraph.invalidateModule(module);
				return [module];
			}
		}
	};
}

function affectsPropsDocs(sourceFile: SourceFile, visited = new Set<string>()): boolean {
	const filePath = sourceFile.getFilePath();
	if (filePath.endsWith('.props.ts')) return true;
	if (visited.has(filePath)) return false;
	visited.add(filePath);

	return sourceFile
		.getReferencingSourceFiles()
		.some((referencingFile) => affectsPropsDocs(referencingFile, visited));
}
