<script lang="ts">
	import { resolve } from '$app/paths';
	import Code from '$lib/components/Code/Code.svelte';
	import Separator from '$lib/components/Separator/Separator.svelte';

	type Option = {
		name: string;
		type: string;
		def: string;
		desc: string;
	};

	const themeOptions: Option[] = [
		{ name: 'name', type: 'string', def: '—', desc: 'Theme name used for data-theme switching.' },
		{
			name: 'default',
			type: 'boolean',
			def: 'false',
			desc: 'Apply this theme to <html> without a data-theme attribute.'
		},
		{
			name: 'colorscheme',
			type: "'light' | 'dark'",
			def: "'light'",
			desc: 'Base scheme driving surface elevation and the default reversed neutral.'
		},
		{
			name: 'prefersDark',
			type: 'boolean',
			def: 'false',
			desc: 'Also apply under @media (prefers-color-scheme: dark).'
		},
		{
			name: 'luminance',
			type: 'number',
			def: '0',
			desc: 'Shift overall brightness (positive lighter, negative darker).'
		},
		{
			name: 'saturation',
			type: 'number',
			def: '0',
			desc: 'Shift color saturation across the palette.'
		},
		{
			name: 'state-hover-opacity',
			type: 'number',
			def: '0.05 light / 0.16 dark',
			desc: 'Opacity of the current-color layer used for hover and virtual focus.'
		},
		{
			name: 'state-pressed-opacity',
			type: 'number',
			def: '0.10 light / 0.32 dark',
			desc: 'Opacity of the current-color layer used for the pressed state.'
		},
		{
			name: 'state-selected-opacity',
			type: 'number',
			def: '0.07 light / 0.10 dark',
			desc: 'Opacity of the role tint bg-selected-muted composites, so a selection reads the same on any surface.'
		},
		{
			name: 'spinner',
			type: "'spinDynamicThin' | 'spinDynamicThick' | 'spinLargeThreeQuarter' | 'spinlargeQuarter'",
			def: "'spinDynamicThin'",
			desc: 'Which .ui-spinner keyframes and style the engine emits.'
		}
	];

	// `ThemeOptions` intersects `EngineOptions`, and `applyGlobalEngine` reads these five keys only
	// from the block that carries `default: true` — they are ignored on every other theme block.
	const engineOptions: Option[] = [
		{
			name: 'spacing',
			type: "'small' | 'normal' | 'large' | number",
			def: "unset (Tailwind's 0.25rem)",
			desc: 'Factor on the base spacing unit; writes --spacing and the geometry family under it.'
		},
		{
			name: 'radius',
			type: "'none' | 'subtile' | 'small' | 'normal' | 'large' | 'round' | number",
			def: "'normal'",
			desc: 'Factor on the whole radius ramp; writes --radius and --radius-xs … --radius-4xl.'
		},
		{
			name: 'typeScale',
			type: "'compact' | 'default' | 'comfortable' | 'large' | TypeScaleOptions",
			def: "'default'",
			desc: 'Fluid type ramp; writes every --text-* step as a clamp().'
		},
		{
			name: 'elevation',
			type: "'flat' | 'normal' | 'high'",
			def: "'normal'",
			desc: 'Strength of the shadow ramp raised-* and lift-* read; flat removes shadows.'
		},
		{
			name: 'motion',
			type: 'DeepPartial<{ duration, easing }>',
			def: 'library scale',
			desc: 'Duration steps and easing roles; writes --duration-* and --ease-*. Object-valued, so only expressible from a JavaScript plugin config.'
		}
	];

	const semanticColors = [
		'primary',
		'secondary',
		'danger',
		'success',
		'warning',
		'info',
		'neutral'
	] as const;

	const variants = ['DEFAULT', 'light', 'lighter', 'dark', 'muted', 'contrast'] as const;

	const installCode = `pnpm add entasis
pnpm add tailwindcss @tailwindcss/vite`;

	const cssSetupCode = `@import 'tailwindcss';

/* Light theme — applied to <html> by default.
   The default theme also registers the utilities,
   variants and .ui-spinner component. */
@plugin 'entasis/tailwind-plugin/theme' {
	name: light;
	default: true;
	colorscheme: light;
}

/* Dark theme — applied via html[data-theme="dark"] or .dark */
@plugin 'entasis/tailwind-plugin/theme' {
	name: dark;
	colorscheme: dark;
}`;

	const brandCode = `@plugin 'entasis/tailwind-plugin/theme' {
	name: light;
	default: true;
	colorscheme: light;

	/* hex or a Tailwind color name (e.g. \`zinc\`) */
	primary: #5f62ef;
	secondary: #e4e4e7;
	danger: #dc2626;
	success: #15803d;
	warning: #f59e0b;
	info: #2563eb;

	/* surface drives elevation; neutral is the achromatic semantic color */
	surface: #fafafa;
	neutral: #18181b;

	/* optional interaction calibration */
	state-hover-opacity: 0.05;
	state-pressed-opacity: 0.10;
	state-selected-opacity: 0.07;

	/* optional per-variant overrides */
	primary-contrast: #fafafa;
}`;

	const usageCode = `<button class="state-layer bg-primary text-primary-contrast rounded-sm px-lg py-sm">
	Primary
</button>

<div class="bg-surface-canvas border-neutral-muted rounded-lg border p-xl">
	<p class="text-neutral">Title</p>
	<p class="text-neutral/70">Muted body copy</p>
</div>

<!-- opacity modifiers work on every token -->
<span class="bg-primary/20 text-primary-readable">Soft badge</span>`;

	const themeToggleCode = `<html data-theme="dark">
	<!-- or toggle the \`.dark\` class -->
</html>`;

	const runtimeThemeCode = `<script lang="ts">
	import { Theme, type ThemeDesignTokenMap } from 'entasis/theme';

	let spacing = $state<'small' | 'normal' | 'large'>('normal');
	const designTokens = $derived({
		light: {
			spacing,
			spacingScale: { xs: 1, sm: 1.5, md: 2, lg: 3, xl: 4 },
			radius: 'normal',
			typeScale: 'default',
			raisedWithBorder: true,
			defaultColor: 'neutral'
		},
		dark: {
			spacing,
			spacingScale: { xs: 1, sm: 1.5, md: 2, lg: 3, xl: 4 },
			radius: 'small',
			typeScale: 'compact',
			raisedWithBorder: false,
			defaultColor: 'neutral'
		}
	} satisfies ThemeDesignTokenMap<readonly ['light', 'dark']>);
</${'script'}>

<Theme {designTokens}>
	{#snippet children(theme)}
		<button onclick={() => (spacing = spacing === 'small' ? 'large' : 'small')}>
			Change density
		</button>
		<!-- app -->
	{/snippet}
</Theme>`;
</script>

