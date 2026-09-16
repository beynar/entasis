<script lang="ts">
	import Theme from './Theme.svelte';
	import type { ThemeDesignTokens } from './theme.designTokens.js';

	let { designTokens }: { designTokens: Record<string, ThemeDesignTokens> } = $props();
</script>

<Theme designTokens={designTokens as never}>
	<button type="button" class="focus-visible:ring-focus/50">Focusable</button>
</Theme>
