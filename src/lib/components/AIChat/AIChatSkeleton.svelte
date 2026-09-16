<script lang="ts" module>
	const assistantRows = [
		{ primary: 'w-4/5 max-w-lg', secondary: 'w-2/3 max-w-md', tertiary: 'w-1/2 max-w-sm' },
		{ primary: 'w-3/4 max-w-xl', secondary: 'w-4/5 max-w-lg', tertiary: 'w-2/5 max-w-xs' },
		{ primary: 'w-2/3 max-w-md', secondary: 'w-1/2 max-w-sm', tertiary: 'w-3/5 max-w-md' }
	] as const;
	const userRows = [
		{ primary: 'w-2/5 max-w-sm', secondary: 'w-1/3 max-w-xs' },
		{ primary: 'w-1/2 max-w-md', secondary: 'w-1/4 max-w-40' }
	] as const;

	function createSkeletonRows(messageCount: number) {
		const finiteCount = Number.isFinite(messageCount) ? messageCount : 4;
		const count = Math.min(8, Math.max(1, Math.trunc(finiteCount)));
		return Array.from({ length: count }, (_, index) => {
			if (index % 3 === 1) {
				return { id: index, side: 'user' as const, layout: userRows[index % userRows.length]! };
			}
			return {
				id: index,
				side: 'assistant' as const,
				layout: assistantRows[index % assistantRows.length]!
			};
		});
	}
</script>

<script lang="ts">
	import Skeleton from '../Skeleton/Skeleton.svelte';
	import type { AIChatSkeletonProps } from './aiChatSkeleton.props.js';
	import { useAIChatTheme } from './aiChat.theme.js';
	import { useI18n } from '$lib/i18n/context.svelte.js';

	let {
		ref = $bindable(),
		messageCount = 4,
		showHeader = false,
		showComposer = true,
		showFooter = false,
		role = 'status',
		'aria-label': label,
		'aria-busy': ariaBusy = 'true',
		class: className,
		theme,
		...rootAttributes
	}: AIChatSkeletonProps = $props();
	const t = $derived(useI18n());
	const rows = $derived(createSkeletonRows(messageCount));
	const classes = $derived(useAIChatTheme(theme));
</script>

<div
	{...rootAttributes}
	bind:this={ref}
	data-slot="ai-chat-skeleton"
	{role}
	aria-label={label ?? t.aiChatConnecting}
	aria-busy={ariaBusy}
	class={classes.root({ className })}
>
	{#if showHeader}
		<div data-slot="ai-chat-skeleton-header" aria-hidden="true" class={classes.header()}>
			<div class="flex min-w-0 items-center justify-between gap-3">
				<div class="flex min-w-0 flex-col gap-2">
					<Skeleton class="h-5 w-40 max-w-full" />
					<Skeleton class="h-3 w-56 max-w-full" />
				</div>
				<Skeleton class="h-8 w-24 shrink-0" />
			</div>
		</div>
	{/if}

	<div data-slot="ai-chat-skeleton-thread" aria-hidden="true" class={classes.thread()}>
		<div class={classes.skeletonMessages()}>
			{#each rows as row (row.id)}
				{#if row.side === 'user'}
					<div class="flex justify-end">
						<div class="flex w-full max-w-[82%] flex-col items-end gap-2">
							<Skeleton class={`h-4 ${row.layout.primary}`} />
							<Skeleton class={`h-4 ${row.layout.secondary}`} />
						</div>
					</div>
				{:else}
					<div class="flex gap-3">
						<Skeleton class="size-8 shrink-0 rounded-full" />
						<div class="flex min-w-0 flex-1 flex-col gap-2 pt-1">
							<Skeleton class={`h-4 ${row.layout.primary}`} />
							<Skeleton class={`h-4 ${row.layout.secondary}`} />
							<Skeleton class={`h-4 ${row.layout.tertiary}`} />
						</div>
					</div>
				{/if}
			{/each}
		</div>
	</div>

	{#if showComposer}
		<div data-slot="ai-chat-skeleton-composer" aria-hidden="true" class={classes.composer()}>
			<div class="grid min-h-24 gap-3">
				<Skeleton class="h-4 w-3/4" />
				<Skeleton class="h-4 w-1/2" />
				<div class="mt-2 flex items-center justify-between gap-3">
					<div class="flex min-w-0 items-center gap-2">
						<Skeleton class="size-8" />
						<Skeleton class="h-8 w-24" />
					</div>
					<Skeleton class="size-8 shrink-0" />
				</div>
			</div>
		</div>
	{/if}

	{#if showFooter}
		<div data-slot="ai-chat-skeleton-footer" aria-hidden="true" class={classes.footer()}>
			<div class="flex items-center justify-between gap-3">
				<Skeleton class="h-4 w-48 max-w-full" />
				<Skeleton class="h-8 w-28 shrink-0" />
			</div>
		</div>
	{/if}
</div>
