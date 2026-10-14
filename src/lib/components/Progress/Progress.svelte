<script lang="ts">
	import Slot from '../Slot/Slot.svelte';
	import type { ProgressProps, ProgressValueState } from './progress.props.js';
	import { useProgressTheme } from './progress.theme.js';
	import { useDefaultColor } from '../Theme/theme.state.svelte.js';
	import { useI18n } from '$lib/i18n/context.svelte.js';
	import { clampRange, rangeAriaAttributes, resolveRangeValue } from '$lib/utils/range.js';
	import { presence } from '$lib/utils/stateAttributes.js';

	let {
		ref = $bindable(),
		class: className,
		color,
		size = 'normal',
		density = 'normal',
		value = 0,
		min = 0,
		max = 100,
		format,
		getAriaValueText,
		locale: localeProp,
		showValue = false,
		label,
		valueLabel,
		theme,
		...attachments
	}: ProgressProps = $props();
	const t = $derived(useI18n());

	const id = $props.id();
	const labelId = `${id}-label`;

	const classes = $derived(useProgressTheme(theme));
	const resolvedColor = $derived(useDefaultColor(color));
	const locale = $derived(localeProp ?? t.locale);

	// `null` (or a non-finite number) is indeterminate. Otherwise the value is clamped into
	// [min, max], and the fill, the ARIA values and the text all follow that one clamped value.
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
	const valueState: ProgressValueState = $derived({
		value: range.value,
		formattedValue: range.formatted,
		percent: range.percent,
		status: range.status
	});
	// Always present as text, so NVDA reads the bar's name (nvaccess/nvda#13904). The visible
	// value text covers it, except while indeterminate when that text is empty.
	const valueText = $derived(aria['aria-valuetext'] ?? range.formatted);
	const hasLabel = $derived(!!label);
	const hasHeader = $derived(hasLabel || showValue);
</script>

<div
	bind:this={ref}
	data-slot="progress"
	data-color={resolvedColor}
	data-size={size}
	data-density={density}
	data-indeterminate={presence(indeterminate)}
	data-progressing={presence(range.status === 'progressing')}
	data-complete={presence(range.status === 'complete')}
	role="progressbar"
	aria-labelledby={hasLabel ? labelId : undefined}
	aria-label={hasLabel ? undefined : t.progress}
	aria-valuemin={aria['aria-valuemin']}
	aria-valuemax={aria['aria-valuemax']}
	aria-valuenow={aria['aria-valuenow']}
	aria-valuetext={aria['aria-valuetext']}
	class={classes.root({ density, className })}
	{...attachments}
>
	{#if hasHeader}
		<div data-slot="progress-header" class={classes.header()}>
			<!-- role="presentation" keeps the label out of NVDA's way (nvaccess/nvda#16204); the
			     bar is still named through aria-labelledby. -->
			{#if hasLabel}
				<Slot
					as="span"
					render={label}
					class={classes.label({ size })}
					attrs={{ id: labelId, role: 'presentation', 'data-slot': 'progress-label' }}
				/>
			{/if}
			{#if showValue}
				<Slot
					as="span"
					render={valueLabel}
					payload={valueState}
					class={classes.value({ size })}
					attrs={{ role: 'presentation', 'data-slot': 'progress-value' }}
				>
					{range.formatted}
				</Slot>
			{/if}
		</div>
	{/if}
	<div data-slot="progress-track" class={classes.track({ size })}>
		<div
			data-slot="progress-indicator"
			data-indeterminate={presence(indeterminate)}
			class={classes.indicator({ color: resolvedColor })}
			style:width={range.percent === null ? undefined : `${range.percent}%`}
		></div>
	</div>
	{#if !showValue || !range.formatted}
		<span role="presentation" class="sr-only">{valueText}</span>
	{/if}
</div>

<style>
	@keyframes progress-indeterminate {
		from {
			inset-inline-start: -40%;
		}
		to {
			inset-inline-start: 100%;
		}
	}

	div[data-slot='progress-indicator'][data-indeterminate] {
		position: absolute;
		inset-block: 0;
		inset-inline-start: -40%;
		width: 40%;
		animation: progress-indeterminate 1.6s ease-in-out infinite;
	}

	/* Without motion the indeterminate fill rests in the middle of the track. */
	@media (prefers-reduced-motion: reduce) {
		div[data-slot='progress-indicator'][data-indeterminate] {
			animation: none;
			inset-inline-start: 30%;
		}
	}

	:global(html[data-entasis-reduce-motion])
		div[data-slot='progress-indicator'][data-indeterminate] {
		animation: none;
		inset-inline-start: 30%;
	}
</style>
