<script lang="ts">
	import { Timeline, type TimelineItem } from '$lib/components/Timeline/index.js';
	import { gitForkIcon } from '$lib/components/Icons/gitFork.js';
	import { gitMergeIcon } from '$lib/components/Icons/gitMerge.js';
	import { gitPullRequestIcon } from '$lib/components/Icons/gitPullRequest.js';
	import type { Snippet } from 'svelte';

	type ActivityItem = TimelineItem & {
		relativeTime: string;
		activityIcon?: Snippet;
		state: 'complete' | 'active';
	};

	const activities: ActivityItem[] = [
		{
			id: 'forked',
			title: 'Forked repository',
			description: 'Created a branch for the new implementation.',
			relativeTime: '15 minutes ago',
			activityIcon: gitForkIcon,
			state: 'complete',
			color: 'neutral'
		},
		{
			id: 'submitted',
			title: 'Pull request submitted',
			description: 'Opened PR #342 and requested code review.',
			relativeTime: '10 minutes ago',
			activityIcon: gitPullRequestIcon,
			state: 'complete',
			color: 'primary'
		},
		{
			id: 'reviewed',
			title: 'Comparing branches',
			description: 'Received comments and updated error handling.',
			relativeTime: '5 minutes ago',
			state: 'complete',
			color: 'warning'
		},
		{
			id: 'merged',
			title: 'Merging branch',
			description: 'Applying the reviewed changes to the main branch.',
			relativeTime: 'Just now',
			activityIcon: gitMergeIcon,
			state: 'active',
			loading: true,
			color: 'success'
		}
	];
</script>

<div class="bg-surface w-full max-w-3xl rounded-2xl p-4 sm:p-7">
	<Timeline items={activities} density="comfortable" aria-label="Repository activity">
		{#snippet item({ item, defaultContent })}
			<div class="space-y-2" class:opacity-70={item.state === 'active'}>
				{@render defaultContent()}
				<p class="text-neutral/65 text-xs tabular-nums">{item.relativeTime}</p>
			</div>
		{/snippet}

		{#snippet marker({ item, color, defaultMarker })}
			{#if item.loading}
				{@render defaultMarker()}
			{:else if item.activityIcon}
				<span
					data-color={color}
					class="bg-color-muted text-color-muted-readable relative z-10 grid size-7 shrink-0 place-items-center rounded-full shadow-[0_0_0_3px_var(--color-surface)] [&>svg]:size-4"
				>
					{@render item.activityIcon()}
				</span>
			{:else}
				{@render defaultMarker()}
			{/if}
		{/snippet}
	</Timeline>
</div>
