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
	assert.equal(absentRules.length, 6);
});

test('the dialog backdrop and the tooltip surface are imported by their owners only', async () => {
	await fixture(
		{
			'components/Theme/index.js': "export { default as Theme } from './Theme.svelte';",
			'components/Theme/Theme.svelte':
				"<script>\n\timport TooltipHost from '../Tooltip/TooltipHost.svelte';\n</script>",
			'components/Tooltip/index.js':
				"export { tooltip } from './tooltip.attachment.svelte.js';\nexport { default as TooltipHost } from './TooltipHost.svelte';",
			'components/Tooltip/tooltip.attachment.svelte.js':
				"import TooltipHost from './TooltipHost.svelte';\nexport const tooltip = () => TooltipHost;",
			'components/Tooltip/TooltipHost.svelte': '<div></div>',
			'components/Dialog/index.js': "export { DialogState } from './dialog.state.svelte.js';",
			'components/Dialog/dialog.state.svelte.js':
				"import DialogBackdrop from './DialogBackdrop.svelte';\nexport class DialogState {}",
			'components/Dialog/DialogBackdrop.svelte': '<div></div>'
		},
		async (root) => {
			const theme = await checkEntry(path.join(root, 'components/Theme/index.js'), root);
			assert.equal(theme.problems.length, 1);
			assert.match(
				theme.problems[0],
				/come with the first dialog or tooltip: .*Theme\.svelte -> components\/Tooltip\/TooltipHost\.svelte \(static import\)/
			);
			const tooltip = await checkEntry(path.join(root, 'components/Tooltip/index.js'), root);
			assert.deepEqual(tooltip.problems, []);
			const dialog = await checkEntry(path.join(root, 'components/Dialog/index.js'), root);
			assert.deepEqual(dialog.problems, []);
		}
	);
});

test('the loading overlay and the theme transitions are imported dynamically', async () => {
	await fixture(
		{
			'components/Button/index.js': "export { default as Button } from './Button.svelte';",
			'components/Button/Button.svelte':
				"<script>\n\timport { lazySpinnerOverlay } from '../../attachments/spinnerOverlay.lazy.svelte.js';\n</script>",
			'components/Eager/index.js':
				"export { spinnerOverlay } from '../../attachments/spinnerOverlay.svelte.js';",
			'attachments/spinnerOverlay.lazy.svelte.js':
				"export const lazySpinnerOverlay = () => import('./spinnerOverlay.svelte.js');",
			'attachments/spinnerOverlay.svelte.js': 'export const spinnerOverlay = () => {};',
			'components/Theme/index.js':
				"export { ThemeState } from './theme.state.svelte.js';\nexport { themeTransitions } from './themeTransition.js';",
			'components/Theme/theme.state.svelte.js':
				"export const loadThemeTransition = () => import('./themeTransition.js');\nexport class ThemeState {}",
			'components/Theme/themeTransition.js': 'export const themeTransitions = [];',
			'components/Other/index.js':
				"import { themeTransitions } from '../Theme/themeTransition.js';\nexport const other = themeTransitions;"
		},
		async (root) => {
			const button = await checkEntry(path.join(root, 'components/Button/index.js'), root);
			assert.deepEqual(button.problems, [], 'a dynamic import is the supported path');
			const eager = await checkEntry(path.join(root, 'components/Eager/index.js'), root);
			assert.match(
				eager.problems.join(),
				/loading overlay .*spinnerOverlay\.svelte\.js \(static import\)/
			);
			const theme = await checkEntry(path.join(root, 'components/Theme/index.js'), root);
			assert.deepEqual(theme.problems, [], 'the Theme entry re-exports the names');
			const other = await checkEntry(path.join(root, 'components/Other/index.js'), root);
			assert.match(
				other.problems.join(),
				/Theme transitions .*themeTransition\.js \(static import\)/
			);
		}
	);
});
