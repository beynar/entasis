<script lang="ts">
	import { createBindableValue } from '$lib/utils/state.svelte.js';
	import type { DialogProps, DialogSnapPoint } from './dialog.props.js';
	import { useDialogTheme } from './dialog.theme.js';
	import { DialogState } from './dialog.state.svelte.js';
	import Slot from '../Slot/Slot.svelte';
	import { xIcon } from '../Icons/x.js';
	import Button from '../Button/Button.svelte';
	import { fso } from '$lib/transitions/transition.js';
	import { portal } from '$lib/attachments/portal.js';
	import { drawerInsetValue } from '../Theme/theme.designTokens.js';
	import { composeHandlers } from '$lib/utils/handlers.js';
	import { useI18n } from '$lib/i18n/context.svelte.js';

	let {
		id: customId,
		type,
		responsive,
		modal = true,
		defaultOpen = false,
		open = $bindable(),
		onOpenChange,
		onAfterOpen,
		onAfterClose,
		size,
		scroll,
		transition,
		children,
		closeOnEscape = true,
		closeOnClickOutside,
		closable = true,
		focusOnClose,
		swipeToDismiss,
		swipeFrom,
		snapPoints,
		snapPoint = $bindable(),
		defaultSnapPoint,
		onSnapPointChange,
		thumb = true,
		inset,
		class: className,
		header,
		footer,
		title,
		description,
		closeButton,
		trigger,
		theme
	}: DialogProps = $props();
	const openState = createBindableValue(
		() => open,
		(next) => {
			open = next;
		},
		() => defaultOpen
	);

	const snapState = createBindableValue<DialogSnapPoint | undefined>(
		() => snapPoint,
		(next) => {
			snapPoint = next;
		},
		() => undefined
	);

	const t = $derived(useI18n());
	const id = $props.id();
	const dialog = new DialogState({
		get id() {
			return customId || id;
		},
		get type() {
			return type;
		},
		get responsive() {
			return responsive;
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
		get onAfterOpen() {
			return onAfterOpen;
		},
		get onAfterClose() {
			return onAfterClose;
		},
		get size() {
			return size;
		},
		get scroll() {
			return scroll;
		},
		get transition() {
			return transition;
		},
		get closeOnEscape() {
			return closeOnEscape;
		},
		get closeOnClickOutside() {
			return closeOnClickOutside;
		},
		get closable() {
			return closable;
		},
		get focusOnClose() {
			return focusOnClose;
		},
		get swipeToDismiss() {
			return swipeToDismiss;
		},
		get swipeFrom() {
			return swipeFrom;
		},
		get modal() {
			return modal;
		},
		get snapPoints() {
			return snapPoints;
		},
		get snapPoint() {
			return snapState.value;
		},
		set snapPoint(value) {
			snapState.value = value;
		},
		get defaultSnapPoint() {
			return defaultSnapPoint;
		},
		get onSnapPointChange() {
			return onSnapPointChange;
		},
		get motion() {
			return theme?.motion;
		}
	});

	const classes = $derived(useDialogTheme(theme));

	const hasHeader = $derived(!!(title || description));

	// A close button that renders nothing (the Popover mobile sheet passes one) leaves the dialog
	// without a visible way to close it, like `closeButton={false}`: the hidden one takes over.
	let customCloseButtonEmpty = $state(false);
	const visibleCloseSuppressed = $derived(closeButton === false || customCloseButtonEmpty);
	const watchCustomCloseButton = (node: HTMLElement) => {
		customCloseButtonEmpty = node.childElementCount === 0 && !node.textContent?.trim();
		return () => {
			customCloseButtonEmpty = false;
		};
	};

	// Wrapped so the lifecycle knows when the panel's transition plays (and when none does).
	const panelTransition = dialog.lifecycle.transition(fso());
</script>

{#snippet CLOSE_BUTTON()}
	{#if closeButton === false}
		<!-- Suppressed: a hidden button at the end of the panel still closes it for screen readers. -->
	{:else if closeButton}
		<!-- The part positions a custom close button through this wrapper. -->
		<Slot
			class={classes.closeButton({ size: dialog.computedSize })}
			render={closeButton}
			{@attach watchCustomCloseButton}
		/>
	{:else}
		<!-- The default button carries the part itself. Wrapped in the same classes, the empty
		     wrapper drew a dot at the corner when hovered (padding, rounded, state layer). -->
		<Button
			squared
			class={classes.closeButton({ size: dialog.computedSize })}
			size="small"
			variant="ghost"
			label={t.close}
			{@attach (node) => node.setAttribute('data-autofocus-skip', '')}
			onclick={(event) => dialog.close({ reason: 'close-press', event })}
		>
			{@render xIcon({ size: 20 })}
		</Button>
	{/if}
{/snippet}

{#if dialog.isRendered}
	<div
		{@attach portal()}
		id={dialog.id}
		role={dialog.role}
		aria-modal={dialog.modal ? 'true' : undefined}
		aria-labelledby={title ? `${dialog.id}-label` : undefined}
		aria-describedby={description ? `${dialog.id}-description` : undefined}
		data-layer-root
		class={classes.root({
			scroll: dialog.computedScroll,
			modal: dialog.modal,
			className
		})}
		data-type={dialog.computedType}
		data-size={size}
		data-modal={dialog.modal}
		{...dialog.stateAttributes}
		style:z-index={dialog.zIndex}
		style:--drawer-inset={inset === undefined ? undefined : drawerInsetValue(inset)}
	>
		<div
			class={classes.align({
				type: dialog.computedType,
				scroll: dialog.computedScroll,
				keyboard: dialog.keyboardAvoiding
			})}
		>
			<div
				{@attach dialog.contentAttachment}
				data-type={dialog.computedType}
				{...dialog.stateAttributes}
				style:transform={dialog.contentTransform}
				style:transition={dialog.dragging || dialog.followsChild ? 'none' : undefined}
				style:height={dialog.snapPanelHeight === undefined
					? undefined
					: `${dialog.snapPanelHeight}px`}
				style:touch-action={dialog.bodyScrollLocked ? 'none' : undefined}
				in:panelTransition={dialog.computedTransition.in}
				out:panelTransition={dialog.computedTransition.out}
				onintroend={dialog.lifecycle.introEnd}
				onoutroend={dialog.lifecycle.outroEnd}
				class={classes.content({
					size: dialog.computedSize,
					type: dialog.computedType,
					scroll: dialog.computedScroll,
					modal: dialog.modal,
					// A class, not an inline style: Svelte's transitions stash and rewrite the inline
					// `overflow` shorthand, which drops an `overflow-y` longhand when the intro ends.
					className: dialog.bodyScrollLocked ? 'overflow-y-hidden!' : undefined
				})}
			>
				<div
					class="duration-normal ease-standard flex min-h-0 flex-1 flex-col transition-opacity will-change-[opacity]"
					style:opacity={dialog.stackOpacity}
					style:transition={dialog.followsChild ? 'none' : undefined}
				>
					{#if thumb && dialog.gestureEnabled}
						<div
							aria-hidden="true"
							data-drag-handle
							class={classes.thumb({ type: dialog.computedType })}
						></div>
					{/if}
					<Slot
						as="header"
						render={header}
						attrs={dialog.gestureEnabled ? { 'data-drag-handle': true } : undefined}
						class={classes.header({
							size: dialog.computedSize,
							// The header doubles as the drag handle on touch, where a scrollable body
							// would otherwise let the browser claim the pan before we can.
							className: dialog.gestureEnabled ? 'touch-none' : undefined
						})}
						renderIf={hasHeader}
					>
						<Slot
							attrs={{ id: `${dialog.id}-label` }}
							class={classes.title({ size: dialog.computedSize })}
							render={title}
						/>
						<Slot
							attrs={{ id: `${dialog.id}-description` }}
							class={classes.description({ size: dialog.computedSize })}
							render={description}
						/>
						{#if closable}
							{@render CLOSE_BUTTON()}
						{/if}
					</Slot>
					{#if !hasHeader && closable}
						{@render CLOSE_BUTTON()}
					{/if}
					{@render children?.(dialog)}
					<Slot render={footer} class={classes.footer({ size: dialog.computedSize })} />
					{#if closable && !dialog.isAlert && visibleCloseSuppressed}
						<!-- Out of the Tab order (Escape and the sheet's own gestures serve sighted keyboard and
						     touch users), but in the accessibility tree for a screen reader's virtual cursor. -->
						<button
							type="button"
							class="sr-only"
							tabindex="-1"
							data-autofocus-skip
							onclick={(event) => dialog.close({ reason: 'close-press', event })}
						>
							{t.close}
						</button>
					{/if}
				</div>
			</div>
		</div>
	</div>
{/if}
{#if trigger}
	{#if typeof trigger === 'function'}
		{@render trigger?.(dialog)}
	{:else}
		{@const { content, children, onclick, ...buttonProps } = trigger}
		<Button
			{...buttonProps}
			{...dialog.triggerProps}
			onclick={composeHandlers(onclick, (event) => dialog.open(event))}
			children={children ?? content}
			{@attach dialog.reference}
		/>
	{/if}
{/if}

<style>
	/*
	 * A drawer's edge corners round only while it stands off the screen edge: 9999× the inset
	 * is 0 at `drawerInset: 'none'` and larger than any radius otherwise, so `min()` picks square
	 * or the panel's radius with no variant. Declared here, on the panel, so a scoped <Theme>
	 * that changes `--drawer-inset` is seen (a declaration on `html` would resolve the variable
	 * there instead).
	 */
	[data-type^='drawer'] {
		--drawer-edge-radius: min(var(--radius-xl), calc(var(--drawer-inset) * 9999));
	}
</style>
