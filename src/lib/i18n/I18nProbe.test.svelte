<script lang="ts">
	import { useI18n } from './context.svelte.js';

	const t = $derived(useI18n());
</script>

<span data-testid="probe">{t.previous}</span>
