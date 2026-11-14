// npm run check:bundle-absent
//
// No public entry statically reaches a module it must not bundle (rules in ./graph.mjs): a
// component's `*.webmcp.ts` (dynamically imported only under `<Theme webmcp>`), MapLibre and
// intl-tel-input (loaded from a CDN at runtime).
//
//   node tooling/bundle-absent/check.mjs            reads dist/ (run `svelte-package` first; CI)
//   node tooling/bundle-absent/check.mjs --source   reads src/lib, the same graph before packaging
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { loadManifest, repositoryRoot } from '../component-contract/source.mjs';
import { checkEntry } from './graph.mjs';

const fromSource = process.argv.includes('--source');
const libRoot = path.join(repositoryRoot, fromSource ? 'src/lib' : 'dist');

const toLib = (sourceIndex) => {
	const relative = sourceIndex.replace(/^src\/lib\//, '');
	return path.join(libRoot, fromSource ? relative : relative.replace(/\.ts$/, '.js'));
};

async function entryFiles(entry) {
	if (!entry.sourceIndex.startsWith('src/lib/')) return [];
	if (!entry.sourceIndex.includes('*')) return [toLib(entry.sourceIndex)];
	// Wildcard subpaths (icons): every module the pattern matches.
	const pattern = toLib(entry.sourceIndex);
	const directory = path.dirname(pattern);
	const [prefix, suffix] = path.basename(pattern).split('*');
	return (await readdir(directory))
		.filter((name) => name.startsWith(prefix) && name.endsWith(suffix) && !name.includes('.test'))
		.map((name) => path.join(directory, name));
}

try {
	await readdir(libRoot);
} catch {
	console.error(
		`check:bundle-absent: ${path.relative(repositoryRoot, libRoot)} is missing. Run \`svelte-package\` first, or pass --source.`
	);
	process.exit(1);
}

const manifest = await loadManifest();
const cache = new Map();
const problems = new Set();
let entries = 0;
let modules = 0;
for (const entry of manifest) {
	if (entry.visibility !== 'public' || !entry.exports) continue;
	for (const file of await entryFiles(entry)) {
		entries += 1;
		const result = await checkEntry(file, libRoot, undefined, cache);
		modules = Math.max(modules, result.modules);
		for (const problem of result.problems) problems.add(`${entry.id}: ${problem}`);
	}
}

if (problems.size) {
	console.error(
		`check:bundle-absent failed (${problems.size}):\n${[...problems].map((p) => `- ${p}`).join('\n')}`
	);
	process.exit(1);
}
console.log(
	`check:bundle-absent passed: ${entries} entry modules in ${path.relative(repositoryRoot, libRoot)}, ${cache.size} modules read (largest entry graph ${modules}).`
);