{#snippet ic(text: string)}<code class="bg-neutral-muted px-xs py-micro rounded-sm text-sm"
		>{text}</code
	>{/snippet}

<article class="text-neutral mx-auto grid max-w-3xl gap-4 pb-20">
	<header class="grid gap-2">
		<h1 class="text-3xl font-semibold">Getting started</h1>
		<p class="text-neutral/70 text-balance">
			This library combines a Tailwind color engine with runtime design tokens managed by the
			{@render ic('<Theme>')} component.
		</p>
	</header>

	<Separator class="my-2" children="Installation" />

	<p class="text-neutral/70">Install the package, then Tailwind and its Vite plugin.</p>
	<Code language="bash" code={installCode} />

	<p class="text-neutral/70">
		entasis runs inside a SvelteKit app ({@render ic('@sveltejs/kit')} is a peer). Three rendering libraries
		stay optional peers — install a line only if you import one of the components on it:
		{@render ic('Chart')} needs
		{@render ic('@tanstack/charts d3-array d3-force d3-hierarchy d3-sankey d3-scale d3-shape')},
		{@render ic('RichTextInput')} — and the {@render ic('AIComposer')} / {@render ic('AIChat')} that render
		it — needs
		{@render ic(
			'lexical @lexical/history @lexical/link @lexical/list @lexical/markdown @lexical/rich-text @lexical/selection @lexical/utils'
		)}, and {@render ic('Globe')} needs {@render ic('cobe')}. Every other component works with
		entasis alone.
	</p>

	<p class="text-neutral/70">
		A missing peer fails the build, not the browser. Vite substitutes a stub module instead of
		reporting an unresolved import, so the errors name the missing exports first: importing
		{@render ic('Chart')} without its line fails with a wall of
		{@render ic('[MISSING_EXPORT] "bandX" is not exported by')}
		{@render ic('"__vite-optional-peer-dep:@tanstack/charts:entasis"')}. The package to install is in
		that virtual module id.
	</p>

	<p class="text-neutral/70">
		Then wire up the theme in your {@render ic('src/app.css')}. Declare the {@render ic(
			"@plugin 'entasis/tailwind-plugin/theme'"
		)} block once per theme — each generates a scoped color palette. The block marked
		{@render ic('default: true')} also registers the shared utilities, variants and {@render ic(
			'.ui-spinner'
		)} component, so a single plugin is all you need.
	</p>
	<Code language="css" code={cssSetupCode} />

	<Separator class="my-2" children="Build-time plugin options" />

	<p class="text-neutral/70">
		Every key below is passed inside the {@render ic("@plugin 'entasis/tailwind-plugin/theme'")} block,
		and together they are the {@render ic('ThemeOptions')} type. They are read at build time and baked
		into the stylesheet.
	</p>

	<div class="border-neutral-muted overflow-hidden rounded-xl border">
		{#each themeOptions as option, i (option.name)}
			<div
				class="grid grid-cols-[1fr_1.4fr] gap-4 p-3 {i % 2 === 0
					? 'bg-surface'
					: 'bg-surface-canvas'}"
			>
				<div class="grid content-start gap-1">
					<code class="text-primary-readable text-sm font-medium">{option.name}</code>
					<code class="text-neutral/70 text-xs">{option.type}</code>
					<span class="text-neutral/70 text-xs">default: {option.def}</span>
				</div>
				<p class="text-neutral/70 text-sm">{option.desc}</p>
			</div>
		{/each}
	</div>

	<p class="text-neutral/70">
		{@render ic('ThemeOptions')} also intersects {@render ic('EngineOptions')}. The engine is
		installed once, by the block carrying {@render ic('default: true')}, and these five keys are
		read only from that block — they are ignored on every other theme block.
	</p>

	<div class="border-neutral-muted overflow-hidden rounded-xl border">
		{#each engineOptions as option, i (option.name)}
			<div
				class="grid grid-cols-[1fr_1.4fr] gap-4 p-3 {i % 2 === 0
					? 'bg-surface'
					: 'bg-surface-canvas'}"
			>
				<div class="grid content-start gap-1">
					<code class="text-primary-readable text-sm font-medium">{option.name}</code>
					<code class="text-neutral/70 text-xs">{option.type}</code>
					<span class="text-neutral/70 text-xs">default: {option.def}</span>
				</div>
				<p class="text-neutral/70 text-sm">{option.desc}</p>
			</div>
		{/each}
	</div>

	<p class="text-neutral/70">
		Each base color ({@render ic('primary')}, {@render ic('danger')}, …) accepts a hex value or a
		Tailwind color name. Variants ({@render ic('-light')}, {@render ic('-dark')}, {@render ic(
			'-muted'
		)}, {@render ic('-contrast')}) are derived automatically but can be overridden individually.
	</p>
	<Code language="css" code={brandCode} />

	<Separator class="my-2" children="Runtime design tokens" />

	<p class="text-neutral/70">
		Pass {@render ic('designTokens')} to {@render ic('<Theme>')} to control spacing, radius, fluid typography
		and raised borders for each logical theme. The object is reactive: changing a value updates existing
		{@render ic('p-*')}, {@render ic('gap-*')}, {@render ic('rounded-*')} and
		{@render ic('text-*')} utilities without rebuilding Tailwind.
	</p>
	<Code language="svelte" code={runtimeThemeCode} />
	<p class="text-neutral/70">
		{@render ic('spacing')}, {@render ic('radius')}, {@render ic('typeScale')}, {@render ic(
			'elevation'
		)}
		and {@render ic('motion')} exist on both sides. The plugin writes them on {@render ic('html')} at
		build time; {@render ic('designTokens')} writes them on {@render ic(
			'html[data-theme="<name>"]'
		)}, which is more specific — so a runtime token always wins for that theme, and every key a
		theme omits keeps the build-time value. Use the plugin for the app-wide baseline and {@render ic(
			'designTokens'
		)} for what differs per theme or changes at runtime. See the
		<a class="text-primary-readable underline" href={resolve('/docs/tokens')}>design tokens</a> page for
		every key. Component density variants remain local choices; their spacing utilities inherit the active
		runtime spacing scale.
	</p>

	<Separator class="my-2" children="Color tokens" />

	<p class="text-neutral/70">
		The palette exposes seven semantic colors, each with five variants. Use them like any Tailwind
		color: {@render ic('bg-primary')}, {@render ic('text-danger-contrast')}, {@render ic(
			'border-neutral-muted'
		)}. Opacity modifiers ({@render ic('/20')}) are supported.
	</p>

	<div class="grid gap-3">
		{#each semanticColors as color (color)}
			<div class="grid gap-1">
				<span class="text-neutral/70 text-xs font-medium">{color}</span>
				<div class="flex flex-wrap gap-2">
					{#each variants as variant (variant)}
						{@const token = variant === 'DEFAULT' ? color : `${color}-${variant}`}
						<div
							class="border-neutral-muted grid h-12 min-w-20 flex-1 place-items-center rounded border text-xs"
							style:background-color="var(--color-{token})"
						>
							<span class="rounded bg-black/40 px-1 text-white">
								{variant === 'DEFAULT' ? color : variant}
							</span>
						</div>
					{/each}
				</div>
			</div>
		{/each}
	</div>

	<p class="text-neutral/70">
		See the <a class="text-primary-readable underline" href={resolve('/colors')}>Colors</a> page for the
		full palette.
	</p>

	<p class="text-neutral/70">
		Use {@render ic('surface-recessed')} for inset wells, then the {@render ic('surface-canvas')} → {@render ic(
			'surface-floating'
		)}
		ladder for resting elevation. Add {@render ic('state-layer')} to interactive elements so hover and
		press composite the element's current text color without replacing that resting surface. Use focus
		rings for keyboard focus, and use {@render ic('*-muted')} or solid colors for persistent selected,
		checked, open, or semantic states.
	</p>

	<Separator class="my-2" children="Using tokens" />

	<Code language="html" code={usageCode} />

	<Separator class="my-2" children="Dark mode" />

	<p class="text-neutral/70">
		Any non-default theme is applied through its {@render ic('data-theme')} attribute or a matching class.
		Toggle it on {@render ic('<html>')} to switch themes. Add {@render ic('prefersDark: true;')} to follow
		the system setting automatically.
	</p>
	<Code language="html" code={themeToggleCode} />
</article>
