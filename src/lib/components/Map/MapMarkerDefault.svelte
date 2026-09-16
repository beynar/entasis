<script lang="ts" generics="TData = unknown">
	import { mapPinIcon } from '../Icons/mapPin.js';
	import MapHtmlText from './MapHtmlText.svelte';
	import type { MapMarker } from './map-data.js';

	type Props<TData = unknown> = {
		marker: MapMarker<TData>;
		color: string;
	};

	let { marker, color }: Props<TData> = $props();
</script>

<span
	class="text-surface ring-offset-surface group-focus-visible:ring-focus/50 flex size-9 items-center justify-center drop-shadow-md group-focus-visible:ring-2 group-focus-visible:ring-offset-2"
	style:color
>
	<span class="inline-flex items-center justify-center [&_svg]:size-9" aria-hidden="true"
		>{@render mapPinIcon()}</span
	>
</span>
{#if marker.label}
	<span
		class="bg-surface-floating/95 text-neutral ring-neutral-muted lift-1 mt-1 max-w-full truncate rounded-md px-2 py-0.5 text-xs font-medium ring-1"
	>
		<MapHtmlText value={marker.label} />
	</span>
{/if}
