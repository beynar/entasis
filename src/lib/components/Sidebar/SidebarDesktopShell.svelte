<script lang="ts">
	import type { Snippet } from 'svelte';
	import { on } from 'svelte/events';
	import { useSafeArea } from '$lib/utils/safeArea.svelte.js';
	import type { LayerHandle } from '$lib/utils/layers.svelte.js';
	import { cx } from '$lib/utils/cva/index.js';
	import {
		type SidebarActivityBar as SidebarActivityBarConfig,
		type SidebarCollapsible,
		type SidebarDisplayState,
		type SidebarDensity,
		type SidebarFrame,
		type SidebarRail,
		type SidebarSide,
		type SidebarSize,
		type SidebarState,
		type SidebarVariant
	} from './sidebar.props.js';
	import {
		getSidebarActivityBarContainerClass,
		getSidebarContainerClass,
		getSidebarGapClass,
		getSidebarPanelPeekClass
	} from './sidebar-layout.js';
	import type { SidebarResizeState } from './sidebar.resize.svelte.js';
	import SidebarActivityBar from './SidebarActivityBar.svelte';
	import { useSidebarTheme, type SidebarThemeProps } from './sidebar.theme.js';
	import { useDefaultColor, useTheme } from '../Theme/theme.state.svelte.js';

	let {
		sidebarState,
		displayState,
		collapsibleState,
		variant,
		side,
		frame,
		size,
		iconSize,
		density,
		rail,
		edgeReveal,
		expandOnHover,
		activityBar,
		activityBarLabel,
		toggleLabel,
		resizeLabel,
		collapsedResizeLabel,
		openLabel,
		toggle,
		open,
		edgeRevealed = $bindable(false),
		hoverExpanded = $bindable(false),
		resize,
		theme,
		children
	}: {
		sidebarState: SidebarState;
		displayState: SidebarDisplayState;
		collapsibleState: SidebarCollapsible | '';
		variant: SidebarVariant;
		side: SidebarSide;
		frame: SidebarFrame;
		size: SidebarSize;
		iconSize?: SidebarSize;
		density: SidebarDensity;
		rail: SidebarRail;
		edgeReveal: boolean;
		expandOnHover: boolean;
		activityBar?: SidebarActivityBarConfig;
		activityBarLabel: string;
		toggleLabel: string;
		resizeLabel: string;
		collapsedResizeLabel: string;
		openLabel: string;
		toggle: () => void;
		open: () => void;
		edgeRevealed?: boolean;
		hoverExpanded?: boolean;
		resize: SidebarResizeState;
		theme?: SidebarThemeProps;
		children: Snippet;
	} = $props();

	// Grace window for the peeks this component dismisses itself (see `needsReleaseTimer`),
	// matching the safe area's own delay so a boundary jitter never dismisses the panel.
	const PEEK_RELEASE_DELAY = 120;

	const classes = $derived(useSidebarTheme(theme));
	const resolvedColor = $derived(useDefaultColor());
	const layerStack = useTheme().layers;
	const showEdgeTrigger = $derived(edgeReveal && displayState === 'hidden');
	const hasRail = $derived(rail !== false);
	const railAppearance = $derived(rail === 'thumb' ? 'thumb' : 'line');
	const resizeControlLabel = $derived(hasRail ? `${resizeLabel}; ${toggleLabel}` : resizeLabel);
	const resizeValueText = $derived(
		displayState === 'collapsed' ? collapsedResizeLabel : `${resize.displayWidth}px`
	);

	let panelRef: HTMLElement | null = $state(null);
	let resizeHandleRef: HTMLElement | null = $state(null);
	let edgeTriggerRef: HTMLButtonElement | null = $state(null);

	let focusInside = $state(false);
	let pointerInside = $state(false);

	const canHoverExpand = $derived(
		expandOnHover && collapsibleState === 'icon' && displayState === 'collapsed'
	);
	const isHoverExpanded = $derived(canHoverExpand && hoverExpanded);
	const isPeeking = $derived(edgeRevealed || isHoverExpanded);

	// An overlay opened from inside the panel (a row's PopupMenu, or a submenu of it) is
	// portaled out of the panel, so its own nodes are elsewhere. Walking `.parent` finds the
	// ancestor layer whose trigger still lives inside the panel.
	const hasOpenLayerInside = $derived.by(() => {
		const panel = panelRef;
		if (!panel || !layerStack) return false;

		return layerStack.open.some((layer) => {
			for (let current: LayerHandle | null = layer; current; current = current.parent) {
				for (const node of current.nodes) {
					if (panel.contains(node)) return true;
				}
			}
			return false;
		});
	});
	/** A peek must survive a pointer that left: focus or an open overlay pins it open. */
	const isPeekPinned = $derived(focusInside || hasOpenLayerInside);

	// The nodes a pointer or focus may sit on without ending the peek. The cast keeps the
	// array from narrowing to `null[]`: these refs are only ever assigned through `bind:this`.
	const peekRegion = $derived(
		([panelRef, edgeTriggerRef, resizeHandleRef] as (HTMLElement | null)[]).filter(
			(node): node is HTMLElement => node !== null
		)
	);

	const revealSafeArea = useSafeArea({
		isActive: () => showEdgeTrigger && edgeRevealed && !resize.isResizing && !isPeekPinned,
		callback: () => (edgeRevealed = false),
		offset: 8,
		trackPosition: true
	});

	$effect(() => {
		if (showEdgeTrigger) return;
		edgeRevealed = false;
	});

	$effect(() => {
		if (canHoverExpand) return;
		hoverExpanded = false;
	});

	// A hidden panel is inert, so focus cannot be inside it: clearing the latch keeps a stale
	// `focusin` from pinning the next peek open for good.
	$effect(() => {
		if (!focusInside || displayState !== 'hidden' || isPeeking) return;
		focusInside = false;
	});

	$effect(() => {
		const nodes = peekRegion;
		if (!nodes.length) return;

		const isInside = (target: EventTarget | null) =>
			target instanceof Node && nodes.some((node) => node.contains(target));
		const offs = nodes.flatMap((node) => [
			on(node, 'focusin', () => {
				focusInside = true;
				if (canHoverExpand) hoverExpanded = true;
			}),
			on(node, 'focusout', (event) => {
				focusInside = isInside(event.relatedTarget);
			}),
			on(node, 'pointerenter', () => {
				pointerInside = true;
				if (canHoverExpand) hoverExpanded = true;
			}),
			on(node, 'pointerleave', (event) => {
				pointerInside = isInside(event.relatedTarget);
			})
		]);
		return () => offs.forEach((off) => off());
	});

	// `revealSafeArea` owns edge-reveal dismissal, and its tolerance rectangle is what lets a
	// pointer graze the panel edge without losing the reveal. It stops listening while a peek is
	// pinned, though, so a pin that releases with the pointer already gone leaves nobody to close
	// the panel: this records that a pin happened so the timer below can cover that one case.
	let edgeRevealWasPinned = $state(false);
	$effect(() => {
		if (!edgeRevealed) {
			edgeRevealWasPinned = false;
			return;
		}
		if (isPeekPinned) edgeRevealWasPinned = true;
	});

	// A hover expand runs no safe area of its own, so the timer is its only release. An edge
	// reveal that was never pinned keeps its tolerance and is left to `revealSafeArea`.
	const needsReleaseTimer = $derived(isHoverExpanded || (edgeRevealed && edgeRevealWasPinned));

	$effect(() => {
		if (!needsReleaseTimer || isPeekPinned || pointerInside || resize.isResizing) return;

		const timer = setTimeout(() => {
			edgeRevealed = false;
			hoverExpanded = false;
		}, PEEK_RELEASE_DELAY);
		return () => clearTimeout(timer);
	});

	$effect(() => {
		if (displayState === 'hidden') return;
		resize.releaseEdgeRevealSuppression();
	});

	$effect(() => {
		if (!showEdgeTrigger || !resize.isEdgeRevealSuppressed) return;

		return on(window, 'pointermove', (event) => {
			if (event.buttons !== 0) return;

			const trigger = edgeTriggerRef;
			if (!trigger) return;

			const rect = trigger.getBoundingClientRect();
			const isInside =
				event.clientX >= rect.left &&
				event.clientX <= rect.right &&
				event.clientY >= rect.top &&
				event.clientY <= rect.bottom;
			if (!isInside) resize.releaseEdgeRevealSuppression();
		});
	});

	$effect(() => {
		const node = panelRef;
		resize.panelNode = node;
		return () => {
			if (resize.panelNode === node) {
				resize.panelNode = null;
			}
		};
	});

	const onResizeHandleKeydown = (event: KeyboardEvent) => {
		if (hasRail && (event.key === 'Enter' || event.key === ' ')) {
			event.preventDefault();
			toggle();
			return;
		}
		resize.handleKeydown(event);
	};
	const onResizeHandleClick = () => {
		if (!hasRail || !resize.consumeClickAfterResize()) return;
		toggle();
	};
