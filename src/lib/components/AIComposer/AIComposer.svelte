<script lang="ts">
	import { tick } from 'svelte';
	import { createBindableValue } from '$lib/utils/state.svelte.js';
	import type {
		RichTextInputChange,
		RichTextInputHandle,
		RichTextInputItem,
		RichTextInputToken,
		RichTextInputTokenKind
	} from '../RichTextInput/richTextInput.props.js';
	import { toRichTextInputToken } from '../RichTextInput/suggestions.js';
	import Alert from '../Alert/Alert.svelte';
	import Button from '../Button/Button.svelte';
	import { xIcon } from '../Icons/x.js';
	import { getAIConversation } from '../AIConversation/aiConversation.state.svelte.js';
	import { uploadSimpleIcon } from '../Icons/uploadSimple.js';
	import Slot from '../Slot/Slot.svelte';
	import type { AIThreadItem } from '../AIThread/aiThread.props.js';
	import AIComposerEditor from './AIComposerEditor.svelte';
	import AIComposerFiles from './AIComposerFiles.svelte';
	import AIComposerFooter from './AIComposerFooter.svelte';
	import AIComposerQueue from './AIComposerQueue.svelte';
	import { AIComposerFileController } from './aiComposerFileController.svelte.js';
	import type {
		AIComposerAttachment,
		AIComposerCommand,
		AIComposerDropzoneState,
		AIComposerMentionItem,
		AIComposerProps,
		AIComposerQueuedMessage,
		AIComposerSkillItem,
		AIComposerSubmitMeta,
		AIComposerSubmitState,
		AIComposerTriggerSource
	} from './aiComposer.props.js';
	import { AIComposerQueueController } from './aiComposerQueueController.svelte.js';
	import { getAIComposerMentionKind, resolveAIComposerSources } from './aiComposerSourceAdapter.js';
	import { AIComposerSubmitMetadata } from './aiComposerSubmit.js';
	import { AIComposerSubmitController } from './aiComposerSubmitController.svelte.js';
	import { useAIComposerTheme } from './aiComposer.theme.js';
	import { useI18n } from '$lib/i18n/context.svelte.js';

	let {
		ref = $bindable<HTMLFormElement | null>(null),
		defaultValue,
		value = $bindable<string | undefined>(),
		onValueChange,
		files = $bindable<File[]>(),
		attachments = $bindable<AIComposerAttachment[]>(),
		queue = $bindable<AIComposerQueuedMessage[]>(),
		busy,
		disabled = false,
		queueWhileBusy = true,
		fileDropzone = false,
		fileMultiple = true,
		accept,
		maxFiles,
		maxFileSize,
		commands,
		mentionItems = [],
		mentions,
		references,
		skills,
		submitShortcut = 'enter',
		toolbar = 'none',
		formats,
		autoresize = true,
		voiceInput = false,
		voiceInputVariant = 'compact',
		voiceInputMinDuration,
		voiceInputMaxDuration,
		voiceInputColor,
		voiceInputAriaLabel,
		voiceInputStopLabel,
		voiceInputProcessingLabel,
		placeholder,
		submitLabel,
		stopLabel,
		attachLabel,
		dropLabel,
		dropInvalidLabel,
		onSubmit,
		onStop,
		onFilesRejected,
		onFilesChange,
		onFileReject,
		onAttachmentAdd,
		onAttachmentRetry,
		onAttachmentRemove,
		onQueueChange,
		onQueuedMessageAdd,
		onQueuedMessageCancel,
		onQueuedMessageEditStart,
		onQueuedMessageEditCommit,
		onQueuedMessageEditCancel,
		onQueuedMessageReorder,
		onSteer,
		onCommandInsert,
		onMentionInsert,
		onSkillInsert,
		onCommandSearch,
		onMentionSearch,
		onSkillSearch,
		onSuggestionOpen,
		onSuggestionClose,
		onSuggestionQueryChange,
		onSuggestionHighlightChange,
		onVoiceInput,
		modelSelector,
		header,
		dropzone,
		footer,
		footerStart,
		actions,
		prefix,
		suffix,
		class: className,
		theme,
		voiceInputTheme,
		onkeydown,
		...formAttachments
	}: AIComposerProps = $props();
	const valueState = createBindableValue<string | undefined>(
		() => value,
		(nextValue) => (value = nextValue),
		() => defaultValue
	);

	const NOTICE_DURATION = 6000;
	const conversation = getAIConversation<AIThreadItem>();
	const t = $derived(useI18n());
	let editorHandle = $state<RichTextInputHandle>();
	let editorValue = $state('');
	let tokens = $state<RichTextInputToken[]>([]);
	const submitMetadata = new AIComposerSubmitMetadata();

	const resolvedValue = $derived(valueState.value ?? conversation?.currentInput ?? '');
	const resolvedFiles = $derived<File[]>(files ?? conversation?.files ?? []);
	const resolvedAttachments = $derived<AIComposerAttachment[]>(
		attachments ?? conversation?.attachments ?? []
	);
	const hasAttachmentLifecycle = $derived(
		attachments !== undefined ||
			(files === undefined && Boolean(conversation)) ||
			Boolean(onAttachmentAdd || onAttachmentRetry || onAttachmentRemove)
	);
	const resolvedQueue = $derived<AIComposerQueuedMessage[]>(queue ?? []);
	const resolvedBusy = $derived(
		busy ?? (conversation ? conversation.streaming || conversation.status === 'stopping' : false)
	);
	const resolvedAccept = $derived(Array.from(accept ?? []));
	const resolvedMaxFiles = $derived(Math.max(0, maxFiles ?? Number.POSITIVE_INFINITY));
	const resolvedMaxFileSize = $derived(Math.max(0, maxFileSize ?? Number.POSITIVE_INFINITY));
	const resolvedSources = $derived(
		resolveAIComposerSources({
			commands,
			mentionItems,
			mentions,
			references,
			skills,
			onCommandInsert,
			onMentionInsert,
			onSkillInsert,
			onCommandSearch,
			onMentionSearch,
			onSkillSearch,
			onItemInsert: ({ item, kind }) => submitMetadata.remember(item, kind),
			messages: t
		})
	);
	const resolvedPlaceholder = $derived(
		placeholder ?? conversation?.labels.composer.placeholder ?? t.aiComposerPlaceholder
	);
	const resolvedSubmitLabel = $derived(
		submitLabel ?? conversation?.labels.composer.submitLabel ?? t.aiComposerSend
	);
	const resolvedStopLabel = $derived(
		stopLabel ?? conversation?.labels.composer.stopLabel ?? t.aiComposerStop
	);
	const resolvedAttachLabel = $derived(
		attachLabel ?? conversation?.labels.composer.attachLabel ?? t.aiComposerAttach
	);
	const fileController: AIComposerFileController = new AIComposerFileController(() => ({
		disabled,
		get isWorking() {
			return submitController.isWorking;
		},
		fileDropzone,
		fileMultiple,
		accept: resolvedAccept,
		maxFiles: resolvedMaxFiles,
		maxFileSize: resolvedMaxFileSize,
		managedAttachments: hasAttachmentLifecycle,
		files: resolvedFiles,
		attachments: resolvedAttachments,
		setFiles,
		setAttachments,
		onFilesRejected,
		onFilesChange,
		onFileReject,
		onAttachmentAdd,
		onAttachmentRetry,
		onAttachmentRemove,
		get messages() {
			return t;
		}
	}));
	const fileDropzoneController = fileController.dropzone;
	const displayFiles: File[] = $derived(fileController.files);
	const currentAttachments: AIComposerAttachment[] = $derived(fileController.attachments);
	const canSubmit: boolean = $derived(editorValue.trim().length > 0 || displayFiles.length > 0);
	const submitState = $derived<AIComposerSubmitState>({
		value: editorValue,
		files: [...displayFiles],
		attachments: [...currentAttachments],
		isEmpty: !canSubmit,
		isBusy: resolvedBusy
	});
	const queueController: AIComposerQueueController = new AIComposerQueueController(() => ({
		disabled,
		get isWorking() {
			return submitController.isWorking;
		},
		messages: resolvedQueue,
		conversation,
		setMessages: setQueue,
		restoreDraft: restoreQueuedMessage,
		clearDraft,
		onQueueChange,
		onAdd: onQueuedMessageAdd,
		onCancel: onQueuedMessageCancel,
		onEditStart: onQueuedMessageEditStart,
		onEditCommit: onQueuedMessageEditCommit,
		onEditCancel: onQueuedMessageEditCancel,
		onReorder: onQueuedMessageReorder,
		onSteer
	}));

	const submitController: AIComposerSubmitController = new AIComposerSubmitController(() => ({
		disabled,
		canSubmit,
		busy: resolvedBusy,
		queueWhileBusy,
		queue: queueController,
		conversation,
		buildMeta: buildSubmitMeta,
		clearDraft,
		hasFocus: (event) =>
			Boolean(
				ref?.contains(document.activeElement) ||
				(event && 'submitter' in event && ref?.contains(event.submitter))
			),
		restoreFocus: restoreEditorFocus,
		messages: { submitFailed: t.aiComposerSubmitFailed, stopFailed: t.aiComposerStopFailed },
		onSubmit,
		onStop
	}));
	const isWorking: boolean = $derived(submitController.isWorking);
	// A voice failure (microphone denied, recording or transcription failed) shows in the same
	// banner instead of inside the footer, where the voice control has no room to hold it.
	let voiceError = $state<string | null>(null);
	const visibleError = $derived(submitController.error ?? fileController.error ?? voiceError);
	const classes = $derived(useAIComposerTheme(theme));
	const dropzoneState = $derived<AIComposerDropzoneState>({
		state: fileDropzoneController.state,
		files: [...displayFiles],
		accept: resolvedAccept,
		multiple: fileMultiple,
		maxFiles: resolvedMaxFiles,
		maxFileSize: resolvedMaxFileSize
	});

	$effect(() => {
		if (editorValue !== resolvedValue) editorValue = resolvedValue;
	});

	$effect(() => {
		queueController.syncConversation(resolvedQueue);
	});

	// A rejected-file note is information, not a blocking error: it dismisses itself. Each new
	// rejection (even one with the same text) bumps `noticeId` and restarts the timer.
	$effect(() => {
		void fileController.noticeId;
		if (!fileController.notice) return;
		const timeout = setTimeout(() => fileController.dismissNotice(), NOTICE_DURATION);
		return () => clearTimeout(timeout);
	});

	/**
	 * Focuses the editor with the caret at the end. A parent that has just changed the value (a
	 * suggestion filling the shared input) has not reached the editor yet: Lexical would load that
	 * text after this call and skip writing the selection, so focus again once it has loaded.
	 */
	export function focus(): void {
		editorHandle?.focus();
		void tick().then(() => editorHandle?.focus());
	}

	export function clear(): void {
		clearEditor();
	}

	/**
	 * Sends the current draft, or `text` in place of it, through the same path as Enter or the send
	 * button (queueing while busy), then returns focus to the editor.
	 */
	export async function submit(text?: string): Promise<void> {
		if (text !== undefined) {
			tokens = [];
			submitMetadata.clear();
			editorValue = text;
			setValue(text);
			await tick();
		}
		await submitController.submit();
		await tick();
		editorHandle?.focus();
	}

	export function insertText(text: string): void {
		editorHandle?.insertText(text);
	}

	export function insertItem(trigger: string, item: RichTextInputItem): void {
		editorHandle?.insertItem(trigger, item);
	}

	export function insertToken(token: RichTextInputToken): void {
		editorHandle?.insertToken(token);
	}

	export function insertCommand(item: AIComposerCommand): void {
		insertTypedToken(item, '/', 'command', resolvedSources.commands);
	}

	export function insertMention(item: AIComposerMentionItem): void {
		insertTypedToken(
			item,
			'@',
			getAIComposerMentionKind(item, 'mention'),
			resolvedSources.mentions
		);
	}

	export function insertReference(item: AIComposerMentionItem): void {
		insertTypedToken(item, '@', 'reference', resolvedSources.references);
	}

	export function insertSkill(item: AIComposerSkillItem): void {
		insertTypedToken(item, '$', 'skill', resolvedSources.skills);
	}

	function insertTypedToken<Item extends RichTextInputItem>(
		item: Item,
		trigger: string,
		kind: RichTextInputTokenKind,
		source: AIComposerTriggerSource<Item> | undefined
	): void {
		const handle = editorHandle;
		if (!handle) return;
		const typedItem = { ...item, kind: item.kind ?? kind };
		const context = { trigger, query: '' };
		const token = source?.toToken
			? source.toToken({ item, context })
			: toRichTextInputToken(typedItem, { tokenKind: typedItem.kind }, context);
		handle.insertToken(token);
		submitMetadata.remember(item, kind);
		source?.onSelect?.({ item, context });
	}

	function setValue(nextValue: string): void {
		if (nextValue === resolvedValue) return;
		if (valueState.value !== undefined || !conversation) valueState.value = nextValue;
		else conversation.setInput(nextValue);
		onValueChange?.(nextValue);
	}

	function setFiles(nextFiles: File[]): void {
		if (files !== undefined || !conversation) files = nextFiles;
		else conversation.setFiles(nextFiles);
	}

	function setAttachments(nextAttachments: AIComposerAttachment[]): void {
		if (attachments !== undefined || !conversation) attachments = nextAttachments;
		else conversation.setAttachments(nextAttachments);
	}

	function setQueue(nextQueue: AIComposerQueuedMessage[]): void {
		queue = nextQueue;
	}

	function handleValueChange(change: RichTextInputChange): void {
		tokens = change.tokens;
		setValue(change.markdown);
	}

	function buildSubmitMeta(): AIComposerSubmitMeta {
		return submitMetadata.build({
			markdown: editorValue.trim(),
			files: [...displayFiles],
			attachments: [...currentAttachments],
			tokens: [...tokens],
			busy: resolvedBusy,
			commands: resolvedSources.commands,
			mentions: resolvedSources.mentions,
			references: resolvedSources.references,
			skills: resolvedSources.skills
		});
	}

	function restoreQueuedMessage(message: AIComposerQueuedMessage): void {
		editorValue = message.markdown;
		tokens = message.tokens.map((token) => ({ ...token }));
		setValue(message.markdown);
		fileController.restore(message);
		void tick().then(() => editorHandle?.focus());
	}

	// Sending, queueing and leaving a queued edit clear the editor or unmount the control that was
	// used; keep focus in the composer unless it already moved somewhere else on the page.
	function restoreEditorFocus(): void {
		void tick().then(() => {
			const active = document.activeElement;
			if (active && active !== document.body && !ref?.contains(active)) return;
			editorHandle?.focus();
		});
	}

	function handleKeydown(event: KeyboardEvent & { currentTarget: HTMLFormElement }): void {
		onkeydown?.(event);
		// The editor and its suggestion popup handle Escape first and mark it handled.
		if (event.defaultPrevented || event.key !== 'Escape' || !queueController.isEditing) return;
		event.preventDefault();
		cancelQueuedEdit();
	}

	function cancelQueuedEdit(): void {
		queueController.cancelEdit();
		restoreEditorFocus();
	}

	function clearDraft(): void {
		clearEditor();
		fileController.clear();
	}

	function clearEditor(): void {
		editorHandle?.clear();
		editorValue = '';
		tokens = [];
		submitMetadata.clear();
		setValue('');
	}
