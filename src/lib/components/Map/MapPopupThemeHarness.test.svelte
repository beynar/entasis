<script lang="ts">
	// Test-only: a marker's popup and tooltip under the classes a Map shares with its markers.
	import Theme from '../Theme/Theme.svelte';
	import MapMarkerPopup from './MapMarkerPopup.svelte';
	import MapMarkerTooltip from './MapMarkerTooltip.svelte';
	import { provideMapClasses, useMapTheme, type MapThemeProps } from './map.theme.js';

	let { theme }: { theme?: MapThemeProps } = $props();
	// svelte-ignore state_referenced_locally
	const classes = useMapTheme(theme);
	provideMapClasses(() => classes);

	const args = {
		marker: { id: 'paris', lngLat: [2.35, 48.85], label: 'Paris' },
		data: undefined,
		map: {} as never,
		lngLat: [2.35, 48.85] as [number, number]
	} as const;
</script>

{#snippet card()}
	<article data-testid="card">Own card</article>
{/snippet}

<Theme>
	<MapMarkerPopup args={args as never} content={card} open>
		{#snippet children(reference)}
			<button type="button" {@attach reference}>Paris</button>
		{/snippet}
	</MapMarkerPopup>
	<MapMarkerTooltip args={args as never} content="Tip">
		{#snippet children(attach)}
			<button type="button" {@attach attach}>Tooltip trigger</button>
		{/snippet}
	</MapMarkerTooltip>
</Theme>
