<script lang="ts">
	// Mounts one component under a Theme with `webmcp` on, and the <Ask /> host.
	import type { Component } from 'svelte';
	import Ask from '$lib/components/Form/Ask/Ask.svelte';
	import Theme from '$lib/components/Theme/Theme.svelte';

	let {
		component: Inner,
		webmcp = true,
		...props
	}: {
		// Any component under test, with its own props.
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		component: Component<any>;
		webmcp?: boolean;
		[key: string]: unknown;
	} = $props();
</script>

<Theme {webmcp}>
	<Ask />
	<Inner {...props} />
</Theme>
