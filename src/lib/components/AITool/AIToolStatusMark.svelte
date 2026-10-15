<script lang="ts">
	import { checkIconBold } from '../Icons/check.js';
	import { handIcon } from '../Icons/hand.js';
	import { prohibitIcon } from '../Icons/prohibit.js';
	import { xIconBold } from '../Icons/x.js';
	import Spinner from '../Spinner/Spinner.svelte';
	import type { AIToolStatus } from './aiTool.props.js';
	import { useAIToolTheme, type AIToolThemeProps } from './aiTool.theme.js';
	import { getAIToolStatusTone, isActiveAIToolStatus } from './toolRendering.js';

	let {
		status,
		label,
		slot = 'ai-tool-call-status-indicator',
		decorative = false,
		theme
	}: {
		status: AIToolStatus;
		/** Accessible status word; omitted from the tree when `decorative`. */
		label: string;
		slot?: string;
		/** Set when a visible status word next to the mark already names the status. */
		decorative?: boolean;
		theme?: AIToolThemeProps;
	} = $props();

	const classes = $derived(useAIToolTheme(theme));
	const tone = $derived(getAIToolStatusTone(status));
</script>

<span
	data-slot={slot}
	data-tone={tone}
	role={decorative ? undefined : 'img'}
	aria-label={decorative ? undefined : label}
	aria-hidden={decorative ? 'true' : undefined}
	class={classes.indicator({ tone })}
>
	{#if isActiveAIToolStatus(status)}
		<Spinner size="small" color="info" decorative class="motion-reduce:[&_*]:animate-none" />
	{:else if tone === 'success'}
		{@render checkIconBold({ size: 14, 'aria-hidden': 'true' })}
	{:else if tone === 'error'}
		{@render xIconBold({ size: 14, 'aria-hidden': 'true' })}
	{:else if tone === 'awaiting'}
		{@render handIcon({ size: 14, 'aria-hidden': 'true' })}
	{:else if tone === 'denied' || tone === 'cancelled'}
		{@render prohibitIcon({ size: 14, 'aria-hidden': 'true' })}
	{:else}
		<span class={classes.indicatorDot()}></span>
	{/if}
</span>
