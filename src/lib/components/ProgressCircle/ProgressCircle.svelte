<script lang="ts">
	import type { ProgressCircleProps } from './progressCircle.props.js';
	import { useProgressCircleTheme } from './progressCircle.theme.js';
	import { useDefaultColor } from '../Theme/theme.state.svelte.js';
	import { useI18n } from '$lib/i18n/context.svelte.js';
	import { clampRange, rangeAriaAttributes, resolveRangeValue } from '$lib/utils/range.js';
	import { presence } from '$lib/utils/stateAttributes.js';

	let {
		ref = $bindable(),
		class: className,
		color,
		size = 'normal',
		diameter,
		value = 0,
		min = 0,
		max = 100,
		format,
		getAriaValueText,
		locale: localeProp,
		label,
		decorative = false,
		theme,
		...attachments
	}: ProgressCircleProps = $props();
	const t = $derived(useI18n());

	const classes = $derived(useProgressCircleTheme(theme));
	const resolvedColor = $derived(useDefaultColor(color));
	const pixelDiameter = $derived(
		diameter !== undefined
			? `${Number.isFinite(diameter) ? Math.max(diameter, 1) : 28}px`
			: undefined
	);
	const locale = $derived(localeProp ?? t.locale);

	// `null` (or a non-finite number) is indeterminate. Otherwise the value is clamped into
	// [min, max] and the arc, the ARIA values and the text all follow that one clamped value.
	const rangeOptions = $derived({
		value,
		min,
		max,
		format,
		locale,
		indeterminateText: t.progressIndeterminate,
		getAriaValueText:
			getAriaValueText &&
			((formattedValue: string, rawValue: number | null) =>
				getAriaValueText({
					value: rawValue === null ? null : clampRange(rawValue, min, max),
					formattedValue,
					min,
					max
				}))
	});
	const range = $derived(resolveRangeValue(rangeOptions));
	const aria = $derived(rangeAriaAttributes(rangeOptions));
	const indeterminate = $derived(range.status === 'indeterminate');
	// An indeterminate arc is a quarter turn that spins.
	const indicatorOffset = $derived(100 - (range.percent ?? 25));
</script>

<span
	bind:this={ref}
	data-slot="progress-circle"
	data-color={resolvedColor}
	data-size={size}
	role={decorative ? undefined : 'progressbar'}
	aria-hidden={decorative ? 'true' : undefined}
	aria-label={decorative ? undefined : (label ?? t.progress)}
	aria-valuemin={decorative ? undefined : aria['aria-valuemin']}
	aria-valuemax={decorative ? undefined : aria['aria-valuemax']}
	aria-valuenow={decorative ? undefined : aria['aria-valuenow']}
	aria-valuetext={decorative ? undefined : aria['aria-valuetext']}
	data-indeterminate={presence(indeterminate)}
	data-progressing={presence(range.status === 'progressing')}
	data-complete={presence(range.status === 'complete')}
	class={classes.root({ size, color: resolvedColor, className })}
	style:--progress-circle-size={pixelDiameter}
	{...attachments}
>
	{#if !decorative}
		<!-- NVDA ignores the name of a progressbar with no text content (nvaccess/nvda#13904), so
		     the value text sits inside it. role="presentation" keeps it out of the tree. -->
		<span role="presentation" class="sr-only">{aria['aria-valuetext'] ?? range.formatted}</span>
	{/if}
	<svg
		data-slot="progress-circle-svg"
		viewBox="0 0 32 32"
		aria-hidden="true"
		class={classes.svg({ indeterminate })}
	>
		<circle
			data-slot="progress-circle-track"
			cx="16"
			cy="16"
			r="13"
			fill="none"
			stroke-width="4"
			class={classes.track()}
		/>
		<circle
			data-slot="progress-circle-indicator"
			cx="16"
			cy="16"
			r="13"
			fill="none"
			stroke-width="4"
			stroke-linecap="round"
			pathLength="100"
			stroke-dasharray="100"
			style:stroke-dashoffset={`${indicatorOffset}`}
			class={classes.indicator()}
		/>
	</svg>
</span>
