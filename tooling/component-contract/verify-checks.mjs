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
	'tooling/component-contract/theme-parts.mjs',
	'tooling/check-public-api-contract.mjs',
	'tooling/check-semantic-theme-tokens.mjs'
];

async function fixture(run) {
	const directory = await mkdtemp(path.join(os.tmpdir(), 'entasis-contract-'));
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
				name: 'entasis',
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
			await write(`${skill}/skills/entasis/SKILL.md`, '# Authored prose\n\nPreserve this text.\n');
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
			await readFile(path.join(directory, '.agents/skills/entasis/SKILL.md'), 'utf8'),
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
			'export type Payload = { nested: Record<string, any>; isPrimary?: boolean }; export type Handler = (payload: Payload) => void;'
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
/** Active. */ isActive?: boolean;
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
			'boolean prop WidgetProps.isActive restates its type in its name',
			'Widget.inline has no public documentation'
		])
			assert.ok(rejected.includes(diagnostic), diagnostic);
		// The boolean-prefix rule reads component props types only; a nested payload keeps its own
		// vocabulary, so `Payload.isPrimary` is not reported.
		assert.ok(!rejected.includes('isPrimary'), 'nested payload boolean is exempt');
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
			"export const spacing = 'gap-3 rounded-5xl';"
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
			'unsupported radius utility rounded-5xl'
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

// One value per drifting axis — focus-ring role, elevation, control and icon geometry, muted
// ink, hover tint and selected fill — each enforced here so the sweep cannot regress. The
// passing base carries the engine utilities the rules point at (`raised-*`/`lift-*`,
// `h-control-*`/`h-row-*`, `size-icon-*`), which doubles as proof they do not trip any rule.
const passingTheme =
	'gap-md rounded-md state-layer h-control-md h-row-sm min-h-row-lg size-icon-xs size-icon-xl raised-2 lift-3 text-neutral/70 text-color-muted-readable/45 [&>svg]:size-icon-sm focus-visible:ring-2 focus-visible:ring-focus/50 data-[selected=true]:bg-selected-muted data-[selected=true]:text-selected-muted-readable';
const themeSource = (classes) =>
	`import { cva } from '$lib/utils/cva/index.js'; const root = cva({ base: '${classes}' }); export const widgetTheme = { root };`;
const surfaceRules = [
	{
		rule: 'focus rings that name a fixed role',
		classes: 'focus-visible:ring-primary/50',
		diagnostic:
			'focus ring focus-visible:ring-primary/50 — focus rings use the focus state role (ring-focus/50)'
	},
	{
		// The rule the state roles introduced: the ring used to be the *current* role, which a
		// theme could only move by moving every other current-role surface with it.
		rule: 'focus rings that ride the current role instead of the focus state role',
		classes: 'focus-visible:ring-color/50',
		diagnostic:
			'focus ring focus-visible:ring-color/50 — focus rings use the focus state role (ring-focus/50)'
	},
	{
		// The ring is written on the box and the focus lands on the range input inside it, so the
		// variant is composed. Reading the bare `focus*:` prefix alone left AudioPlayer's waveform
		// and scrubber and VoiceInput's waveform on `ring-color/60` through the whole sweep.
		rule: 'focus rings behind a composed focus variant',
		classes: 'has-[input:focus-visible]:ring-color/60',
		diagnostic:
			'focus ring has-[input:focus-visible]:ring-color/60 — focus rings use the focus state role (ring-focus/50)'
	},
	{
		rule: 'raw shadow utilities',
		classes: 'hover:shadow-md',
		diagnostic: 'raw shadow hover:shadow-md — elevation comes from raised-N'
	},
	{
		rule: 'numeric icon sizes',
		classes: '[&_svg]:size-4',
		diagnostic: 'icon size [&_svg]:size-4 — icons are sized with size-icon-xs'
	},
	{
		rule: 'numeric control heights',
		classes: 'min-h-10',
		diagnostic: 'numeric height min-h-10 — controls use h-control-*'
	},
	{
		rule: 'muted text off the two-step scale',
		classes: 'text-neutral/65',
		diagnostic: 'muted text text-neutral/65 — secondary text is text-<role>/70'
	},
	{
		rule: 'ad-hoc hover fills',
		classes: 'hover:bg-neutral/10',
		diagnostic: 'hover fill hover:bg-neutral/10 — interactive surfaces tint with state-layer'
	},
	{
		rule: 'selected fills that name a fixed role',
		classes: 'data-[selected=true]:bg-primary-muted/40',
		diagnostic:
			'selected fill data-[selected=true]:bg-primary-muted/40 — persistent selection uses the selected state role (selectedSoft / selectedSolid)'
	},
	{
		// Same rule's second half: the current role is no longer enough either, because a theme
		// that pins `selectedColor` must be able to move the selection without moving the chrome.
		rule: 'selected fills that ride the current role instead of the selected state role',
		classes: 'data-[state=checked]:bg-color-muted',
		diagnostic:
			'selected fill data-[state=checked]:bg-color-muted — persistent selection uses the selected state role (selectedSoft / selectedSolid)'
	},
	{
		rule: 'resting rings written at an opacity',
		classes: 'ring-1 ring-neutral/15',
		diagnostic:
			'resting ring ring-neutral/15 — ring-<role>/NN is a focus ring (focus*:ring-<role>/50); resting rings use ring-neutral-muted / ring-color-muted'
	},
	{
		rule: 'resting rings written on the selected state role at an opacity',
		classes: 'ring-1 ring-selected/15',
		diagnostic: 'resting ring ring-selected/15 — ring-<role>/NN is a focus ring'
	}
];

