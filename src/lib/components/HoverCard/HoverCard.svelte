<script lang="ts">
	import { createBindableValue } from '$lib/utils/state.svelte.js';
	import { onDestroy, untrack } from 'svelte';
	import type { Attachment } from 'svelte/attachments';

	import Button from '../Button/Button.svelte';
	import Card from '../Card/Card.svelte';
	import Popover from '../Popover/Popover.svelte';
	import Slot from '../Slot/Slot.svelte';
	import type { ButtonProps } from '../Button/index.js';
	import type { HoverCardProps, HoverCardTrigger } from './hoverCard.props.js';
	import { useHoverCardMotion, useHoverCardTheme } from './hoverCard.theme.js';
	import { useTheme } from '../Theme/theme.state.svelte.js';
	import { popoverInternals, type PopoverState } from '../Popover/popover.state.svelte.js';
	import type { PopoverApi } from '../Popover/popover.api.js';
	import { presence } from '$lib/utils/stateAttributes.js';

	let {
		id: customId,
		defaultOpen = false,
		open = $bindable(),
		trigger: triggerContent = 'Hover',
		children,
		title,
		description,
		footer,
		position = 'top',
		offset = 8,
		delay = 150,
		closeDelay = 100,
		openOnFocus = true,
		openOnClick = false,
		closeOnEscape = true,
		closeOnClickOutside = true,
		directedTransition = true,
		transition,
		size = 'normal',
		density = 'normal',
		disabled = false,
		wrap = false,
		anchorTo,
		arrow = false,
		class: className,
		triggerClass,
		popover,
		card,
		showBorders = false,
		onOpenChange,
		onAfterOpen,
		onAfterClose,
		theme,
		...attachments
	}: HoverCardProps = $props();
	const openState = createBindableValue(
		() => open,
		(next) => {
			open = next;
		},
		() => defaultOpen
	);
	const isOpen = $derived(openState.value);

	const generatedId = $props.id();
	const id = $derived(customId || generatedId);
	const classes = $derived(useHoverCardTheme(theme));
	// Own motion preset (ladder: registry → setHoverCardTheme → theme.motion → the
	// `transition` prop), handed to the Popover as an already-resolved `{ in, out }`.
	const resolveMotion = useHoverCardMotion();
	const hoverCardTransition = $derived(
		resolveMotion(undefined, { motion: theme?.motion, transition })
	);

	let openTimer: ReturnType<typeof setTimeout> | null = null;
	let closeTimer: ReturnType<typeof setTimeout> | null = null;
	const themeState = useTheme();
	let triggerElement = $state<HTMLElement | null>(null);
	let cardElement = $state<HTMLElement | null>(null);
	// The popover behind this card, for the cards opened from inside it (see `hasChildOpen`).
	let cardPopover = $state.raw<PopoverState | null>(null);
	const trackPopover =
		(api: PopoverApi): Attachment =>
		() => {
			const popover = popoverInternals(api);
			cardPopover = popover;
			return () => {
				if (cardPopover === popover) cardPopover = null;
			};
		};
	// Whether the pointer is over the trigger or the card. Plain fields: read when a timer fires.
	let pointerInside = false;
	// From the close request until the close transition has ended: a pointer that comes back in
	// that time reopens the card at once instead of waiting out `delay` again.
	let closing = false;

	// An open card keeps the hover warm-up going: moving on to a neighbouring card, tooltip or
	// hover popover opens it at once. Triggers inside this card do not count as moving on.
	$effect(() => {
		if (!isOpen) return;
		return untrack(() =>
			themeState.hoverIntent.join({ contains: (node) => !!cardElement?.contains(node) })
		);
	});

	const clearOpenTimer = () => {
		if (openTimer) {
			clearTimeout(openTimer);
			openTimer = null;
		}
	};

	const clearCloseTimer = () => {
		if (closeTimer) {
			clearTimeout(closeTimer);
			closeTimer = null;
		}
	};

	const openImmediately = () => {
		clearOpenTimer();
		clearCloseTimer();
		if (!disabled) setOpen(true);
	};

	const closeImmediately = () => {
		clearOpenTimer();
		clearCloseTimer();
		setOpen(false);
	};

	const setOpen = (nextOpen: boolean) => {
		if (isOpen === nextOpen) return;
		closing = !nextOpen;
		openState.value = nextOpen;
		onOpenChange?.(nextOpen);
	};

	const toggleImmediately = () => {
		if (isOpen) {
			closeImmediately();
		} else {
			openImmediately();
		}
	};

	const scheduleOpen = () => {
		clearCloseTimer();
		if (disabled || isOpen || openTimer) return;
		if (closing || themeState.hoverIntent.isWarm(triggerElement)) {
			openImmediately();
			return;
		}
		openTimer = setTimeout(openImmediately, delay);
	};

	// Hover is a mouse or pen affair: a touch tap reaches the card through focus instead.
	const handlePointerEnter = (event: PointerEvent) => {
		if (event.pointerType === 'touch') return;
		pointerInside = true;
		scheduleOpen();
	};
	const handlePointerLeave = (event: PointerEvent) => {
		if (event.pointerType === 'touch') return;
		pointerInside = false;
		scheduleClose();
	};

	// A card opened from inside this one (a link in its text) keeps this one open while the pointer
	// is on it: the pointer left this card, but not the cards it leads to.
	const hasOpenChild = () => !!cardPopover?.hasChildOpen;

	const scheduleClose = () => {
		clearOpenTimer();
		if (!isOpen || closeTimer) return;
		closeTimer = setTimeout(() => {
			closeTimer = null;
			if (!hasOpenChild()) closeImmediately();
		}, closeDelay);
	};

	// When the last child card closes with the pointer outside every card, this one closes too.
	let hadOpenChild = false;
	$effect(() => {
		const open = !!cardPopover?.hasChildOpen;
		untrack(() => {
			const closedLast = hadOpenChild && !open;
			hadOpenChild = open;
			if (!closedLast || !isOpen || pointerInside) return;
			const focused = cardElement?.ownerDocument.activeElement;
			if (focused && (cardElement?.contains(focused) || triggerElement?.contains(focused))) return;
			scheduleClose();
		});
	});

	const handleFocusIn = () => {
		if (openOnFocus) scheduleOpen();
	};

	const handleClick = () => {
		if (openOnClick) toggleImmediately();
	};

	const isButtonTrigger = (value: HoverCardTrigger): value is ButtonProps & { content?: string } =>
		typeof value === 'object' && value !== null;

	const payload = $derived({
		id,
		isOpen,
		open: openImmediately,
		close: closeImmediately,
		toggle: toggleImmediately
	});

	onDestroy(() => {
		clearOpenTimer();
		clearCloseTimer();
	});
