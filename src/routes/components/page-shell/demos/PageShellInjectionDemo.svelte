<script lang="ts">
	import { PageShell } from '$lib/components/PageShell/index.js';
	import PageShellInjectedChildDemo from './PageShellInjectedChildDemo.svelte';
</script>

<div class="border-neutral-muted h-[420px] w-full overflow-auto rounded-lg border">
	<PageShell title="Fallback page" subtitle="This text is replaced by the child route">
		<PageShellInjectedChildDemo />
	</PageShell>
</div>
