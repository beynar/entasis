<script lang="ts">
	// A small chart with no axes, read at a glance beside a figure. The series is drawn in a
	// 100 × 100 box that the SVG stretches to whatever size the root is given; strokes and dots
	// keep their weight in pixels, so a class can widen it to a card's width without thickening
	// the line. Adapted from react-tiny-sparkline by Franz Benthin (MIT).
	import { getContext, untrack } from 'svelte';
	import { Tween } from 'svelte/motion';
	import { useI18n } from '$lib/i18n/context.svelte.js';
	import { defaultMotionTokens } from '$lib/tailwind/scales.js';
	import { easingBezierStrings, easingFunctions } from '$lib/transitions/easingFunctions.js';
	import { prefersReducedMotion } from '$lib/utils/motion.svelte.js';
	import { getNumberFormatter } from '$lib/utils/number.js';
	import { presence } from '$lib/utils/stateAttributes.js';
	import type { ThemeState } from '../Theme/theme.state.svelte.js';
	import { arrowDownRightIcon } from '../Icons/arrowDownRight.js';
	import { arrowRightIcon } from '../Icons/arrowRight.js';
	import { arrowUpRightIcon } from '../Icons/arrowUpRight.js';
	import {
		SPARKLINE_BOX,
		sparklineAreaPath,
		sparklineBars,
		sparklineBaseline,
		sparklineDomain,
		sparklineDotPath,
		sparklineExtremes,
		sparklineLinePath,
		sparklineMarkerIndex,
		sparklineNearestIndex,
		sparklineTrend,
		sparklineTrendPlacement,
		sparklineXs,
		sparklineYs
	} from './sparkline.geometry.js';
	import type { SparklinePoint, SparklineProps } from './sparkline.props.js';
	import { useSparklineTheme } from './sparkline.theme.js';

	let {
		data,
		labels,
		variant = 'line',
		size = 'normal',
		color,
		curved = false,
		strokeWidth,
		min,
		max,
		markers = [],
		showTrend = false,
		tooltip = false,
		tooltipContent,
		format,
		locale,
		barGap = 0.2,
		animated = true,
		animation = 'draw',
		duration,
		easing = 'enter',
		label,
		ref = $bindable(null),
		class: className,
		theme,
		...rest
	}: SparklineProps = $props();

	const id = $props.id();
	const themeState = getContext('entasisTheme') as ThemeState | undefined;
	const classes = $derived(useSparklineTheme(theme));
	const messages = $derived(useI18n());
	const formatter = $derived(getNumberFormatter(locale ?? messages.locale, format));

	const stroke = $derived(strokeWidth ?? (size === 'small' ? 1.5 : size === 'large' ? 2.5 : 2));
	// A dot is a stroke of no length with round ends: it stays round however the box stretches.
	const dotSize = $derived(stroke * 2 + 2);
	const markerSize = $derived(stroke * 2 + 3);
	const hasTooltip = $derived(tooltip !== false);
	// Unless it names its own, the tooltip takes the series' color.
	const tooltipColor = $derived(typeof tooltip === 'string' ? tooltip : (color ?? 'inherit'));
	// Half the series' own stroke, or dot: the series is drawn that far inside the root, so it
	// never spills out. Markers, and the dot under the pointer, may reach a little past it: they
	// come and go, and the series keeps its size when they do.
	const inset = $derived(Math.max(stroke, variant === 'dot' ? dotSize : 0) / 2);
	// The lowest and the highest value are drawn last: in their colors, over a first or a last
	// marker on the same point.
	const markerOrder = ['first', 'last', 'min', 'max'] as const;

	const domain = $derived(sparklineDomain(data, variant, min, max));
	// Where zero sits, then where each value sits: one array, so a change moves them together.
	const target = $derived([sparklineBaseline(domain), ...sparklineYs(data, domain)]);
	// Durations and easings are Theme tokens, or plain milliseconds and easing names.
	const tokens = $derived(themeState?.motion ?? defaultMotionTokens);
	const easingName = $derived(
		easing in tokens.easing ? tokens.easing[easing as keyof typeof tokens.easing] : easing
	);
	const timing = (fallback: keyof typeof tokens.duration) =>
		typeof duration === 'number' ? Math.max(0, duration) : tokens.duration[duration ?? fallback];
	const appear = $derived(animated && animation !== 'none');
	// The appearance is a CSS animation. A cubic Bézier cannot bounce or spring, so an elastic or
	// a bouncing easing is traced point by point with `linear()` instead.
	const cssEasing = $derived.by(() => {
		const name = easingName as keyof typeof easingFunctions;
		if (!/^(elastic|bounce)/.test(name)) return easingBezierStrings[name];
		const curve = easingFunctions[name];
		const stops = Array.from(
			{ length: 41 },
			(_, step) => Math.round(curve(step / 40) * 1000) / 1000
		);
		return `linear(${stops.join(', ')})`;
	});

	const shape = new Tween(untrack(() => target));
	$effect(() => {
		const next = target;
		untrack(() => {
			// Only a series of the same length can move from one to the next, value by value.
			const moves = animated && shape.target.length === next.length && !prefersReducedMotion();
			void shape.set(next, {
				duration: moves ? timing('slow') : 0,
				easing: easingFunctions[easingName as keyof typeof easingFunctions]
			});
		});
	});

	const baseline = $derived(shape.current[0]);
	const ys = $derived(
		shape.current.length === data.length + 1 ? shape.current.slice(1) : target.slice(1)
	);
	const xs = $derived(sparklineXs(data.length, variant));
	const trend = $derived(sparklineTrend(data));
	const trendIcon = $derived(
		trend === 'up' ? arrowUpRightIcon : trend === 'down' ? arrowDownRightIcon : arrowRightIcon
	);

	// The arrow sits on the last value, clear of the line and of a marker on it; further from the
	// line when it has to sit on the side the line comes from.
	const trendAnchor = $derived.by(() => {
		const place = sparklineTrendPlacement(ys, variant, baseline);
		if (!place) return null;
		const clearance = Math.max(stroke / 2, markers.length > 0 ? markerSize / 2 : 0) + 2;
		return {
			...place,
			share: xs[data.length - 1] / SPARKLINE_BOX,
			gap: clearance + (place.crowded ? 4 : 0)
		};
	});

	const name = $derived.by(() => {
		const { min: lowest, max: highest } = sparklineExtremes(data);
		const summary =
			lowest === -1
				? messages.sparklineEmpty
				: messages.sparklineSummary(
						data.length,
						formatter.format(data[0]),
						formatter.format(data[data.length - 1]),
						formatter.format(data[lowest]),
						formatter.format(data[highest]),
						trend
					);
		return label ? `${label}, ${summary}` : summary;
	});

	let svg = $state<SVGSVGElement | null>(null);
	// The plot's size, to carry the area's fill (and bars standing on an edge) through the inset to
	// the edges of the root: the line stops short of them by half its stroke, a fill should not.
	let plotWidth = $state(0);
	let plotHeight = $state(0);
	const reachUnits = (side: number) =>
		side > inset * 2 ? (inset * SPARKLINE_BOX) / (side - inset * 2) : 0;
	const reach = $derived({ x: reachUnits(plotWidth), y: reachUnits(plotHeight) });
	let active = $state<number | null>(null);
	const point = $derived.by((): SparklinePoint | null => {
		if (active === null || active >= data.length) return null;
		return {
			value: data[active],
			index: active,
			label: labels?.[active],
			text: formatter.format(data[active])
		};
	});

	const follow = (event: PointerEvent) => {
		if (!hasTooltip || !svg || data.length === 0) return;
		const box = svg.getBoundingClientRect();
		if (box.width <= 0) return;
		active = sparklineNearestIndex((event.clientX - box.left) / box.width, data.length, variant);
	};
	const leave = () => {
		active = null;
	};
