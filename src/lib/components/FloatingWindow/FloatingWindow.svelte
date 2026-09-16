<script lang="ts">
	import { untrack } from 'svelte';
	import { createBindableValue } from '$lib/utils/state.svelte.js';
	import { crossfade, scale } from 'svelte/transition';
	import { easingFunctions } from '$lib/transitions/easingFunctions.js';
	import Button from '../Button/Button.svelte';
	import { minusIcon } from '../Icons/minus.js';
	import { squareIcon } from '../Icons/square.js';
	import { xIcon } from '../Icons/x.js';
	import ScrollArea from '../ScrollArea/ScrollArea.svelte';
	import Slot from '../Slot/Slot.svelte';
	import type {
		FloatingWindowProps,
		FloatingWindowResizeDirection
	} from './floatingWindow.props.js';
	import { FloatingWindowState } from './floatingWindow.state.svelte.js';
	import { useFloatingWindowMotion, useFloatingWindowTheme } from './floatingWindow.theme.js';
	import { useI18n } from '$lib/i18n/context.svelte.js';

	let {
		id: customId,
		ref = $bindable(),
		defaultOpen = true,
		open = $bindable(),
		minimized = $bindable(false),
		dockPlacement = 'bottom-left',
		title,
		children,
		dragFrom = 'header',
		draggable = true,
		resizable = true,
		minimizable = true,
		closable = true,
		closeOnEscape = true,
		position = $bindable(),
		dimensions = $bindable({ width: 480, height: 320 }),
		class: className,
		theme,
		onOpenChange,
		onAfterOpen,
		onAfterClose,
		onMinimize,
		onRestore,
		onMove,
		onResize,
		...attachments
	}: FloatingWindowProps = $props();
	const openState = createBindableValue(
		() => open,
		(next) => {
			open = next;
		},
		() => defaultOpen
	);

	const generatedId = $props.id();
	const id = $derived(customId || generatedId);
	const classes = $derived(useFloatingWindowTheme(theme));
	const t = $derived(useI18n());
	// Motion preset from `floatingWindowTheme.motion`, through the override ladder
	// (registry → `setFloatingWindowTheme` → instance `theme.motion`). `crossfade` is
	// built once, so the preset is read at init like the hardcoded timings it replaces.
	const resolveMotion = useFloatingWindowMotion();
	const { flight, enter, exit } = untrack(() => ({
		flight: resolveMotion({ phase: 'flight' }, { motion: theme?.motion }),
		enter: resolveMotion({ phase: 'enter' }, { motion: theme?.motion }),
		exit: resolveMotion({ phase: 'exit' }, { motion: theme?.motion })
	}));
	const [send, receive] = crossfade({
		duration: flight.in.duration ?? 0,
		easing: easingFunctions[flight.in.easing ?? 'cubicOut'],
		fallback: (node, _params, intro) => {
			const side = intro ? enter.in : exit.out;
			return scale(node, {
				duration: side.duration ?? 0,
				easing: easingFunctions[side.easing ?? 'cubicOut'],
				start: side.scale ?? 0.97,
				opacity: side.opacity ?? 0
			});
		}
	});
	const windowState = new FloatingWindowState({
		get id() {
			return id;
		},
		get open() {
			return openState.value;
		},
		set open(value) {
			openState.value = value;
		},
		get minimized() {
			return minimized;
		},
		set minimized(value) {
			minimized = value;
		},
		get dockPlacement() {
			return dockPlacement;
		},
		get dragFrom() {
			return dragFrom;
		},
		get draggable() {
			return draggable;
		},
		get resizable() {
			return resizable;
		},
		get minimizable() {
			return minimizable;
		},
		get closable() {
			return closable;
		},
		get closeOnEscape() {
			return closeOnEscape;
		},
		get position() {
			return position;
		},
		set position(value) {
			position = value;
		},
		get dimensions() {
			return dimensions;
		},
		set dimensions(value) {
			dimensions = { ...dimensions, width: value.width, height: value.height };
		},
		get onOpenChange() {
			return onOpenChange;
		},
		get onMinimize() {
			return onMinimize;
		},
		get onRestore() {
			return onRestore;
		},
		get onMove() {
			return onMove;
		},
		get onResize() {
			return onResize;
		}
	});

	const resizeDirections: FloatingWindowResizeDirection[] = [
		'north',
		'northEast',
		'east',
		'southEast',
		'south',
		'southWest',
		'west',
		'northWest'
	];

	const isEdge = (direction: FloatingWindowResizeDirection) =>
		direction === 'north' || direction === 'east' || direction === 'south' || direction === 'west';

	const edgeOrientation = (direction: FloatingWindowResizeDirection) =>
		direction === 'north' || direction === 'south' ? 'horizontal' : 'vertical';

	const edgeValue = (direction: FloatingWindowResizeDirection) =>
		direction === 'north' || direction === 'south'
			? windowState.dimensions.height
			: windowState.dimensions.width;

	const edgeMinimum = (direction: FloatingWindowResizeDirection) =>
		direction === 'north' || direction === 'south'
			? (dimensions.min?.[1] ?? 160)
			: (dimensions.min?.[0] ?? 280);

	const edgeMaximum = (direction: FloatingWindowResizeDirection) =>
		direction === 'north' || direction === 'south'
			? (dimensions.max?.[1] ?? windowState.viewportHeight - 16)
			: (dimensions.max?.[0] ?? windowState.viewportWidth - 16);

	let observedOpen = openState.value;
	let pendingAfterOpen = openState.value;
	let pendingAfterClose = false;

	$effect(() => {
		const nextOpen = openState.value;
		if (nextOpen === observedOpen) return;
		observedOpen = nextOpen;
		pendingAfterOpen = nextOpen;
		pendingAfterClose = !nextOpen;
	});

	const handleIntroEnd = () => {
		if (!pendingAfterOpen) return;
		pendingAfterOpen = false;
		onAfterOpen?.(windowState.payload);
	};

	const handleOutroEnd = () => {
		if (!pendingAfterClose) return;
		pendingAfterClose = false;
		onAfterClose?.(windowState.payload);
	};