</script>

<div
	class={cx(
		'group peer text-neutral duration-normal data-[display-state=hidden]:duration-instant relative z-0 hidden transition-[z-index] [transition-timing-function:step-end] data-[display-state=hidden]:z-20 data-[edge-revealed=true]:!z-30 data-[peek=true]:!z-30 data-[side=right]:order-last md:block',
		frame === 'contained' && 'sticky top-0 max-h-[var(--window-height,100dvh)]'
	)}
	data-slot="sidebar"
	data-state={sidebarState}
	data-display-state={displayState}
	data-resizing={resize.shouldSuppressTransitions ? 'true' : undefined}
	data-edge-revealed={edgeRevealed ? 'true' : undefined}
	data-peek={isHoverExpanded ? 'true' : undefined}
	data-activity-bar={activityBar ? 'true' : undefined}
	data-collapsible={isHoverExpanded ? '' : collapsibleState}
	data-variant={variant}
	data-side={side}
	data-size={size}
	data-density={density}
	data-rail={hasRail ? railAppearance : undefined}
>
	<div data-slot="sidebar-spacer" class={getSidebarGapClass(variant)}></div>
	{#if activityBar}
		<!-- Pinned outside the panel and never offset by the collapse state, so the rail stays
			 on screen while the panel slides away. -->
		<div
			data-slot="sidebar-activity-bar-container"
			data-side={side}
			class={getSidebarActivityBarContainerClass(side, frame)}
		>
			<SidebarActivityBar {activityBar} {side} {size} {density} label={activityBarLabel} {theme} />
		</div>
	{/if}
	<!-- A hidden panel is parked off screen: `inert` keeps Tab out of it, so focus cannot land
		 there and pin a later peek open. A peek makes it interactive again. -->
	<div
		bind:this={panelRef}
		{@attach revealSafeArea.reference}
		data-slot="sidebar-container"
		data-side={side}
		inert={displayState === 'hidden' && !isPeeking ? true : undefined}
		class={getSidebarContainerClass(side, variant, edgeRevealed, frame)}
	>
		<div
			data-sidebar="sidebar"
			data-slot="sidebar-panel"
			data-color={resolvedColor}
			data-side={side}
			class={classes.panel({
				variant,
				placement: 'positioned',
				size,
				iconSize,
				density,
				className: getSidebarPanelPeekClass(variant)
			})}
		>
			{@render children()}
		</div>
	</div>
	{#if hasRail && !resize.enabled}
		<button
			type="button"
			data-slot="sidebar-rail"
			data-sidebar="rail"
			data-side={side}
			data-appearance={railAppearance}
			aria-label={toggleLabel}
			tabindex={-1}
			title={toggleLabel}
			class={classes.rail({ variant, side, appearance: railAppearance })}
			onclick={toggle}
		></button>
	{/if}
	{#if resize.enabled}
		<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
		<div
			bind:this={resizeHandleRef}
			{@attach revealSafeArea.reference}
			role="separator"
			tabindex="0"
			aria-orientation="vertical"
			aria-valuenow={resize.displayWidth}
			aria-valuemin={resize.displayMinWidth}
			aria-valuemax={resize.maxWidth}
			aria-valuetext={resizeValueText}
			aria-label={resizeControlLabel}
			title={resizeControlLabel}
			data-slot="sidebar-resize-handle"
			data-sidebar="resize-handle"
			data-side={side}
			data-appearance={hasRail ? railAppearance : undefined}
			data-dragging={resize.isDragging ? 'true' : undefined}
			onkeydown={onResizeHandleKeydown}
			onclick={onResizeHandleClick}
			{@attach resize.handleAttachment}
			class={classes.resizeHandle({
				variant,
				side,
				dragging: resize.isDragging,
				disabled: false,
				combined: hasRail,
				appearance: railAppearance
			})}
		></div>
	{/if}
	{#if showEdgeTrigger}
		<button
			bind:this={edgeTriggerRef}
			{@attach revealSafeArea.reference}
			type="button"
			data-slot="sidebar-edge-trigger"
			data-sidebar="edge-trigger"
			data-side={side}
			aria-label={openLabel}
			tabindex={-1}
			title={openLabel}
			class={classes.edgeTrigger({
				className:
					activityBar &&
					(side === 'left'
						? '!left-[var(--sidebar-width-activity,3rem)]'
						: '!right-[var(--sidebar-width-activity,3rem)]')
			})}
			onpointerenter={() => {
				if (!resize.isEdgeRevealSuppressed) edgeRevealed = true;
			}}
			onfocus={() => (edgeRevealed = true)}
			onclick={open}
		></button>
	{/if}
</div>
