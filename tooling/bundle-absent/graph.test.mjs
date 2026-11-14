// node --test tooling/bundle-absent/graph.test.mjs (part of npm run test:contracts)
// A tiny packaged library: what `svelte-package` writes to dist/ (relative `.js` imports, `.svelte`
// files with their script blocks), so the check is exercised without building the real package.
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { absentRules, checkEntry, importsOf } from './graph.mjs';

async function fixture(files, run) {
	const root = await mkdtemp(path.join(os.tmpdir(), 'entasis-absent-'));
	try {
		for (const [file, source] of Object.entries(files)) {
			await mkdir(path.dirname(path.join(root, file)), { recursive: true });
			await writeFile(path.join(root, file), source);
		}
		await run(root);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
}

const tabs = {
	'components/Tabs/index.js': "export { default as Tabs } from './Tabs.svelte';",
	'components/Tabs/Tabs.svelte': [
		'<script module>',
		"\timport { shared } from '../../utils/shared.js';",
		'</script>',
		'<script>',
		"\timport { useWebMCPExposure } from '../../utils/webmcp/exposure.js';",
		"\tuseWebMCPExposure(() => import('./tabs.webmcp.js'));",
		'</script>',
		'<div></div>'
	].join('\n'),
	'components/Tabs/tabs.webmcp.js': "import { heavy } from '../../utils/heavy.js';",
	'utils/shared.js': 'export const shared = 1;',
	'utils/heavy.js': 'export const heavy = 1;',
	'utils/webmcp/exposure.js': 'export const useWebMCPExposure = () => {};'
};

test('reads static, re-exported, dynamic and type-only imports', () => {
	const found = importsOf(
		[
			"import a from './a.js';",
			"import type { B } from './b.js';",
			"import { type C } from './c.js';",
			"import { type D, e } from './d.js';",
			"export * from './f.js';",
			"export type { G } from './g.js';",
			"const h = () => import('./h.js');",
			"import './side-effect.js';"
		].join('\n'),
		'module.ts'
	);
	assert.deepEqual(found.static, ['./a.js', './d.js', './f.js', './side-effect.js']);
	assert.deepEqual(found.dynamic, ['./h.js']);
});

test('a dynamically imported WebMCP module is absent from the entry graph', async () => {
	await fixture(tabs, async (root) => {
		const result = await checkEntry(path.join(root, 'components/Tabs/index.js'), root);
		assert.deepEqual(result.problems, []);
		assert.equal(result.modules, 4, 'index, Tabs.svelte, shared, exposure; not webmcp or heavy');
	});
});

test('a static import of a WebMCP module fails with its import chain', async () => {
	await fixture(
		{
			...tabs,
			'components/Tabs/Tabs.svelte':
				"<script>\n\timport { expose } from './tabs.webmcp.js';\n</script>"
		},
		async (root) => {
			const { problems } = await checkEntry(path.join(root, 'components/Tabs/index.js'), root);
			assert.equal(problems.length, 1);
			assert.match(
				problems[0],
				/components\/Tabs\/index\.js -> components\/Tabs\/Tabs\.svelte -> components\/Tabs\/tabs\.webmcp\.js/
			);
		}
	);
});

test('Ask may import its WebMCP module statically; nothing else may reach it', async () => {
	const files = {
		'components/Form/Ask/index.js': "export { default } from './Ask.svelte';",
		'components/Form/Ask/Ask.svelte': "<script>\n\timport './ask.webmcp.js';\n</script>",
		'components/Form/Ask/ask.webmcp.js': 'export {};',
		'components/Other/index.js': "import '../Form/Ask/ask.webmcp.js';"
	};
	await fixture(files, async (root) => {
		const ask = await checkEntry(path.join(root, 'components/Form/Ask/index.js'), root);
		assert.deepEqual(ask.problems, []);
		const other = await checkEntry(path.join(root, 'components/Other/index.js'), root);
		assert.equal(other.problems.length, 1);
	});
});

test('MapLibre and intl-tel-input are never imported, statically or dynamically', async () => {
	await fixture(
		{
			'components/Map/index.js': "export const load = () => import('maplibre-gl');",
			'components/Phone/index.js': "import 'intl-tel-input/build/css/intlTelInput.css';",
			'components/Cdn/index.js':
				"export const load = (url) => import(/* @vite-ignore */ url); load('https://cdn/maplibre-gl.js');"
		},
		async (root) => {
			const map = await checkEntry(path.join(root, 'components/Map/index.js'), root);
			assert.match(map.problems.join(), /MapLibre .* imports\(\) 'maplibre-gl'/);
			const phone = await checkEntry(path.join(root, 'components/Phone/index.js'), root);
			assert.match(phone.problems.join(), /intl-tel-input .* imports 'intl-tel-input\/build/);
			const cdn = await checkEntry(path.join(root, 'components/Cdn/index.js'), root);
			assert.deepEqual(cdn.problems, [], 'a CDN URL is not a bundled module');
		}
	);
	assert.equal(absentRules.length, 3);
});
