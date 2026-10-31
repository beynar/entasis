<script lang="ts">
	// A progress band whose host draws its own marker for the current step and falls back to the
	// default marker for the others.
	import Timeline from './Timeline.svelte';
	import type { TimelineItem } from './timeline.props.js';

	let { items }: { items: TimelineItem[] } = $props();
</script>

<Timeline {items} orientation="horizontal" color="primary">
	{#snippet marker({ item, defaultMarker })}
		{#if item.progress === 'current'}
			<span data-testid="custom-marker">★</span>
		{:else}
			{@render defaultMarker()}
		{/if}
	{/snippet}
</Timeline>
