<script lang="ts">
	// `useTheme()` throws when no `<Theme>` sits above the component, so a test that exercises one
	// component in isolation mounts it through this harness and runs the supported configuration
	// instead of a provider-less tree.
	import type { Component } from 'svelte';
	import Theme from './Theme.svelte';

	let {
		component,
		...props
	}: { component: Component<Record<string, unknown>> } & Record<string, unknown> = $props();
</script>

<Theme>
	{@const Rendered = component}
	<Rendered {...props} />
</Theme>
