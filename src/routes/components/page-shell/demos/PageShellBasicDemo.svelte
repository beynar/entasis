<script lang="ts">
	import {
		PageShell,
		type PageShellAction,
		type PageShellContentPadding,
		type PageShellContentWidth
	} from '$lib/components/PageShell/index.js';
	import { arrowClockwiseIcon } from '$lib/components/Icons/arrowClockwise.js';
	import { downloadSimpleIcon } from '$lib/components/Icons/downloadSimple.js';

	let {
		contentPadding = 'normal',
		contentWidth = 'wide'
	}: {
		contentPadding?: PageShellContentPadding;
		contentWidth?: PageShellContentWidth;
	} = $props();

	const headerActions = [
		{
			label: 'Refresh insights',
			squared: true,
			variant: 'outline',
			prefix: arrowClockwiseIcon
		},
		{
			content: 'Export',
			color: 'primary',
			prefix: downloadSimpleIcon
		}
	] satisfies PageShellAction[];
</script>

<div class="border-neutral-muted h-[460px] w-full overflow-auto rounded-lg border">
	<PageShell
		title="Insights"
		subtitle="Sticky header and footer with natural content flow"
		{headerActions}
		{contentPadding}
		{contentWidth}
	>
		{#snippet footer()}
			<span>Updated just now</span>
			<span class="text-primary-readable font-medium">All systems healthy</span>
		{/snippet}

		<div class="grid gap-4 lg:grid-cols-3">
			{#each ['Revenue', 'Activation', 'Retention'] as metric, index (index)}
				<section class="border-neutral-muted bg-surface-raised rounded-lg border p-4">
					<p class="text-neutral/70 text-sm font-medium">{metric}</p>
					<p class="text-neutral mt-3 text-3xl font-semibold">{[84, 67, 91][index]}%</p>
					<p class="text-neutral/70 mt-2 text-sm">Compared with the previous 30 days.</p>
				</section>
			{/each}

			<section class="border-neutral-muted bg-surface-raised rounded-lg border p-4 lg:col-span-3">
				<p class="text-neutral text-sm font-medium">Activity feed</p>
				<div class="mt-4 grid gap-3">
					{#each ['Pipeline refreshed', 'Segment imported', 'Forecast recalculated', 'Report queued', 'Notebook synced'] as event, index (index)}
						<div class="bg-surface flex items-center justify-between rounded-md px-3 py-2">
							<span class="text-neutral text-sm">{event}</span>
							<span class="text-neutral/65 text-xs">now</span>
						</div>
					{/each}
				</div>
			</section>
		</div>
	</PageShell>
</div>
