<script lang="ts">
	import Button from '$lib/components/Button/Button.svelte';
	import Card from '$lib/components/Card/Card.svelte';
	import Code from '$lib/components/Code/Code.svelte';
	import Form from '$lib/components/Form/Form/Form.svelte';
	import MenuOption from '$lib/components/MenuOption/MenuOption.svelte';
	import Pagination from '$lib/components/Pagination/Pagination.svelte';
	import SegmentedControl from '$lib/components/SegmentedControl/SegmentedControl.svelte';
	import Select from '$lib/components/Form/Select/Select.svelte';
	import Stat from '$lib/components/Stat/Stat.svelte';
	import Switch from '$lib/components/Form/Switch/Switch.svelte';
	import Table from '$lib/components/Table/Table.svelte';
	import TagGroup from '$lib/components/Form/TagGroup/TagGroup.svelte';
	import TextInput from '$lib/components/Form/TextInput/TextInput.svelte';
	import ToggleButton from '$lib/components/ToggleButton/ToggleButton.svelte';
	import { magnifyingGlassIcon } from '$lib/components/Icons/magnifyingGlass.js';
	import { starIcon } from '$lib/components/Icons/star.js';
	import { compileThemeDesignTokens } from '$lib/components/Theme/theme.designTokens.js';
	import type { Sizes } from '$lib/types/theme.js';

	const sizes: Sizes[] = ['small', 'normal', 'large'];

	const rules = [
		{
			id: 'focus',
			title: 'Focus ring',
			value: 'ring-2 ring-focus/50',
			rule: 'The ring is the focus state role at 50 %. ring-focus falls back to the current role, so neutral chrome still rings neutral and a coloured control rings in its colour — and a theme that pins designTokens.focusColor moves every ring at once. Only error states may ring in danger.'
		},
		{
			id: 'elevation',
			title: 'Elevation',
			value: 'raised-N / lift-N',
			rule: 'Shadows come from the elevation engine only. Bordered surfaces use raised-N, which also draws the hairline; borderless things (thumbs, indicators, pills, drag previews) use the shadow-only lift-N. Raw shadow-* classes are banned, so the elevation design token can flatten or lift the whole library.'
		},
		{
			id: 'sizes',
			title: 'Sizes',
			value: 'h-control-* · h-row-* · size-icon-*',
			rule: 'Interactive controls take their height from the control scale, rows from the row scale, icons from the icon scale. Numeric heights and icon sizes only survive as justified geometry exceptions (a thumb, a track, a grip).'
		},
		{
			id: 'muted',
			title: 'Muted text',
			value: 'text-<role>/70 · text-<role>/45',
			rule: 'Two steps and only two. 70 % for secondary text: it clears 6:1 on the surface and on tinted tracks. 45 % for decorative ink only: idle icons, grips, separators, never text meant to be read.'
		},
		{
			id: 'hover',
			title: 'Hover',
			value: 'state-layer',
			rule: 'Every interactive surface hovers and presses through the same currentColor tint layer, so a Select trigger, a Button and a menu row react identically under the pointer. Ad-hoc hover:bg-* classes are banned.'
		},
		{
			id: 'selected',
			title: 'Selected',
			value: 'selectedSoft · selectedSolid',
			rule: 'Two recipes exported from svelai/theme, both on the selected state role. Soft (bg-selected-muted text-selected-muted-readable) for rows, options, tags and pressed toggles; solid (bg-selected text-selected-contrast) for a current-page pill. Each token falls back to the current role, so designTokens.selectedColor pins every selection at once.'
		},
		{
			id: 'type',
			title: 'Type ramp',
			value: 'xs · sm · sm — xs · sm · base',
			rule: 'A size variant walks one of six ramps. A control grows its box at large (h-control-lg, more padding) and keeps its type at text-sm; a content part takes the one step up to text-base; a display value rides xl/2xl/3xl. Secondary text sits one step below its part and never below text-xs, and a size written as a length is banned.'
		},
		{
			id: 'container',
			title: 'Container queries',
			value: '@container · @lg: · @max-3xl:',
			rule: 'A component that fills its host lays itself out against its own width, never the window. The root carries @container and the parts query it, so the same field, table or player reflows identically in a page, a split pane and a 360px drawer. A layout a consumer sets per breakpoint is expressed as ResponsiveProps<T> against one shared container table. Viewport variants survive only in app chrome, whose host is the viewport, and in overlays that size to their content.'
		}
	] as const;

	const selectItems = [
		{ value: 'design', label: 'Design' },
		{ value: 'engineering', label: 'Engineering' }
	];
	let selected = $state<string | null>('design');
	let toggled = $state(true);
	let enabled = $state(true);
	let tag = $state<string | null>('travel');
	let segment = $state<'day' | 'week' | 'month'>('week');
	let page = $state(3);

	const elevationLevels = [0, 1, 2, 3, 4, 5] as const;
	// Static class per level so Tailwind sees every utility in the source.
	const raisedClass = ['raised-0', 'raised-1', 'raised-2', 'raised-3', 'raised-4', 'raised-5'];
	const liftClass = ['lift-0', 'lift-1', 'lift-2', 'lift-3', 'lift-4', 'lift-5'];
	const iconSteps = [
		{ token: 'size-icon-xs', className: 'size-icon-xs' },
		{ token: 'size-icon-sm', className: 'size-icon-sm' },
		{ token: 'size-icon-md', className: 'size-icon-md' },
		{ token: 'size-icon-lg', className: 'size-icon-lg' },
		{ token: 'size-icon-xl', className: 'size-icon-xl' }
	];
	const rowSteps = [
		{ token: 'h-row-sm', className: 'h-row-sm' },
		{ token: 'h-row-md', className: 'h-row-md' },
		{ token: 'h-row-lg', className: 'h-row-lg' }
	];
	const controlSteps = [
		{ token: 'h-control-sm', className: 'h-control-sm' },
		{ token: 'h-control-md', className: 'h-control-md' },
		{ token: 'h-control-lg', className: 'h-control-lg' }
	];

	// Static class per step so Tailwind sees every utility in the source.
	const typeRamps = [
		{
			id: 'control',
			title: 'Control',
			note: 'Buttons, inputs, chips, menu options, tabs, pagination, kbd, badges.',
			steps: [
				{ size: 'small', token: 'text-xs', className: 'text-xs' },
				{ size: 'normal', token: 'text-sm', className: 'text-sm' },
				{ size: 'large', token: 'text-sm', className: 'text-sm' }
			]
		},
		{
			id: 'content',
			title: 'Content',
			note: 'Cards, alerts, toasts, empty states, timelines, table cells, descriptions.',
			steps: [
				{ size: 'small', token: 'text-xs', className: 'text-xs' },
				{ size: 'normal', token: 'text-sm', className: 'text-sm' },
				{ size: 'large', token: 'text-base', className: 'text-base' }
			]
		},
		{
			id: 'display',
			title: 'Display',
			note: 'The figure in a Stat — a number read before it is read as text.',
			steps: [
				{ size: 'small', token: 'text-xl', className: 'text-xl' },
				{ size: 'normal', token: 'text-2xl', className: 'text-2xl' },
				{ size: 'large', token: 'text-3xl', className: 'text-3xl' }
			]
		}
	];

	const focusSnippet = `<!-- Every control below emits the same ring; only the role behind it changes. -->
<Button>Neutral</Button>
<Button color="primary">Primary</Button>
<Button color="danger" variant="outline">Danger</Button>
<TextInput label="Search" />`;

	// The two state-role snippets: one Theme token replaces what used to be a per-component
	// decision, and the controls inside stay on whatever role they already carried.
	const focusRoleSnippet = `import { focusRing } from 'svelai/theme';

// The recipe every control emits: focus-visible:ring-2 focus-visible:ring-focus/50
const trigger = cva({ base: focusRing });

// ring-focus resolves to var(--color-focus, var(--color)), so this is the only place
// a whole app has to name the colour its focus rings paint.
<Theme designTokens={{ light: { focusColor: 'primary' }, dark: { focusColor: 'primary' } }} />`;

	const selectedRoleSnippet = `// bg-selected-muted  → var(--color-selected-muted, var(--color-muted))
// text-selected-muted-readable → var(--color-selected-muted-readable, var(--color-muted-readable))
// bg-selected        → var(--color-selected, var(--color))
// text-selected-contrast → var(--color-selected-contrast, var(--color-contrast))

<Theme designTokens={{ light: { selectedColor: 'primary' }, dark: { selectedColor: 'primary' } }} />`;

	// The two "Pinning the role" demos below wear what a real Theme would emit, compiled by the
	// real compiler: `compileThemeDesignTokens` is the function `<Theme designTokens>` calls, and
	// this is its literal output for `{ focusColor: 'primary', selectedColor: 'primary' }`, with
	// the `html[data-theme="light"]` wrapper stripped so the declarations land on one demo box.
	// A nested <Theme> could not do it — it emits on the document root, and the page would repaint
	// whole. So the variables are never hand-written here: if the compiler stops emitting a
	// companion, the demo stops pinning it too.
	const pinnedStateRoles = compileThemeDesignTokens({
		designTokens: { light: { focusColor: 'primary', selectedColor: 'primary' } },
		attribute: 'data-theme'
	}).replace(/^[^{]*\{|\}$/g, '');

	const elevationSnippet = `<!-- A card owns its hairline, so it is raised. -->
<div class="bg-surface-raised rounded-lg p-lg raised-2">…</div>

<!-- A switch thumb has no border and must not gain one, so it lifts. -->
<span class="bg-surface-floating rounded-full lift-1"></span>

<!-- Both follow the elevation design token: 'flat' removes every shadow. -->
<Theme designTokens={{ light: { elevation: 'flat' } }} />`;

	const sizesSnippet = `// A control reads the control scale, a list row the row scale, an icon the icon scale.
const input = cva({
	base: 'h-control-md rounded-md',
	variants: { size: { small: 'h-control-sm', normal: 'h-control-md', large: 'h-control-lg' } }
});
const row = cva({ base: 'min-h-row-md [&>svg]:size-icon-sm' });`;

	const mutedSnippet = `<p class="text-neutral">Primary text keeps the full role colour.</p>
<p class="text-neutral/70">Secondary text is the role at 70 %.</p>
<span class="text-neutral/45">Decorative ink only: an idle icon, a grip, a separator.</span>`;

	const hoverSnippet = `<!-- Add state-layer to any interactive surface: hover and press tint through currentColor. -->
<button class="state-layer rounded-md px-lg h-control-md">Same feedback as every Button</button>`;

	const selectedSnippet = `import { selectedSoft, selectedSolid } from 'svelai/theme';
// selectedSoft = 'bg-selected-muted text-selected-muted-readable'
// selectedSolid = 'bg-selected text-selected-contrast'

const row = cva({
	base: 'state-layer',
	variants: { selected: { true: selectedSoft, false: null } }
});
const currentPage = cva({ variants: { active: { true: selectedSolid } } });`;

	const typeSnippet = `// A control grows its box at large and keeps its type.
const button = cva({
	variants: {
		size: {
			small: 'h-control-sm px-md text-xs',
			normal: 'h-control-md px-lg text-sm',
			large: 'h-control-lg px-xl text-sm'
		}
	}
});

// A content part takes the one step up; its description sits one step below it.
const cardTitle = cva({ variants: { size: { small: 'text-xs', normal: 'text-sm', large: 'text-base' } } });
const cardDescription = cva({ variants: { size: { small: 'text-xs', normal: 'text-xs', large: 'text-sm' } } });

// A display value rides its own ramp.
const statValue = cva({ variants: { size: { small: 'text-xl', normal: 'text-2xl', large: 'text-3xl' } } });`;

	// One Field, two hosts. `layout="horizontal"` asks for a label beside its control; the Field
	// grants it only once the FIELD is 32rem wide, so the narrow host keeps the stacked layout.
	const containerInputs = {
		project: {
			type: 'text',
			label: 'Project name',
			placeholder: 'Quarterly report',
			class: 'col-span-2'
		},
		owner: {
			type: 'select',
			label: 'Owner',
			items: selectItems,
			defaultValue: 'design',
			class: 'col-span-2'
		}
	} as const;

	const containerSnippet = `// The root is the container; the parts query it. @lg = 32rem of FIELD width,
// the narrowest width at which the control still reads as a control next to its label.
const field = cva({
	variants: {
		labelPosition: {
			top: 'grid-cols-1',
			left: '@container grid-cols-[minmax(8rem,0.4fr)_minmax(0,1fr)]'
		}
	}
});
// A container never queries itself, so the switch lives on the parts.
const fieldHeader = cva({
	variants: { labelPosition: { left: 'col-start-1 col-end-3 @lg:col-end-2 @lg:row-start-1' } }
});`;

	const checkerSnippet = `npm run check:semantic-theme-tokens
# - Card/card.theme.ts: raw shadow shadow-sm — elevation comes from raised-N (bordered surfaces) or lift-N
# - Sidebar/sidebar.theme.ts: focus ring ring-primary/50 — focus rings use the focus state role (ring-focus/50)
# - Table/table.theme.ts: muted text text-neutral/65 — secondary text is text-<role>/70, decorative ink text-<role>/45`;
</script>

<article class="text-neutral mx-auto flex w-full max-w-4xl flex-col gap-14 pb-24">
	<header class="flex max-w-3xl flex-col gap-3">
		<h1 class="text-3xl font-semibold">Consistency rules</h1>
		<p class="text-balance">
			Eight axes used to drift one component at a time: focus rings, elevation, sizes, muted text,
			hover, selection, the type ramp and responsive layout each had a dominant value and a long
			tail written per file. Each axis now has one rule, one token, and a checker that rejects
			anything else. This page states the rules and shows them on live components.
		</p>
	</header>

	<section class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
		{#each rules as rule (rule.id)}
			<a
				href={`#${rule.id}`}
				class="bg-surface-raised raised-1 state-layer p-lg grid gap-2 rounded-lg text-left"
			>
				<span class="text-primary-readable font-mono text-xs">{rule.value}</span>
				<h2 class="text-base font-semibold">{rule.title}</h2>
				<p class="text-neutral/70 text-sm leading-relaxed">{rule.rule}</p>
			</a>
		{/each}
	</section>

	<section id="focus" class="flex flex-col gap-5">
		<div class="max-w-3xl">
			<h2 class="text-lg font-semibold">1. Focus ring</h2>
			<p class="mt-1 text-sm leading-relaxed">
				Press <kbd>Tab</kbd> through the row. The ring geometry never changes; the colour comes from
				the <strong>focus state role</strong>. <code>ring-focus</code> resolves to
				<code>var(--color-focus, var(--color))</code>, so with nothing pinned the neutral input and
				the neutral button ring in the same grey, the primary button rings in primary, and the
				danger outline rings in red — exactly as before.
			</p>
		</div>
		<div class="bg-surface-raised raised-1 gap-lg p-lg flex flex-wrap items-end rounded-lg">
			<div class="w-56">
				<TextInput label="Search" placeholder="Find a task" prefix={magnifyingGlassIcon} />
			</div>
			<div class="w-48">
				<Select label="Team" items={selectItems} bind:value={selected} />
			</div>
			<Button>Neutral</Button>
			<Button color="primary">Primary</Button>
			<Button color="danger" variant="outline">Danger</Button>
			<Switch label="Enabled" bind:value={enabled} />
		</div>
		<div class="max-w-3xl">
			<h3 class="text-base font-semibold">Pinning the role</h3>
			<p class="mt-1 text-sm leading-relaxed">
				One <code>designTokens.focusColor</code> on the Theme declares
				<code>--color-focus</code>, and every ring in the library follows it. The box below carries
				exactly what <code>compileThemeDesignTokens</code> — the function
				<code>&lt;Theme designTokens&gt;</code> compiles with — emits for that token, moved from
				<code>html</code> onto the box so the rest of this page stays neutral. The controls inside are
				the same neutral controls; nothing about them changed, but they now focus in primary. Tab into
				the box to see it.
			</p>
		</div>
		<div
			class="bg-surface-raised raised-1 gap-lg p-lg flex flex-wrap items-end rounded-lg"
			style={pinnedStateRoles}
		>
			<div class="w-56">
				<TextInput label="Search" placeholder="Find a task" />
			</div>
			<Button>Neutral</Button>
			<Button variant="outline">Outline</Button>
			<Switch label="Enabled" value={true} />
		</div>
		<Code language="svelte" code={focusSnippet} />
		<Code language="svelte" code={focusRoleSnippet} />
	</section>

	<section id="elevation" class="flex flex-col gap-5">
		<div class="max-w-3xl">
			<h2 class="text-lg font-semibold">2. Elevation</h2>
			<p class="mt-1 text-sm leading-relaxed">
				Six levels, two families. <code>raised-N</code> paints the shadow and the hairline: cards,
				popovers, panels. <code>lift-N</code> paints only the shadow: thumbs, indicators, pills,
				drag previews. Both read the same <code>--elevation-N</code> variables, so switching the
				elevation token in the playground popover below to <em>flat</em> empties every tile at once.
			</p>
		</div>
		<div class="grid gap-6">
			<div class="gap-lg grid grid-cols-3 sm:grid-cols-6">
				{#each elevationLevels as level (level)}
					<div
						class="bg-surface-raised text-neutral/70 flex aspect-square items-center justify-center rounded-lg font-mono text-xs {raisedClass[
							level
						]}"
					>
						raised-{level}
					</div>
				{/each}
			</div>
			<div class="gap-lg grid grid-cols-3 sm:grid-cols-6">
				{#each elevationLevels as level (level)}
					<div
						class="bg-surface-raised text-neutral/70 flex aspect-square items-center justify-center rounded-lg font-mono text-xs {liftClass[
							level
						]}"
					>
						lift-{level}
					</div>
				{/each}
			</div>
		</div>
		<Code language="svelte" code={elevationSnippet} />
	</section>

	<section id="sizes" class="flex flex-col gap-5">
		<div class="max-w-3xl">
			<h2 class="text-lg font-semibold">3. Sizes</h2>
			<p class="mt-1 text-sm leading-relaxed">
				One <code>size</code> prop, three scales behind it. Controls in a row share the control
				height, so an input, a select, a button and a toggle line up at every size; rows share the
				row height; icons share the icon scale. Retune <code>--spacing</code> and all three move.
			</p>
		</div>
		<div class="bg-surface-raised raised-1 gap-lg p-lg grid rounded-lg">
			{#each sizes as size (size)}
				<div class="gap-md flex flex-wrap items-center">
					<span class="text-neutral/70 w-16 font-mono text-xs">{size}</span>
					<div class="w-44">
						<TextInput {size} placeholder="Input" />
					</div>
					<div class="w-40">
						<Select {size} items={selectItems} value="design" />
					</div>
					<Button {size}>Button</Button>
					<ToggleButton type="button" {size} bind:value={toggled}>Toggle</ToggleButton>
				</div>
			{/each}
		</div>
		<div class="gap-lg grid sm:grid-cols-3">
			<div class="bg-surface-raised raised-1 gap-md p-lg grid rounded-lg">
				<span class="text-neutral/70 text-xs font-medium">Control scale</span>
				{#each controlSteps as step (step.token)}
					<div
						class="bg-neutral-muted px-md flex items-center rounded-md font-mono text-xs {step.className}"
					>
						{step.token}
					</div>
				{/each}
			</div>
			<div class="bg-surface-raised raised-1 gap-md p-lg grid rounded-lg">
				<span class="text-neutral/70 text-xs font-medium">Row scale</span>
				{#each rowSteps as step (step.token)}
					<div
						class="bg-neutral-muted px-md flex items-center rounded-md font-mono text-xs {step.className}"
					>
						{step.token}
					</div>
				{/each}
			</div>
			<div class="bg-surface-raised raised-1 gap-md p-lg grid rounded-lg">
				<span class="text-neutral/70 text-xs font-medium">Icon scale</span>
				{#each iconSteps as step (step.token)}
					<div class="gap-md flex items-center">
						<span class="flex items-center justify-center [&>svg]:size-full {step.className}">
							{@render starIcon({})}
						</span>
						<span class="font-mono text-xs">{step.token}</span>
					</div>
				{/each}
			</div>
		</div>
		<Code language="typescript" code={sizesSnippet} />
	</section>

	<section id="muted" class="flex flex-col gap-5">
		<div class="max-w-3xl">
			<h2 class="text-lg font-semibold">4. Muted text</h2>
			<p class="mt-1 text-sm leading-relaxed">
				Eleven greys became two. Secondary text is the role at 70 %, which measures above 6:1 on the
				surface and on a recessed track. 60 % looked close but measured 4.5:1 on the surface and
				4.49:1 on a track, which is why it is not the step. 45 % is reserved for ink nobody reads:
				idle icons, grips, separators.
			</p>
		</div>
		<div class="gap-lg grid sm:grid-cols-2">
			<div class="bg-surface-raised raised-1 gap-sm p-lg grid rounded-lg">
				<span class="text-neutral/70 text-xs font-medium">On the surface</span>
				<p class="text-neutral">Primary text keeps the full role colour.</p>
				<p class="text-neutral/70">Secondary text is the role at 70 %.</p>
				<p class="gap-sm flex items-center">
					<span class="text-neutral/45 [&>svg]:size-icon-sm">{@render starIcon({})}</span>
					<span class="text-neutral">An idle icon sits at 45 % next to full text.</span>
				</p>
			</div>
			<div class="bg-surface-recessed gap-sm p-lg grid rounded-lg">
				<span class="text-neutral/70 text-xs font-medium">On a recessed track</span>
				<p class="text-neutral">The same three steps on a tinted background.</p>
				<p class="text-neutral/70">Secondary text still clears 6:1 here.</p>
				<SegmentedControl
					items={[
						{ value: 'day', label: 'Day' },
						{ value: 'week', label: 'Week' },
						{ value: 'month', label: 'Month' }
					]}
					bind:value={segment}
				/>
			</div>
		</div>
		<Code language="svelte" code={mutedSnippet} />
	</section>

	<section id="hover" class="flex flex-col gap-5">
		<div class="max-w-3xl">
			<h2 class="text-lg font-semibold">5. Hover</h2>
			<p class="mt-1 text-sm leading-relaxed">
				Move the pointer across the row. A button, a select trigger, a menu option and a plain
				element with the <code>state-layer</code> class all tint by the same amount on hover and
				press, because the tint is one pseudo-element reading <code>--state-hover-opacity</code>
				and <code>--state-pressed-opacity</code>. Typed inputs are the deliberate exception: a text
				field does not tint under the pointer.
			</p>
		</div>
		<div class="bg-surface-raised raised-1 gap-lg p-lg flex flex-wrap items-center rounded-lg">
			<Button variant="outline">Button</Button>
			<div class="w-44">
				<Select items={selectItems} bind:value={selected} />
			</div>
			<div class="bg-surface p-xs raised-2 w-56 rounded-md">
				<MenuOption as="button" title="Menu option" />
				<MenuOption as="button" title="Another option" />
			</div>
			<button
				type="button"
				class="state-layer bg-surface h-control-md px-lg raised-1 flex items-center rounded-md text-sm"
			>
				Plain state-layer
			</button>
		</div>
		<Code language="svelte" code={hoverSnippet} />
	</section>

	<section id="selected" class="flex flex-col gap-5">
		<div class="max-w-3xl">
			<h2 class="text-lg font-semibold">6. Selected</h2>
			<p class="mt-1 text-sm leading-relaxed">
				Whatever is selected reads as the same thing: <code>bg-selected-muted</code> with
				<code>text-selected-muted-readable</code>. Rows, menu options, tags and pressed toggles use
				it. The one solid exception is a current-page pill —
				<code>bg-selected text-selected-contrast</code> — which needs to stand out from its
				siblings. Each of those tokens falls back to the matching current-role tint (<code
					>var(--color-selected-muted, var(--color-muted))</code
				>), so an app that pins nothing looks unchanged.
			</p>
		</div>
		<div class="gap-lg grid sm:grid-cols-2">
			<div class="bg-surface-raised raised-1 gap-md p-lg grid rounded-lg">
				<span class="text-neutral/70 text-xs font-medium">selectedSoft</span>
				<div class="bg-surface p-xs raised-1 rounded-md">
					<MenuOption as="button" title="Selected option" active />
					<MenuOption as="button" title="Resting option" />
				</div>
				<Table
					header={{ name: 'Task', owner: 'Owner' }}
					items={[
						{ cells: { name: 'Document API', owner: 'Ada' }, selected: true },
						{ cells: { name: 'Refactor cards', owner: 'Grace' } }
					]}
				/>
				<TagGroup
					label="Category"
					bind:value={tag}
					items={[
						{ value: 'news', label: 'News' },
						{ value: 'travel', label: 'Travel' },
						{ value: 'gaming', label: 'Gaming' }
					]}
				/>
				<div class="gap-md flex">
					<ToggleButton type="button" variant="outline" bind:value={toggled}>Pressed</ToggleButton>
					<ToggleButton type="button" variant="outline">Resting</ToggleButton>
				</div>
			</div>
			<div class="bg-surface-raised raised-1 gap-md p-lg grid rounded-lg">
				<span class="text-neutral/70 text-xs font-medium">selectedSolid</span>
				<Pagination bind:value={page} totalPages={8} />
				<p class="text-neutral/70 text-sm">
					A current page is the one place a selection paints solid: the pill must win against a row
					of otherwise identical siblings.
				</p>
			</div>
		</div>
		<div class="max-w-3xl">
			<h3 class="text-base font-semibold">Pinning the role</h3>
			<p class="mt-1 text-sm leading-relaxed">
				<code>designTokens.selectedColor</code> declares the whole
				<code>--color-selected*</code> kit at once — the fill, its muted tint and the three inks
				tuned for them. The box below carries that same compiled block. The controls inside are
				neutral; only what is <em>selected</em> in them turns primary.
			</p>
		</div>
		<div
			class="bg-surface-raised raised-1 gap-md p-lg grid rounded-lg sm:grid-cols-2"
			style={pinnedStateRoles}
		>
			<div class="gap-md grid content-start">
				<div class="bg-surface p-xs raised-1 rounded-md">
					<MenuOption as="button" title="Selected option" active />
					<MenuOption as="button" title="Resting option" />
				</div>
				<Table
					header={{ name: 'Task', owner: 'Owner' }}
					items={[
						{ cells: { name: 'Document API', owner: 'Ada' }, selected: true },
						{ cells: { name: 'Refactor cards', owner: 'Grace' } }
					]}
				/>
			</div>
			<div class="gap-md grid content-start">
				<Pagination value={3} totalPages={8} />
				<div class="gap-md flex">
					<ToggleButton type="button" variant="outline" value={true}>Pressed</ToggleButton>
					<ToggleButton type="button" variant="outline">Resting</ToggleButton>
				</div>
			</div>
		</div>
		<Code language="typescript" code={selectedSnippet} />
		<Code language="svelte" code={selectedRoleSnippet} />
	</section>

	<section id="type" class="flex flex-col gap-5">
		<div class="max-w-3xl">
			<h2 class="text-lg font-semibold">7. Type ramp</h2>
			<p class="mt-1 text-sm leading-relaxed">
				<code>size</code> is a box axis, not a typeface axis. A large control grows its height and
				its padding and keeps its type at <code>text-sm</code>, so a large Button and a normal
				Button read as the same voice at two scales. Only a content part — a card, an alert, a
				toast, a table cell — takes the one step up to <code>text-base</code>, and only a display
				value (a Stat figure) rides its own <code>xl/2xl/3xl</code> ramp. Secondary text sits
				exactly one step below the part it belongs to and never below <code>text-xs</code>, which is
				the floor: <code>text-[11px]</code> and every other inline length is banned.
			</p>
		</div>
		<div class="gap-lg grid sm:grid-cols-3">
			{#each typeRamps as ramp (ramp.id)}
				<div class="bg-surface-raised raised-1 gap-md p-lg grid content-start rounded-lg">
					<span class="text-neutral/70 text-xs font-medium">{ramp.title}</span>
					{#each ramp.steps as step (step.size)}
						<div class="gap-md flex items-baseline justify-between">
							<span class={step.className}>{step.size}</span>
							<span class="text-neutral/70 font-mono text-xs">{step.token}</span>
						</div>
					{/each}
					<p class="text-neutral/70 text-xs leading-relaxed">{ramp.note}</p>
				</div>
			{/each}
		</div>
		<div class="bg-surface-raised raised-1 gap-lg p-lg grid rounded-lg">
			{#each sizes as size (size)}
				<div class="gap-lg grid items-start sm:grid-cols-[6rem_1fr]">
					<span class="text-neutral/70 pt-1 font-mono text-xs">{size}</span>
					<div class="gap-lg grid md:grid-cols-3">
						<div class="gap-md flex flex-wrap items-center">
							<Button {size}>Button</Button>
							<div class="bg-surface p-xs raised-1 min-w-40 flex-1 rounded-md">
								<MenuOption as="button" {size} title="Menu option" />
							</div>
						</div>
						<Card
							{size}
							title="Card title"
							description="The description is one step below the title."
						/>
						<Stat
							{size}
							label="Revenue"
							value="$45,231"
							trend="+20.1%"
							trendDirection="up"
							description="Compared with last month"
						/>
					</div>
				</div>
			{/each}
		</div>
		<Code language="typescript" code={typeSnippet} />
	</section>

	<section id="container" class="flex flex-col gap-5">
		<div class="max-w-3xl">
			<h2 class="text-lg font-semibold">8. Container queries</h2>
			<p class="mt-1 text-sm leading-relaxed">
				A component that fills its host is responsive to <em>its own</em> width, not the window's.
				The root recipe carries <code>@container</code> and the parts query it with
				<code>@lg:</code> / <code>@max-3xl:</code>, so the same component reflows identically in a
				page, a split pane, a dialog and a sidebar. Both forms below are the same
				<code>layout="horizontal"</code>, rendered at this one viewport width into hosts of two
				pinned widths: the 18rem host is under the Field's 32rem threshold, so the label stays
				stacked; the 34rem host clears it, so the label moves beside the control. Resize the window
				and <em>neither</em> changes — the hosts keep their widths, so the Fields keep their layouts.
				A viewport query would have flipped both.
			</p>
		</div>
		<!-- The two hosts are pinned (`w-72` / `w-[34rem]`) and the row scrolls rather than wrapping,
		     because the point of the demo is that each Field answers to a KNOWN host width. A responsive
		     grid here would collapse both hosts to the same width on a narrow screen and the captions
		     would describe something the page is no longer rendering. -->
		<div class="gap-lg flex items-start overflow-x-auto pb-2">
			<div class="bg-surface-raised raised-1 gap-md p-md grid w-72 shrink-0 rounded-lg">
				<span class="text-neutral/70 font-mono text-xs">host 18rem — label stacked</span>
				<Form inputs={containerInputs} layout="horizontal" density="compact" />
			</div>
			<div class="bg-surface-raised raised-1 gap-md p-md grid w-[34rem] shrink-0 rounded-lg">
				<span class="text-neutral/70 font-mono text-xs">host 34rem — label beside control</span>
				<Form inputs={containerInputs} layout="horizontal" density="compact" />
			</div>
		</div>
		<p class="text-neutral/70 max-w-3xl text-sm leading-relaxed">
			<code>@container</code> only goes on an element that already fills its host: inline-size containment
			removes intrinsic width, so a popover panel, a menu or an inline chip would collapse to nothing.
			Breadcrumbs is the worked exception — it is a flex item beside the back button in a page header,
			so it has no responsive gap at all rather than a fake one.
		</p>
		<p class="text-neutral/70 max-w-3xl text-sm leading-relaxed">
			When the <em>consumer</em> picks the layout per breakpoint, the prop is
			<code>ResponsiveProps&lt;T&gt;</code>: a plain value, or a partial record
			<code>{'{ sm: 2, lg: 4 }'}</code> whose nearest defined key at or below the active step wins.
			There is no function form. Host-sized layout — Grid, GridSpan, Stack, Carousel — resolves all
			five steps while rendering, writes them as custom properties and lets static
			<code>@min-[…]</code> container rules pick the matching one, so the first paint and the server
			render are already right with no measurement and no JavaScript. The widths are one shared
			table, the component's <em>own</em> width in every case: <code>sm</code> 36rem,
			<code>md</code> 42rem, <code>lg</code> 56rem, <code>xl</code> 72rem, with <code>xs</code> below.
		</p>
		<Code language="typescript" code={containerSnippet} />
	</section>

	<section class="flex flex-col gap-5">
		<div class="max-w-3xl">
			<h2 class="text-lg font-semibold">How it stays this way</h2>
			<p class="mt-1 text-sm leading-relaxed">
				<code>tooling/check-semantic-theme-tokens.mjs</code> sweeps every theme file and the component
				markup, and fails the build on any class outside these rules. Each rule has a test proving it
				fires. Genuine geometry (a slider thumb, a drag handle) lives in a justified exceptions map, and
				an exception nobody uses any more is itself an error.
			</p>
		</div>
		<Code language="bash" code={checkerSnippet} />
	</section>
</article>
