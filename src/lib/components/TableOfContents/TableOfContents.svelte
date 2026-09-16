<script lang="ts">
	import type { Sizes } from '$lib/types/theme.js';
	import ScrollArea from '../ScrollArea/ScrollArea.svelte';
	import BeforeHydratation from '../Utils/BeforeHydratation.svelte';
	import { normalizeTableOfContentsItems } from './tableOfContents.items.js';
	import { createTableOfContentsPrehydrationScript } from './tableOfContents.prehydration.js';
	import type {
		TableOfContentsDensity,
		TableOfContentsLevel,
		TableOfContentsMarkerVisibility,
		TableOfContentsProps
	} from './tableOfContents.props.js';
	import {
		getTableOfContentsConnectorEnd,
		getTableOfContentsItemOffset,
		getTableOfContentsLineX,
		getTableOfContentsMarkerRadius,
		normalizeTableOfContentsLevels,
		type TableOfContentsRailGutter
	} from './tableOfContents.rail.js';
	import { TableOfContentsState } from './tableOfContents.state.svelte.js';
	import { useTableOfContentsTheme } from './tableOfContents.theme.js';
	import { useDefaultColor } from '../Theme/theme.state.svelte.js';
	import { useI18n } from '$lib/i18n/context.svelte.js';

	const densityFactors = {
		compact: 0.6,
		normal: 0.8,
		comfortable: 1
	} as const;
	const sizeFactors = {
		small: 0.875,
		normal: 1,
		large: 1.125
	} as const satisfies Record<Sizes, number>;

	function resolveDensityFactor(density: TableOfContentsDensity) {
		if (typeof density !== 'number') return densityFactors[density];
		if (!Number.isFinite(density)) return densityFactors.normal;

		return Math.max(0, density);
	}

	function resolveRailGutter(
		showRail: boolean,
		hasMarkers: boolean,
		showConnectors: boolean
	): TableOfContentsRailGutter {
		if (showConnectors) return 'connector';
		if (hasMarkers) return 'marker';
		if (showRail) return 'rail';
		return 'none';
	}

	function resolveMarkerVisibility(
		showMarkers: TableOfContentsMarkerVisibility
	): 'none' | 'active' | 'always' {
		if (showMarkers === false) return 'none';
		if (showMarkers === 'always') return 'always';
		return 'active';
	}

	let {
		ref = $bindable(),
		target,
		items,
		levels = [2, 3, 4],
		activationThresholds,
		scrollOffset,
		density = 'normal',
		size = 'normal',
		showRail = true,
		showMarkers = true,
		showConnectors = true,
		indentSize = 14,
		indentRadius = 6,
		color,
		label,
		class: className,
		theme,
		...attachments
	}: TableOfContentsProps = $props();
	const t = $derived(useI18n());

	const componentId = $props.id();
	const clipId = `${componentId}-active-rail`;
	const prehydrationListId = `${componentId}-prehydration-list`;
	const prehydrationRailId = `${componentId}-prehydration-rail`;
	const classes = $derived(useTableOfContentsTheme(theme));
	const resolvedColor = $derived(useDefaultColor(color));
	const densityFactor = $derived(resolveDensityFactor(density));
	const sizeFactor = $derived(sizeFactors[size]);
	const markerVisibility = $derived(resolveMarkerVisibility(showMarkers));
	const railGutter = $derived(
		resolveRailGutter(showRail, markerVisibility !== 'none', showConnectors)
	);
	const hasRailDecoration = $derived(railGutter !== 'none');
	const normalizedLevels = $derived(normalizeTableOfContentsLevels(levels));
	const providedItems = $derived(normalizeTableOfContentsItems(items, normalizedLevels));
	const selectorTarget = $derived(
		typeof target === 'string' && target.trim().length > 0 ? target : null
	);
	const hasSelectorFallback = $derived(
		providedItems === null && Boolean(selectorTarget && normalizedLevels.length)
	);
	const hasPrehydrationSource = $derived(hasSelectorFallback || Boolean(providedItems?.length));
	const prehydrationScript = $derived.by(() => {
		if (!normalizedLevels.length) return null;
		if (providedItems === null && !selectorTarget) return null;
		if (providedItems !== null && !providedItems.length) return null;

		const offsets: Partial<Record<TableOfContentsLevel, number>> = {};
		const markerRadii: Partial<Record<TableOfContentsLevel, number>> = {};
		const linePositions: Partial<
			Record<TableOfContentsLevel, { x: number; connectorEnd: number }>
		> = {};
		for (const level of normalizedLevels) {
			offsets[level] = getTableOfContentsItemOffset(
				level,
				normalizedLevels,
				indentSize,
				sizeFactor,
				railGutter
			);
			const x = getTableOfContentsLineX(level, normalizedLevels, indentSize, sizeFactor);
			markerRadii[level] = getTableOfContentsMarkerRadius(level, sizeFactor);
			linePositions[level] = {
				x,
				connectorEnd: getTableOfContentsConnectorEnd(x, sizeFactor)
			};
		}

		return createTableOfContentsPrehydrationScript({
			listId: prehydrationListId,
			railId: prehydrationRailId,
			targetSelector: providedItems === null ? (selectorTarget ?? undefined) : undefined,
			headingSelector:
				providedItems === null ? normalizedLevels.map((level) => `h${level}`).join(',') : undefined,
			items: providedItems ?? undefined,
			offsets,
			linePositions,
			markerRadii,
			indentRadius,
			sizeScale: sizeFactor,
			showRail,
			showConnectors,
			markerVisibility,
			itemClass: classes.item(),
			linkClass: classes.link({ size, highlighted: false }),
			trackClass: classes.track(),
			markerClass: classes.marker({ highlighted: false })
		});
	});
	const scrollAreaTheme = $derived({
		viewport: { base: classes.scrollAreaViewport() }
	});
	const state = new TableOfContentsState({
		get target() {
			return target;
		},
		get providedItems() {
			return items;
		},
		get levels() {
			return levels;
		},
		get activationThresholds() {
			return activationThresholds;
		},
		get scrollOffset() {
			return scrollOffset;
		},
		get indentSize() {
			return indentSize;
		},
		get indentRadius() {
			return indentRadius;
		},
		get sizeScale() {
			return sizeFactor;
		}
	});
	const displayedItems = $derived(providedItems ?? state.items);
