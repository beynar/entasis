<script lang="ts">
	import Theme from '../Theme/Theme.svelte';
	import Card from './Card.svelte';

	let {
		withAction = true,
		withDescription = true
	}: { withAction?: boolean; withDescription?: boolean } = $props();
</script>

<Theme>
	<div style="width: 360px">
		<Card
			action={withAction ? action : undefined}
			description={withDescription ? description : undefined}
		>
			{#snippet media()}
				<div
					data-testid="face"
					style="width: 40px; height: 40px; border-radius: 9999px; background: #888"
				></div>
			{/snippet}
			{#snippet title()}<span data-testid="title">Import</span>{/snippet}
		</Card>
	</div>
</Theme>

{#snippet description()}<span data-testid="subtitle">Relance des factures en retard</span>{/snippet}
{#snippet action()}<button type="button" data-testid="action">More</button>{/snippet}