</script>

<form
	bind:this={ref}
	data-slot="ai-composer"
	data-file-drag-active={fileDropzoneController.isActive ? 'true' : undefined}
	data-file-drag-state={fileDropzoneController.isActive ? fileDropzoneController.state : undefined}
	class={classes.root({ className, dragState: fileDropzoneController.state })}
	onsubmit={submitController.submit}
	onkeydown={handleKeydown}
	onpaste={(event) => fileController.handlePaste(event)}
	{@attach fileDropzoneController.zone}
	{...formAttachments}
>
	<input
		type="file"
		hidden
		multiple={fileMultiple && resolvedMaxFiles > 1}
		accept={resolvedAccept.join(',')}
		disabled={fileController.isDisabled}
		tabindex="-1"
		aria-hidden="true"
		{@attach fileDropzoneController.input}
	/>

	{#if fileDropzoneController.isActive}
		<div
			data-slot="ai-composer-dropzone"
			data-state={fileDropzoneController.state}
			role="status"
			aria-live="polite"
			class={classes.dropzone({ state: fileDropzoneController.state })}
		>
			{#if dropzone}
				<Slot render={dropzone} payload={dropzoneState} />
			{:else}
				<span class={classes.dropzoneIcon()}>
					{@render uploadSimpleIcon({ size: 18 })}
				</span>
				<span>
					{fileDropzoneController.state === 'invalid'
						? (dropInvalidLabel ?? t.aiComposerDropInvalid)
						: (dropLabel ?? t.aiComposerDrop)}
				</span>
			{/if}
		</div>
	{/if}

	{#if header}<Slot render={header} class={classes.header()} />{/if}

	<AIComposerQueue
		messages={resolvedQueue}
		editingMessage={queueController.editingMessage}
		disabled={disabled || isWorking}
		onReorder={(messages) => queueController.reorder(messages)}
		onSteer={(messageId) => queueController.steer(messageId)}
		onEdit={(messageId) => queueController.startEdit(messageId)}
		onCancel={(messageId) => queueController.cancel(messageId)}
		onCancelEdit={cancelQueuedEdit}
		{theme}
	/>

	{#if fileDropzone}
		<AIComposerFiles
			files={displayFiles}
			attachments={currentAttachments}
			disabled={disabled || isWorking}
			canRetry={Boolean(onAttachmentRetry)}
			onRemove={(file) => fileController.removeFile(file)}
			onRetry={(attachmentId) => fileController.retryAttachment(attachmentId)}
			{theme}
		/>
	{/if}

	<AIComposerEditor
		bind:handle={editorHandle}
		bind:value={editorValue}
		{toolbar}
		{formats}
		{autoresize}
		triggers={resolvedSources.triggers}
		placeholder={resolvedPlaceholder}
		disabled={disabled || submitController.isSubmitting}
		{submitShortcut}
		{prefix}
		{suffix}
		onSubmit={submitController.submit}
		onValueChange={handleValueChange}
		{onSuggestionOpen}
		{onSuggestionClose}
		{onSuggestionQueryChange}
		{onSuggestionHighlightChange}
		{theme}
	/>

	{#if visibleError}
		<Alert color="danger" variant="soft" description={visibleError} class={classes.error()} />
	{/if}

	<!-- The status region stays mounted (visually hidden while empty) and only its text changes, so
	     screen readers announce each note; re-keying the text re-announces a repeated rejection. -->
	<div
		data-slot="ai-composer-notice"
		data-empty={fileController.notice ? undefined : 'true'}
		class={classes.notice({ empty: !fileController.notice })}
	>
		<span role="status" class="min-w-0">
			{#key fileController.noticeId}{fileController.notice ?? ''}{/key}
		</span>
		{#if fileController.notice}
			<Button
				type="button"
				squared
				size="small"
				variant="ghost"
				color="neutral"
				label={t.close}
				onclick={() => fileController.dismissNotice()}
			>
				{@render xIcon({ size: 14 })}
			</Button>
		{/if}
	</div>

	<AIComposerFooter
		state={submitState}
		onVoiceError={(message) => (voiceError = message)}
		{footer}
		{footerStart}
		{actions}
		{modelSelector}
		{voiceInput}
		{voiceInputVariant}
		{voiceInputMinDuration}
		{voiceInputMaxDuration}
		voiceInputColor={voiceInputColor ?? 'primary'}
		voiceInputAriaLabel={voiceInputAriaLabel ?? t.voiceInputStart}
		voiceInputStopLabel={voiceInputStopLabel ?? t.voiceInputStop}
		voiceInputProcessingLabel={voiceInputProcessingLabel ?? t.voiceInputProcessing}
		voiceInputFailedLabel={t.aiComposerVoiceFailed}
		{onVoiceInput}
		{fileDropzone}
		attachDisabled={disabled || isWorking || displayFiles.length >= resolvedMaxFiles}
		{disabled}
		{isWorking}
		isSubmitting={submitController.isSubmitting}
		isStopping={submitController.isStopping}
		isEditing={queueController.isEditing}
		{queueWhileBusy}
		submitLabel={resolvedSubmitLabel}
		stopLabel={resolvedStopLabel}
		queueLabel={t.aiComposerQueue}
		attachLabel={resolvedAttachLabel}
		onAttach={() => fileDropzoneController.open()}
		onStop={submitController.stop}
		{theme}
		{voiceInputTheme}
	/>
</form>
