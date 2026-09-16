<script lang="ts" generics="TMessage extends AIThreadItem = AIThreadItem">
	import { createVirtualizer } from '@tanstack/svelte-virtual';
	import { onDestroy, tick, untrack } from 'svelte';
	import type { Attachment } from 'svelte/attachments';
	import { get } from 'svelte/store';
	import Alert from '../Alert/Alert.svelte';
	import Button from '../Button/Button.svelte';
	import type { AIMessageSize } from '../AIMessage/aiMessage.props.js';
	import { arrowDownIcon } from '../Icons/arrowDown.js';
	import type {
		AIAskAnswers,
		AIAskUserQuestionSubmitPayload
	} from '../AIAskUserQuestion/aiAskUserQuestion.props.js';
	import { getAIConversation } from '../AIConversation/aiConversation.state.svelte.js';
	import AIThreadToc from '../AIThreadToc/AIThreadToc.svelte';
	import { buildAIThreadTocState } from '../AIThreadToc/aiThreadToc.js';
	import Slot from '../Slot/Slot.svelte';
	import AIThreadAskUserQuestionSurface from './AIThreadAskUserQuestion.svelte';
	import AIThreadItems from './AIThreadItems.svelte';
	import type {
		AIThreadAskUserQuestion,
		AIThreadAskUserQuestionState,
		AIThreadDensity,
		AIThreadItem,
		AIThreadProps,
		AIThreadScrollBehavior
	} from './aiThread.props.js';
	import { useAIThreadTheme } from './aiThread.theme.js';
	import { findActiveAskUserQuestion } from './threadAskUserQuestion.js';
	import { AIThreadAskUserQuestionPublisher } from './threadAskUserQuestionPublisher.js';
	import { deriveAIThreadRenderItems } from './threadRenderItems.js';
	import { AIThreadScrollController } from './threadScrollController.js';
	import { useI18n } from '$lib/i18n/context.svelte.js';

	type EndStateVirtualizer = {
		isAtEnd: (threshold?: number) => boolean;
	};
	const DENSITY_PADDING: Record<AIThreadDensity, number> = {
		compact: 8,
		normal: 16,
		comfortable: 24
	};
	const DENSITY_ESTIMATE_SIZE: Record<AIThreadDensity, number> = {
		compact: 80,
		normal: 96,
		comfortable: 120
	};
	const MESSAGE_ACTION_HEIGHT: Record<AIMessageSize, number> = {
		small: 24,
		normal: 28,
		large: 32
	};
	const MESSAGE_BOTTOM_PADDING: Record<AIMessageSize, number> = {
		small: 6,
		normal: 8,
		large: 10
	};
	const ITEM_BOTTOM_PADDING: Record<AIThreadDensity, number> = {
		compact: 2,
		normal: 8,
		comfortable: 14
	};
	function normalizeThreadScale(value: unknown): 'small' | 'normal' | 'large' {
		return value === 'small' || value === 'large' ? value : 'normal';
	}
	function normalizeThreadDensity(value: unknown): AIThreadDensity {
		return value === 'compact' || value === 'comfortable' ? value : 'normal';
	}

	let {
		ref = $bindable(),
		messages,
		getMessageKey,
		liveText,
		streaming,
		density = 'normal',
		messageSize = 'normal',
		messageVariant = 'bubble',
		followOutput = true,
		bottomThreshold = 80,
		estimateSize,
		overscan = 4,
		padding,
		paddingStart,
		paddingEnd,
		scrollBehavior = 'smooth',
		showScrollButton = true,
		scrollButtonPosition = 'right',
		showToc = false,
		tocSide = 'left',
		tocMaxPins,
		tocTheme,
		activeAskUserQuestion,
		renderAskUserQuestion = true,
		askUserQuestionDisabled = false,
		suggestions,
		onSelect,
		empty,
		message: messageSlot,
		messageActions,
		messageActionsVisibility,
		messageCopyable,
		messageEditable,
		messageRetryable,
		onMessageCopy,
		onMessageEdit,
		onMessageRetry,
		tool: toolSlot,
		toolIcon,
		toolTitle,
		toolContent,
		toolInput,
		toolOutput,
		toolError,
		toolStatus,
		marker: markerSlot,
		markerIcon,
		markerContent,
		onAskUserQuestionStateChange,
		header,
		footer,
		toc,
		role = 'log',
		viewportLabel,
		onscroll,
		onwheel: onWheel,
		class: className,
		theme,
		...rootAttributes
	}: AIThreadProps<TMessage> = $props();
	const t = $derived(useI18n());

	const conversation = getAIConversation<TMessage>();
	const generatedKeys = new WeakMap<object, string>();
	const questionPublisher = new AIThreadAskUserQuestionPublisher<TMessage>();
	const scrollController = new AIThreadScrollController(() => scrollBehavior);
	let generatedKeyId = 0;
	let viewport = $state<HTMLDivElement>();
	let viewportHeight = $state(0);
	let viewportScrollTop = $state(0);
	let isPinned = $state(true);
	let hasInitializedEnd = $state(false);
	let isInitializingEnd = $state(false);
	let isFollowingAppendedItem = $state(false);
	let errorMessage = $state<string>();
	let questionStates = $state<Record<string, AIThreadAskUserQuestionState | undefined>>({});
	let questionValuesByKey = $state<Record<string, AIAskAnswers | undefined>>({});
	let previousRenderItemCount = 0;
	let previousFirstRenderItemKey: string | undefined;
	let shouldSmoothAppendedItem = false;
	let prependScrollTarget: 'start' | 'end' | undefined;
	let initialEndFrame: number | undefined;
	let initialEndSchedule = 0;
	const resolvedDensity: AIThreadDensity = $derived(normalizeThreadDensity(density));
	const resolvedMessageSize: AIMessageSize = $derived(normalizeThreadScale(messageSize));
	const resolvedEstimateSize = $derived(
		Math.max(1, estimateSize ?? DENSITY_ESTIMATE_SIZE[resolvedDensity])
	);
	const resolvedPadding = $derived(Math.max(0, padding ?? DENSITY_PADDING[resolvedDensity]));
	const resolvedPaddingStart = $derived(Math.max(0, paddingStart ?? resolvedPadding));
	const messageActionOverflow = $derived(
		messageActions === false || messageActionsVisibility === 'none'
			? 0
			: Math.max(
					0,
					MESSAGE_ACTION_HEIGHT[resolvedMessageSize] -
						MESSAGE_BOTTOM_PADDING[resolvedMessageSize] -
						ITEM_BOTTOM_PADDING[resolvedDensity]
				)
	);
	const resolvedPaddingEnd = $derived(
		Math.max(0, paddingEnd ?? Math.max(resolvedPadding, messageActionOverflow))
	);

	const resolvedMessages = $derived<readonly TMessage[]>(messages ?? conversation?.messages ?? []);
	const resolvedLiveText = $derived(liveText ?? conversation?.liveText);
	const resolvedStreaming = $derived(streaming ?? conversation?.streaming ?? false);
	const resolvedSuggestions = $derived(suggestions ?? conversation?.suggestions ?? []);
	const messageKeys = $derived.by(() => createMessageKeys(resolvedMessages));
	const detectedQuestion = $derived<AIThreadAskUserQuestion<TMessage> | null>(
		findActiveAskUserQuestion(
			resolvedMessages,
			(_message, index) => messageKeys[index] ?? `missing:${index}`,
			questionStates
		)
	);
	const resolvedQuestion = $derived.by<AIThreadAskUserQuestion<TMessage> | null>(() => {
		const request =
			activeAskUserQuestion !== undefined
				? activeAskUserQuestion
				: (conversation?.activeAskUserQuestion ?? detectedQuestion);
		if (!request || (request.state !== undefined && request.state !== 'pending')) return null;
		return questionStates[request.key] && questionStates[request.key] !== 'pending'
			? null
			: request;
	});
	const renderItems = $derived.by(() => {
		return deriveAIThreadRenderItems(resolvedMessages, {
			getMessageKey: (_message, index) => messageKeys[index] ?? `missing:${index}`,
			activeQuestion: resolvedQuestion,
			splitMessageParts: !messageSlot
		});
	});
	const classes = $derived(useAIThreadTheme(theme));
	const isSettlingInitialEnd = $derived(
		renderItems.length > 0 && (!hasInitializedEnd || isInitializingEnd)
	);
	const shouldShowScrollButton = $derived(
		showScrollButton &&
			!isPinned &&
			!isFollowingAppendedItem &&
			!isSettlingInitialEnd &&
			!isViewportAtEnd() &&
			renderItems.length > 0
	);

	const virtualizerStore = createVirtualizer<HTMLDivElement, HTMLElement>(
		untrack(() => ({
			count: initialThreadCount(),
			getScrollElement: () => viewport ?? null,
			estimateSize: () => resolvedEstimateSize,
			overscan: Math.max(0, overscan),
			paddingStart: resolvedPaddingStart,
			paddingEnd: resolvedPaddingEnd,
			initialRect: { width: 1, height: resolvedEstimateSize },
			getItemKey: renderItemKey,
			scrollToFn: scrollController.scrollToFn,
			anchorTo: 'end',
			followOnAppend: followOnAppendBehavior(),
			scrollEndThreshold: Math.max(0, bottomThreshold),
			initialOffset: initialThreadOffset,
			onChange: handleVirtualizerChange
		}))
	);

	const virtualItems = $derived($virtualizerStore.getVirtualItems());
	const totalSize = $derived($virtualizerStore.getTotalSize());
	const tocState = $derived.by(() => {
		const virtualizer = $virtualizerStore;
		const effectiveScrollOffset = isPinned
			? Math.max(viewportScrollTop, totalSize - viewportHeight)
			: viewportScrollTop;
		return buildAIThreadTocState(renderItems, {
			totalSize,
			scrollOffset: effectiveScrollOffset,
			viewportSize: viewportHeight,
			isPinnedToBottom: isPinned || isSettlingInitialEnd,
			estimateSize: resolvedEstimateSize,
			getItemOffset: (index) => virtualizer.getOffsetForIndex(index, 'start')?.[0],
			getItemSize: (index) => virtualizer.measurementsCache[index]?.size,
			scrollToIndex(index, behavior) {
				virtualizer.scrollToIndex(index, { align: 'start', behavior });
			},
			scrollToOffset(offset, behavior) {
				virtualizer.scrollToOffset(offset, { behavior });
			}
		});
	});
	const shouldRenderToc = $derived(
		showToc && tocState.entries.length > 1 && viewportHeight > 0 && totalSize > viewportHeight + 1
	);

	$effect(() => {
		questionPublisher.sync(conversation, detectedQuestion, activeAskUserQuestion !== undefined);
	});

	$effect(() => {
		const currentViewport = viewport;
		if (!currentViewport) return;
		const sync = () => syncThreadPosition(get(virtualizerStore));
		sync();
		const observer = new ResizeObserver(sync);
		observer.observe(currentViewport);
		return () => observer.disconnect();
	});

	$effect.pre(() => {
		const hasAddedItems = hasInitializedEnd && renderItems.length > previousRenderItemCount;
		const hasPrependedItems = hasAddedItems && renderItems[0]?.key !== previousFirstRenderItemKey;
		prependScrollTarget = hasPrependedItems
			? isViewportAtStart()
				? 'start'
				: isViewportAtEnd()
					? 'end'
					: undefined
			: undefined;
		shouldSmoothAppendedItem =
			hasAddedItems &&
			!hasPrependedItems &&
			followOutput &&
			scrollBehavior === 'smooth' &&
			isViewportAtEnd();
		if (shouldSmoothAppendedItem) isFollowingAppendedItem = true;
	});

	$effect(() => {
		const count = renderItems.length;
		const currentViewport = viewport;
		scrollController.prepareSmoothAppendAdjustment(shouldSmoothAppendedItem);
		get(virtualizerStore).setOptions({
			count,
			getScrollElement: () => currentViewport ?? null,
			estimateSize: () => resolvedEstimateSize,
			overscan: Math.max(0, overscan),
			paddingStart: resolvedPaddingStart,
			paddingEnd: resolvedPaddingEnd,
			getItemKey: renderItemKey,
			scrollToFn: scrollController.scrollToFn,
			anchorTo: 'end',
			followOnAppend: followOnAppendBehavior(),
			scrollEndThreshold: Math.max(0, bottomThreshold),
			onChange: handleVirtualizerChange
		});
		if (prependScrollTarget) {
			const target = prependScrollTarget;
			prependScrollTarget = undefined;
			scrollController.settlePrependedItems(
				target === 'start' ? scrollToStart : () => scrollToBottom('instant'),
				() => syncThreadPosition(get(virtualizerStore))
			);
		}
		previousRenderItemCount = count;
		previousFirstRenderItemKey = renderItems[0]?.key;
		if (shouldSmoothAppendedItem) {
			scrollController.scheduleSmoothAppendAdjustmentReset();
			scrollController.watchAppendFollowEnd(isViewportAtEnd, () => {
				isFollowingAppendedItem = false;
				syncThreadPosition(get(virtualizerStore));
			});
		}
		if (count === 0) {
			hasInitializedEnd = false;
			isInitializingEnd = false;
			isFollowingAppendedItem = false;
			cancelInitialEndSettlement();
			previousFirstRenderItemKey = undefined;
		}
		if (currentViewport && count > 0 && !hasInitializedEnd) {
			isInitializingEnd = true;
			hasInitializedEnd = true;
			scheduleInitialEndSettlement();
		}
		syncThreadPosition(get(virtualizerStore));
	});

	onDestroy(() => {
		cancelInitialEndSettlement();
		questionPublisher.destroy();
		scrollController.destroy();
	});

	const measureItem: Attachment<HTMLElement> = (element) => {
		get(virtualizerStore).measureElement(element);
	};

	function createMessageKeys(currentMessages: readonly TMessage[]): string[] {
		const bases = currentMessages.map((message, index) => {
			const configured = getMessageKey?.(message, index) ?? message.id;
			return configured === undefined ? generatedKey(message) : String(configured);
		});
		// eslint-disable-next-line svelte/prefer-svelte-reactivity -- Ephemeral key counts are not component state.
		const counts = new Map<string, number>();
		for (const base of bases) counts.set(base, (counts.get(base) ?? 0) + 1);
		return bases.map((base, index) => {
			if ((counts.get(base) ?? 0) === 1) return base;
			const message = currentMessages[index];
			return message ? `${base}:duplicate:${generatedKey(message)}` : `${base}:duplicate:${index}`;
		});
	}

	function generatedKey(message: TMessage): string {
		const existing = generatedKeys.get(message);
		if (existing) return existing;
		generatedKeyId += 1;
		const key = `message-generated:${generatedKeyId}`;
		generatedKeys.set(message, key);
		return key;
	}

	function renderItemKey(index: number): string | number {
		return renderItems[index]?.key ?? index;
	}

	function initialThreadOffset(): number {
		return Math.max(
			0,
			resolvedPaddingStart + resolvedPaddingEnd + renderItems.length * resolvedEstimateSize
		);
	}

	function initialThreadCount(): number {
		return renderItems.length;
	}

	function followOnAppendBehavior(): AIThreadScrollBehavior | false {
		return followOutput ? scrollBehavior : false;
	}

	function handleVirtualizerChange(instance: EndStateVirtualizer): void {
		syncThreadPosition(instance);
	}

	function syncThreadPosition(instance: EndStateVirtualizer): void {
		if (!viewport) return;
		viewportHeight = viewport.clientHeight;
		viewportScrollTop = viewport.scrollTop;
		if (isInitializingEnd) {
			isPinned = true;
			return;
		}
		isPinned = isViewportAtEnd() || instance.isAtEnd(Math.max(0, bottomThreshold));
	}

	function isViewportAtStart(): boolean {
		return !viewport || viewport.scrollTop <= 1;
	}

	function isViewportAtEnd(): boolean {
		if (!viewport) return isPinned;
		const distanceFromEnd = viewport.scrollHeight - viewport.clientHeight - viewport.scrollTop;
		return Math.max(distanceFromEnd, 0) <= Math.max(0, bottomThreshold);
	}

	function handleScroll(event: UIEvent & { currentTarget: EventTarget & HTMLDivElement }): void {
		syncThreadPosition(get(virtualizerStore));
		onscroll?.(event);
	}

	function handleWheel(): void {
		cancelInitialEndSettlement();
		isInitializingEnd = false;
		isFollowingAppendedItem = false;
		isPinned = false;
	}

	function handleRootWheel(
		event: WheelEvent & { currentTarget: EventTarget & HTMLDivElement }
	): void {
		handleWheel();
		onWheel?.(event);
	}

	function scrollToStart(): void {
		get(virtualizerStore).scrollToOffset(0, { behavior: 'instant' });
		syncThreadPosition(get(virtualizerStore));
	}

	function scrollToBottom(behavior: AIThreadScrollBehavior = scrollBehavior): void {
		if (renderItems.length === 0) return;
		get(virtualizerStore).scrollToEnd({ behavior });
		syncThreadPosition(get(virtualizerStore));
	}

	function scheduleInitialEndSettlement(): void {
		cancelInitialEndSettlement();
		const schedule = initialEndSchedule;
		void tick().then(() => {
			if (schedule !== initialEndSchedule || !isInitializingEnd) return;
			get(virtualizerStore).scrollToEnd({ behavior: 'instant' });
			initialEndFrame = requestAnimationFrame(() => {
				get(virtualizerStore).scrollToEnd({ behavior: 'instant' });
				initialEndFrame = undefined;
				isInitializingEnd = false;
				syncThreadPosition(get(virtualizerStore));
			});
		});
	}

	function cancelInitialEndSettlement(): void {
		initialEndSchedule += 1;
		if (initialEndFrame === undefined) return;
		cancelAnimationFrame(initialEndFrame);
		initialEndFrame = undefined;
	}

	function handleSuggestionSelect(suggestion: string): void {
		if (onSelect) {
			onSelect(suggestion);
			return;
		}
		conversation?.setInput(suggestion);
	}

	function handleQuestionChange({
		request,
		values
	}: {
		request: AIThreadAskUserQuestion<TMessage>;
		values: AIAskAnswers;
	}): void {
		questionValuesByKey = { ...questionValuesByKey, [request.key]: values };
	}

	async function resolveQuestion({
		request,
		state,
		detail
	}: {
		request: AIThreadAskUserQuestion<TMessage>;
		state: 'completed' | 'discarded';
		detail?: AIAskUserQuestionSubmitPayload;
	}): Promise<void> {
		errorMessage = undefined;
		questionStates = { ...questionStates, [request.key]: state };
		const change = {
			request,
			state,
			detail: detail ? { answers: detail.answers, values: detail.values } : undefined
		};
		try {
			if (onAskUserQuestionStateChange) {
				await onAskUserQuestionStateChange(change);
				return;
			}
			if (!conversation) {
				throw new Error(
					'AIThread requires onAskUserQuestionStateChange or a parent AIConversation to resolve questions.'
				);
			}
			await conversation.resolveAskUserQuestion(state, change.detail, request);
		} catch (error) {
			questionStates = { ...questionStates, [request.key]: 'pending' };
			errorMessage = getErrorMessage(error, 'Unable to resolve the question request.');
		}
	}

	function getErrorMessage(error: unknown, fallback: string): string {
		return error instanceof Error && error.message ? error.message : fallback;
	}