for (const { rule, classes, diagnostic } of surfaceRules)
	test(`theme inventory rejects ${rule}`, async () => {
		await fixture(async ({ directory, write }) => {
			const tool = 'tooling/check-semantic-theme-tokens.mjs';
			await write('src/lib/components/Widget/Widget.svelte', '<div>Widget</div>');
			await write('src/lib/components/Widget/widget.theme.ts', themeSource(passingTheme));
			await runCheck(directory, tool);
			await write(
				'src/lib/components/Widget/widget.theme.ts',
				themeSource(`${passingTheme} ${classes}`)
			);
			const rejected = await runCheck(directory, tool, 1);
			assert.ok(rejected.includes(diagnostic), diagnostic);
		});
	});

// The selected fill has two spellings and the class-string rule above only reads one of them: a
// Tailwind variant prefix (`data-active:bg-…`). Everywhere the library expresses selection as a
// cva *variant key* — Pagination's current page, MenuBar's open trigger, the Calendar day — the
// fill sits in a nested object no class string shows, so it is read off the AST instead.
const selectedVariantSource = (variants) =>
	`import { cva } from '$lib/utils/cva/index.js'; const root = cva({ base: 'gap-md', variants: ${JSON.stringify(
		variants
	)} }); export const widgetTheme = { root };`;

test('theme inventory rejects a selected fill spelled as a cva variant key', async () => {
	await fixture(async ({ directory, write }) => {
		const tool = 'tooling/check-semantic-theme-tokens.mjs';
		await write('src/lib/components/Widget/Widget.svelte', '<div>Widget</div>');
		// The state role passes, and so do the two things that are not a selection surface: the
		// resting step of the same variant, and a transient state layer painted over the selection.
		await write(
			'src/lib/components/Widget/widget.theme.ts',
			selectedVariantSource({
				active: {
					true: 'bg-selected text-selected-contrast',
					false: 'bg-neutral-muted'
				},
				checked: { true: 'before:bg-selected disabled:bg-neutral-muted' }
			})
		);
		await runCheck(directory, tool);
		for (const { rule, variants, diagnostic } of [
			{
				rule: 'the current role',
				variants: { active: { true: 'border-color bg-color-muted text-color-muted-readable' } },
				diagnostic:
					'selected fill bg-color-muted on variant active:true — persistent selection uses the selected state role (selectedSoft / selectedSolid)'
			},
			{
				rule: 'a fixed role',
				variants: { selected: { true: 'bg-primary text-primary-contrast' } },
				diagnostic: 'selected fill bg-primary on variant selected:true'
			},
			{
				rule: 'the pseudo-element an indicator draws with',
				variants: { checked: { true: 'before:bg-color' } },
				diagnostic: 'selected fill before:bg-color on variant checked:true'
			}
		]) {
			await write('src/lib/components/Widget/widget.theme.ts', selectedVariantSource(variants));
			const rejected = await runCheck(directory, tool, 1);
			assert.ok(rejected.includes(diagnostic), `${rule}: ${diagnostic}`);
		}
		// Same fill, written as a compound variant instead of a variant step.
		await write(
			'src/lib/components/Widget/widget.theme.ts',
			`import { cva } from '$lib/utils/cva/index.js'; const root = cva({ base: 'gap-md', variants: { mode: { card: '' }, checked: { true: '' } }, compoundVariants: [{ mode: 'card', checked: true, class: 'bg-neutral-muted/40' }] }); export const widgetTheme = { root };`
		);
		assert.ok(
			(await runCheck(directory, tool, 1)).includes(
				'selected fill bg-neutral-muted/40 on a selected compound variant'
			),
			'compound variant'
		);
		// And the third spelling: the selection is its own part, named for the state it paints and
		// merged over the resting part by the component (DocumentViewer's `thumbnailActive`).
		await write(
			'src/lib/components/Widget/widget.theme.ts',
			`import { cva } from '$lib/utils/cva/index.js'; const root = cva({ base: 'gap-md' }); const rootActive = cva({ base: 'border-primary bg-primary-muted' }); export const widgetTheme = { root, rootActive };`
		);
		assert.ok(
			(await runCheck(directory, tool, 1)).includes(
				'selected fill bg-primary-muted on the rootActive part'
			),
			'selection-named part'
		);
	});
});

