<script lang="ts" generics="TMessage extends AIThreadItem = AIThreadItem">
	import { useI18n } from '$lib/i18n/context.svelte.js';
	import { aiThreadTocPopoverTheme } from './aiThreadToc.popover.theme.js';
	import { aiThreadTocScrollAreaTheme } from './aiThreadToc.scrollArea.theme.js';
	import { onDestroy } from 'svelte';
	import { flip } from 'svelte/animate';
	import { quintOut } from 'svelte/easing';
	import { prefersReducedMotion } from '$lib/utils/motion.svelte.js';
	import { scale } from 'svelte/transition';
	import type { Attachment } from 'svelte/attachments';
	import HoverCard from '../HoverCard/HoverCard.svelte';
	import ScrollArea from '../ScrollArea/ScrollArea.svelte';
	import Slot from '../Slot/Slot.svelte';
	import type { AIThreadItem, AIThreadTocEntry, AIThreadTocProps } from './aiThreadToc.props.js';
	import type { AIThreadTocPin } from '../AIThread/aiThread.props.js';
	import { useAIThreadTocTheme } from './aiThreadToc.theme.js';
	import AIThreadTocPreview from './AIThreadTocPreview.svelte';
	import {
		compactAIThreadTocEntries,
		getAIThreadTocLabel,
		isAIThreadTocEntryVisible
	} from './aiThreadToc.js';

	const PIN_GAP = 10;
	const PIN_STACK_MIN_HEIGHT = 56;
	const PIN_STACK_MAX_HEIGHT = 360;
	const PIN_STACK_INTERACTION_PADDING = 12;
	const PIN_MAGNIFICATION_RADIUS = 44;
	const PIN_MAX_SCALE = 2.25;
	const PIN_TARGET_SCALE = 2.75;
	const PIN_NEIGHBOR_MAX_OPACITY = 0.68;
	const PREVIEW_DELAY = 80;
	const PREVIEW_CLOSE_DELAY = 120;
	const PREVIEW_GAP = 10;
	const PIN_ACTIVE_OPACITY = 1;
	const PIN_VISIBLE_OPACITY = 0.55;
	const PIN_IDLE_OPACITY = 0.28;
	const DEFAULT_MIN_CONTAINER_WIDTH = 480;

	let {
		ref = $bindable(),
		state: tocState,
		maxPins = 96,
		scrollAreaLabel,
		side = 'left',
		previewSide,
		previewAlign = 'center',
		minContainerWidth = DEFAULT_MIN_CONTAINER_WIDTH,
		pin,
		preview,
		title,
		excerpt,
		metadata,
		icon,
		class: className,
		theme,
		...rootAttributes
	}: AIThreadTocProps<TMessage> = $props();

	let previewEntry = $state<AIThreadTocEntry<TMessage>>();
	let previewOpen = $state(false);
	let pointerPinIndex = $state<number>();
	let pointerPinPosition = $state<number>();
	let focusedPinIndex = $state<number>();
	let pinAreaElement = $state<HTMLDivElement>();
	// Roving tab stop: the last pin focused from the keyboard (the first pin until then). It never
	// follows the active turn, so scrolling the thread writes no `tabindex`; a keyboard entry into
	// the rail moves on to the active pin instead (see `handlePinFocus`).
	let rovingKey = $state<string>();
	// Width of the surrounding container, measured while the rail is mounted.
	let containerWidth = $state<number>();
	const narrow = $derived(
		minContainerWidth > 0 && containerWidth !== undefined && containerWidth < minContainerWidth
	);
	// A touch tap previews a pin first; a second tap on the same pin navigates.
	let lastPointerType: string | undefined;
	let touchPreviewKey = $state<string>();
	let pendingPointerY: number | undefined;
	let pointerFrame: number | undefined;
	let previewOpenTimer: ReturnType<typeof setTimeout> | undefined;
	let previewCloseTimer: ReturnType<typeof setTimeout> | undefined;
	// The TOC state is rebuilt on every scroll. Keep the previous pins while they still show the same
	// entries: new pin objects make the keyed list run its flip animation, which measures every pin
	// with getBoundingClientRect on each scroll event and made scrolling stutter.
	let previousPins: AIThreadTocPin<TMessage>[] = [];
	const t = $derived(useI18n());
	const pins = $derived.by(() => {
		const next = compactAIThreadTocEntries<TMessage>(tocState.entries, {
			maxPins,
			activeEntryIndex: tocState.activeIndex
		});
		const same =
			next.length === previousPins.length &&
			next.every((pin, index) => {
				const previous = previousPins[index];
				return (
					pin.key === previous.key &&
					pin.isBucket === previous.isBucket &&
					pin.entry.index === previous.entry.index &&
					pin.entry.title === previous.entry.title &&
					pin.entry.excerpt === previous.entry.excerpt &&
					pin.entry.fileCount === previous.entry.fileCount
				);
			});
		if (!same) previousPins = next;
		return previousPins;
	});
	// Built once per pin list: in the template the label would be re-truncated on every scroll,
	// because it updates with the pin's active and visible state.
	const pinLabels = $derived(pins.map((tocPin) => getAIThreadTocLabel(tocPin.entry, t)));
	const visibleStartPercent = $derived(offsetPercent(tocState.visibleStartOffset));
	const visibleEndPercent = $derived(offsetPercent(tocState.visibleEndOffset));
	const visibleRangePercent = $derived(Math.max(0, visibleEndPercent - visibleStartPercent));
	const stackHeight = $derived(pinStackHeight(pins.length));
	const trackHeight = $derived(stackHeight + PIN_STACK_INTERACTION_PADDING * 2);
	const magnifiedPinPosition = $derived(pointerPinPosition ?? focusedPinIndex);
	const targetedPinIndex = $derived(pointerPinIndex ?? focusedPinIndex);
	const previewPinIndex = $derived(
		previewEntry ? pins.findIndex((tocPin) => tocPin.entry.key === previewEntry?.key) : -1
	);
	const previewPinTop = $derived(
		previewPinIndex >= 0 ? pinStackTopPercent(previewPinIndex, pins.length) : 50
	);
	const resolvedPreviewPosition = $derived(previewPosition());
	const activePinIndex = $derived(
		pins.findIndex((tocPin) => tocPin.entryIndex === tocState.activeIndex)
	);
	const tabStopIndex = $derived(
		Math.max(0, rovingKey === undefined ? 0 : pins.findIndex((tocPin) => tocPin.key === rovingKey))
	);
	const previewTurn = $derived(
		previewEntry ? tocState.entries.findIndex((entry) => entry.key === previewEntry?.key) + 1 : 0
	);
	const pinTransitionDuration = $derived(prefersReducedMotion() ? 0 : 240);
	const pinFlipDuration = $derived(prefersReducedMotion() ? 0 : 170);
	const classes = $derived(useAIThreadTocTheme(theme));

	function offsetPercent(offset: number): number {
		const rangeSize =
			tocState.range.endOffset - tocState.range.startOffset || tocState.range.totalSize;
		if (rangeSize <= 0) return 0;
		return Math.max(0, Math.min(100, ((offset - tocState.range.startOffset) / rangeSize) * 100));
	}

	function pinStackHeight(pinCount: number): number {
		if (pinCount <= 0) return 0;
		return Math.min(PIN_STACK_MAX_HEIGHT, Math.max(PIN_STACK_MIN_HEIGHT, (pinCount - 1) * PIN_GAP));
	}

	function pinStackTopPercent(pinIndex: number, pinCount: number): number {
		if (pinCount <= 1) return 50;
		return (pinIndex / (pinCount - 1)) * 100;
	}

	function pinInfluence(pinIndex: number): number {
		if (magnifiedPinPosition === undefined) return 0;
		const gap = pins.length <= 1 ? PIN_GAP : stackHeight / (pins.length - 1);
		const distance = Math.abs(pinIndex - magnifiedPinPosition) * gap;
		const proximity = Math.max(0, 1 - distance / PIN_MAGNIFICATION_RADIUS);
		return proximity * proximity * (3 - 2 * proximity);
	}

	function pinScale(influence: number, targeted: boolean): string {
		if (targeted) return PIN_TARGET_SCALE.toFixed(3);
		return (1 + influence * (PIN_MAX_SCALE - 1)).toFixed(3);
	}

	function pinOpacity(
		influence: number,
		active: boolean,
		visible: boolean,
		targeted: boolean
	): string {
		if (targeted) return '1';
		const baseOpacity = active
			? PIN_ACTIVE_OPACITY
			: visible
				? PIN_VISIBLE_OPACITY
				: PIN_IDLE_OPACITY;
		const peakOpacity = Math.max(baseOpacity, PIN_NEIGHBOR_MAX_OPACITY);
		return (baseOpacity + influence * (peakOpacity - baseOpacity)).toFixed(3);
	}

	function activate(entry: AIThreadTocEntry<TMessage>): void {
		tocState.scrollToIndex(entry.index);
	}

	function handlePinPointerDown(event: PointerEvent): void {
		lastPointerType = event.pointerType;
	}

	function handlePinClick(entry: AIThreadTocEntry<TMessage>, pinIndex: number, key: string): void {
		const touch = lastPointerType === 'touch';
		lastPointerType = undefined;
		if (touch && touchPreviewKey !== key) {
			touchPreviewKey = key;
			pointerPinPosition = pinIndex;
			pointerPinIndex = pinIndex;
			openPreview(entry, true);
			return;
		}
		if (touch) closeTouchPreview();
		activate(entry);
	}

	function closeTouchPreview(): void {
		if (touchPreviewKey === undefined) return;
		touchPreviewKey = undefined;
		pointerPinIndex = undefined;
		pointerPinPosition = undefined;
		schedulePreviewClose();
	}

	// A touch preview closes on the next tap outside the rail.
	$effect(() => {
		if (touchPreviewKey === undefined || !ref) return;
		const root = ref;
		const ownerDocument = root.ownerDocument;
		const handlePointerDown = (event: PointerEvent) => {
			if (event.target instanceof Node && root.contains(event.target)) return;
			closeTouchPreview();
		};
		ownerDocument.addEventListener('pointerdown', handlePointerDown, true);
		return () => ownerDocument.removeEventListener('pointerdown', handlePointerDown, true);
	});

	function handleStackKeydown(event: KeyboardEvent): void {
		if (event.altKey || event.ctrlKey || event.metaKey || pins.length === 0) return;
		const current =
			event.target instanceof Element ? event.target.closest('[data-toc-pin-key]') : null;
		if (!current) return;
		const index = pins.findIndex(
			(tocPin) => tocPin.key === current.getAttribute('data-toc-pin-key')
		);
		let next: number;
		if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = index + 1;
		else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = index - 1;
		else if (event.key === 'Home') next = 0;
		else if (event.key === 'End') next = pins.length - 1;
		else return;
		event.preventDefault();
		focusPin(Math.max(0, Math.min(pins.length - 1, next)));
	}

	function focusPin(pinIndex: number): void {
		const tocPin = pins[pinIndex];
		if (!tocPin || !pinAreaElement) return;
		rovingKey = tocPin.key;
		const element = Array.from(
			pinAreaElement.querySelectorAll<HTMLElement>('[data-slot="ai-thread-toc-pin"]')
		).find((candidate) => candidate.dataset.tocPinKey === tocPin.key);
		element?.focus();
	}

	// The rail is a wide-layout affordance: it removes itself when the surrounding container (the
	// nearest ancestor wider than the rail, typically the thread) is narrower than
	// `minContainerWidth`.
	const watchContainer: Attachment<HTMLElement> = (node) => {
		if (typeof ResizeObserver === 'undefined') return;
		let container = node.parentElement;
		while (container && container.clientWidth <= node.offsetWidth + 1) {
			container = container.parentElement;
		}
		if (!container) return;
		const measured = container;
		// Only the width is stored; `narrow` derives from it, so a new `minContainerWidth` applies
		// at once instead of waiting for the next resize.
		const measure = () => {
			containerWidth = measured.clientWidth;
		};
		const observer = new ResizeObserver(measure);
		observer.observe(measured);
		measure();
		return () => {
			observer.disconnect();
			containerWidth = undefined;
		};
	};

	function handleStackPointerMove(event: PointerEvent): void {
		if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
		pendingPointerY = event.clientY;
		if (pointerFrame !== undefined) return;
		pointerFrame = requestAnimationFrame(flushPendingPointer);
	}

	function flushPendingPointer(): void {
		pointerFrame = undefined;
		const clientY = pendingPointerY;
		pendingPointerY = undefined;
		if (clientY === undefined) return;
		const pinPosition = getPointerPinPosition(clientY);
		if (pinPosition === undefined) return;
		pointerPinPosition = pinPosition;
		activatePointerPin(Math.round(pinPosition));
	}

	function getPointerPinPosition(clientY: number): number | undefined {
		if (!pinAreaElement || pins.length === 0) return undefined;
		if (pins.length === 1) return 0;
		const rect = pinAreaElement.getBoundingClientRect();
		if (rect.height <= 0) return undefined;
		const ratio = Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));
		return ratio * (pins.length - 1);
	}

	function activatePointerPin(pinIndex: number): void {
		const tocPin = pins[pinIndex];
		if (!tocPin) return;
		pointerPinIndex = pinIndex;
		openPreview(tocPin.entry);
	}

	function handleStackPointerLeave(): void {
		cancelPendingPointer();
		pointerPinIndex = undefined;
		pointerPinPosition = undefined;
		const focusedPin = focusedPinIndex === undefined ? undefined : pins[focusedPinIndex];
		if (focusedPin) {
			openPreview(focusedPin.entry, true);
			return;
		}
		schedulePreviewClose();
	}

	function handleStackClick(event: MouseEvent): void {
		if (
			event.target instanceof Element &&
			event.target.closest('[data-slot="ai-thread-toc-pin"]')
		) {
			return;
		}
		const pinPosition = getPointerPinPosition(event.clientY);
		if (pinPosition === undefined) return;
		pointerPinPosition = pinPosition;
		const pinIndex = Math.round(pinPosition);
		const tocPin = pins[pinIndex];
		if (!tocPin) return;
		if (lastPointerType === 'touch') {
			handlePinClick(tocPin.entry, pinIndex, tocPin.key);
			return;
		}
		activatePointerPin(pinIndex);
		activate(tocPin.entry);
	}

	function handlePinFocus(
		event: FocusEvent,
		entry: AIThreadTocEntry<TMessage>,
		pinIndex: number
	): void {
		const target = event.currentTarget as HTMLElement;
		if (!target.matches(':focus-visible')) {
			focusedPinIndex = undefined;
			return;
		}
		// Tab (or Shift+Tab) into the rail lands on the resting tab stop; the active turn's pin is
		// where a keyboard user expects to start.
		const from = event.relatedTarget;
		const entering = !(from instanceof Node && pinAreaElement?.contains(from));
		if (entering && activePinIndex >= 0 && activePinIndex !== pinIndex) {
			focusPin(activePinIndex);
			return;
		}
		focusedPinIndex = pinIndex;
		rovingKey = pins[pinIndex]?.key;
		openPreview(entry, true);
	}

	function handleStackFocusOut(event: FocusEvent): void {
		const next = event.relatedTarget as Node | null;
		if (next && event.currentTarget instanceof HTMLElement && event.currentTarget.contains(next))
			return;
		focusedPinIndex = undefined;
		const pointerPin = pointerPinIndex === undefined ? undefined : pins[pointerPinIndex];
		if (pointerPin) {
			openPreview(pointerPin.entry);
			return;
		}
		schedulePreviewClose();
	}

	function openPreview(entry: AIThreadTocEntry<TMessage>, immediately = false): void {
		clearPreviewCloseTimer();
		previewEntry = entry;
		if (previewOpen) return;
		if (immediately) {
			clearPreviewOpenTimer();
			previewOpen = true;
			return;
		}
		if (previewOpenTimer !== undefined) return;
		previewOpenTimer = setTimeout(() => {
			previewOpenTimer = undefined;
			if (previewEntry && (pointerPinIndex !== undefined || focusedPinIndex !== undefined)) {
				previewOpen = true;
			}
		}, PREVIEW_DELAY);
	}

	function schedulePreviewClose(): void {
		clearPreviewOpenTimer();
		if (!previewOpen) {
			previewEntry = undefined;
			return;
		}
		if (previewCloseTimer !== undefined) return;
		previewCloseTimer = setTimeout(() => {
			previewCloseTimer = undefined;
			previewOpen = false;
			previewEntry = undefined;
		}, PREVIEW_CLOSE_DELAY);
	}

	function clearPreviewOpenTimer(): void {
		if (previewOpenTimer === undefined) return;
		clearTimeout(previewOpenTimer);
		previewOpenTimer = undefined;
	}

	function clearPreviewCloseTimer(): void {
		if (previewCloseTimer === undefined) return;
		clearTimeout(previewCloseTimer);
		previewCloseTimer = undefined;
	}

	function cancelPendingPointer(): void {
		if (pointerFrame !== undefined) cancelAnimationFrame(pointerFrame);
		pointerFrame = undefined;
		pendingPointerY = undefined;
	}

	function previewPosition():
		'left' | 'left-start' | 'left-end' | 'right' | 'right-start' | 'right-end' {
		const resolvedSide = previewSide ?? (side === 'right' ? 'left' : 'right');
		if (previewAlign === 'center') return resolvedSide;
		if (resolvedSide === 'left') return previewAlign === 'start' ? 'left-start' : 'left-end';
		return previewAlign === 'start' ? 'right-start' : 'right-end';
	}

	onDestroy(() => {
		cancelPendingPointer();
		clearPreviewOpenTimer();
		clearPreviewCloseTimer();
	});
