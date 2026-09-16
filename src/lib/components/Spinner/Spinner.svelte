<script lang="ts">
	import Slot from '../Slot/Slot.svelte';
	import { useTheme } from '../Theme/theme.state.svelte.js';
	import { resolveSpinnerVariant } from './resolveSpinnerVariant.js';
	import SpinnerIndicator from './SpinnerIndicator.svelte';
	import type { SpinnerProps } from './spinner.props.js';
	import { useSpinnerTheme } from './spinner.theme.js';
	import { useI18n } from '$lib/i18n/context.svelte.js';

	let {
		ref = $bindable(),
		class: className,
		color = 'neutral',
		size = 'normal',
		variant,
		text,
		label,
		decorative = false,
		children,
		theme,
		...attachments
	}: SpinnerProps = $props();
	const t = $derived(useI18n());

	const themeState = useTheme();
	const resolvedVariant = $derived(resolveSpinnerVariant(variant, themeState?.spinnerVariant));
	const classes = $derived(useSpinnerTheme(theme));
	const hasText = $derived(typeof text === 'string' ? text.length > 0 : text != null);
	const hasVisibleLabel = $derived(hasText || children != null);
	const resolvedLabel = $derived(decorative || hasVisibleLabel ? undefined : (label ?? t.loading));
</script>

<span
	bind:this={ref}
	data-slot="spinner"
	data-color={color}
	data-size={size}
	data-variant={resolvedVariant}
	role={decorative ? undefined : 'status'}
	aria-hidden={decorative ? 'true' : undefined}
	aria-label={resolvedLabel}
	aria-live={decorative ? undefined : 'polite'}
	class={classes.root({ size, color, className })}
	{...attachments}
>
	<SpinnerIndicator
		variant={resolvedVariant}
		class={classes.indicator({ size, variant: resolvedVariant })}
	/>
	{#if hasVisibleLabel}
		<Slot as="span" render={children ?? text} class={classes.label({ size })} />
	{/if}
</span>