// The type ramp is the one axis that is a *relationship* between the three sizes rather than a
// single token, so it is read off the `size` variant block instead of the class soup: a large
// control grows its box (`h-control-lg`) and keeps its type, a content part takes the one step
// to `text-base`, a display value rides its own ramp — and a size written as a length is off
// the scale whatever it rounds to.
const rampTheme = (sizes) =>
	`import { cva } from '$lib/utils/cva/index.js'; const root = cva({ base: 'gap-md', variants: { size: ${JSON.stringify(sizes)} } }); export const widgetTheme = { root };`;

test('theme inventory pins the type ramp a size variant walks', async () => {
	await fixture(async ({ directory, write }) => {
		const tool = 'tooling/check-semantic-theme-tokens.mjs';
		await write('src/lib/components/Widget/Widget.svelte', '<div>Widget</div>');
		for (const accepted of [
			{
				small: 'h-control-sm text-xs',
				normal: 'h-control-md text-sm',
				large: 'h-control-lg text-sm'
			},
			{ small: 'text-xs', normal: 'text-sm', large: 'text-base' },
			{ small: 'text-xs', normal: 'text-xs', large: 'text-sm' },
			{ small: 'text-xl', normal: 'text-2xl', large: 'text-3xl' }
		]) {
			await write('src/lib/components/Widget/widget.theme.ts', rampTheme(accepted));
			await runCheck(directory, tool);
		}
		for (const { rule, sizes, diagnostic } of [
			{
				rule: 'a large size that grows the type instead of the box',
				sizes: { small: 'text-sm', normal: 'text-base', large: 'text-lg' },
				diagnostic:
					/root type ramp sm\/base\/lg — a size variant walks one of xs\/sm\/sm \(control\)/
			},
			{
				rule: 'a ramp only two of the three sizes name',
				sizes: { small: 'text-xs', normal: 'text-sm', large: 'h-control-lg' },
				diagnostic: /root names a type size on some sizes only \(large missing\)/
			},
			{
				rule: 'a type size written as a length',
				sizes: { small: 'text-[11px]', normal: 'text-xs', large: 'text-sm' },
				diagnostic: /arbitrary type size text-\[11px\] — type comes from the text-xs…text-3xl scale/
			}
		]) {
			await write('src/lib/components/Widget/widget.theme.ts', rampTheme(sizes));
			assert.match(await runCheck(directory, tool, 1), diagnostic, rule);
		}
	});
});

