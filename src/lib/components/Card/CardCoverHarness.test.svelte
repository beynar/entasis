<script lang="ts">
	// A Card with a cover across its top, then a face, a title and a description.
	import Theme from '../Theme/Theme.svelte';
	import Card from './Card.svelte';

	let { density = 'normal' }: { density?: 'compact' | 'normal' | 'comfortable' } = $props();
</script>

<Theme>
	<div style="width: 320px">
		<Card {density} title="Bord de mer" description="Une étude de la côte">
			{#snippet cover()}
				<div data-testid="cover" style="height: 120px; background: #888"></div>
			{/snippet}
			{#snippet media()}
				<div data-testid="face" style="width: 32px; height: 32px; background: #444"></div>
			{/snippet}
		</Card>
	</div>
</Theme>
