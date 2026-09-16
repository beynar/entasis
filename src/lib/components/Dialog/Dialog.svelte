<script lang="ts">
	import { createBindableValue } from '$lib/utils/state.svelte.js';
	import type { DialogProps } from './dialog.props.js';
	import { useDialogTheme } from './dialog.theme.js';
	import { DialogState } from './dialog.state.svelte.js';
	import Slot from '../Slot/Slot.svelte';
	import { xIcon } from '../Icons/x.js';
	import Button from '../Button/Button.svelte';
	import { fso } from '$lib/transitions/transition.js';
	import { portal } from '$lib/attachments/portal.js';

	let {
		id: customId,
		type,
		responsive,
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
		closeOnClickOutside = true,
		closable = true,
		swipeToDismiss,
		swipeFrom,
		thumb = true,
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
		get swipeToDismiss() {
			return swipeToDismiss;
		},
		get swipeFrom() {
			return swipeFrom;
		},
		get motion() {
			return theme?.motion;
		}
	});

	const classes = $derived(useDialogTheme(theme));

	const hasHeader = $derived(!!(title || description));

	const in_out = fso();
</script>

{#snippet CLOSE_BUTTON()}
	<Slot class={classes.closeButton({ size: dialog.computedSize })} render={closeButton}>
		<Button
			squared
			class={classes.closeButton({ size: dialog.computedSize })}
			size="small"
			variant="ghost"
			{@attach (node) => node.setAttribute('data-autofocus-skip', '')}
			onclick={() => dialog.close()}
		>
			{@render xIcon({ size: 20 })}
		</Button>
	</Slot>
{/snippet}

{#if dialog.isOpen}
	<div
		{@attach portal()}
		id={dialog.id}
		role="dialog"
		aria-modal="true"
		aria-labelledby={title ? `${dialog.id}-label` : undefined}
		aria-describedby={description ? `${dialog.id}-description` : undefined}
		data-layer-root
		class={classes.root({
			scroll: dialog.computedScroll,
			className
		})}
		data-type={dialog.type}
		data-size={size}
		style:z-index={dialog.zIndex}
	>
		<div class={classes.align({ type: dialog.computedType, scroll: dialog.computedScroll })}>
			<div
				{@attach dialog.contentAttachment}
				data-type={dialog.type}
				style:transform={dialog.contentTransform}
				style:transition={dialog.dragging ? 'none' : undefined}
				in:in_out={dialog.computedTransition.in}
				out:in_out={dialog.computedTransition.out}
				onintroend={() => {
					dialog.hasTransitioned = true;
					onAfterOpen?.(dialog);
				}}
				onoutrostart={() => {
					dialog.hasTransitioned = false;
				}}
				onoutroend={() => {
					dialog.focusScope.restore();
					onAfterClose?.(dialog);
				}}
				class={classes.content({
					size: dialog.computedSize,
					type: dialog.computedType,
					scroll: dialog.computedScroll
				})}
			>
				<div
					class="duration-normal ease-standard flex min-h-0 flex-1 flex-col transition-opacity will-change-[opacity]"
					style:opacity={dialog.stackOpacity}
				>
					{#if thumb && dialog.swipeEnabled}
						<div
							aria-hidden="true"
							data-drag-handle
							class={classes.thumb({ type: dialog.computedType })}
						></div>
					{/if}
					<Slot
						as="header"
						render={header}
						attrs={dialog.swipeEnabled ? { 'data-drag-handle': true } : undefined}
						class={classes.header({
							size: dialog.computedSize,
							// The header doubles as the drag handle on touch, where a scrollable body
							// would otherwise let the browser claim the pan before we can.
							className: dialog.swipeEnabled ? 'touch-none' : undefined
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
					{#if !hasHeader}
						{@render CLOSE_BUTTON()}
					{/if}
					{@render children?.(dialog)}
					<Slot render={footer} class={classes.footer({ size: dialog.computedSize })} />
				</div>
			</div>
		</div>
	</div>
{/if}
{#if trigger}
	{#if typeof trigger === 'function'}
		{@render trigger?.(dialog)}
	{:else}
		<Button
			{...trigger}
			onclick={(event) => {
				trigger.onclick?.(event);
				dialog.open();
			}}
		>
			{trigger.content}
		</Button>
	{/if}
{/if}
