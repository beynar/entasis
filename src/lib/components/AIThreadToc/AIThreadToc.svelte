<script lang="ts" generics="TMessage extends AIThreadItem = AIThreadItem">
	import { aiThreadTocPopoverTheme } from './aiThreadToc.popover.theme.js';
	import { aiThreadTocScrollAreaTheme } from './aiThreadToc.scrollArea.theme.js';
	import { onDestroy } from 'svelte';
	import { flip } from 'svelte/animate';
	import { quintOut } from 'svelte/easing';
	import { MediaQuery } from 'svelte/reactivity';
	import { scale } from 'svelte/transition';
	import HoverCard from '../HoverCard/HoverCard.svelte';
	import ScrollArea from '../ScrollArea/ScrollArea.svelte';
	import Slot from '../Slot/Slot.svelte';
	import type { AIThreadItem, AIThreadTocEntry, AIThreadTocProps } from './aiThreadToc.props.js';
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

	let {
		ref = $bindable(),
		state: tocState,
		maxPins = 96,
		scrollAreaLabel = 'Thread minimap entries',
		side = 'left',
		previewSide,
		previewAlign = 'center',
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
	let pendingPointerY: number | undefined;
	let pointerFrame: number | undefined;
	let previewOpenTimer: ReturnType<typeof setTimeout> | undefined;
	let previewCloseTimer: ReturnType<typeof setTimeout> | undefined;
	const prefersReducedMotion = new MediaQuery('(prefers-reduced-motion: reduce)');
	const pins = $derived(
		compactAIThreadTocEntries<TMessage>(tocState.entries, {
			maxPins,
			activeEntryIndex: tocState.activeIndex
		})
	);
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
	const pinTransitionDuration = $derived(prefersReducedMotion.current ? 0 : 240);
	const pinFlipDuration = $derived(prefersReducedMotion.current ? 0 : 170);
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
		const baseOpacity = active || visible ? 0.8 : 0.32;
		const peakOpacity = Math.max(baseOpacity, PIN_NEIGHBOR_MAX_OPACITY);
		return (baseOpacity + influence * (peakOpacity - baseOpacity)).toFixed(3);
	}

	function activate(entry: AIThreadTocEntry<TMessage>): void {
		tocState.scrollToIndex(entry.index);
	}

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
		focusedPinIndex = pinIndex;
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
	aria-label="Thread minimap"
	class={classes.root({ side, className })}
	{...rootAttributes}
>
	{#if pins.length > 0}
		<ScrollArea
			ariaLabel={scrollAreaLabel}
			class={classes.scrollArea()}
			theme={aiThreadTocScrollAreaTheme}
		>
			<div class={classes.scrollContent()}>
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div
					data-slot="ai-thread-toc-stack"
					data-interacting={magnifiedPinPosition !== undefined ? 'true' : undefined}
					class={classes.track()}
					style:height={`${trackHeight}px`}
					onpointermove={handleStackPointerMove}
					onpointerleave={handleStackPointerLeave}
					onfocusout={handleStackFocusOut}
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
								class={classes.pin({ side, active })}
								style:top={`${pinStackTopPercent(pinIndex, pins.length)}%`}
								style:transform-origin={side === 'left' ? 'left center' : 'right center'}
								aria-label={getAIThreadTocLabel(tocPin.entry)}
								aria-current={active ? 'location' : undefined}
								animate:flip={{ duration: pinFlipDuration, easing: quintOut }}
								transition:scale={{
									duration: pinTransitionDuration,
									start: 0.65,
									easing: quintOut
								}}
								onfocus={(event) => handlePinFocus(event, tocPin.entry, pinIndex)}
								onclick={() => activate(tocPin.entry)}
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
								content={previewCard}
								position={resolvedPreviewPosition}
								offset={PREVIEW_GAP}
								delay={0}
								closeDelay={0}
								openOnFocus={false}
								openOnClick={false}
								closeOnClickOutside={false}
								class="w-80 max-w-[calc(100vw-8rem)]"
								triggerClass={classes.previewAnchor({ side })}
								popoverClass="pointer-events-none"
								popoverTheme={aiThreadTocPopoverTheme}
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
