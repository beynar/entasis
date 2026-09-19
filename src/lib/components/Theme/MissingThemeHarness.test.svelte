<script lang="ts">
	// Reads the provider the way every component does, with no `<Theme>` above it.
	import { useTheme } from './theme.state.svelte.js';

	const theme = useTheme();
</script>

<span>{theme.resolvedTheme}</span>
