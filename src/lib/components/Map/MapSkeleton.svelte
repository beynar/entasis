<script lang="ts">
	import { useI18n } from '$lib/i18n/context.svelte.js';
	import Skeleton from '../Skeleton/Skeleton.svelte';

	const t = $derived(useI18n());
</script>

<div
	data-slot="map-skeleton"
	role="status"
	aria-label={t.loadingMap}
	class="pointer-events-none absolute inset-0 z-10"
>
	<Skeleton class="h-full w-full rounded-none" />
</div>
