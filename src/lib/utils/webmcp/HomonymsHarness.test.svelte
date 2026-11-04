<script lang="ts">
	// Buttons that read the same, in the shapes a page has them.
	import Button from '$lib/components/Button/Button.svelte';

	let {
		onDelete,
		flat = false,
		described = false
	}: { onDelete?: (name: string) => void; flat?: boolean; described?: boolean } = $props();

	const clients = ['Ada Martin', 'Bob Durand', 'Cleo Petit'];
</script>

{#if flat}
	<!-- Nothing around them, and no heading. -->
	<div>
		<Button>Open</Button>
		<Button>Open</Button>
		<Button color="danger">Wipe</Button>
		<Button color="danger">Wipe</Button>
		<Button>Marker</Button>
	</div>
{:else if described}
	<div>
		<Button tool={{ description: 'The invoice.' }}>Open</Button>
		<Button tool={{ description: 'The quote.' }}>Open</Button>
		<Button>Marker</Button>
	</div>
{:else}
	<table>
		<tbody>
			{#each clients as name (name)}
				<tr>
					<td>{name}</td>
					<td><input value="hidden-value" aria-label="Note" /></td>
					<td><Button color="danger" onclick={() => onDelete?.(name)}>Delete</Button></td>
				</tr>
			{/each}
		</tbody>
	</table>
	<div>
		<h2>Invoices</h2>
		<Button>Export</Button>
		<h2>Quotes</h2>
		<Button>Export</Button>
	</div>
{/if}
