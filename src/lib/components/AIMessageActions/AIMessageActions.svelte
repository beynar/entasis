<script lang="ts" generics="TMessage extends AIThreadItem = AIThreadItem">
	import { useClipboard } from '../../utils/useClipboard.svelte.js';
	import Alert from '../Alert/Alert.svelte';
	import Button from '../Button/Button.svelte';
	import { arrowsClockwiseIcon } from '../Icons/arrowsClockwise.js';
	import { checkIcon } from '../Icons/check.js';
	import { copyIcon } from '../Icons/copy.js';
	import { pencilSimpleIcon } from '../Icons/pencilSimple.js';
	import Slot from '../Slot/Slot.svelte';
	import type { AIThreadItem } from '../AIThread/aiThread.props.js';
	import { getAIConversation } from '../AIConversation/aiConversation.state.svelte.js';
	import type { AIMessageActionState, AIMessageActionsProps } from './aiMessageActions.props.js';
	import { useAIMessageActionsTheme } from './aiMessageActions.theme.js';

	let {
		ref = $bindable(),
		message,
		messageIndex,
		index,
		role,
		content,
		size = 'normal',
		conversation: conversationProp,
		visibility = 'always',
		copyable,
		editable,
		retryable,
		copy: copyAction,
		edit: editAction,
		retry: retryAction,
		actions,
		children,
		onCopy,
		onEdit,
		onRetry,
		class: className,
		theme,
		...attachments
	}: AIMessageActionsProps<TMessage> = $props();
	const clipboard = useClipboard();
	const contextConversation = getAIConversation<TMessage>();
	const conversation = $derived(
		conversationProp === null ? null : (conversationProp ?? contextConversation)
	);
	const resolvedIndex = $derived(messageIndex ?? index);
	const resolvedRole = $derived(role ?? message?.role ?? 'assistant');
	const resolvedContent = $derived(content ?? message?.content ?? '');
	const isCopyEnabled = $derived(copyable ?? copyAction ?? true);
	const isEditEnabled = $derived(editable ?? editAction ?? true);
	const isRetryEnabled = $derived(retryable ?? retryAction ?? true);
	const customActions = $derived(actions !== undefined && actions !== false ? actions : children);
	let errorMessage = $state<string>();
	const classes = $derived(useAIMessageActionsTheme(theme));
	const roleLayout = $derived(resolveRoleLayout(resolvedRole));
	const actionState = $derived<AIMessageActionState<TMessage>>({
		message,
		messageIndex: resolvedIndex,
		index: resolvedIndex,
		role: resolvedRole,
		content: resolvedContent,
		size,
		copied: clipboard.copied,
		canCopy: isCopyEnabled && resolvedContent.length > 0,
		canEdit:
			isEditEnabled &&
			resolvedRole === 'user' &&
			resolvedContent.length > 0 &&
			Boolean(onEdit || conversation),
		canRetry:
			isRetryEnabled &&
			resolvedRole === 'assistant' &&
			Boolean(onRetry || (conversation && resolvedIndex !== undefined)),
		conversation,
		copy: copyMessage,
		edit: editMessage,
		retry: retryMessage
	});

	const hasActions = $derived(
		visibility !== 'none' &&
			actions !== false &&
			Boolean(customActions || actionState.canCopy || actionState.canEdit || actionState.canRetry)
	);
	const buttonSize = $derived(size === 'large' ? 'normal' : 'small');

	function resolveRoleLayout(
		value: AIThreadItem['role']
	): 'user' | 'assistant' | 'system' | 'tool' {
		if (value === 'user') return 'user';
		if (value === 'system') return 'system';
		if (value === 'tool') return 'tool';
		return 'assistant';
	}

	async function copyMessage(): Promise<boolean> {
		if (!actionState.canCopy) return false;
		const didCopy = await clipboard.copy(resolvedContent);
		if (!didCopy) return false;
		await onCopy?.(actionState);
		return true;
	}

	async function editMessage(): Promise<void> {
		if (!actionState.canEdit) return;
		if (onEdit) await onEdit(actionState);
		else conversation?.setInput(resolvedContent);
	}

	async function retryMessage(): Promise<void> {
		if (!actionState.canRetry) return;
		if (onRetry) await onRetry(actionState);
		else if (conversation && resolvedIndex !== undefined) {
			await conversation.retry({ index: resolvedIndex });
		}
	}

	async function handleCopy(): Promise<void> {
		errorMessage = undefined;
		try {
			const didCopy = await copyMessage();
			if (!didCopy) errorMessage = 'Unable to copy this message.';
		} catch (error) {
			setActionError(
				error,
				clipboard.copied
					? 'The message was copied, but the copy action failed.'
					: 'Unable to copy this message.'
			);
		}
	}

	async function handleEdit(): Promise<void> {
		errorMessage = undefined;
		try {
			await editMessage();
		} catch (error) {
			setActionError(error, 'Unable to edit this message.');
		}
	}

	async function handleRetry(): Promise<void> {
		errorMessage = undefined;
		try {
			await retryMessage();
		} catch (error) {
			setActionError(error, 'Unable to retry this message.');
		}
	}

	function setActionError(error: unknown, fallback: string): void {
		errorMessage = error instanceof Error && error.message ? error.message : fallback;
	}
</script>

{#if hasActions}
	<div
		bind:this={ref}
		data-slot="ai-message-actions"
		data-size={size}
		class={classes.root({ role: roleLayout, visibility, size, className })}
		{...attachments}
	>
		{#if customActions}<Slot render={customActions} payload={actionState} />{:else}
			{#if actionState.canCopy}<Button
					type="button"
					squared
					size={buttonSize}
					variant="ghost"
					label={actionState.copied ? 'Copied' : 'Copy'}
					onclick={() => void handleCopy()}
					class={classes.button({ size })}
					>{@render (actionState.copied ? checkIcon : copyIcon)({ size: 14 })}</Button
				>{/if}
			{#if actionState.canEdit}<Button
					type="button"
					squared
					size={buttonSize}
					variant="ghost"
					label="Edit message"
					onclick={() => void handleEdit()}
					class={classes.button({ size })}>{@render pencilSimpleIcon({ size: 14 })}</Button
				>{/if}
			{#if actionState.canRetry}<Button
					type="button"
					squared
					size={buttonSize}
					variant="ghost"
					label="Retry response"
					onclick={() => void handleRetry()}
					class={classes.button({ size })}>{@render arrowsClockwiseIcon({ size: 14 })}</Button
				>{/if}
		{/if}
		{#if errorMessage}<div data-slot="ai-message-actions-error" class={classes.error()}>
				<Alert color="danger" variant="soft" description={errorMessage} />
			</div>{/if}
	</div>
{/if}
