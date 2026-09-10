import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { copyFile, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { promisify } from 'node:util';
import { repositoryRoot } from './source.mjs';

const execute = promisify(execFile);
const sourceTools = [
	'tooling/component-contract/source.mjs',
	'tooling/component-contract/generate.mjs',
	'tooling/check-public-api-contract.mjs',
	'tooling/check-semantic-theme-tokens.mjs'
];

async function fixture(run) {
	const directory = await mkdtemp(path.join(os.tmpdir(), 'svelai-contract-'));
	const write = async (filename, source) => {
		const target = path.join(directory, filename);
		await mkdir(path.dirname(target), { recursive: true });
		await writeFile(target, source);
	};
	try {
		for (const filename of sourceTools) {
			await mkdir(path.dirname(path.join(directory, filename)), { recursive: true });
			await copyFile(path.join(repositoryRoot, filename), path.join(directory, filename));
		}
		await symlink(
			path.join(repositoryRoot, 'node_modules'),
			path.join(directory, 'node_modules'),
			'dir'
		);
		await copyFile(path.join(repositoryRoot, '.prettierrc'), path.join(directory, '.prettierrc'));
		await write(
			'package.json',
			JSON.stringify({
				name: 'svelai',
				type: 'module',
				scripts: { prepack: 'keep authored scripts' }
			})
		);
		await write(
			'src/lib/components/Icons/index.svelte.ts',
			'type IconProps = { size?: number }; export const icon = 1;'
		);
		await run({ directory, write });
	} finally {
		await rm(directory, { recursive: true, force: true });
	}
}

async function runCheck(directory, tool, expectedExit = 0) {
	try {
		const execution = await execute(process.execPath, [tool], {
			cwd: directory,
			maxBuffer: 4 * 1024 * 1024
		});
		assert.equal(expectedExit, 0, `${tool} unexpectedly accepted an invalid contract`);
		return execution.stdout;
	} catch (error) {
		if (error.code !== expectedExit || expectedExit === 0) throw error;
		return `${error.stdout}\n${error.stderr}`;
	}
}

const gridEntry = {
	id: 'grid',
	subpath: './grid',
	sourceIndex: 'src/lib/components/Grid/index.ts',
	exportedSymbols: ['Grid', 'GridSpan'],
	exports: {
		types: './dist/components/Grid/index.d.ts',
		svelte: './dist/components/Grid/index.js',
		default: './dist/components/Grid/index.js'
	},
	docs: [
		{ id: 'grid', route: '/components/grid', category: 'Layout', label: 'Grid' },
		{ id: 'grid-span', route: '/components/grid-span', category: 'Layout', label: 'Grid span' }
	],
	mcp: { source: 'components/Grid/grid.mcp.js', exportName: 'gridDescription' },
	capabilities: ['component'],
	relatedComponents: [],
	visibility: 'public'
};
const manifestSource = (entries) => `export const componentContract = ${JSON.stringify(entries)};`;

test('manifest generation preserves authored fields and rejects invalid public metadata and symbols', async () => {
	await fixture(async ({ directory, write }) => {
		await write(
			'src/lib/components/Grid/index.ts',
			'export const Grid = 1; export const GridSpan = 2;'
		);
		await write(
			'src/lib/components/Grid/grid.mcp.ts',
			"export const gridDescription = 'Grid layout.';"
		);
		await write('src/routes/components/grid/+page.svelte', '<div>Grid</div>');
		await write('src/routes/components/grid-span/+page.svelte', '<div>Grid span</div>');
		await write(
			'src/hooks.server.ts',
			"import { componentMcpRegistry } from '$lib/generated/componentMcpRegistry.js';"
		);
		await write(
			'src/routes/appNavigation.ts',
			"import { componentNavigationSections } from './componentNavigation.generated.js';"
		);
		for (const skill of ['.agents', '.claude'])
			await write(`${skill}/skills/svelai/SKILL.md`, '# Authored prose\n\nPreserve this text.\n');
		await write('tooling/component-contract/manifest.ts', manifestSource([gridEntry]));
		const tool = 'tooling/component-contract/generate.mjs';
		await runCheck(directory, tool);
		const firstPackage = await readFile(path.join(directory, 'package.json'), 'utf8');
		await runCheck(directory, tool);
		assert.equal(await readFile(path.join(directory, 'package.json'), 'utf8'), firstPackage);
		assert.equal(JSON.parse(firstPackage).scripts.prepack, 'keep authored scripts');
		assert.deepEqual(JSON.parse(firstPackage).typesVersions['*'].grid, [
			'dist/components/Grid/index.d.ts'
		]);
		assert.match(
			await readFile(path.join(directory, '.agents/skills/svelai/SKILL.md'), 'utf8'),
			/Preserve this text\./
		);
		await execute(process.execPath, [tool, '--check'], { cwd: directory });
		const broken = [
			{
				...gridEntry,
				relatedComponents: ['missing-component'],
				exportedSymbols: ['Grid', 'GridSpan', 'MissingSymbol'],
				mcp: { ...gridEntry.mcp, exportName: 'missingDescription' },
				exports: { default: './dist/missing.js' }
			},
			{ ...gridEntry, id: 'duplicate', mcp: null },
			{
				...gridEntry,
				id: 'missing-source',
				subpath: './missing-source',
				sourceIndex: 'src/lib/missing.ts',
				docs: [
					{ id: 'missing-page', route: '/components/missing', category: 'Layout', label: 'Missing' }
				]
			}
		];
		await write('tooling/component-contract/manifest.ts', manifestSource(broken));
		const rejected = await runCheck(directory, tool, 1);
		for (const diagnostic of [
			'Duplicate package subpath',
			'Duplicate documentation route',
			'Unknown related component',
			'MissingSymbol',
			'Missing missingDescription export',
			'Missing public MCP description',
			'Broken package target',
			'Missing source',
			'Missing documentation route'
		])
			assert.ok(rejected.includes(diagnostic), diagnostic);
	});
});

test('API inventory resolves inherited callbacks, nested any, method payloads, state trios and inline Svelte props', async () => {
	await fixture(async ({ directory, write }) => {
		const owners = [
			'AIFilePreviewSource',
			'AIFileSource',
			'AIThreadTocEntry',
			'AIComposerAttachment',
			'ResizablePanelPayload',
			'ResizableHandleAriaLabel',
			'ResizableHandlePayload',
			'GlobeMarker',
			'ChartAxisTicks',
			'ChartScatterSize'
		];
		const domainTypes = owners.map((name) => `export type ${name} = { size: number };`).join('\n');
		await write(
			'src/lib/components/Widget/index.ts',
			`${domainTypes}\nexport type { WidgetProps } from './widget.props.js'; export { default as Widget } from './Widget.svelte';`
		);
		await write('src/lib/components/Widget/Widget.svelte', '<div>Widget</div>');
		await write(
			'src/lib/components/Widget/widget.props.ts',
			`export interface WidgetProps {
/** Current value. */
value?: string;
/** Initial value. */
defaultValue?: string;
/** Value changes. */
onValueChange?: (value: string) => void;
}`
		);
		await write(
			'tooling/component-contract/manifest.ts',
			manifestSource([
				{ ...gridEntry, id: 'widget', sourceIndex: 'src/lib/components/Widget/index.ts' }
			])
		);
		await runCheck(directory, 'tooling/check-public-api-contract.mjs');
		await write(
			'src/lib/components/Widget/payload.ts',
			'export type Payload = { nested: Record<string, any> }; export type Handler = (payload: Payload) => void;'
		);
		await write(
			'src/lib/components/Widget/widget.props.ts',
			`import type { Handler } from './payload.js';
declare class Controller<T> { value: T }
interface Base { /** Current value. */ value?: string; /** Initial value. */ defaultValue?: string; }
export interface WidgetProps extends Base {
/** Payload callback. */ onProcess?: Handler;
/** Controller callback. */ onInspect?: (controller: Controller<any>) => void;
/** Old event. */ onChange?: () => void;
/** Action callback. */ onPick(first: string, second: number): void;
/** Rest callback. */ onSelect?: (...values: [string, number]) => void;
/** Native callback. */ onclick?: (payload: string) => void;
/** Physical size. */ size?: number;
undocumented?: boolean;
}`
		);
		await write(
			'src/lib/components/Widget/Widget.svelte',
			'<script lang="ts">let { inline } : { inline?: string } = $props();</script><div>{inline}</div>'
		);
		const rejected = await runCheck(directory, 'tooling/check-public-api-contract.mjs', 1);
		for (const diagnostic of [
			'callback onProcess uses any',
			'callback onInspect uses any',
			'deprecated callback onChange',
			'callback onPick must use one payload',
			'callback onSelect must use one payload',
			'missing controlled-state prop onValueChange',
			'lowercase callback onclick',
			'numeric size WidgetProps.size',
			'WidgetProps.undocumented has no public documentation',
			'Widget.inline has no public documentation'
		])
			assert.ok(rejected.includes(diagnostic), diagnostic);
	});
});

test('theme inventory rejects aliases hidden in Svelte, unowned parts, wrong owners and imported numeric tokens', async () => {
	await fixture(async ({ directory, write }) => {
		await write('src/lib/components/Widget/Widget.svelte', '<div>Widget</div>');
		await write(
			'src/lib/components/Widget/widget.theme.ts',
			`import { cva as variants } from '$lib/utils/cva/index.js'; const root = variants({ base: 'gap-md rounded-md' }); export const widgetTheme = { root };`
		);
		await runCheck(directory, 'tooling/check-semantic-theme-tokens.mjs');
		await write(
			'src/lib/components/Widget/Widget.svelte',
			`<script lang="ts">import { cva as variants } from '$lib/utils/cva/index.js'; const hidden = variants({ base: 'gap-4' });</script><div />`
		);
		await write(
			'src/lib/components/Widget/spacing.ts',
			"export const spacing = 'gap-3 rounded-2xl';"
		);
		await write(
			'src/lib/components/Widget/wrong.theme.ts',
			`import { cva } from '$lib/utils/cva/index.js'; import { spacing } from './spacing.js'; const root = cva({ base: spacing }); const unused = cva({ base: 'gap-md' }); export const wrongTheme = { root };`
		);
		const rejected = await runCheck(directory, 'tooling/check-semantic-theme-tokens.mjs', 1);
		for (const diagnostic of [
			'hidden theme definition',
			'does not name a sibling component owner',
			'unowned CVA part unused',
			'numeric spacing utility gap-3',
			'unsupported radius utility rounded-2xl'
		])
			assert.ok(rejected.includes(diagnostic), diagnostic);
		await write(
			'src/lib/components/Widget/Widget.svelte',
			'<script lang="ts">const privateTheme = $derived({ root: { base: `gap-4 ${variant}` } });</script><div />'
		);
		assert.match(
			await runCheck(directory, 'tooling/check-semantic-theme-tokens.mjs', 1),
			/Widget\.svelte: hidden theme definition/
		);
		await write(
			'src/lib/components/Widget/Widget.svelte',
			`<script lang="ts">import type { WidgetThemeProps as Theme } from './widget.theme.js'; const privatePreset: Theme = { root: { base: 'gap-4' } };</script><div />`
		);
		assert.match(
			await runCheck(directory, 'tooling/check-semantic-theme-tokens.mjs', 1),
			/Widget\.svelte: hidden theme definition/
		);
	});
});
