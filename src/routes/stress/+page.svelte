<script lang="ts">
	import { Button } from '$lib/components/Button/index.js';
	import { SegmentedControl } from '$lib/components/SegmentedControl/index.js';
	import { useTheme } from '$lib/components/Theme/theme.state.svelte.js';
	import type { Density, Sizes } from '$lib/types/theme.js';
	import ActionsSection from './ActionsSection.svelte';
	import AISection from './AISection.svelte';
	import DataSection from './DataSection.svelte';
	import DisplaySection from './DisplaySection.svelte';
	import InputsSection from './InputsSection.svelte';
	import LayoutSection from './LayoutSection.svelte';
	import MediaSection from './MediaSection.svelte';
	import NavigationSection from './NavigationSection.svelte';
	import NotRendered from './NotRendered.svelte';
	import OverlaysSection from './OverlaysSection.svelte';

	const theme = useTheme();

	let size = $state<Sizes>('normal');
	let density = $state<Density>('normal');

	const scaleItems = [
		{ value: 'small', label: 'Small' },
		{ value: 'normal', label: 'Normal' },
		{ value: 'large', label: 'Large' }
	] as const;

	const densityItems = [
		{ value: 'compact', label: 'Compact' },
		{ value: 'normal', label: 'Normal' },
		{ value: 'comfortable', label: 'Comfortable' }
	] as const;

	const sections = [
		{ id: 'actions', label: 'Actions' },
		{ id: 'inputs', label: 'Inputs' },
		{ id: 'display', label: 'Display' },
		{ id: 'navigation', label: 'Navigation' },
		{ id: 'overlays', label: 'Overlays' },
		{ id: 'data', label: 'Data' },
		{ id: 'layout', label: 'Layout' },
		{ id: 'media', label: 'Media' },
		{ id: 'ai', label: 'AI' },
		{ id: 'not-rendered', label: 'Not rendered' }
	];
</script>

<svelte:head>
	<title>Stress test</title>
</svelte:head>

<div class="gap-xl grid pb-24" data-stress-page>
	<header class="gap-sm grid">
		<h1 class="text-neutral text-3xl font-semibold">Design review stress test</h1>
		<p class="text-neutral/60 max-w-3xl text-sm">
			Every public component rendered side by side with its variants, colors, sizes and states, so
			coherence and uniformity can be judged in one scroll. Each block caption names the component
			and which props vary.
		</p>
	</header>

	<div
		class="gap-sm border-neutral-muted bg-surface/95 py-sm sticky top-0 z-30 -mx-2 grid border-b px-2 backdrop-blur"
		data-stress-toolbar
	>
		<div class="gap-md flex flex-wrap items-center">
			<!-- Button rejects arbitrary data-* attributes, so the e2e hook lives on a wrapper. -->
			<span data-stress-theme-toggle>
				<Button
					variant="outline"
					size="small"
					onclick={() => (theme.theme = theme.resolvedTheme === 'dark' ? 'light' : 'dark')}
				>
					{theme.resolvedTheme === 'dark' ? 'Light' : 'Dark'}
				</Button>
			</span>
			<label class="gap-xs text-neutral/60 flex items-center text-xs">
				Size
				<SegmentedControl size="small" label="Global size" items={scaleItems} bind:value={size} />
			</label>
			<label class="gap-xs text-neutral/60 flex items-center text-xs">
				Density
				<SegmentedControl
					size="small"
					label="Global density"
					items={densityItems}
					bind:value={density}
				/>
			</label>
		</div>
		<nav aria-label="Sections" class="gap-xs flex flex-wrap">
			{#each sections as section (section.id)}
				<a
					href="#{section.id}"
					class="border-neutral-muted text-neutral/70 hover:bg-neutral-muted rounded-md border px-2 py-1 text-xs"
				>
					{section.label}
				</a>
			{/each}
		</nav>
	</div>

	<ActionsSection {size} />
	<InputsSection {size} {density} />
	<DisplaySection {size} {density} />
	<NavigationSection {size} {density} />
	<OverlaysSection {size} {density} />
	<DataSection {size} {density} />
	<LayoutSection />
	<MediaSection {size} />
	<AISection {size} />
	<NotRendered />
</div>
