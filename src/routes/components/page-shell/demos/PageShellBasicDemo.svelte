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

<div class="h-[460px] w-full overflow-auto rounded-lg border border-neutral-muted">
	<PageShell
		title="Insights"
		subtitle="Sticky header and footer with natural content flow"
		{headerActions}
		{contentPadding}
		{contentWidth}
	>
		{#snippet footer()}
			<span>Updated just now</span>
			<span class="font-medium text-primary">All systems healthy</span>
		{/snippet}

		{#snippet children()}
			<div class="grid gap-4 lg:grid-cols-3">
				{#each ['Revenue', 'Activation', 'Retention'] as metric, index}
					<section class="rounded-lg border border-neutral-muted bg-surface-raised p-4">
						<p class="text-sm font-medium text-neutral/60">{metric}</p>
						<p class="mt-3 text-3xl font-semibold text-neutral">{[84, 67, 91][index]}%</p>
						<p class="mt-2 text-sm text-neutral/60">Compared with the previous 30 days.</p>
					</section>
				{/each}

				<section
					class="rounded-lg border border-neutral-muted bg-surface-raised p-4 lg:col-span-3"
				>
					<p class="text-sm font-medium text-neutral">Activity feed</p>
					<div class="mt-4 grid gap-3">
						{#each ['Pipeline refreshed', 'Segment imported', 'Forecast recalculated', 'Report queued', 'Notebook synced'] as event}
							<div class="flex items-center justify-between rounded-md bg-surface px-3 py-2">
								<span class="text-sm text-neutral">{event}</span>
								<span class="text-xs text-neutral/50">now</span>
							</div>
						{/each}
					</div>
				</section>
			</div>
		{/snippet}
	</PageShell>
</div>
