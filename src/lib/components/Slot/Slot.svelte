<script lang="ts" generics="Payload = undefined">
	import { type Slot } from './slot.js';
	import type { Snippet } from 'svelte';
	import type { WithAttachments } from '$lib/types/props.js';
	let {
		render,
		class: className = '',
		children,
		style = '',
		attrs = {},
		as = 'div',
		renderIf = true,
		payload,
		...attachments
	}: WithAttachments<
		{
			/** Classes for the optional wrapper; an empty value renders content without a wrapper. */
			class?: string;
			/** Tag name of the optional wrapper. */
			as?: string;
			/** Attributes forwarded to the optional wrapper element. */
			attrs?: Record<string, unknown>;
			/** Fallback content when render is absent. */
			children?: Snippet<[]>;
			/** Inline styles for the optional wrapper. */
			style?: string;
			/** Text or a snippet to render. */
			render?: Slot<Payload>;
			/** Allows fallback content when render is absent. */
			renderIf?: boolean;
		} & (undefined extends Payload
			? {
					/**
					 * Optional context for a snippet that accepts undefined.
					 */
					payload?: Payload;
				}
			: {
					/**
					 * Required typed context passed to the render snippet.
					 */
					payload: Payload;
				})
	> = $props();
</script>

{#snippet slot()}
	{#if typeof render === 'string'}
		{render}
	{:else if render}
		<!-- The conditional prop contract requires payload when the snippet needs it. -->
		{@render render(payload as Payload)}
	{/if}
{/snippet}

{#if renderIf || render}
	<!-- If no class is pass, we assume that we don't want to wrap it inside a div -->
	{#if render}
		{#if !className && render}
			{@render slot()}
		{:else if render}
			<svelte:element this={as} {style} {...attrs} class={className} {...attachments}>
				{@render slot()}
			</svelte:element>
		{/if}
	{:else if children}
		{#if className}
			<svelte:element this={as} {style} {...attrs} class={className} {...attachments}>
				{@render children()}
			</svelte:element>
		{:else}
			{@render children()}
		{/if}
	{/if}
{/if}
