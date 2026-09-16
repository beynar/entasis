<script lang="ts">
	import type { ProgressCircleProps } from './progressCircle.props.js';
	import { useProgressCircleTheme } from './progressCircle.theme.js';
	import { useDefaultColor } from '../Theme/theme.state.svelte.js';
	import { useI18n } from '$lib/i18n/context.svelte.js';

	let {
		ref = $bindable(),
		class: className,
		color,
		size = 'normal',
		diameter,
		value = 0,
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
	const progressValue = $derived(Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0);
	const indicatorOffset = $derived(100 - progressValue);
</script>

<span
	bind:this={ref}
	data-slot="progress-circle"
	data-color={resolvedColor}
	data-size={size}
	role={decorative ? undefined : 'progressbar'}
	aria-hidden={decorative ? 'true' : undefined}
	aria-label={decorative ? undefined : (label ?? t.progress)}
	aria-valuemin={decorative ? undefined : 0}
	aria-valuemax={decorative ? undefined : 100}
	aria-valuenow={decorative ? undefined : progressValue}
	class={classes.root({ size, color: resolvedColor, className })}
	style:--progress-circle-size={pixelDiameter}
	{...attachments}
>
	<svg data-slot="progress-circle-svg" viewBox="0 0 32 32" aria-hidden="true" class={classes.svg()}>
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
