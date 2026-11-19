<script lang="ts" generics="Payload = undefined">
	// The snippet type is imported under another name: the emitted declaration of this component declares
	// `Slot` itself, and an import of the same name conflicts with it.
	import type { Slot as SlotSnippet } from './slot.js';
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
			render?: SlotSnippet<Payload>;
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

<!-- One chain, so a slot costs one block whatever it renders (a Button mounts three).
     Without a class the content renders bare, with no wrapping element. -->
{#if render && className}
	<svelte:element this={as} {style} {...attrs} class={className} {...attachments}>
		{@render slot()}
	</svelte:element>
{:else if render && typeof render !== 'string'}
	<!-- The conditional prop contract requires payload when the snippet needs it. -->
	{@render render(payload as Payload)}
{:else if render}
	{render}
{:else if renderIf && children && className}
	<svelte:element this={as} {style} {...attrs} class={className} {...attachments}>
		{@render children()}
	</svelte:element>
{:else if renderIf && children}
	{@render children()}
{/if}
