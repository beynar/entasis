<script lang="ts" generics="TData = unknown">
	import type { Snippet } from 'svelte';
	import type { Attachment } from 'svelte/attachments';
	import MapHtmlText from './MapHtmlText.svelte';
	import { tooltip as tooltipAttachment } from '../Tooltip/tooltip.attachment.svelte.js';
	import type { MapMarkerSnippetArg, MapMarkerTooltipContentArg } from './map-types.js';

	type Props<TData = unknown> = {
		args: MapMarkerSnippetArg<TData>;
		content: true | string | Snippet<[MapMarkerTooltipContentArg<TData>]>;
		disabled?: boolean;
		children: Snippet<[Attachment<HTMLElement>]>;
	};

	let { args, content, disabled, children }: Props<TData> = $props();

	const tooltipArg = $derived<MapMarkerTooltipContentArg<TData>>({
		...args,
		open: false
	});

	const noop: Attachment<HTMLElement> = () => {};
</script>

{#snippet tooltipContent()}
	{#if content === true}
		{#if args.marker.label}
			<MapHtmlText value={args.marker.label} />
		{:else}
			{args.marker.id}
		{/if}
	{:else if typeof content === 'string'}
		<MapHtmlText value={content} />
	{:else}
		{@render content(tooltipArg)}
	{/if}
{/snippet}

<!-- Single call site: toggling `disabled` swaps only the attachment, so the trigger node is
     never recreated. Recreating it would re-run the popup's reference attachment on a fresh
     node, and the popup would place against the detached old node (top-left) before jumping. -->
{@render children(
	disabled
		? noop
		: tooltipAttachment({
				content: tooltipContent,
				position: 'top',
				offset: 8,
				class: 'max-w-60 rounded-md px-2.5 py-1.5 text-xs'
			})
)}
