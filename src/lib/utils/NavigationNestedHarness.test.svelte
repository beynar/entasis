<script lang="ts">
	// Harness for `useNavigation.svelte.test.ts`: a navigation list holding a second navigation list
	// (a toolbar inside a panel), to check that each list takes only the keys typed in its own items.
	import { useNavigation } from './useNavigation.svelte.js';

	let { onActivate }: { onActivate?: (name: string) => void } = $props();

	const outer = useNavigation({ orientation: 'horizontal', typeahead: true });
	const inner = useNavigation({ orientation: 'horizontal', typeahead: true });
</script>

<div role="toolbar" aria-label="Outer" {@attach outer.containerReference}>
	<button type="button" {@attach outer.itemReference}>Outer A</button>
	<div>
		<div role="toolbar" aria-label="Inner" {@attach inner.containerReference}>
			<button type="button" onclick={() => onActivate?.('Inner A')} {@attach inner.itemReference}
				>Inner A</button
			>
			<button type="button" {@attach inner.itemReference}>Inner B</button>
		</div>
	</div>
	<button type="button" {@attach outer.itemReference}>Outer B</button>
</div>