</script>

{#if prehydrationScript}
	<BeforeHydratation immediate once scripts={[prehydrationScript]} />
{/if}

{#if hasSelectorFallback || displayedItems.length}
	<nav
		bind:this={ref}
		aria-label={label ?? t.tableOfContents}
		data-slot="table-of-contents"
		data-color={resolvedColor}
		data-density={density}
		data-size={size}
		data-rail={showRail}
		class={classes.root({ className })}
		{@attach state.rootAttachment}
		{...attachments}
	>
		<ScrollArea theme={scrollAreaTheme}>
			<div
				data-slot="table-of-contents-content"
				class={classes.content()}
				style:--table-of-contents-list-gap={`${densityFactor * 0.25}rem`}
				style:--table-of-contents-link-padding={`${densityFactor * 0.5}rem`}
			>
				{#if hasRailDecoration}
					{#if state.geometry}
						<svg
							aria-hidden="true"
							data-slot="table-of-contents-rail"
							class={classes.rail()}
							width={state.geometry.width}
							height={state.geometry.height}
							viewBox={`0 0 ${state.geometry.width} ${state.geometry.height}`}
						>
							{#if showRail}
								<path
									d={state.geometry.path}
									fill="none"
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width={sizeFactor}
									vector-effect="non-scaling-stroke"
									class={classes.track()}
								/>
							{/if}

							{#if showConnectors}
								{#each state.geometry.positions as position (`${position.id}-track`)}
									<line
										x1={position.connectorStart}
										x2={position.connectorEnd}
										y1={position.center}
										y2={position.center}
										stroke-linecap="round"
										stroke-width={sizeFactor}
										vector-effect="non-scaling-stroke"
										class={classes.track()}
									/>
								{/each}
							{/if}

							{#if state.activeRange && showRail}
								<defs>
									<clipPath id={clipId}>
										<rect
											x="0"
											y={state.activeRange.top}
											width={state.geometry.width}
											height={Math.max(1, state.activeRange.bottom - state.activeRange.top)}
										/>
									</clipPath>
								</defs>
								<path
									d={state.geometry.path}
									fill="none"
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width={1.5 * sizeFactor}
									vector-effect="non-scaling-stroke"
									clip-path={`url(#${clipId})`}
									class={classes.active()}
								/>
							{/if}

							{#each state.geometry.positions as position (`${position.id}-active`)}
								{@const highlighted = state.highlightedIds.has(position.id)}
								{#if highlighted && showConnectors}
									<line
										x1={position.connectorStart}
										x2={position.connectorEnd}
										y1={position.center}
										y2={position.center}
										stroke-linecap="round"
										stroke-width={1.5 * sizeFactor}
										vector-effect="non-scaling-stroke"
										class={classes.active()}
									/>
								{/if}
								{#if markerVisibility === 'always' || (markerVisibility === 'active' && highlighted)}
									<circle
										data-level={position.level}
										cx={position.x}
										cy={position.center}
										r={getTableOfContentsMarkerRadius(position.level, sizeFactor)}
										stroke-width={1.5 * sizeFactor}
										vector-effect="non-scaling-stroke"
										class={classes.marker({ highlighted })}
									/>
								{/if}
							{/each}
						</svg>
					{:else if hasPrehydrationSource}
						<svg
							id={prehydrationRailId}
							aria-hidden="true"
							data-slot="table-of-contents-rail"
							data-toc-prehydration
							class={classes.rail()}
						></svg>
					{/if}
				{/if}

				{#if displayedItems.length}
					<ol
						id={prehydrationListId}
						data-slot="table-of-contents-list"
						class={classes.list()}
						{@attach state.listAttachment}
					>
						{#each displayedItems as item (item.id)}
							{@const highlighted = state.highlightedIds.has(item.id)}
							<li data-slot="table-of-contents-item" class={classes.item()}>
								<a
									data-slot="table-of-contents-link"
									data-toc-id={item.id}
									data-level={item.level}
									href={`#${encodeURIComponent(item.id)}`}
									aria-current={state.currentId === item.id ? 'location' : undefined}
									class={classes.link({ size, highlighted })}
									style:padding-inline-start={`${getTableOfContentsItemOffset(item.level, normalizedLevels, indentSize, sizeFactor, railGutter)}px`}
								>
									{item.title}
								</a>
							</li>
						{/each}
					</ol>
				{:else if hasSelectorFallback}
					<ol
						id={prehydrationListId}
						data-slot="table-of-contents-list"
						data-toc-prehydration
						class={classes.list()}
					></ol>
				{/if}
			</div>
		</ScrollArea>
	</nav>
{/if}