</script>

<Popover
	open={isOpen}
	{id}
	{position}
	{offset}
	transition={hoverCardTransition}
	{closeOnEscape}
	{closeOnClickOutside}
	closeOnFocusOut={false}
	{directedTransition}
	{arrow}
	anchorTo={anchorTo ?? (wrap ? 'line' : 'box')}
	openOnClick={false}
	openOnHover={false}
	closeOnMouseLeave={false}
	lockScroll={false}
	{size}
	class={classes.popover({ className: popover?.class })}
	theme={popover?.theme}
	onOpenChange={setOpen}
	onAfterOpen={() => onAfterOpen?.(payload)}
	onAfterClose={() => {
		closing = false;
		onAfterClose?.(payload);
	}}
>
	{#snippet trigger(anchor)}
		{#if typeof triggerContent === 'string'}
			<button
				{@attach anchor.reference}
				{@attach trackPopover(anchor)}
				type="button"
				class={classes.trigger({ disabled, className: triggerClass })}
				data-state={isOpen ? 'open' : 'closed'}
				data-disabled={presence(disabled)}
				aria-haspopup="dialog"
				aria-expanded={isOpen}
				aria-controls={id}
				{disabled}
				bind:this={triggerElement}
				onpointerenter={handlePointerEnter}
				onpointerleave={handlePointerLeave}
				onfocusin={handleFocusIn}
				onfocusout={scheduleClose}
				onclick={handleClick}
				{...attachments}
			>
				<Slot render={triggerContent} {payload} />
			</button>
		{:else}
			<span
				{@attach anchor.reference}
				{@attach trackPopover(anchor)}
				class={classes.trigger({ disabled, wrap, className: triggerClass })}
				data-state={isOpen ? 'open' : 'closed'}
				data-disabled={presence(disabled)}
				role="presentation"
				bind:this={triggerElement}
				onpointerenter={handlePointerEnter}
				onpointerleave={handlePointerLeave}
				onfocusin={handleFocusIn}
				onfocusout={scheduleClose}
				onclick={isButtonTrigger(triggerContent) ? undefined : handleClick}
				{...attachments}
			>
				{#if isButtonTrigger(triggerContent)}
					{@const {
						content: buttonContent,
						disabled: isTriggerDisabled,
						onclick: onTriggerClick,
						...buttonProps
					} = triggerContent}
					<Button
						{...buttonProps}
						disabled={disabled || isTriggerDisabled}
						haspopup="dialog"
						expanded={isOpen}
						controls={id}
						onclick={(event) => {
							onTriggerClick?.(event);
							handleClick();
						}}
					>
						{buttonContent}
					</Button>
				{:else}
					<Slot render={triggerContent} {payload} />
				{/if}
			</span>
		{/if}
	{/snippet}

	<div
		role="presentation"
		bind:this={cardElement}
		onpointerenter={(event) => {
			if (event.pointerType !== 'touch') pointerInside = true;
			openImmediately();
		}}
		onpointerleave={handlePointerLeave}
		onfocusin={handleFocusIn}
		onfocusout={scheduleClose}
	>
		{#snippet cardTitle()}
			<Slot render={title} {payload} />
		{/snippet}

		{#snippet cardDescription()}
			<Slot render={description} {payload} />
		{/snippet}

		{#snippet cardContentSlot()}
			<Slot render={children} {payload} />
		{/snippet}

		{#snippet cardFooter()}
			<Slot render={footer} {payload} />
		{/snippet}

		<Card
			{size}
			{density}
			color={card?.color ?? 'neutral'}
			variant={card?.variant ?? 'solid'}
			{showBorders}
			class={classes.card({ size, className })}
			theme={card?.theme}
			title={title ? cardTitle : undefined}
			description={description ? cardDescription : undefined}
			content={children ? cardContentSlot : undefined}
			footer={footer ? cardFooter : undefined}
		/>
	</div>
</Popover>