</script>

<div
	bind:this={ref}
	data-slot="ai-thread"
	data-density={resolvedDensity}
	{role}
	aria-busy={resolvedStreaming}
	class={classes.root({ className })}
	{...rootAttributes}
	onwheel={handleRootWheel}
>
	{#if resolvedLiveText}
		<div data-slot="ai-thread-live-region" class="sr-only" aria-live="polite" aria-atomic="true">
			{resolvedLiveText}
		</div>
	{/if}
	{#if header}<Slot render={header} class={classes.header()} />{/if}
	{#if errorMessage}<Alert color="danger" variant="soft" description={errorMessage} />{/if}
	<div class={classes.body()}>
		<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
		<div
			bind:this={viewport}
			data-slot="ai-thread-viewport"
			class={classes.viewport({
				tocSide: shouldRenderToc && !toc ? tocSide : undefined
			})}
			tabindex="0"
			aria-label={viewportLabel ?? t.aiThreadTranscript}
			onscroll={handleScroll}
		>
			<AIThreadItems
				{renderItems}
				{virtualItems}
				{totalSize}
				{measureItem}
				density={resolvedDensity}
				messageSize={resolvedMessageSize}
				{messageVariant}
				suggestions={resolvedSuggestions}
				onSelect={handleSuggestionSelect}
				{empty}
				message={messageSlot}
				{messageActions}
				{messageActionsVisibility}
				{messageCopyable}
				{messageEditable}
				{messageRetryable}
				{onMessageCopy}
				{onMessageEdit}
				{onMessageRetry}
				tool={toolSlot}
				{toolIcon}
				{toolTitle}
				{toolContent}
				{toolInput}
				{toolOutput}
				{toolError}
				{toolStatus}
				marker={markerSlot}
				{markerIcon}
				{markerContent}
				{theme}
			/>
		</div>

		{#if shouldRenderToc}
			{#if toc}
				<Slot render={toc} payload={tocState} />
			{:else}
				<div class={classes.tocOverlay({ side: tocSide })}>
					<AIThreadToc state={tocState} maxPins={tocMaxPins} side={tocSide} theme={tocTheme} />
				</div>
			{/if}
		{/if}

		{#if shouldShowScrollButton}
			<Button
				squared
				size="small"
				variant="soft"
				label={t.aiThreadScrollToLatest}
				class={classes.scrollButton({ position: scrollButtonPosition })}
				onclick={() => scrollToBottom()}
			>
				{@render arrowDownIcon({ size: 16 })}
			</Button>
		{/if}
	</div>
	{#if renderAskUserQuestion && resolvedQuestion}
		{@const question = resolvedQuestion}
		{#key question.key}
			<AIThreadAskUserQuestionSurface
				request={question}
				value={questionValuesByKey[question.key] ?? question.value}
				{askUserQuestionDisabled}
				class={classes.askQuestion()}
				onValuesChange={handleQuestionChange}
				onResolve={resolveQuestion}
			/>
		{/key}
	{/if}
	{#if footer}<Slot render={footer} class={classes.footer()} />{/if}
</div>
