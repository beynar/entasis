<script lang="ts">
	import { untrack } from 'svelte';
	import type { Attachment } from 'svelte/attachments';
	import Slot from '../Slot/Slot.svelte';
	import Spinner from '../Spinner/Spinner.svelte';
	import { resolveSpinnerVariant } from '../Spinner/resolveSpinnerVariant.js';
	import { useTheme } from '../Theme/theme.state.svelte.js';
	import type { SpinnerTextProps } from './spinnerText.props.js';
	import { useSpinnerTextMotion, useSpinnerTextTheme } from './spinnerText.theme.js';
	import { revealText, verticalText } from './spinnerText.transition.js';
	import { useI18n } from '$lib/i18n/context.svelte.js';

	let {
		ref = $bindable(),
		class: className,
		texts,
		delay = 2200,
		transition: transitionMode = 'vertical',
		shimmer = false,
		showSpinner = true,
		spinnerVariant,
		spinner,
		label,
		size = 'normal',
		color = 'neutral',
		theme,
		...attachments
	}: SpinnerTextProps = $props();
	const t = $derived(useI18n());

	let activeIndex = $state(0);
	const themeState = useTheme();
	const activeText = $derived(texts.length > 0 ? (texts[activeIndex % texts.length] ?? '') : '');
	const activeKey = $derived(`${activeIndex}:${activeText}`);
	const resolvedSpinnerVariant = $derived(
		resolveSpinnerVariant(spinnerVariant, themeState?.spinnerVariant)
	);
	const spinnerPayload = $derived({ color, size, variant: resolvedSpinnerVariant });
	const classes = $derived(useSpinnerTextTheme(theme));
	// Swap timing from `spinnerTextTheme.motion`, keyed by the transition mode, through
	// the override ladder (registry → `setSpinnerTextTheme` → instance `theme.motion`).
	const resolveMotion = useSpinnerTextMotion();
	const textMotion = $derived(resolveMotion({ mode: transitionMode }, { motion: theme?.motion }));
	const verticalTransition = verticalText(() => textMotion.in);
	const revealTransition = revealText(() => textMotion.in);

	const cycleTexts: Attachment<HTMLElement> = (node) =>
		untrack(() => {
			const ownerWindow = node.ownerDocument.defaultView;
			if (!ownerWindow) return;
			let interval: number | null = null;
			const stop = () => {
				if (interval === null) return;
				ownerWindow.clearInterval(interval);
				interval = null;
			};

			$effect(() => {
				const textCount = texts.length;
				const intervalDelay = Number.isFinite(delay) ? delay : 0;
				stop();
				if (textCount <= 1 || intervalDelay <= 0) return;

				interval = ownerWindow.setInterval(() => {
					activeIndex = (activeIndex + 1) % textCount;
				}, intervalDelay);
				return stop;
			});

			return stop;
		});
</script>

<span
	bind:this={ref}
	data-slot="spinner-text"
	data-color={color}
	data-size={size}
	data-spinner-variant={resolvedSpinnerVariant}
	data-transition={transitionMode}
	data-shimmer={shimmer || undefined}
	role="status"
	aria-live="polite"
	aria-atomic="true"
	aria-label={activeText ? undefined : (label ?? t.loading)}
	class={classes.root({ size, color, className })}
	{@attach cycleTexts}
	{...attachments}
>
	{#if showSpinner}
		{#if spinner}
			<Slot
				as="span"
				render={spinner}
				payload={spinnerPayload}
				attrs={{ 'aria-hidden': 'true' }}
				class={classes.spinner({ size })}
			/>
		{:else}
			<Spinner
				decorative
				{size}
				{color}
				variant={resolvedSpinnerVariant}
				class={classes.spinner({ size })}
			/>
		{/if}
	{/if}

	{#if texts.length > 0}
		<span aria-hidden="true" class={classes.viewport({ size })}>
			<span class={classes.sizer()}>
				{#each texts as text, index (`${index}:${text}`)}
					<span class={classes.sizerItem()}>{text}</span>
				{/each}
			</span>

			{#if transitionMode === 'reveal'}
				{#key activeKey}
					<span
						class={classes.message({ shimmer })}
						in:revealTransition={{ role: 'in' }}
						out:revealTransition={{ role: 'out' }}
					>
						{activeText}
					</span>
				{/key}
			{:else}
				{#key activeKey}
					<span
						class={classes.message({ shimmer })}
						in:verticalTransition={{ role: 'in' }}
						out:verticalTransition={{ role: 'out' }}
					>
						{activeText}
					</span>
				{/key}
			{/if}
		</span>
		<span class="sr-only">{activeText}</span>
	{/if}
</span>
