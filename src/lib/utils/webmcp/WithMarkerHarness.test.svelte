<script lang="ts">
	// A component beside a plain Button: once that one is offered, the component's have had the time.
	import type { Component } from 'svelte';
	import Button from '$lib/components/Button/Button.svelte';

	let {
		inner: Inner,
		...props
	}: {
		// Any component under test, with its own props.
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		inner: Component<any>;
		[key: string]: unknown;
	} = $props();
</script>

<Inner {...props} />
<Button>Marker</Button>
