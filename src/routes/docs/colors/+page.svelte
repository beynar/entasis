<script lang="ts">
	import { resolve } from '$app/paths';
	import {
		runtimeThemePresetNames,
		runtimeThemePresets
	} from '../../runtimeThemePlayground.svelte.js';

	const elevationSteps = [
		{ level: 1, className: 'raised-1', role: 'Resting cards' },
		{ level: 2, className: 'raised-2', role: 'Hovered cards' },
		{ level: 3, className: 'raised-3', role: 'Popovers' },
		{ level: 4, className: 'raised-4', role: 'Dialogs' },
		{ level: 5, className: 'raised-5', role: 'Dragged items' }
	] as const;

	const semanticFamilies = [
		{
			name: 'primary',
			role: 'Main brand action and strongest product emphasis.',
			colors: [
				['primary', 'bg-primary'],
				['primary-dark', 'bg-primary-dark'],
				['primary-light', 'bg-primary-light'],
				['primary-lighter', 'bg-primary-lighter'],
				['primary-muted', 'bg-primary-muted'],
				['primary-contrast', 'bg-primary-contrast']
			]
		},
		{
			name: 'secondary',
			role: 'Supporting accent when primary should not carry every emphasis.',
			colors: [
				['secondary', 'bg-secondary'],
				['secondary-dark', 'bg-secondary-dark'],
				['secondary-light', 'bg-secondary-light'],
				['secondary-lighter', 'bg-secondary-lighter'],
				['secondary-muted', 'bg-secondary-muted'],
				['secondary-contrast', 'bg-secondary-contrast']
			]
		},
		{
			name: 'neutral',
			role: 'Default text, icons, borders, and colorless solid controls.',
			colors: [
				['neutral', 'bg-neutral'],
				['neutral-dark', 'bg-neutral-dark'],
				['neutral-light', 'bg-neutral-light'],
				['neutral-lighter', 'bg-neutral-lighter'],
				['neutral-muted', 'bg-neutral-muted'],
				['neutral-contrast', 'bg-neutral-contrast']
			]
		},
		{
			name: 'danger',
			role: 'Destructive actions, failures, and conditions requiring intervention.',
			colors: [
				['danger', 'bg-danger'],
				['danger-dark', 'bg-danger-dark'],
				['danger-light', 'bg-danger-light'],
				['danger-lighter', 'bg-danger-lighter'],
				['danger-muted', 'bg-danger-muted'],
				['danger-contrast', 'bg-danger-contrast']
			]
		},
		{
			name: 'success',
			role: 'Completed, valid, healthy, or confirmed outcomes.',
			colors: [
				['success', 'bg-success'],
				['success-dark', 'bg-success-dark'],
				['success-light', 'bg-success-light'],
				['success-lighter', 'bg-success-lighter'],
				['success-muted', 'bg-success-muted'],
				['success-contrast', 'bg-success-contrast']
			]
		},
		{
			name: 'warning',
			role: 'Caution, risk, or a condition that may need attention.',
			colors: [
				['warning', 'bg-warning'],
				['warning-dark', 'bg-warning-dark'],
				['warning-light', 'bg-warning-light'],
				['warning-lighter', 'bg-warning-lighter'],
				['warning-muted', 'bg-warning-muted'],
				['warning-contrast', 'bg-warning-contrast']
			]
		},
		{
			name: 'info',
			role: 'Informational guidance and neutral system communication.',
			colors: [
				['info', 'bg-info'],
				['info-dark', 'bg-info-dark'],
				['info-light', 'bg-info-light'],
				['info-lighter', 'bg-info-lighter'],
				['info-muted', 'bg-info-muted'],
				['info-contrast', 'bg-info-contrast']
			]
		}
	] as const;

	const surfaceTokens = [
		{
			name: 'surface-recessed',
			background: 'bg-surface-recessed',
			role: 'Inset wells and grouped-control tracks.'
		},
		{
			name: 'surface-canvas',
			background: 'bg-surface-canvas',
			role: 'Deepest application background.'
		},
		{
			name: 'surface',
			background: 'bg-surface',
			role: 'Ordinary page and component surface.'
		},
		{
			name: 'surface-raised',
			background: 'bg-surface-raised',
			role: 'Cards and surfaces resting above the page.'
		},
		{
			name: 'surface-floating',
			background: 'bg-surface-floating',
			role: 'Popovers, dialogs, tooltips, and floating controls.'
		}
	] as const;

	const variantSemantics = [
		['{color}', 'The canonical solid color.'],
		['{color}-dark', 'A darker tonal grade; not a hover or pressed state.'],
		['{color}-light', 'A lighter tonal grade.'],
		['{color}-lighter', 'The lightest tonal grade.'],
		['{color}-muted', 'A low-emphasis tinted surface for persistent semantic state.'],
		['{color}-contrast', 'Content designed to sit on the solid color.'],
		['{color}-readable', 'The solid color adjusted for readable text on neutral surfaces.'],
		['{color}-muted-readable', 'Content designed to sit on the muted color.']
	] as const;
