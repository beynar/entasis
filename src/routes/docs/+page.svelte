<script lang="ts">
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

	const installCode = `pnpm add tailwindcss @tailwindcss/vite`;

	const cssSetupCode = `@import 'tailwindcss';

/* Light theme — applied to <html> by default.
   The default theme also registers the utilities,
   variants and .ui-spinner component. */
@plugin 'svelai/tailwind-plugin/theme' {
	name: light;
	default: true;
	colorscheme: light;
}

/* Dark theme — applied via html[data-theme="dark"] or .dark */
@plugin 'svelai/tailwind-plugin/theme' {
	name: dark;
	colorscheme: dark;
}`;

	const brandCode = `@plugin 'svelai/tailwind-plugin/theme' {
	name: light;
	default: true;
	colorscheme: light;

	/* hex or a Tailwind color name (e.g. \`indigo\`) */
	primary: #6366f1;
	secondary: #8b5cf6;
	danger: #ef4444;
	success: #22c55e;
	warning: #f59e0b;
	info: #3b82f6;

	/* surface drives elevation; neutral is the achromatic semantic color */
	surface: #ffffff;
	neutral: #0a0a0a;

	/* optional interaction calibration */
	state-hover-opacity: 0.05;
	state-pressed-opacity: 0.10;

	/* optional per-variant overrides */
	primary-dark: #4338ca;
	primary-contrast: #ffffff;
}`;

	const usageCode = `<button class="state-layer bg-primary text-primary-contrast rounded-sm px-lg py-sm">
	Primary
</button>

<div class="bg-surface-canvas border-neutral-muted rounded-lg border p-xl">
	<p class="text-neutral">Title</p>
	<p class="text-neutral/60">Muted body copy</p>
</div>

<!-- opacity modifiers work on every token -->
<span class="bg-primary/20 text-primary">Soft badge</span>`;

	const themeToggleCode = `<html data-theme="dark">
	<!-- or toggle the \`.dark\` class -->
</html>`;

	const runtimeThemeCode = `<script lang="ts">
	import { Theme, type ThemeDesignTokenMap } from 'svelai/theme';

	let spacing = $state<'small' | 'normal' | 'large'>('normal');
	const designTokens = $derived({
		light: {
			spacing,
			spacingScale: { xs: 1, sm: 1.5, md: 2, lg: 3, xl: 4 },
			radius: 'normal',
			typeScale: 'default',
			raisedWithBorder: true
		},
		dark: {
			spacing,
			spacingScale: { xs: 1, sm: 1.5, md: 2, lg: 3, xl: 4 },
			radius: 'small',
			typeScale: 'compact',
			raisedWithBorder: false
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

{#snippet ic(text: string)}<code class="bg-neutral-muted rounded-sm px-xs py-micro text-sm"
		>{text}</code
	>{/snippet}

<article class="text-neutral mx-auto grid max-w-3xl gap-4 pb-20">
	<header class="grid gap-2">
		<h1 class="text-3xl font-semibold">Getting started</h1>
		<p class="text-neutral/60 text-balance">
			This library combines a Tailwind color engine with runtime design tokens managed by the
			{@render ic('<Theme>')} component.
		</p>
	</header>

	<Separator class="my-2" children="Installation" />

	<p class="text-neutral/60">Install Tailwind and its Vite plugin.</p>
	<Code language="bash" code={installCode} />

	<p class="text-neutral/60">
		Then wire up the theme in your {@render ic('src/app.css')}. Declare the {@render ic(
			"@plugin 'svelai/tailwind-plugin/theme'"
		)} block once per theme — each generates a scoped color palette. The block marked
		{@render ic('default: true')} also registers the shared utilities, variants and {@render ic(
			'.ui-spinner'
		)} component, so a single plugin is all you need.
	</p>
	<Code language="css" code={cssSetupCode} />

	<Separator class="my-2" children="Build-time color options" />

	<p class="text-neutral/60">
		Every key below is passed inside the {@render ic("@plugin 'svelai/tailwind-plugin/theme'")} block.
	</p>

	<div class="border-neutral-muted rounded-xl overflow-hidden border">
		{#each themeOptions as option, i (option.name)}
			<div
				class="grid grid-cols-[1fr_1.4fr] gap-4 p-3 {i % 2 === 0
					? 'bg-surface'
					: 'bg-surface-canvas'}"
			>
				<div class="grid content-start gap-1">
					<code class="text-primary text-sm font-medium">{option.name}</code>
					<code class="text-neutral/60 text-xs">{option.type}</code>
					<span class="text-neutral/60 text-xs">default: {option.def}</span>
				</div>
				<p class="text-neutral/60 text-sm">{option.desc}</p>
			</div>
		{/each}
	</div>

	<p class="text-neutral/60">
		Each base color ({@render ic('primary')}, {@render ic('danger')}, …) accepts a hex value or a
		Tailwind color name. Variants ({@render ic('-light')}, {@render ic('-dark')}, {@render ic(
			'-muted'
		)}, {@render ic('-contrast')}) are derived automatically but can be overridden individually.
	</p>
	<Code language="css" code={brandCode} />

	<Separator class="my-2" children="Runtime design tokens" />

	<p class="text-neutral/60">
		Pass {@render ic('designTokens')} to {@render ic('<Theme>')} to control spacing, radius, fluid typography
		and raised borders for each logical theme. The object is reactive: changing a value updates existing
		{@render ic('p-*')}, {@render ic('gap-*')}, {@render ic('rounded-*')} and
		{@render ic('text-*')} utilities without rebuilding Tailwind.
	</p>
	<Code language="svelte" code={runtimeThemeCode} />
	<p class="text-neutral/60">
		This replaces the former {@render ic('spacing')}, {@render ic('radius')}, {@render ic('scale')}
		and {@render ic('raised-with-border')} plugin options. Component density variants remain local choices;
		their spacing utilities inherit the active runtime spacing scale.
	</p>

	<Separator class="my-2" children="Color tokens" />

	<p class="text-neutral/60">
		The palette exposes seven semantic colors, each with five variants. Use them like any Tailwind
		color: {@render ic('bg-primary')}, {@render ic('text-danger-contrast')}, {@render ic(
			'border-neutral-muted'
		)}. Opacity modifiers ({@render ic('/20')}) are supported.
	</p>

	<div class="grid gap-3">
		{#each semanticColors as color (color)}
			<div class="grid gap-1">
				<span class="text-neutral/60 text-xs font-medium">{color}</span>
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

	<p class="text-neutral/60">
		See the <a class="text-primary underline" href="/colors">Colors</a> page for the full palette.
	</p>

	<p class="text-neutral/60">
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

	<p class="text-neutral/60">
		Any non-default theme is applied through its {@render ic('data-theme')} attribute or a matching class.
		Toggle it on {@render ic('<html>')} to switch themes. Add {@render ic('prefersDark: true;')} to follow
		the system setting automatically.
	</p>
	<Code language="html" code={themeToggleCode} />
</article>
