<script lang="ts">
	// Binds one component to a parent value that starts `undefined`, `null` or `false`; `onPass` counts how
	// many times Svelte renders this markup on the server.
	import { untrack, type Component } from 'svelte';
	import Theme from './Theme/Theme.svelte';
	import BoundDefaultPass from './BoundDefaultPass.test.svelte';

	let {
		component: Bound,
		props = {},
		start,
		binding = 'value',
		onPass
	}: {
		component: Component<Record<string, unknown>>;
		props?: Record<string, unknown>;
		start: undefined | null | false;
		binding?: 'value' | 'open' | 'api';
		onPass: () => void;
	} = $props();
	let value = $state<unknown>(untrack(() => start));
	let api = $state<unknown>();
	let open = $state<boolean | undefined>(untrack(() => (start === false ? false : undefined)));
</script>

<Theme>
	<BoundDefaultPass {onPass} />
	{#if binding === 'api'}
		<Bound bind:api {...props} />
	{:else if binding === 'open'}
		<Bound bind:open {...props} />
	{:else}
		<Bound bind:value {...props} />
	{/if}
</Theme>