// `rounded-<step>-concentric` is a radius utility like any other, so the radius allowlist has to know it —
// and only the three forms the engine emits exist, because a per-corner spelling would compile to
// nothing and round nothing. Concentricity itself is no longer a rule: the container's own
// `rounded-*` and `p-*` publish `--radius-parent` / `--pad-parent-*` to the subtree, so the
// checker has no pair left to pair up.
test('theme inventory accepts the rounded-<step>-concentric family and rejects a per-corner spelling', async () => {
	await fixture(async ({ directory, write }) => {
		const tool = 'tooling/check-semantic-theme-tokens.mjs';
		await write('src/lib/components/Widget/Widget.svelte', '<div>Widget</div>');

		for (const accepted of [
			'rounded-md-concentric p-xs bg-surface',
			'rounded-t-md-concentric',
			'rounded-b-md-concentric',
			'rounded-lg p-xs'
		]) {
			await write('src/lib/components/Widget/widget.theme.ts', themeSource(accepted));
			await runCheck(directory, tool);
		}

		await write(
			'src/lib/components/Widget/widget.theme.ts',
			themeSource('rounded-tl-md-concentric')
		);
		assert.match(
			await runCheck(directory, tool, 1),
			/widget\.theme\.ts: unsupported radius utility rounded-tl-md-concentric/
		);
	});
});

// A theme is an object literal OR a factory that returns one. Reading only the object literal
// left every class string inside an exported `*Theme` arrow function unswept —
// `buildMarkdownStreamdownTheme` shipped a raw `shadow`, an off-scale `/80` muted step and a
// numeric `space-y-2` behind exactly that hole, and no rule ever saw them. So the sweep has to
// reach a factory, and it has to reach the class strings a factory interpolates.
test('theme inventory sweeps a theme factory, not just a theme object', async () => {
	await fixture(async ({ directory, write }) => {
		const tool = 'tooling/check-semantic-theme-tokens.mjs';
		await write('src/lib/components/Widget/Widget.svelte', '<div>Widget</div>');
		const factory = (classes) =>
			`const SIZES = { normal: { text: 'text-sm' } };
			 export const buildWidgetTheme = (size) => {
				const s = SIZES[size];
				return { root: { base: \`${classes} \${s.text}\` } };
			 };`;

		await write('src/lib/components/Widget/widget.theme.ts', factory('rounded-lg p-xs'));
		await runCheck(directory, tool);

		// Every rule reaches in here, not a chosen one: the factory body is ordinary theme source.
		for (const [classes, diagnostic] of [
			['h-9', /numeric height h-9 — controls use h-control-\*, rows use h-row-\*/],
			['text-neutral/80', /muted text text-neutral\/80 — secondary text is text-<role>\/70/],
			['space-y-2', /numeric spacing utility space-y-2/],
			['rounded-lg shadow-lg', /raw shadow shadow-lg — elevation comes from raised-N/]
		]) {
			await write('src/lib/components/Widget/widget.theme.ts', factory(classes));
			assert.match(await runCheck(directory, tool, 1), diagnostic);
		}

		// The factory is still a theme export, so it still has to name its owner — which is what
		// keeps `buildStreamdownTheme`-shaped names from re-opening the hole by drifting out of
		// the sweep's sight.
		await write(
			'src/lib/components/Widget/widget.theme.ts',
			factory('rounded-lg p-xs').replace(/buildWidgetTheme/g, 'buildGadgetTheme')
		);
		assert.match(
			await runCheck(directory, tool, 1),
			/widget\.theme\.ts: theme export buildGadgetTheme does not name its owner/
		);
	});
});

// Elevation is the one surface rule that also reaches component markup and the `.mcp.ts`
// snippets: a `class="shadow-lg"` in a template, or a snippet teaching `hover:shadow-lg`, puts
// the raw value back in front of the reader exactly as loudly as a theme file would.
test('elevation rule reaches component markup and mcp snippets', async () => {
	await fixture(async ({ directory, write }) => {
		const tool = 'tooling/check-semantic-theme-tokens.mjs';
		await write('src/lib/components/Widget/Widget.svelte', '<div class="raised-2">Widget</div>');
		await write(
			'src/lib/components/Widget/widget.mcp.ts',
			'export const widgetDescription = `<Widget class="lift-4" />`;'
		);
		await runCheck(directory, tool);

		await write(
			'src/lib/components/Widget/Widget.svelte',
			'<div class="rounded-lg shadow-lg">Widget</div>'
		);
		assert.match(
			await runCheck(directory, tool, 1),
			/Widget\.svelte: raw shadow shadow-lg — elevation comes from raised-N/
		);

		await write('src/lib/components/Widget/Widget.svelte', '<div class="raised-2">Widget</div>');
		await write(
			'src/lib/components/Widget/widget.mcp.ts',
			'export const widgetDescription = `<Widget class="shadow-md hover:shadow-lg" />`;'
		);
		const rejected = await runCheck(directory, tool, 1);
		for (const diagnostic of [
			'widget.mcp.ts: raw shadow shadow-md',
			'widget.mcp.ts: raw shadow hover:shadow-lg'
		])
			assert.ok(rejected.includes(diagnostic), diagnostic);
	});
});

