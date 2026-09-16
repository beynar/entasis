<script lang="ts">
	// Marker `label`, `popup` and `tooltip` strings are HTML by design — `map-html.ts` derives
	// the accessible name from the same markup — so every raw-HTML render of map content goes
	// through this one component instead of being spread across the marker components.
	let { value }: { value: string } = $props();
</script>

<!-- eslint-disable-next-line svelte/no-at-html-tags -- Single vetted injection point for the HTML strings the Map marker API accepts. -->
{@html value}
