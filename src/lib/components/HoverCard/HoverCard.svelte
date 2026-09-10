<script lang="ts">
	import { createBindableValue } from '$lib/utils/state.svelte.js';
	import { onDestroy } from 'svelte';

	import Button from '../Button/Button.svelte';
	import Card from '../Card/Card.svelte';
	import Popover from '../Popover/Popover.svelte';
	import Slot from '../Slot/Slot.svelte';
	import type { ButtonProps } from '../Button/index.js';
	import type { HoverCardProps, HoverCardTrigger } from './hoverCard.props.js';
	import { useHoverCardTheme } from './hoverCard.theme.js';

	let {
		id: customId,
		defaultOpen = false,
		open = $bindable(),
		trigger: triggerContent = 'Hover',
		content,
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
		class: className,
		triggerClass,
		popoverClass,
		cardColor = 'neutral',
		cardVariant = 'solid',
		showBorders = false,
		onOpenChange,
		onAfterOpen,
		onAfterClose,
		theme,
		cardTheme,
		popoverTheme,
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
	const cardContent = $derived(content ?? children);

	let openTimer: ReturnType<typeof setTimeout> | null = null;
	let closeTimer: ReturnType<typeof setTimeout> | null = null;

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
		openTimer = setTimeout(openImmediately, delay);
	};

	const scheduleClose = () => {
		clearOpenTimer();
		if (!isOpen || closeTimer) return;
		closeTimer = setTimeout(closeImmediately, closeDelay);
	};

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
	{transition}
	{closeOnEscape}
	{closeOnClickOutside}
	{directedTransition}
	openOnClick={false}
	openOnHover={false}
	closeOnMouseLeave={false}
	lockScroll={false}
	{size}
	class={classes.popover({ className: popoverClass })}
	theme={popoverTheme}
	onOpenChange={setOpen}
	onAfterOpen={() => onAfterOpen?.(payload)}
	onAfterClose={() => onAfterClose?.(payload)}
>
	{#snippet trigger(popover)}
		{#if typeof triggerContent === 'string'}
			<button
				{@attach popover.reference}
				type="button"
				class={classes.trigger({ disabled, className: triggerClass })}
				data-state={isOpen ? 'open' : 'closed'}
				aria-haspopup="dialog"
				aria-expanded={isOpen}
				aria-controls={id}
				{disabled}
				onpointerenter={scheduleOpen}
				onpointerleave={scheduleClose}
				onfocusin={handleFocusIn}
				onfocusout={scheduleClose}
				onclick={handleClick}
				{...attachments}
			>
				<Slot render={triggerContent} {payload} />
			</button>
		{:else}
			<span
				{@attach popover.reference}
				class={classes.trigger({ disabled, className: triggerClass })}
				data-state={isOpen ? 'open' : 'closed'}
				role="presentation"
				onpointerenter={scheduleOpen}
				onpointerleave={scheduleClose}
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
						aria-haspopup="dialog"
						aria-expanded={isOpen}
						aria-controls={id}
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
		onpointerenter={openImmediately}
		onpointerleave={scheduleClose}
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
			<Slot render={cardContent} {payload} />
		{/snippet}

		{#snippet cardFooter()}
			<Slot render={footer} {payload} />
		{/snippet}

		<Card
			{size}
			{density}
			color={cardColor}
			variant={cardVariant}
			{showBorders}
			class={classes.card({ size, className })}
			theme={cardTheme}
			title={title ? cardTitle : undefined}
			description={description ? cardDescription : undefined}
			content={cardContent ? cardContentSlot : undefined}
			footer={footer ? cardFooter : undefined}
		/>
	</div>
</Popover>