// The layout axis: a component that fills its host reflows on the width it was handed, so its
// breakpoints are container variants on an `@container` root. A viewport variant measures the
// device instead and is pinned here in both places a class is written — the theme file and the
// markup — with the app chrome and content-sized overlays that legitimately keep it listed by path
// prefix in the checker's `viewportExceptions`.
test('theme inventory rejects viewport breakpoints outside app chrome', async () => {
	await fixture(async ({ directory, write }) => {
		const tool = 'tooling/check-semantic-theme-tokens.mjs';
		await write(
			'src/lib/components/Widget/Widget.svelte',
			'<div class="@container @md:flex @max-3xl:hidden">Widget</div>'
		);
		await write(
			'src/lib/components/Widget/widget.theme.ts',
			themeSource(`${passingTheme} @container @max-3xl:flex-col @min-[30rem]:grid`)
		);
		await runCheck(directory, tool);

		await write(
			'src/lib/components/Widget/widget.theme.ts',
			themeSource(`${passingTheme} md:flex-row`)
		);
		assert.match(
			await runCheck(directory, tool, 1),
			/widget\.theme\.ts: viewport breakpoint md:flex-row — host-sized components lay out by container query \(@md: on an @container root\); only app chrome and content-sized overlays use the viewport, listed in viewportExceptions/
		);

		await write('src/lib/components/Widget/widget.theme.ts', themeSource(passingTheme));
		await write(
			'src/lib/components/Widget/Widget.svelte',
			'<div class={`max-[360px]:hidden ${extra}`}>Widget</div>'
		);
		assert.match(
			await runCheck(directory, tool, 1),
			/Widget\.svelte: viewport breakpoint max-\[360px\]:hidden — host-sized components lay out by container query/
		);
	});
});

// The layout rule reaches the two places outside a theme file and a template where a class list is
// written: a plain helper `.ts` that assembles classes in JS, and an `.mcp.ts` snippet an agent
// pastes into consumer code. Both are string literals, so the sweep is AST-based — the `md:` a root
// recipe's comment quotes to say what it replaced is prose and must stay silent.
test('layout rule reaches helper .ts modules and mcp snippets, but not comments', async () => {
	await fixture(async ({ directory, write }) => {
		const tool = 'tooling/check-semantic-theme-tokens.mjs';
		await write('src/lib/components/Widget/Widget.svelte', '<div class="@container">Widget</div>');
		await write('src/lib/components/Widget/widget.theme.ts', themeSource(passingTheme));
		await write(
			'src/lib/components/Widget/widget-layout.ts',
			[
				'// Old: `md:flex-row` — the phone breakpoint. New: `@md:` on the @container root.',
				"export const widgetLayout = (wide) => (wide ? '@md:flex-row' : 'flex-col');"
			].join('\n')
		);
		await write(
			'src/lib/components/Widget/widget.mcp.ts',
			'export const widgetDescription = `<Widget theme={{ root: { base: "@container @md:grid-cols-2" } }} />`;'
		);
		await runCheck(directory, tool);

		await write(
			'src/lib/components/Widget/widget-layout.ts',
			"export const widgetLayout = (wide) => (wide ? 'md:flex-row' : 'flex-col');"
		);
		assert.match(
			await runCheck(directory, tool, 1),
			/widget-layout\.ts: viewport breakpoint md:flex-row — host-sized components lay out by container query/
		);

		await write(
			'src/lib/components/Widget/widget-layout.ts',
			"export const widgetLayout = () => 'flex-col';"
		);
		await write(
			'src/lib/components/Widget/widget.mcp.ts',
			'export const widgetDescription = `<Widget theme={{ root: { base: "grid-cols-1 md:grid-cols-3" } }} />`;'
		);
		assert.match(
			await runCheck(directory, tool, 1),
			/widget\.mcp\.ts: viewport breakpoint md:grid-cols-3 — host-sized components lay out by container query/
		);
	});
});
