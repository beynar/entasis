<script lang="ts" generics="TMessage extends AIThreadItem = AIThreadItem">
	import AIMarker from '../AIMarker/AIMarker.svelte';
	import Slot from '../Slot/Slot.svelte';
	import type { AIThreadItem, AIThreadRenderPayload } from './aiThread.props.js';
	import type { AIThreadRenderItem } from './threadRenderItems.js';

	let {
		item,
		size = 'normal',
		marker,
		markerIcon,
		markerContent
	}: {
		item: Extract<AIThreadRenderItem<TMessage>, { kind: 'marker' }>;
		size?: import('$lib/types/theme.js').Sizes;
		marker?: import('../Slot/slot.js').Slot<AIThreadRenderPayload<TMessage>>;
		markerIcon?: import('../Slot/slot.js').Slot<AIThreadRenderPayload<TMessage>>;
		markerContent?: import('../Slot/slot.js').Slot<AIThreadRenderPayload<TMessage>>;
	} = $props();

	const payload = $derived({ message: item.message, index: item.messageIndex });
</script>

{#snippet icon()}
	<Slot render={markerIcon} {payload} />
{/snippet}

{#snippet content()}
	<Slot render={markerContent ?? item.content} {payload} />
{/snippet}

{#if marker}
	<Slot render={marker} {payload} />
{:else}
	<AIMarker
		{size}
		variant={item.variant ?? 'separator'}
		icon={markerIcon ? icon : undefined}
		{content}
	/>
{/if}
