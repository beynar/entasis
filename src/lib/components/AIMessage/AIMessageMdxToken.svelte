<script lang="ts">
	import type { Snippet } from 'svelte';
	import { atIcon } from '../Icons/at.js';
	import { fileTextIcon } from '../Icons/fileText.js';
	import { linkSimpleIcon } from '../Icons/linkSimple.js';
	import { sparkleIcon } from '../Icons/sparkle.js';
	import { wrenchIcon } from '../Icons/wrench.js';
	import Slot from '../Slot/Slot.svelte';
	let {
		token,
		children,
		props = {}
	}: {
		token?: { tagName?: string };
		children?: Snippet;
		props?: Record<string, unknown>;
	} = $props();
	const tagName = $derived(token?.tagName ?? 'File');
	const label = $derived(resolveLabel(props, tagName));
	const detail = $derived(typeof props.path === 'string' ? props.path : label);

	function resolveLabel(values: Record<string, unknown>, fallback: string): string {
		if (typeof values.label === 'string') return values.label;
		if (typeof values.path === 'string') return values.path;
		if (typeof values.id === 'string') return values.id;
		return fallback;
	}
</script>

<span
	data-slot="ai-message-mdx-token"
	data-ai-token={tagName.toLowerCase()}
	title={detail}
	class="mx-0.5 inline-flex max-w-full items-center gap-1 rounded-sm border border-current/20 bg-current/10 px-1 py-0 align-[0.05em] text-[0.78em] leading-[1.35] font-medium text-current"
>
	<span class="inline-flex size-[1em] shrink-0 items-center justify-center" aria-hidden="true">
		{#if tagName === 'Command'}
			{@render sparkleIcon({ size: 12 })}
		{:else if tagName === 'Skill'}
			{@render wrenchIcon({ size: 12 })}
		{:else if tagName === 'Mention'}
			{@render atIcon({ size: 12 })}
		{:else if tagName === 'Reference'}
			{@render linkSimpleIcon({ size: 12 })}
		{:else}
			{@render fileTextIcon({ size: 12 })}
		{/if}
	</span>
	<span class="min-w-0 truncate"><Slot render={label ?? children} /></span>
</span>
