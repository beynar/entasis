<script lang="ts">
	import { plusIcon } from '$lib/components/Icons/plus.js';
	import { minusIcon } from '$lib/components/Icons/minus.js';
	import { arrowsInIcon } from '$lib/components/Icons/arrowsIn.js';
	import { gpsFixIcon } from '$lib/components/Icons/gpsFix.js';
	import { arrowsCounterClockwiseIcon } from '$lib/components/Icons/arrowsCounterClockwise.js';
	import Button from '$lib/components/Button/Button.svelte';
	import Map, {
		type MapControlButtonSnippetArg,
		type MapMarker
	} from '$lib/components/Map/Map.svelte';

	type SiteData = {
		status: 'active' | 'planned';
	};

	const markers: MapMarker<SiteData>[] = [
		{ id: 'nantes', lng: -1.5536, lat: 47.2184, label: 'Nantes', data: { status: 'active' } },
		{ id: 'rennes', lng: -1.6778, lat: 48.1173, label: 'Rennes', data: { status: 'planned' } },
		{ id: 'tours', lng: 0.6848, lat: 47.3941, label: 'Tours', data: { status: 'active' } }
	];

	const iconFor = (action: MapControlButtonSnippetArg['action']) =>
		action === 'zoom-in'
			? plusIcon
			: action === 'zoom-out'
				? minusIcon
				: action === 'fit-markers'
					? arrowsInIcon
					: action === 'geolocate'
						? gpsFixIcon
						: arrowsCounterClockwiseIcon;
</script>

<div class="w-full max-w-3xl">
	<Map
		{markers}
		center={[-0.45, 47.65]}
		zoom={6}
		controls={['zoom-in', 'zoom-out', 'fit-markers', 'geolocate', 'reset']}
		controlPosition="bottom-right"
		fitMarkersPadding={56}
		class="h-[28rem]"
	>
		{#snippet controlButton(button: MapControlButtonSnippetArg)}
			<!-- The map wraps this in a click-forwarding element, so the button itself
           doesn't need an onclick — it only renders the icon and disabled state. -->
			<Button
				variant="ghost"
				size="small"
				squared
				prefix={iconFor(button.action)}
				label={button.label}
				disabled={button.disabled}
				class={`size-9 rounded-none bg-surface/95 ${button.active ? 'text-primary' : ''}`}
			/>
		{/snippet}
	</Map>
</div>