</script>

{#snippet dots(
	points: readonly number[],
	width: number,
	kind: 'dot' | 'cursor' | 'marker',
	marker?: string
)}
	<path
		data-slot={kind === 'dot'
			? 'sparkline-dot'
			: kind === 'cursor'
				? 'sparkline-cursor-dot'
				: 'sparkline-marker'}
		data-marker={marker}
		d={sparklineDotPath(xs, ys, points)}
		stroke-width={width}
		stroke-linecap="round"
		vector-effect="non-scaling-stroke"
		class={kind === 'dot'
			? classes.dot()
			: kind === 'cursor'
				? classes.cursorDot()
				: classes.marker({ marker: marker as 'min' | 'max' | 'first' | 'last' })}
	/>
{/snippet}

<span
	bind:this={ref}
	data-slot="sparkline"
	data-variant={variant}
	data-size={size}
	data-color={color}
	data-trend={showTrend ? trend : undefined}
	role="img"
	aria-label={name}
	class={classes.root({ size, color, className })}
	{...rest}
>
	<span
		data-slot="sparkline-plot"
		role="presentation"
		bind:clientWidth={plotWidth}
		bind:clientHeight={plotHeight}
		class={classes.plot()}
		onpointermove={hasTooltip ? follow : undefined}
		onpointerdown={hasTooltip ? follow : undefined}
		onpointerleave={hasTooltip ? leave : undefined}
	>
		<svg
			bind:this={svg}
			data-slot="sparkline-svg"
			data-animation={appear ? animation : undefined}
			aria-hidden="true"
			focusable="false"
			viewBox="0 0 {SPARKLINE_BOX} {SPARKLINE_BOX}"
			preserveAspectRatio="none"
			class={classes.svg()}
			style:inset="{inset}px"
			style:width="calc(100% - {inset * 2}px)"
			style:height="calc(100% - {inset * 2}px)"
			style:--_sparkline-duration={appear ? `${timing('slower')}ms` : undefined}
			style:--_sparkline-easing={appear ? cssEasing : undefined}
			style:--_sparkline-origin={appear && animation === 'grow'
				? `${variant === 'bar' ? target[0] : SPARKLINE_BOX}%`
				: undefined}
		>
			{#if data.length > 0}
				{#if variant === 'area'}
					<defs>
						<linearGradient id="{id}-fill" x1="0" y1="0" x2="0" y2="1">
							<stop offset="0" stop-color="currentColor" stop-opacity="0.3" />
							<stop offset="1" stop-color="currentColor" stop-opacity="0.05" />
						</linearGradient>
					</defs>
					<path
						data-slot="sparkline-area"
						d={sparklineAreaPath(xs, ys, curved, reach)}
						fill="url(#{id}-fill)"
						class={classes.area()}
					/>
				{/if}
				{#if variant === 'line' || variant === 'area'}
					<path
						data-slot="sparkline-line"
						d={sparklineLinePath(xs, ys, curved)}
						stroke-width={stroke}
						stroke-linecap="round"
						stroke-linejoin="round"
						vector-effect="non-scaling-stroke"
						class={classes.line()}
					/>
				{:else if variant === 'bar'}
					{#each sparklineBars(ys, baseline, barGap, reach.y) as bar, index (index)}
						<rect
							data-slot="sparkline-bar"
							data-dimmed={presence(active !== null && active !== index)}
							x={bar.x}
							y={bar.y}
							width={bar.width}
							height={bar.height}
							class={classes.bar()}
						/>
					{/each}
				{:else if variant === 'dot'}
					{@render dots(
						data.map((_, index) => index),
						dotSize,
						'dot'
					)}
				{/if}
				{#each markerOrder.filter((marker) => markers.includes(marker)) as marker (marker)}
					{@const index = sparklineMarkerIndex(data, marker)}
					{#if index !== -1}
						{@render dots([index], markerSize, 'marker', marker)}
					{/if}
				{/each}
				{#if point && variant !== 'bar'}
					<path
						data-slot="sparkline-cursor"
						d="M{xs[point.index]},0 V{SPARKLINE_BOX}"
						stroke-width="1"
						vector-effect="non-scaling-stroke"
						class={classes.cursor()}
					/>
					{@render dots([point.index], markerSize, 'cursor')}
				{/if}
			{/if}
		</svg>
		{#if showTrend && trendAnchor}
			<span
				data-slot="sparkline-trend"
				data-trend={trend}
				data-placement={trendAnchor.placement}
				aria-hidden="true"
				class={classes.trend({ size, trend })}
				style:left="calc({inset}px + {trendAnchor.share} * (100% - {inset * 2}px))"
				style:top={trendAnchor.placement === 'below'
					? `calc(${inset}px + ${trendAnchor.y / SPARKLINE_BOX} * (100% - ${inset * 2}px) + ${trendAnchor.gap}px)`
					: undefined}
				style:bottom={trendAnchor.placement === 'above'
					? `calc(${inset}px + ${1 - trendAnchor.y / SPARKLINE_BOX} * (100% - ${inset * 2}px) + ${trendAnchor.gap}px)`
					: undefined}
				style:translate="{-trendAnchor.share * 100}% 0"
			>
				{@render trendIcon()}
			</span>
		{/if}
		{#if point}
			{@const share = xs[point.index] / SPARKLINE_BOX}
			<span
				data-slot="sparkline-tooltip"
				data-color={tooltipColor}
				aria-hidden="true"
				class={classes.tooltip({ size, color: tooltipColor })}
				style:left="calc({inset}px + {share} * (100% - {inset * 2}px))"
				style:translate="{-share * 100}% 0"
			>
				<span
					data-slot="sparkline-tooltip-text"
					class={classes.tooltipText({ color: tooltipColor })}
				>
					{#if tooltipContent}
						{@render tooltipContent(point)}
					{:else}
						{#if point.label}
							<span data-slot="sparkline-tooltip-label" class={classes.tooltipLabel()}
								>{point.label}</span
							>
						{/if}
						{point.text}
					{/if}
				</span>
			</span>
		{/if}
	</span>
</span>

<style>
	/* How the series appears: drawn in from the left, grown from the bottom, or faded in. */
	:global([data-slot='sparkline-svg'][data-animation]) {
		animation-duration: var(--_sparkline-duration, 500ms);
		animation-timing-function: var(--_sparkline-easing, ease-out);
		animation-fill-mode: backwards;
	}
	:global([data-slot='sparkline-svg'][data-animation='draw']) {
		animation-name: entasis-sparkline-draw;
	}
	:global([data-slot='sparkline-svg'][data-animation='grow']) {
		animation-name: entasis-sparkline-grow;
		transform-origin: 50% var(--_sparkline-origin, 100%);
	}
	:global([data-slot='sparkline-svg'][data-animation='fade']) {
		animation-name: entasis-sparkline-fade;
	}
	@keyframes -global-entasis-sparkline-draw {
		from {
			clip-path: inset(-50% 100% -50% -50%);
		}
		to {
			clip-path: inset(-50% -50% -50% -50%);
		}
	}
	@keyframes -global-entasis-sparkline-grow {
		from {
			transform: scaleY(0);
		}
	}
	@keyframes -global-entasis-sparkline-fade {
		from {
			opacity: 0;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		:global([data-slot='sparkline-svg'][data-animation]) {
			animation: none;
		}
	}
	:global(html[data-entasis-reduce-motion] [data-slot='sparkline-svg'][data-animation]) {
		animation: none;
	}
</style>
