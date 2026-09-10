<script lang="ts">
	import { starIcon, starIconFill } from '../Icons/star.js';
	import { useI18n } from '$lib/i18n/context.svelte.js';
	import type { RatingProps } from './rating.props.js';
	import { useRatingTheme } from './rating.theme.js';

	let {
		value = 0,
		max = 5,
		color = 'warning',
		size = 'normal',
		dir,
		disabled = false,
		interactive = false,
		class: className,
		star,
		ref = $bindable(null),
		onpointermove,
		onclick,
		i18n,
		theme,
		...attachments
	}: RatingProps = $props();

	const t = $derived(useI18n(i18n));
	const classes = $derived(useRatingTheme(theme));

	const displayValue = $derived(value ?? 0);

	// Fixed star-box size (mirrors the `star` theme part). The clipped fill icon must keep this
	// full width so the overflow-hidden clip reveals a fraction of a full-size star, not a shrunk one.
	const boxSizeClass = $derived.by(() => {
		if (size === 'small') return 'size-5';
		if (size === 'large') return 'size-7';
		return 'size-6';
	});

	// Fraction of star `i` (1-based) that should be filled: 0 empty, 0.5 half, 1 full.
	const fillFraction = (i: number) => Math.min(Math.max(displayValue - (i - 1), 0), 1);
</script>

<!-- Standalone this is a read-only image ("3.5 of 5"); a wrapper like RatingInput overrides the
     role/label/handlers by spreading its own attributes after these defaults. -->
<div
	bind:this={ref}
	{dir}
	role="img"
	aria-label={`${displayValue} ${t.of} ${max}`}
	class={classes.container({ size, disabled, className })}
	{...attachments}
>
	{#each Array.from({ length: max }, (_, index) => index + 1) as starIndex (starIndex)}
		<!-- svelte-ignore a11y_no_static_element_interactions, a11y_click_events_have_key_events -->
		<span
			aria-hidden="true"
			data-star-index={starIndex}
			class={classes.star({ size, interactive })}
			{onpointermove}
			{onclick}
		>
			<span class={classes.starBase()}>
				{#if star}
					{@render star({ index: starIndex, fraction: fillFraction(starIndex), layer: 'base' })}
				{:else}
					{@render starIcon({ class: 'size-full' })}
				{/if}
			</span>
			<span
				class={classes.starFill({ color })}
				style="width: {fillFraction(starIndex) * 100}%; inset-inline-start: 0;"
			>
				<!-- Pinned to the leading edge at full star-box width so the clip reveals a
				     fraction of a full-size star; inset-inline-start flips with RTL for free. -->
				<span class="absolute top-0 {boxSizeClass}" style="inset-inline-start: 0;">
					{#if star}
						{@render star({ index: starIndex, fraction: fillFraction(starIndex), layer: 'fill' })}
					{:else}
						{@render starIconFill({ class: 'size-full' })}
					{/if}
				</span>
			</span>
		</span>
	{/each}
</div>
