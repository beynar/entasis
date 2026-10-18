<script lang="ts" generics="TMessage extends AIThreadItem = AIThreadItem">
	import { on } from 'svelte/events';
	import {
		createVirtualizer,
		measureElement as measureVirtualElement
	} from '@tanstack/svelte-virtual';
	import { onDestroy, tick, untrack } from 'svelte';
	import type { Attachment } from 'svelte/attachments';
	import { get } from 'svelte/store';
	import Alert from '../Alert/Alert.svelte';
	import Button from '../Button/Button.svelte';
	import type { AIMessageSize } from '../AIMessage/aiMessage.props.js';
	import AISuggestions from '../AISuggestion/AISuggestions.svelte';
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
	// The scroll-to-latest button shows as soon as the view is this far from the end.
	const SCROLL_BUTTON_THRESHOLD = 8;
	// Below this viewport width the table of contents and its gutter step aside (AIThreadToc's own
	// narrow-container width), so a phone-width thread keeps its full width for messages.
	const TOC_MIN_VIEWPORT_WIDTH = 480;
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
		messageVariant = 'minimal',
		messageColor,
		contentWidth,
		followOutput = true,
		bottomThreshold = 80,
		estimateSize,
		overscan = 4,
		padding,
		paddingStart,
		paddingEnd,
		scrollBehavior = 'smooth',
		showScrollButton = true,
		scrollButtonPosition = 'center',
		showToc = false,
		tocSide = 'left',
		tocMaxPins,
		tocShowRange = false,
		tocTheme,
		activeAskUserQuestion,
		renderAskUserQuestion = true,
		askUserQuestionDisabled = false,
		suggestions,
		showFollowUps = true,
		onSelect,
		error: errorProp,
		showError = true,
		onErrorRetry,
		empty,
		message: messageSlot,
		messageActions,
		messageActionsVisibility = 'latest',
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
	let viewportWidth = $state(0);
	let viewportScrollTop = $state(0);
	let isPinned = $state(true);
	let hasInitializedEnd = $state(false);
	let isInitializingEnd = $state(false);
	let isFollowingAppendedItem = $state(false);
	// The thread follows new output only while the user is at the very end. Scrolling up stops it;
	// scrolling back to the end resumes it. Nothing else moves the user's scroll position.
	let lastScrollTop = 0;
	// A pointer or a finger is down on the transcript: a scroll now is the reader dragging it (the
	// scrollbar, a touch pan), not layout or the virtualizer moving the offset.
	let isDragging = false;
	let stickFrame: number | undefined;
	// Set while the virtualizer handles its ResizeObserver delivery (see `measureItem`).
	let isInResizeDelivery = false;
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
	// Message actions take layout space inside their row, so the end padding no longer reserves
	// room for an action bar hanging below the last message.
	const resolvedPaddingEnd = $derived(Math.max(0, paddingEnd ?? resolvedPadding));

	const resolvedMessages = $derived<readonly TMessage[]>(messages ?? conversation?.messages ?? []);
	const resolvedLiveText = $derived(liveText ?? conversation?.liveText);
	const resolvedStreaming = $derived(streaming ?? conversation?.streaming ?? false);
	const resolvedSuggestions = $derived(suggestions ?? conversation?.suggestions ?? []);
	const resolvedError = $derived(errorProp !== undefined ? errorProp : conversation?.error);
	const hasErrorRow = $derived(showError && resolvedError !== undefined);
	const errorRetry = $derived(resolveErrorRetry());
	const resolvedContentWidth = $derived(
		typeof contentWidth === 'number' ? `${contentWidth}px` : contentWidth
	);
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
			splitMessageParts: !messageSlot,
			questionStates,
			questionValues: questionValuesByKey,
			streaming: resolvedStreaming,
			error: hasErrorRow
		});
	});
	const classes = $derived(useAIThreadTheme(theme));
	const isSettlingInitialEnd = $derived(
		renderItems.length > 0 && (!hasInitializedEnd || isInitializingEnd)
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
			scrollEndThreshold: endThreshold(),
			initialOffset: initialThreadOffset,
			measureElement: measureThreadItem,
			onChange: handleVirtualizerChange
		}))
	);

	const virtualItems = $derived($virtualizerStore.getVirtualItems());
	const totalSize = $derived($virtualizerStore.getTotalSize());
	// Read from reactive scroll state, not the DOM: a wheel, trackpad, key or scrollbar scroll
	// updates `viewportScrollTop`, so the button appears as soon as the view leaves the end.
	const distanceToEnd = $derived(Math.max(0, totalSize - viewportHeight - viewportScrollTop));
	const shouldShowScrollButton = $derived(
		showScrollButton &&
			renderItems.length > 0 &&
			!isFollowingAppendedItem &&
			!isSettlingInitialEnd &&
			distanceToEnd > SCROLL_BUTTON_THRESHOLD &&
			(!isPinned || !followOutput)
	);
	const isPending = $derived(renderItems.at(-1)?.kind === 'pending');
	const liveRegionText = $derived(
		resolvedLiveText || (isPending ? t.aiReasoningThinking : undefined)
	);
	// The last turn, ignoring markers and system notices that may follow it (a context marker, a
	// "model switched" notice): they do not end the turn.
	const lastTurnMessage = $derived(
		resolvedMessages.findLast(
			(message) =>
				message.type !== 'marker' && message.type !== 'context' && message.role !== 'system'
		)
	);
	const shouldShowFollowUps = $derived(
		showFollowUps &&
			resolvedSuggestions.length > 0 &&
			renderItems.length > 0 &&
			!resolvedStreaming &&
			!hasErrorRow &&
			!resolvedQuestion &&
			lastTurnMessage !== undefined &&
			// After an assistant turn: its reply, or the tool calls that ended it.
			lastTurnMessage.role !== 'user'
	);

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
		showToc &&
			tocState.entries.length > 1 &&
			viewportHeight > 0 &&
			viewportWidth >= TOC_MIN_VIEWPORT_WIDTH &&
			totalSize > viewportHeight + 1
	);

	$effect(() => {
		questionPublisher.sync(conversation, detectedQuestion, activeAskUserQuestion !== undefined);
	});

	$effect(() => {
		const currentViewport = viewport;
		if (!currentViewport) return;
		const sync = () => syncThreadPosition();
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
			scrollEndThreshold: endThreshold(),
			onChange: handleVirtualizerChange
		});
		if (prependScrollTarget) {
			const target = prependScrollTarget;
			prependScrollTarget = undefined;
			scrollController.settlePrependedItems(
				target === 'start' ? scrollToStart : () => scrollToBottom('instant'),
				() => syncThreadPosition()
			);
		}
		previousRenderItemCount = count;
		previousFirstRenderItemKey = renderItems[0]?.key;
		if (shouldSmoothAppendedItem) {
			scrollController.scheduleSmoothAppendAdjustmentReset();
			scrollController.watchAppendFollowEnd(isViewportAtEnd, () => {
				isFollowingAppendedItem = false;
				syncThreadPosition();
				stickToEnd();
			});
		}
		if (count === 0) {
			isPinned = true;
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
		syncThreadPosition();
		if (!shouldSmoothAppendedItem) stickToEnd();
	});

	$effect(() => {
		void isPinned;
		untrack(applyFollowOptions);
	});

	onDestroy(() => {
		cancelInitialEndSettlement();
		if (stickFrame !== undefined) cancelAnimationFrame(stickFrame);
		questionPublisher.destroy();
		scrollController.destroy();
	});

	// The virtualizer re-measures rows from its ResizeObserver and re-renders the range in the same
	// pass (a streamed row grows, the pinned view moves to the new end, rows enter and leave the
	// overscan). A row that starts or stops being laid out while the browser is still delivering
	// resize notifications cannot be delivered in that pass, and the browser reports a
	// "ResizeObserver loop" error. Rows that mount during a delivery are measured and observed on the
	// next frame, before the next delivery (their cached or estimated size holds until then), and a
	// removed row stops being observed before the browser looks for further changes.
	function measureThreadItem(
		element: HTMLElement,
		entry: ResizeObserverEntry | undefined,
		instance: Parameters<typeof measureVirtualElement<HTMLElement>>[2]
	): number {
		if (entry && !isInResizeDelivery) {
			isInResizeDelivery = true;
			setTimeout(() => (isInResizeDelivery = false));
		}
		return measureVirtualElement(element, entry, instance);
	}

	let isReleasingItems = false;

	function releaseRemovedItems(): void {
		if (isReleasingItems) return;
		isReleasingItems = true;
		queueMicrotask(() => {
			isReleasingItems = false;
			// With no node, the virtualizer unobserves and forgets every disconnected row.
			get(virtualizerStore).measureElement(null);
		});
	}

	const measureItem: Attachment<HTMLElement> = (element) => {
		let frame: number | undefined;
		if (isInResizeDelivery) {
			frame = requestAnimationFrame(() => {
				frame = undefined;
				if (element.isConnected) get(virtualizerStore).measureElement(element);
			});
		} else {
			get(virtualizerStore).measureElement(element);
		}
		return () => {
			if (frame !== undefined) cancelAnimationFrame(frame);
			releaseRemovedItems();
		};
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

	// The virtualizer keeps the end in view by itself when an item is appended or re-measured
	// (streaming text, rows mounting as they scroll in) within `scrollEndThreshold` of the end. That
	// is only wanted while the thread follows: once the user scrolls up, it would pull every small
	// scroll back down. Read untracked: the effect below applies a change of `isPinned`.
	function followOnAppendBehavior(): AIThreadScrollBehavior | false {
		return followOutput && untrack(() => isPinned) ? scrollBehavior : false;
	}

	// Unpinned, no distance counts as the end (-1): a reader left exactly at the end by a layout
	// change (a row shrinking under them) would otherwise be pulled down when that row grows again.
	function endThreshold(): number {
		return untrack(() => isPinned) ? Math.max(0, bottomThreshold) : -1;
	}

	function handleVirtualizerChange(): void {
		syncThreadPosition();
	}

	function syncThreadPosition(): void {
		if (!viewport) return;
		viewportHeight = viewport.clientHeight;
		viewportWidth = viewport.clientWidth;
		viewportScrollTop = viewport.scrollTop;
		if (isInitializingEnd) {
			isPinned = true;
			return;
		}
		stickToEnd();
	}

	// Closes any gap between the viewport and the end while pinned. Deferred a frame so the spacer
	// has taken the virtualizer's new total size, and coalesced because size changes arrive in bursts.
	function stickToEnd(): void {
		if (stickFrame !== undefined || !followOutput) return;
		stickFrame = requestAnimationFrame(() => {
			stickFrame = undefined;
			if (!viewport || !isPinned || isInitializingEnd) return;
			// A smooth follow or a smooth scroll-to-latest owns the viewport until it lands.
			if (isFollowingAppendedItem || renderItems.length === 0) return;
			if (distanceFromEnd() <= 1) return;
			get(virtualizerStore).scrollToEnd({ behavior: 'instant' });
			syncThreadPosition();
		});
	}

	function isViewportAtStart(): boolean {
		return !viewport || viewport.scrollTop <= 1;
	}

	function distanceFromEnd(): number {
		if (!viewport) return 0;
		return Math.max(0, viewport.scrollHeight - viewport.clientHeight - viewport.scrollTop);
	}

	function isViewportAtEnd(): boolean {
		if (!viewport) return isPinned;
		return distanceFromEnd() <= Math.max(0, bottomThreshold);
	}

	function unpin(): void {
		cancelInitialEndSettlement();
		isInitializingEnd = false;
		isFollowingAppendedItem = false;
		isPinned = false;
		// Now, not in the effect below: a row measured before that effect runs would otherwise still
		// see the pinned end threshold and scroll a scroll that has only just started back down.
		applyFollowOptions();
		cancelProgrammaticScroll();
	}

	// The virtualizer keeps steering a scrollToEnd/scrollToIndex toward its target for up to 5s,
	// until the offset holds for a frame, and re-scrolls whenever measurements move that target. On a
	// busy page it is still steering when the reader scrolls away, and pulls them back. The reader
	// wins: drop the pending reconcile. It has no public cancel (and scrolling to the current offset
	// would cut a smooth wheel or keyboard scroll short), so clear the field it checks.
	function cancelProgrammaticScroll(): void {
		const virtualizer = get(virtualizerStore) as unknown as { scrollState?: unknown };
		if (virtualizer.scrollState) virtualizer.scrollState = null;
	}

	function applyFollowOptions(): void {
		const virtualizer = get(virtualizerStore);
		virtualizer.setOptions({
			...virtualizer.options,
			followOnAppend: followOnAppendBehavior(),
			scrollEndThreshold: endThreshold()
		});
	}

	function handleScroll(event: UIEvent & { currentTarget: EventTarget & HTMLDivElement }): void {
		const scrollTop = event.currentTarget.scrollTop;
		if (scrollTop < lastScrollTop - 0.5) {
			// Only the reader moving up away from the end stops following. A wheel or a key already
			// unpinned on its own event; here that leaves a drag (the scrollbar, a touch pan). Every other
			// upward move is layout: the virtualizer keeping the end anchored as the viewport grows (the
			// suggestions bar going away), or the browser clamping the offset onto the end (the composer
			// coming back after a docked question). Those change nothing, so a following thread keeps
			// following and a reader who scrolled up is not re-pinned.
			if (isDragging && !isInitializingEnd && distanceFromEnd() >= 1) unpin();
		}
		// Only a scroll that reaches the very end follows output again. A layout change that happens
		// to leave the view at the end (rows above it measured smaller) must not re-pin it, or the next
		// growth pulls a reader who scrolled up back to the bottom.
		else if (distanceFromEnd() < 1) isPinned = true;
		lastScrollTop = scrollTop;
		syncThreadPosition();
		onscroll?.(event);
	}

	// A wheel up stops following before its scroll lands, so no output appended in between pulls the
	// view back down.
	function handleWheel(event: WheelEvent): void {
		if (event.deltaY < 0) unpin();
	}

	// The keys that scroll the transcript up stop following on keydown, like a wheel: a smooth
	// keyboard scroll lands over several frames, and output appended meanwhile must not undo it.
	const scrollUpKeys = new Set(['PageUp', 'ArrowUp', 'Home']);
	function handleViewportKeydown(event: KeyboardEvent): void {
		if (event.target !== event.currentTarget || event.altKey || event.ctrlKey || event.metaKey)
			return;
		if (scrollUpKeys.has(event.key) || (event.key === ' ' && event.shiftKey)) unpin();
	}

	// Tracks a drag on the transcript. Touch uses touch events: a touch pan cancels its pointer as
	// soon as the browser takes it over, before the scroll events arrive.
	const trackDrag: Attachment<HTMLDivElement> = (node) => {
		const start = () => (isDragging = true);
		const end = () => (isDragging = false);
		const offs = [
			on(node, 'pointerdown', (event) => {
				if (event.pointerType !== 'touch') start();
			}),
			on(node, 'touchstart', start, { passive: true }),
			on(window, 'pointerup', end),
			on(window, 'pointercancel', (event) => {
				if (event.pointerType !== 'touch') end();
			}),
			on(window, 'touchend', end),
			on(window, 'touchcancel', end)
		];
		return () => {
			for (const off of offs) off();
			isDragging = false;
		};
	};

	function handleRootWheel(
		event: WheelEvent & { currentTarget: EventTarget & HTMLDivElement }
	): void {
		handleWheel(event);
		onWheel?.(event);
	}

	function scrollToStart(): void {
		get(virtualizerStore).scrollToOffset(0, { behavior: 'instant' });
		syncThreadPosition();
	}

	function scrollToBottom(behavior: AIThreadScrollBehavior = scrollBehavior): void {
		if (renderItems.length === 0) return;
		isPinned = true;
		if (behavior === 'smooth') {
			isFollowingAppendedItem = true;
			scrollController.watchAppendFollowEnd(isViewportAtEnd, () => {
				isFollowingAppendedItem = false;
				syncThreadPosition();
				stickToEnd();
			});
		}
		get(virtualizerStore).scrollToEnd({ behavior });
		syncThreadPosition();
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
				syncThreadPosition();
			});
		});
	}

	function cancelInitialEndSettlement(): void {
		initialEndSchedule += 1;
		if (initialEndFrame === undefined) return;
		cancelAnimationFrame(initialEndFrame);
		initialEndFrame = undefined;
	}

	function resolveErrorRetry(): (() => void | Promise<void>) | undefined {
		if (onErrorRetry) return onErrorRetry;
		const current = conversation;
		if (!current) return undefined;
		return () => {
			const index = current.messages.length - 1;
			current.retry(index >= 0 ? { index } : undefined);
		};
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
		if (detail) questionValuesByKey = { ...questionValuesByKey, [request.key]: detail.values };
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
			errorMessage = getErrorMessage(error, t.aiThreadQuestionFailed);
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
	style:--ai-thread-content-width={resolvedContentWidth}
	onwheel={handleRootWheel}
>
	{#if liveRegionText}
		<div data-slot="ai-thread-live-region" class="sr-only" aria-live="polite" aria-atomic="true">
			{liveRegionText}
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
			{@attach (node) => on(node, 'keydown', handleViewportKeydown)}
			{@attach trackDrag}
		>
			<AIThreadItems
				{renderItems}
				{virtualItems}
				{totalSize}
				{measureItem}
				density={resolvedDensity}
				messageSize={resolvedMessageSize}
				{messageVariant}
				{messageColor}
				suggestions={resolvedSuggestions}
				onSelect={handleSuggestionSelect}
				error={resolvedError}
				{errorRetry}
				liveText={resolvedLiveText}
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
					<AIThreadToc
						state={tocState}
						maxPins={tocMaxPins}
						showRange={tocShowRange}
						side={tocSide}
						theme={tocTheme}
					/>
				</div>
			{/if}
		{/if}

		{#if shouldShowScrollButton}
			<Button
				squared
				size="normal"
				variant="outline"
				label={t.aiThreadScrollToLatest}
				data-slot="ai-thread-scroll-button"
				class={classes.scrollButton({ position: scrollButtonPosition })}
				onclick={() => scrollToBottom()}
			>
				{@render arrowDownIcon({ size: 16 })}
			</Button>
		{/if}
	</div>
	{#if shouldShowFollowUps}
		<!-- The scroll row's viewport is the labelled group. -->
		<div data-slot="ai-thread-follow-ups" class={classes.followUps({ density: resolvedDensity })}>
			<!-- One row that scrolls sideways (with a fade) rather than wrapping on a phone. -->
			<div class={classes.followUpList()}>
				<AISuggestions
					suggestions={resolvedSuggestions}
					label={t.aiThreadFollowUps}
					onSelect={handleSuggestionSelect}
				/>
			</div>
		</div>
	{/if}
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
