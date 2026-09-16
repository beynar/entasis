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
	import type { Attachment } from 'svelte/attachments';

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
		delay = 100,
		closeOnEscape = true,
		closeOnClickOutside = true,
		closeOnMouseLeave = false,
		debugSafeArea = false,
		directedTransition = true,
		lockScroll = true,
		fitTrigger = false,
		inline = false,
		mobileSheet = false,
		mobileSheetSizeTransition = true,
		focusOnOpen = false,
		haspopup = 'dialog',
		class: className,
		trigger,
		theme,
		...attachments
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
		get inline() {
			return inline;
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
		get delay() {
			return delay;
		},
		get openOnClick() {
			return openOnClick;
		},
		get focusOnOpen() {
			return focusOnOpen;
		},
		get haspopup() {
			return haspopup;
		},
		get motion() {
			return theme?.motion;
		}
	});

	// `fitTrigger` panels grow past the trigger only up to the size cap, and a trigger wider than
	// the cap keeps its own width (min-width would otherwise beat the class max-width silently).
	const FIT_TRIGGER_CAP = { small: '16rem', normal: '20rem', large: '24rem' } as const;

	const classes = $derived(usePopoverTheme(theme));

	const in_out = fso();

	// An inline panel needs no reference element: it renders where the component sits.
	const visible = $derived(
		popover.isOpen &&
			(inline || popover.isMobileSheet || popover.referenceElement || popover.externalRef)
	);

	// Floating panels portal to the body layer; inline ones stay in normal document flow.
	const maybePortal: Attachment<HTMLElement> = $derived(inline ? () => {} : portal());

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

<!-- Trigger first: an inline panel then follows it in the document flow. Floating and
     mobile-sheet panels portal out, so source order does not reach them. -->
{#if trigger}
	{#if typeof trigger === 'function'}
		{@render trigger?.(popover)}
	{:else if typeof trigger !== 'boolean'}
		<Button
			{...trigger}
			{...popover.triggerProps}
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
		<div {@attach transitionSize({ isActive: () => mobileSheetSizeTransition })} {...attachments}>
			{@render children?.(popover)}
		</div>
	</Dialog>
{:else if visible}
	<dialog
		{@attach maybePortal}
		{@attach popover.dialog}
		open={true}
		id={popover.id}
		class={classes.root({ mode: popover.computedMode })}
		style:visibility={inline ? undefined : 'hidden'}
		style:z-index={inline ? undefined : popover.layer.zIndex}
		{...attachments}
	>
		<!-- The panel is a child of the wrapper, so it is never re-parented mid-transition
		     (which would break the intro). It carries the visuals, transform-origin, and animation. -->
		<div
			{@attach popover.panel}
			class={classes.popover({
				size: popover.computedSize,
				mode: popover.computedMode,
				className
			})}
			style:transform-origin={popover.transformOrigin}
			style:min-width={popover.triggerWidth != null ? `${popover.triggerWidth}px` : undefined}
			style:width={popover.triggerWidth != null ? 'max-content' : undefined}
			style:max-width={popover.triggerWidth != null
				? `max(${FIT_TRIGGER_CAP[popover.computedSize]}, ${popover.triggerWidth}px)`
				: undefined}
			in:in_out={popover.computedTransition.in}
			out:in_out={popover.computedTransition.out}
			onintroend={() => {
				popover.hasTransitioned = true;
				onAfterOpen?.(popover);
			}}
			onoutrostart={() => {
				popover.hasTransitioned = false;
			}}
			onoutroend={() => {
				popover.focusScope.restore();
				onAfterClose?.(popover);
			}}
		>
			{@render children?.(popover)}
		</div>
	</dialog>
{/if}
