<script lang="ts" module>
	// Assistant replies are flat prose of varying length; user turns are short bubbles.
	const assistantRows = [
		['w-full', 'w-11/12', 'w-3/5'],
		['w-full', 'w-4/5'],
		['w-full', 'w-full', 'w-10/12', 'w-2/5']
	] as const;

	function createSkeletonRows(messageCount: number) {
		const finiteCount = Number.isFinite(messageCount) ? messageCount : 4;
		const count = Math.min(8, Math.max(1, Math.trunc(finiteCount)));
		return Array.from({ length: count }, (_, index) =>
			index % 2 === 0
				? { id: index, side: 'user' as const, lines: [] as readonly string[] }
				: {
						id: index,
						side: 'assistant' as const,
						lines: assistantRows[Math.floor(index / 2) % assistantRows.length]!
					}
		);
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
		contentWidth = '48rem',
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
	const resolvedContentWidth = $derived(
		typeof contentWidth === 'number' ? `${contentWidth}px` : contentWidth
	);
</script>

<div
	{...rootAttributes}
	bind:this={ref}
	data-slot="ai-chat-skeleton"
	{role}
	aria-label={label ?? t.aiChatConnecting}
	aria-busy={ariaBusy}
	class={classes.root({ className })}
	style:--ai-chat-content-width={resolvedContentWidth}
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
					<Skeleton data-slot="ai-chat-skeleton-user" class={classes.skeletonUser()} />
				{:else}
					<div data-slot="ai-chat-skeleton-assistant" class={classes.skeletonAssistant()}>
						{#each row.lines as width, line (line)}
							<Skeleton class={`h-4 ${width}`} />
						{/each}
					</div>
				{/if}
			{/each}
		</div>
	</div>

	{#if showComposer}
		<div data-slot="ai-chat-skeleton-composer" aria-hidden="true" class={classes.composer()}>
			<div class={classes.skeletonComposer()}>
				<Skeleton class="h-4 w-1/2" />
				<div class="flex items-center justify-between gap-3">
					<Skeleton class="size-7 rounded-md" />
					<div class="flex items-center gap-2">
						<Skeleton class="h-7 w-20 rounded-md" />
						<Skeleton class="size-7 rounded-md" />
					</div>
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
