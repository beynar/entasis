<script lang="ts">
	import Card from '$lib/components/Card/Card.svelte';
	import ScrollArea from '$lib/components/ScrollArea/ScrollArea.svelte';
	import TableOfContents from '$lib/components/TableOfContents/TableOfContents.svelte';
	import type {
		TableOfContentsActivationThresholds,
		TableOfContentsDensity,
		TableOfContentsItem,
		TableOfContentsLevel,
		TableOfContentsMarkerVisibility
	} from '$lib/components/TableOfContents/tableOfContents.props.js';
	import type { Colors, Sizes } from '$lib/types/theme.js';

	let {
		source = 'target',
		activationThresholds,
		scrollOffset,
		color = 'primary',
		levels = [2, 3, 4],
		density = 'normal',
		size = 'normal',
		showRail = true,
		showMarkers = true,
		showConnectors = true,
		indentSize = 14,
		indentRadius = 6
	}: {
		source?: 'target' | 'items';
		activationThresholds?: TableOfContentsActivationThresholds;
		scrollOffset?: number;
		color?: Colors;
		levels?: readonly TableOfContentsLevel[];
		density?: TableOfContentsDensity;
		size?: Sizes;
		showRail?: boolean;
		showMarkers?: TableOfContentsMarkerVisibility;
		showConnectors?: boolean;
		indentSize?: number;
		indentRadius?: number;
	} = $props();

	const componentId = $props.id();
	const articleId = `table-of-contents-demo-article-${componentId}`;
	const target = `#${articleId}`;
	const headingIds = {
		foundations: `${articleId}-foundations`,
		palette: `${articleId}-palette`,
		roles: `${articleId}-roles`,
		spacing: `${articleId}-spacing`,
		composition: `${articleId}-composition`,
		configuration: `${articleId}-configuration`,
		regions: `${articleId}-regions`,
		accessibility: `${articleId}-accessibility`,
		releases: `${articleId}-releases`,
		regression: `${articleId}-regression`
	} as const;
	const items: TableOfContentsItem[] = [
		{ id: headingIds.foundations, level: 2, title: 'System foundations' },
		{ id: headingIds.palette, level: 3, title: 'A semantic palette' },
		{ id: headingIds.roles, level: 4, title: 'Readable roles' },
		{ id: headingIds.spacing, level: 3, title: 'Spacing as rhythm' },
		{ id: headingIds.composition, level: 2, title: 'Component composition' },
		{ id: headingIds.configuration, level: 3, title: 'Configuration over markup' },
		{ id: headingIds.regions, level: 4, title: 'Named content regions' },
		{ id: headingIds.accessibility, level: 3, title: 'Accessible defaults' },
		{ id: headingIds.releases, level: 2, title: 'Release discipline' },
		{ id: headingIds.regression, level: 3, title: 'Visual regression review' }
	];
</script>

<section
	data-toc-demo
	class="grid w-full min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-start"
>
	<div class="order-2 min-w-0 lg:order-1">
		<ScrollArea
			type="scroll"
			scrollFade
			class="border-neutral-muted bg-surface h-[34rem] rounded-lg border"
		>
			<article id={articleId} class="mx-auto max-w-2xl px-6 py-8 lg:px-10 lg:py-12">
				<p class="text-primary-readable mb-3 text-xs font-semibold tracking-[0.12em] uppercase">
					Design system field guide
				</p>
				<h2 id={headingIds.foundations} class="text-neutral mb-4 text-2xl font-semibold">
					System foundations
				</h2>
				<p class="text-neutral/70 mb-12 text-sm/7">
					A durable interface starts with a small vocabulary of semantic decisions. Components then
					inherit contrast, rhythm, and interaction behavior instead of rebuilding them in
					isolation.
				</p>

				<h3 id={headingIds.palette} class="text-neutral mb-3 text-xl font-semibold">
					A semantic palette
				</h3>
				<p class="text-neutral/70 mb-10 text-sm/7">
					Color names should describe intent rather than a fixed swatch. That keeps foregrounds,
					states, and surfaces coherent when the theme changes.
				</p>

				<h4 id={headingIds.roles} class="text-neutral mb-3 text-base font-semibold">
					Readable roles
				</h4>
				<p class="text-neutral/70 mb-12 text-sm/7">
					Each semantic color needs a readable companion for text and icons. Muted treatments must
					preserve the same contract instead of relying on opacity alone.
				</p>

				<h3 id={headingIds.spacing} class="text-neutral mb-3 text-xl font-semibold">
					Spacing as rhythm
				</h3>
				<p class="text-neutral/70 mb-14 text-sm/7">
					Consistent spacing makes dense screens easier to scan. A short scale also prevents small
					differences from becoming accidental hierarchy.
				</p>

				<h2 id={headingIds.composition} class="text-neutral mb-4 text-2xl font-semibold">
					Component composition
				</h2>
				<p class="text-neutral/70 mb-12 text-sm/7">
					A component should own behavior and semantics while leaving composition open. The useful
					API is the one that makes the common case short without trapping the uncommon case.
				</p>

				<h3 id={headingIds.configuration} class="text-neutral mb-3 text-xl font-semibold">
					Configuration over markup
				</h3>
				<p class="text-neutral/70 mb-10 text-sm/7">
					Data props express repeated structures clearly. Named snippets remain available for the
					parts whose content genuinely needs custom markup.
				</p>

				<h4 id={headingIds.regions} class="text-neutral mb-3 text-base font-semibold">
					Named content regions
				</h4>
				<p class="text-neutral/70 mb-12 text-sm/7">
					Titles, descriptions, prefixes, and actions are stable regions. Naming them keeps the DOM
					predictable while still allowing richer rendering.
				</p>

				<h3 id={headingIds.accessibility} class="text-neutral mb-3 text-xl font-semibold">
					Accessible defaults
				</h3>
				<p class="text-neutral/70 mb-14 text-sm/7">
					Native elements carry useful behavior before JavaScript runs. Focus order, labels, and
					keyboard interaction should be part of the component contract.
				</p>

				<h2 id={headingIds.releases} class="text-neutral mb-4 text-2xl font-semibold">
					Release discipline
				</h2>
				<p class="text-neutral/70 mb-12 text-sm/7">
					A design system changes many products at once. Small releases, focused diagnostics, and
					visual review keep that leverage from turning into surprise.
				</p>

				<h3 id={headingIds.regression} class="text-neutral mb-3 text-xl font-semibold">
					Visual regression review
				</h3>
				<p class="text-neutral/70 pb-16 text-sm/7">
					Inspect real content at several widths. Wrapped labels, focus rings, and scroll-boundary
					states reveal failures that isolated snapshots often miss.
				</p>
			</article>
		</ScrollArea>
	</div>

	<aside data-toc-demo-nav class="order-1 min-w-0 lg:order-2">
		<Card
			title="On this page"
			description="Tracks every visible section"
			variant="outline"
			size="small"
		>
			<TableOfContents
				target={source === 'target' ? target : undefined}
				items={source === 'items' ? items : undefined}
				{activationThresholds}
				{scrollOffset}
				{levels}
				{color}
				{density}
				{size}
				{showRail}
				{showMarkers}
				{showConnectors}
				{indentSize}
				{indentRadius}
			/>
		</Card>
	</aside>
</section>
