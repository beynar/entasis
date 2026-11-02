<script lang="ts">
	/* eslint-disable no-useless-assignment -- api is an output binding. */
	// Writes a bound prop while it renders, as `<Tabs bind:api>` or `<DataTable bind:api>` do:
	// Svelte then renders the page a second time on the server and discards the first pass.
	let { api = $bindable() }: { api?: object } = $props();
	api = { ready: true };
</script>

<span>child</span>