</script>

{#snippet token(text: string)}
	<code class="text-neutral font-mono text-[0.85em]">{text}</code>
{/snippet}

{#snippet interactionPreview(label: string, opacity?: 'hover' | 'pressed')}
	<div
		class="bg-surface-floating text-neutral relative isolate overflow-hidden rounded-lg px-4 py-2 text-sm font-medium"
	>
		{#if opacity}
			<span
				class="pointer-events-none absolute inset-0 bg-current {opacity === 'hover'
					? 'opacity-[var(--state-hover-opacity)]'
					: 'opacity-[var(--state-pressed-opacity)]'}"
			></span>
		{/if}
		<span class="relative">{label}</span>
	</div>
{/snippet}

<article class="text-neutral mx-auto flex max-w-4xl flex-col gap-14 pb-24">
	<header class="flex max-w-3xl flex-col gap-3">
		<h1 class="text-3xl font-semibold">Color system</h1>
		<p class="text-neutral text-balance">
			Choose meaning, resting surface, and interaction independently. This separation keeps
			components coherent across light and dark themes.
		</p>
	</header>

	<section class="flex flex-col gap-5">
		<h2 class="text-lg font-semibold">The three decisions</h2>
		<ol class="flex max-w-3xl flex-col gap-4 text-sm">
			<li>
				<strong class="font-medium">1. Meaning.</strong>
				Choose primary, neutral, danger, success, warning, or info.
			</li>
			<li>
				<strong class="font-medium">2. Resting surface.</strong>
				Choose where the element sits before interaction.
			</li>
			<li>
				<strong class="font-medium">3. Interaction.</strong>
				Add {@render token('state-layer')} for hover, virtual focus, and press.
			</li>
		</ol>
	</section>

	<section class="flex flex-col gap-8">
		<h2 class="text-lg font-semibold">Semantic colors</h2>
		<div class="flex max-w-3xl flex-col gap-3">
			<p class="text-neutral">
				A family name communicates meaning. Its suffix communicates a tonal treatment—not component
				state and not elevation.
			</p>
			<p class="text-neutral text-sm">
				Use {@render token('{color}-contrast')} on solid fills and {@render token(
					'{color}-muted-readable'
				)} on muted fills. Use {@render token('{color}-readable')} when the semantic color itself is text
				on a neutral surface.
			</p>
		</div>
		<div class="flex flex-col gap-8">
			{#each semanticFamilies as family (family.name)}
				<div class="flex flex-col gap-3">
					<div class="max-w-3xl">
						<p class="text-neutral font-medium">{family.name}</p>
						<p class="text-neutral mt-1 text-sm leading-relaxed">{family.role}</p>
					</div>
					<div class="grid grid-cols-3 gap-3 sm:grid-cols-6">
						{#each family.colors as [name, background] (name)}
							<div class="min-w-0">
								<div class={`h-12 rounded-md ${background}`}></div>
								<code
									class="text-neutral mt-2 block truncate text-center text-[0.65rem]"
									title={name}>{name.replace(`${family.name}-`, '')}</code
								>
							</div>
						{/each}
					</div>
				</div>
			{/each}
		</div>

		<dl class="flex max-w-3xl flex-col gap-4 text-sm">
			{#each variantSemantics as [name, meaning] (name)}
				<div class="grid gap-1 sm:grid-cols-[12rem_1fr] sm:gap-4">
					<dt><code class="text-neutral">{name}</code></dt>
					<dd class="text-neutral">{meaning}</dd>
				</div>
			{/each}
		</dl>
	</section>

	<section class="flex flex-col gap-6">
		<h2 class="text-lg font-semibold">Surface tokens</h2>
		<div class="flex max-w-3xl flex-col gap-3">
			<p class="text-neutral">
				Surface tokens describe resting layers. Their generated lightness changes by color scheme so
				the hierarchy remains visible in both modes.
			</p>
			<p class="text-neutral text-sm">
				{@render token('surface-recessed')} is an inset role. The elevation ladder is {@render token(
					'surface-canvas'
				)} → {@render token('surface')} → {@render token('surface-raised')} → {@render token(
					'surface-floating'
				)}.
			</p>
		</div>

		<div class="flex flex-col gap-5">
			{#each surfaceTokens as surface (surface.name)}
				<div class="grid items-center gap-3 sm:grid-cols-[8rem_11rem_1fr]">
					<div class={`h-12 rounded-md ${surface.background}`}></div>
					<code class="text-neutral text-xs font-medium">{surface.name}</code>
					<p class="text-neutral text-sm leading-relaxed">{surface.role}</p>
				</div>
			{/each}
		</div>
	</section>

	<section class="flex flex-col gap-5">
		<h2 class="text-lg font-semibold">Interaction states</h2>
		<p class="text-neutral max-w-3xl text-sm">
			{@render token('state-layer')} overlays the element's current text color at theme-configured opacity
			without replacing its resting fill.
		</p>
		<div class="flex flex-wrap gap-3">
			{@render interactionPreview('Rest')}
			{@render interactionPreview('Hover', 'hover')}
			{@render interactionPreview('Pressed', 'pressed')}
		</div>
		<ul class="text-neutral flex max-w-3xl list-disc flex-col gap-2 pl-5 text-sm leading-relaxed">
			<li>Hover runs only on hover-capable pointers; press is stronger and wins.</li>
			<li>Virtual focus uses the same layer as hover.</li>
			<li>Disabled elements suppress the layer automatically.</li>
			<li>Focus uses a ring. Persistent selected/open/checked states use muted or solid fills.</li>
		</ul>
	</section>

	<section class="flex flex-col gap-6">
		<h2 class="text-lg font-semibold">Elevation</h2>
		<div class="flex max-w-3xl flex-col gap-3">
			<p class="text-neutral">
				Surfaces describe which layer an element rests on; {@render token('raised-{level}')} describes
				how far it lifts off that layer. The five levels share one shadow ramp, tuned by the theme's
				{@render token('elevation')} token—<code class="text-neutral">flat</code> removes the
				shadows,
				<code class="text-neutral">high</code> deepens them.
			</p>
			<p class="text-neutral text-sm">
				In dark mode the ramp also adds a light tint, because shadows alone read as flat on a dark
				canvas. Toggle the color scheme to compare.
			</p>
			<p class="text-neutral text-sm">
				{@render token('raised-{level}')} also draws a hairline border, which is what a card, a popover
				or a panel wants. Borderless things that float — switch thumbs, tab indicators, drag previews,
				tooltips — take {@render token('lift-{level}')} instead: the same shadow off the same ramp, no
				border. Both accept the level numbers above and the t-shirt aliases ({@render token('sm')} … {@render token(
					'2xl'
				)}).
			</p>
		</div>
		<div class="bg-surface-canvas grid grid-cols-5 gap-3 rounded-lg p-5 sm:gap-5 sm:p-8">
			{#each elevationSteps as step (step.level)}
				<div class="flex min-w-0 flex-col gap-2">
					<div class="{step.className} bg-surface-raised h-14 rounded-lg sm:h-20"></div>
					<code class="text-neutral block truncate text-center text-[0.65rem]" title={step.role}
						>{step.className}</code
					>
				</div>
			{/each}
		</div>
	</section>

	<section class="flex flex-col gap-6">
		<h2 class="text-lg font-semibold">Presets</h2>
		<p class="text-neutral max-w-3xl">
			Spacing, radius, type scale, and elevation travel together. The
			<a class="text-primary-readable underline" href={resolve('/playground')}>playground</a>
			applies these presets to a live component gallery, then prints the matching
			{@render token('designTokens')} block to copy.
		</p>
		<dl class="flex flex-col gap-3 text-sm sm:grid sm:grid-cols-[10rem_1fr] sm:gap-x-4 sm:gap-y-3">
			{#each runtimeThemePresetNames as presetName (presetName)}
				{@const preset = runtimeThemePresets[presetName]}
				<dt class="text-neutral font-medium">{preset.label}</dt>
				<dd class="text-neutral">
					{preset.description}
					<span class="text-neutral/70">
						{preset.typeScale} type, {preset.elevation} elevation.
					</span>
				</dd>
			{/each}
		</dl>
	</section>

	<section class="flex max-w-3xl flex-col gap-2">
		<h2 class="text-lg font-semibold">Fast rule for humans and AI</h2>
		<p class="text-neutral text-sm leading-relaxed">
			Never infer interaction from {@render token('-dark')} or {@render token('-light')}. First
			choose a semantic family, then a resting surface, and finally {@render token('state-layer')} for
			transient interaction. Use rings for focus and explicit muted or solid fills for persistent state.
		</p>
	</section>
</article>
