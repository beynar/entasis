<script lang="ts">
	import { useRuntimeThemePlayground } from '../../runtimeThemePlayground.svelte.js';
	import { setSectionScope } from './sections/sectionScope.js';

	let { children } = $props();

	// The docs retune the palette at runtime on `html`; inverse sections re-scope the scheme and
	// need those overrides re-applied inside it.
	const playground = useRuntimeThemePlayground();
	setSectionScope({ inverseStyle: () => playground.colorStyle || undefined });
</script>

{@render children()}