</script>

{#if openState.value && !minimized && windowState.position}
	<div
		{@attach windowState.theme.floatingWindows.portal}
		{@attach windowState.root}
		{@attach windowState.windowDrag}
		in:receive={{ key: id }}
		out:send={{ key: id }}
		onintroend={handleIntroEnd}
		onoutroend={handleOutroEnd}
		bind:this={ref}
		{id}
		role="dialog"
		aria-modal="false"
		aria-labelledby={`${id}-title`}
		aria-keyshortcuts={draggable
			? 'Alt+ArrowUp Alt+ArrowRight Alt+ArrowDown Alt+ArrowLeft'
			: undefined}
		tabindex="-1"
		data-slot="floating-window"
		data-dragging={windowState.isDragging ? 'true' : undefined}
		data-resizing={windowState.isResizing ? 'true' : undefined}
		class={classes.root({
			dragFrom,
			dragging: windowState.isDragging,
			resizing: windowState.isResizing,
			className
		})}
		style:top={`${windowState.position.y}px`}
		style:left={`${windowState.position.x}px`}
		style:width={`${windowState.dimensions.width}px`}
		style:height={`${windowState.dimensions.height}px`}
		style:z-index={windowState.zIndex}
		onfocusin={() => windowState.bringToFront()}
		onkeydown={(event) => windowState.handleWindowKeydown(event)}
		{...attachments}
	>
		<header
			{@attach windowState.headerDrag}
			data-floating-window-header
			class={classes.header({ draggable: draggable && dragFrom === 'header' })}
		>
			<Slot
				render={title}
				payload={windowState.payload}
				attrs={{ id: `${id}-title` }}
				class={classes.title()}
			/>
			<div data-floating-window-no-drag class={classes.actions()}>
				{#if minimizable}
					<Button
						type="button"
						size="small"
						variant="ghost"
						color="neutral"
						squared
						label={t.minimizeWindow}
						class={classes.control()}
						onclick={() => windowState.minimize()}
					>
						{@render minusIcon({ size: 16 })}
					</Button>
				{/if}
				{#if closable}
					<Button
						type="button"
						size="small"
						variant="ghost"
						color="neutral"
						squared
						label={t.closeWindow}
						class={classes.control()}
						onclick={() => windowState.close()}
					>
						{@render xIcon({ size: 16 })}
					</Button>
				{/if}
			</div>
		</header>

		<ScrollArea class={classes.scrollArea()} label={t.windowContent}>
			<Slot render={children} payload={windowState.payload} class={classes.content()} />
		</ScrollArea>

		{#if resizable}
			{#each resizeDirections as direction (direction)}
				<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
				<div
					{@attach windowState.resize(direction)}
					data-floating-window-resize-handle
					data-direction={direction}
					role={isEdge(direction) ? 'separator' : undefined}
					tabindex={isEdge(direction) ? 0 : -1}
					aria-label={isEdge(direction) ? t.resizeWindowEdge(direction) : undefined}
					aria-orientation={isEdge(direction) ? edgeOrientation(direction) : undefined}
					aria-valuenow={isEdge(direction) ? edgeValue(direction) : undefined}
					aria-valuemin={isEdge(direction) ? edgeMinimum(direction) : undefined}
					aria-valuemax={isEdge(direction) ? edgeMaximum(direction) : undefined}
					aria-hidden={isEdge(direction) ? undefined : 'true'}
					class={classes.resizeHandle({ direction })}
					onkeydown={(event) => windowState.handleResizeKeydown(event, direction)}
				></div>
			{/each}
		{/if}
	</div>
{/if}

{#if openState.value && minimized}
	<div
		{@attach windowState.theme.floatingWindows.portal}
		{@attach windowState.dock}
		{@attach windowState.dockDrag}
		in:receive={{ key: id }}
		out:send={{ key: id }}
		onintroend={handleIntroEnd}
		onoutroend={handleOutroEnd}
		bind:this={ref}
		role="group"
		aria-label={t.minimizedWindow}
		data-slot="floating-window-dock-item"
		data-placement={dockPlacement}
		data-dragging={windowState.isDragging ? 'true' : undefined}
		class={classes.dockItem({
			dragging: windowState.isDragging,
			orientation: windowState.dockOrientation,
			side: windowState.dockSide
		})}
		style:top={`${windowState.dockTop}px`}
		style:left={`${windowState.dockLeft}px`}
		style:width={`${windowState.dockWidth}px`}
		style:height={`${windowState.dockHeight}px`}
		style:z-index={windowState.zIndex}
	>
		<Button
			type="button"
			variant="ghost"
			color="neutral"
			fullWidth
			class={classes.dockTitle({
				orientation: windowState.dockOrientation,
				dragging: windowState.isDragging
			})}
			label={t.restoreWindow}
			onclick={() => windowState.restoreFromDock()}
		>
			<span class={classes.dockTitleText({ side: windowState.dockSide })}>
				<Slot render={title} payload={windowState.payload} />
			</span>
		</Button>
		<div
			data-floating-window-dock-actions
			class={classes.dockActions({ orientation: windowState.dockOrientation })}
		>
			<Button
				type="button"
				size="small"
				variant="ghost"
				color="neutral"
				squared
				label={t.restoreWindow}
				class={classes.control()}
				onclick={() => windowState.restore()}
			>
				{@render squareIcon({ size: 15 })}
			</Button>
			{#if closable}
				<Button
					type="button"
					size="small"
					variant="ghost"
					color="neutral"
					squared
					label={t.closeWindow}
					class={classes.control()}
					onclick={() => windowState.close()}
				>
					{@render xIcon({ size: 15 })}
				</Button>
			{/if}
		</div>
	</div>
{/if}
