<script lang="ts">
	// Loading buttons placed by their own classes: absolutely in a corner, and in the flow.
	import Theme from '$lib/components/Theme/Theme.svelte';
	import Button from '$lib/components/Button/Button.svelte';

	let { initial = false }: { initial?: boolean } = $props();
	let loading = $state(initial);
	let pill = $state(false);
</script>

<Theme>
	<button type="button" data-testid="toggle" onclick={() => (loading = !loading)}>Toggle</button>
	<button type="button" data-testid="round" onclick={() => (pill = !pill)}>Round</button>
	<div style="position: relative; width: 400px; height: 200px;">
		<Button {loading} class="absolute end-4 bottom-4" data-testid="placed">Save</Button>
		<Button {loading} class={pill ? 'rounded-[20px]' : undefined} data-testid="flow">Send</Button>
	</div>
</Theme>
