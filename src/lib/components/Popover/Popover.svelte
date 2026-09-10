<script lang="ts">
	import { createBindableValue } from '$lib/utils/state.svelte.js';
	import { getPopoverDialogTheme } from './popover.dialog.theme.js';
	import type { PopoverProps } from './popover.props.js';
	import { usePopoverTheme } from './popover.theme.js';
	import { PopoverState } from './popover.state.svelte.js';
	import Button from '../Button/Button.svelte';
	import Dialog from '../Dialog/Dialog.svelte';
	import { fso } from '$lib/transitions/transition.js';
	import { portal } from '$lib/attachments/portal.js';
	import { transitionSize } from '$lib/attachments/transitionSize.js';

	let {
		id: customId,
		position,
		ref,
		onOpenChange,
		onAfterOpen,
		onAfterClose,
		size,
		offset,
		transition,
		children,
		defaultOpen = false,
		open = $bindable(),
		openOnHover = false,
		openOnClick = true,
		hoverDelay = 100,
		closeOnEscape = true,
		closeOnClickOutside = true,
		closeOnMouseLeave = false,
		debugSafeArea = false,
		directedTransition = true,
		lockScroll = true,
		fitTrigger = false,
		mobileSheet = false,
		mobileSheetSizeTransition = true,
		class: className,
		trigger,
		theme
	}: PopoverProps = $props();
	const openState = createBindableValue(
		() => open,
		(next) => {
			open = next;
		},
		() => defaultOpen
	);

	const id = $props.id();
	const popover = new PopoverState({
		get id() {
			return customId || id;
		},
		get isOpen() {
			return openState.value;
		},
		set isOpen(value) {
			openState.value = value;
		},
		get onOpenChange() {
			return onOpenChange;
		},
		get size() {
			return size;
		},
		get transition() {
			return transition;
		},
		get directedTransition() {
			return directedTransition;
		},
		get position() {
			return position;
		},
		get offset() {
			return offset;
		},
		get externalRef() {
			return ref;
		},
		get fitTrigger() {
			return fitTrigger;
		},
		get mobileSheet() {
			return mobileSheet;
		},
		get closeOnEscape() {
			return closeOnEscape;
		},
		get lockScroll() {
			return lockScroll;
		},
		get closeOnMouseLeave() {
			return closeOnMouseLeave;
		},
		get debugSafeArea() {
			return debugSafeArea;
		},
		get closeOnClickOutside() {
			return closeOnClickOutside;
		},
		get openOnHover() {
			return openOnHover;
		},
		get hoverDelay() {
			return hoverDelay;
		},
		get openOnClick() {
			return openOnClick;
		}
	});

	const classes = $derived(usePopoverTheme(theme));

	const in_out = fso();

	const visible = $derived(
		popover.isOpen && (popover.isMobileSheet || popover.referenceElement || popover.externalRef)
	);

	const mobileSheetDialogTheme = $derived(
		getPopoverDialogTheme(
			classes.popover({
				size: popover.computedSize,
				mode: 'mobileSheet',
				className
			})
		)
	);
</script>

{#snippet emptyCloseButton()}{/snippet}

{#if popover.isMobileSheet}
	<Dialog
		id={popover.id}
		open={popover.isOpen}
		type="drawerBottom"
		responsive={false}
		{size}
		{transition}
		{closeOnEscape}
		{closeOnClickOutside}
		closable={closeOnEscape || closeOnClickOutside}
		swipeToDismiss={closeOnClickOutside}
		thumb={false}
		closeButton={emptyCloseButton}
		theme={mobileSheetDialogTheme}
		onOpenChange={(nextOpen) => popover.setOpen(nextOpen)}
		onAfterOpen={() => {
			popover.hasTransitioned = true;
			onAfterOpen?.(popover);
		}}
		onAfterClose={() => {
			popover.hasTransitioned = false;
			onAfterClose?.(popover);
		}}
	>
		<div {@attach transitionSize({ isActive: () => mobileSheetSizeTransition })}>
			{@render children?.(popover)}
		</div>
	</Dialog>
{:else if visible}
	<dialog
		{@attach portal()}
		{@attach popover.dialog}
		open={true}
		id={popover.id}
		class={classes.root({ mode: popover.computedMode })}
		style="visibility: hidden"
	>
		<!-- The panel is a child of the portaled wrapper, so it is never re-parented mid-transition
		     (which would break the intro). It carries the visuals, transform-origin, and animation. -->
		<div
			{@attach popover.panel}
			class={classes.popover({
				size: popover.computedSize,
				mode: popover.computedMode,
				className
			})}
			style:transform-origin={popover.transformOrigin}
			style:width={popover.triggerWidth != null ? `${popover.triggerWidth}px` : undefined}
			style:max-width={popover.triggerWidth != null ? `${popover.triggerWidth}px` : undefined}
			in:in_out={popover.computedTransition.in}
			out:in_out={popover.computedTransition.out}
			onintroend={() => {
				popover.hasTransitioned = true;
				onAfterOpen?.(popover);
			}}
			onoutrostart={() => {
				popover.hasTransitioned = false;
			}}
			onoutroend={() => onAfterClose?.(popover)}
		>
			{@render children?.(popover)}
		</div>
	</dialog>
{/if}
{#if trigger}
	{#if typeof trigger === 'function'}
		{@render trigger?.(popover)}
	{:else if typeof trigger !== 'boolean'}
		<Button
			{...trigger}
			onclick={(event) => {
				trigger.onclick?.(event);
				if (openOnClick) popover.toggle();
			}}
			{@attach popover.reference}
		>
			{trigger.content}
		</Button>
	{/if}
{/if}
