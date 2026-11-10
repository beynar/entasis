<script lang="ts">
	// Test-only: SpinnerText in a flex row narrower than its message, like a step in a card row.
	import Theme from '../Theme/Theme.svelte';
	import SpinnerText from './SpinnerText.svelte';

	let { texts, truncate = false }: { texts: string[]; truncate?: boolean } = $props();
</script>

<Theme>
	<div data-testid="row" style="display: flex; width: 160px; gap: 8px; align-items: center">
		<SpinnerText {texts} {truncate} delay={0} />
		<span data-testid="after" style="flex-shrink: 0">10 s</span>
	</div>
</Theme>