</script>

{#snippet previewAnchor()}{/snippet}

{#snippet previewCard()}
	{#if previewEntry}
		<AIThreadTocPreview
			entry={previewEntry}
			turn={previewTurn}
			total={tocState.entries.length}
			{preview}
			{title}
			{excerpt}
			{metadata}
			{icon}
			{theme}
		/>
	{/if}
{/snippet}

<nav
	bind:this={ref}
	data-slot="ai-thread-toc"
	aria-label={t.threadMinimap}
	data-narrow={narrow || undefined}
	hidden={narrow || undefined}
	class={classes.root({ side, className })}
	{...rootAttributes}
	{@attach watchContainer}
>
	{#if pins.length > 0 && !narrow}
		<ScrollArea
			label={scrollAreaLabel ?? t.threadMinimapEntries}
			viewportAttrs={{ tabindex: -1 }}
			class={classes.scrollArea()}
			theme={aiThreadTocScrollAreaTheme}
		>
			<div class={classes.scrollContent()}>
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div
					data-slot="ai-thread-toc-stack"
					data-interacting={magnifiedPinPosition !== undefined ? 'true' : undefined}
					class={classes.track()}
					style:height={`${trackHeight}px`}
					onpointermove={handleStackPointerMove}
					onpointerleave={handleStackPointerLeave}
					onpointerdown={handlePinPointerDown}
					onfocusout={handleStackFocusOut}
					onkeydown={handleStackKeydown}
					onclick={handleStackClick}
				>
					<div
						bind:this={pinAreaElement}
						data-slot="ai-thread-toc-pin-area"
						class={classes.pinArea()}
						style={`--ai-thread-toc-preview-top: ${previewPinTop}%`}
					>
						<div data-slot="ai-thread-toc-rail" class={classes.rail()}>
							<div
								data-slot="ai-thread-toc-viewport"
								class={classes.viewport()}
								style:top={`${visibleStartPercent}%`}
								style:height={`${visibleRangePercent}%`}
							></div>
						</div>

						{#each pins as tocPin, pinIndex (tocPin.key)}
							{@const active = tocPin.entryIndex === tocState.activeIndex}
							{@const visible = isAIThreadTocEntryVisible(tocPin.entry, tocState)}
							{@const influence = pinInfluence(pinIndex)}
							{@const targeted = pinIndex === targetedPinIndex}
							<button
								type="button"
								data-slot="ai-thread-toc-pin"
								data-toc-pin-key={tocPin.key}
								data-active={active}
								data-visible={visible}
								data-bucket={tocPin.isBucket}
								data-magnified={influence > 0 ? 'true' : undefined}
								data-targeted={targeted ? 'true' : undefined}
								tabindex={pinIndex === tabStopIndex ? 0 : -1}
								class={classes.pin({ side, active })}
								style:top={`${pinStackTopPercent(pinIndex, pins.length)}%`}
								style:transform-origin={side === 'left' ? 'left center' : 'right center'}
								aria-label={pinLabels[pinIndex]}
								aria-current={active ? 'location' : undefined}
								animate:flip={{ duration: pinFlipDuration, easing: quintOut }}
								transition:scale={{
									duration: pinTransitionDuration,
									start: 0.65,
									easing: quintOut
								}}
								onfocus={(event) => handlePinFocus(event, tocPin.entry, pinIndex)}
								onclick={() => handlePinClick(tocPin.entry, pinIndex, tocPin.key)}
							>
								{#if pin}
									<Slot render={pin} payload={{ entry: tocPin.entry, active }} />
								{:else}
									<span
										data-slot="ai-thread-toc-pin-indicator"
										class={classes.pinIndicator({ side })}
										style:--ai-thread-toc-scale={pinScale(influence, targeted)}
										style:--ai-thread-toc-opacity={pinOpacity(influence, active, visible, targeted)}
									></span>
								{/if}
							</button>
						{/each}

						{#if previewEntry && previewPinIndex >= 0}
							<HoverCard
								bind:open={previewOpen}
								trigger={previewAnchor}
								children={previewCard}
								position={resolvedPreviewPosition}
								offset={PREVIEW_GAP}
								delay={0}
								closeDelay={0}
								openOnFocus={false}
								openOnClick={false}
								closeOnClickOutside={false}
								class="w-80 max-w-[calc(100vw-8rem)]"
								triggerClass={classes.previewAnchor({ side })}
								popover={{
									class: 'pointer-events-none',
									theme: aiThreadTocPopoverTheme
								}}
								onAfterClose={() => {
									if (!previewOpen) previewEntry = undefined;
								}}
							/>
						{/if}
					</div>
				</div>
			</div>
		</ScrollArea>
	{/if}
</nav>
