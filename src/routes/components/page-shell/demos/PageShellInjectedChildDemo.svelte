<script lang="ts">
	import { setPageShell } from '$lib/components/PageShell/index.js';
	import { arrowClockwiseIcon } from '$lib/components/Icons/arrowClockwise.js';

	setPageShell({
		title: 'Revenue insights',
		subtitle: 'Child page content injected this header and footer',
		headerActions,
		footer
	});
</script>

{#snippet headerActions()}
	<button
		type="button"
		class="state-layer border-neutral-muted text-neutral inline-flex h-8 items-center gap-2 rounded-md border px-3 text-sm font-medium"
	>
		{@render arrowClockwiseIcon({ class: 'size-4' })}
		Refresh
	</button>
{/snippet}

{#snippet footer()}
	<span>Route footer</span>
	<span class="text-primary-readable font-medium">Synced 2 minutes ago</span>
{/snippet}

<div class="grid gap-4 p-4 md:grid-cols-2">
	<section class="border-neutral-muted bg-surface-raised rounded-lg border p-4">
		<p class="text-primary-readable text-sm font-medium">Net revenue</p>
		<p class="text-neutral mt-3 text-3xl font-semibold">$128.4k</p>
		<p class="text-neutral/70 mt-2 text-sm">The child page sets the shell title and footer.</p>
	</section>
	<section class="border-neutral-muted bg-surface-raised rounded-lg border p-4">
		<p class="text-primary-readable text-sm font-medium">Expansion</p>
		<p class="text-neutral mt-3 text-3xl font-semibold">18.2%</p>
		<p class="text-neutral/70 mt-2 text-sm">Cleanup happens automatically on destroy.</p>
	</section>
</div>
