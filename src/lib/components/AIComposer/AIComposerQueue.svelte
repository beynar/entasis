<script lang="ts">
	import Button from '../Button/Button.svelte';
	import { arrowBendDownRightIcon } from '../Icons/arrowBendDownRight.js';
	import { pencilSimpleIcon } from '../Icons/pencilSimple.js';
	import { trashSimpleIcon } from '../Icons/trashSimple.js';
	import { xIcon } from '../Icons/x.js';
	import SortableList from '../SortableList/SortableList.svelte';
	import type { SortableListItemPayload } from '../SortableList/sortableList.props.js';
	import type { AIComposerQueuedMessage } from './aiComposer.props.js';
	import { useAIComposerTheme, type AIComposerThemeProps } from './aiComposer.theme.js';
	import { useI18n } from '$lib/i18n/context.svelte.js';

	let {
		messages,
		editingMessage,
		disabled = false,
		onReorder,
		onSteer,
		onEdit,
		onCancel,
		onCancelEdit,
		theme
	}: {
		messages: AIComposerQueuedMessage[];
		editingMessage?: AIComposerQueuedMessage;
		disabled?: boolean;
		onReorder: (messages: AIComposerQueuedMessage[]) => void;
		onSteer: (messageId: string) => void;
		onEdit: (messageId: string) => void;
		onCancel: (messageId: string) => void;
		onCancelEdit: () => void;
		theme?: AIComposerThemeProps;
	} = $props();
	const t = $derived(useI18n());

	const classes = $derived(useAIComposerTheme(theme));

	function getMessagePreview(message: AIComposerQueuedMessage): string {
		let preview = message.markdown;
		for (const token of message.tokens) {
			if (token.markdown) preview = preview.replaceAll(token.markdown, token.label);
		}
		return preview.replace(/\s+/g, ' ').trim() || t.aiComposerFilesOnly;
	}
</script>

{#if messages.length > 0 || editingMessage}
	<div data-slot="ai-composer-queue" class={classes.queue()}>
		{#if editingMessage}
			<div data-slot="ai-composer-queue-editing" class={classes.queueEditing()}>
				<span class={classes.queueText()}>
					{t.aiComposerEditingQueued(getMessagePreview(editingMessage))}
				</span>
				<Button
					type="button"
					squared
					size="small"
					variant="ghost"
					label={t.aiComposerCancelQueuedEdit}
					{disabled}
					onclick={onCancelEdit}
				>
					{@render xIcon({ size: 14 })}
				</Button>
			</div>
		{/if}
		{#if messages.length > 0}
			<SortableList
				items={messages}
				handle
				size="small"
				{disabled}
				class={classes.queueList()}
				onReorder={({ items }) => onReorder(items)}
			>
				{#snippet item({ item }: SortableListItemPayload<AIComposerQueuedMessage>)}
					<div
						data-slot="ai-composer-queue-item"
						class={classes.queueItem()}
						data-steered={item.steered || undefined}
					>
						<div class={classes.queueText()}>{getMessagePreview(item)}</div>
						{#if item.attachments.length > 0}
							<span class="text-neutral/50 text-xs">
								{item.attachments.length} file{item.attachments.length === 1 ? '' : 's'}
							</span>
						{/if}
						<Button
							type="button"
							squared
							size="small"
							variant={item.steered ? 'soft' : 'ghost'}
							label={t.aiComposerSteerQueued(getMessagePreview(item))}
							pressed={item.steered}
							{disabled}
							onclick={() => onSteer(item.id)}
						>
							{@render arrowBendDownRightIcon({ size: 14 })}
						</Button>
						<Button
							type="button"
							squared
							size="small"
							variant="ghost"
							label={t.aiComposerEditQueued(getMessagePreview(item))}
							disabled={disabled || Boolean(editingMessage)}
							onclick={() => onEdit(item.id)}
						>
							{@render pencilSimpleIcon({ size: 14 })}
						</Button>
						<Button
							type="button"
							squared
							size="small"
							variant="ghost"
							color="danger"
							label={t.aiComposerCancelQueued(getMessagePreview(item))}
							{disabled}
							onclick={() => onCancel(item.id)}
						>
							{@render trashSimpleIcon({ size: 14 })}
						</Button>
					</div>
				{/snippet}
			</SortableList>
		{/if}
	</div>
{/if}
