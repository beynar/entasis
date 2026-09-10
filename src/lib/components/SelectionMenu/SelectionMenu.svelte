<script lang="ts">
	import { tick } from 'svelte';
	import type { Attachment } from 'svelte/attachments';
	import Popover from '../Popover/Popover.svelte';
	import type { PopoverState } from '../Popover/popover.state.svelte.js';
	import Slot from '../Slot/Slot.svelte';
	import ToggleMenu from '../ToggleMenu/ToggleMenu.svelte';
	import type { SelectionMenuProps, SelectionMenuPayload } from './selectionMenu.props.js';
	import { SelectionMenuState } from './selectionMenu.state.svelte.js';
	import { useSelectionMenuTheme } from './selectionMenu.theme.js';
	import { createBindableValue } from '$lib/utils/state.svelte.js';

	let {
		target,
		defaultValue = [],
		value = $bindable(),
		ariaLabel,
		color,
		variant,
		disabled = false,
		onValueChange,
		class: className,
		theme: toggleMenuTheme,
		children: content,
		enabled = true,
		position = 'top',
		offset = 8,
		size = 'normal',
		transition,
		directedTransition = true,
		closeOnEscape = true,
		closeOnClickOutside = true,
		popoverClass,
		contentClass,
		onSelectionChange,
		onAfterOpen,
		onAfterClose,
		selectionTheme,
		popoverTheme,
		...attachments
	}: SelectionMenuProps = $props();
	const valueState = createBindableValue(
		() => value,
		(next) => {
			value = next;
		},
		() => defaultValue
	);

	let open = $state(false);
	let popoverState = $state<PopoverState | null>(null);
	let contentElement = $state<HTMLElement | null>(null);

	const classes = $derived(useSelectionMenuTheme(selectionTheme));
	const selectionMenu = new SelectionMenuState(() => ({ target, onSelectionChange }));
	const payload = $derived<SelectionMenuPayload>({
		selection: selectionMenu.selection,
		target: selectionMenu.targetElement,
		close
	});

	$effect(() => {
		void target;
		selectionMenu.refresh();
	});

	$effect(() => {
		const shouldOpen = enabled && selectionMenu.selection !== null && !selectionMenu.isDismissed;
		if (open !== shouldOpen) open = shouldOpen;
	});

	$effect(() => {
		void selectionMenu.revision;
		if (!open || !popoverState?.dialogElement) return;
		void tick().then(() => {
			if (popoverState?.dialogElement) void popoverState.place(popoverState.dialogElement);
		});
	});

	export function focusFirst() {
		const focusTarget = contentElement?.querySelector<HTMLElement>(
			'[role="toolbar"] [tabindex="0"], button:not([disabled]), input:not([disabled]), [href]'
		);
		focusTarget?.focus({ preventScroll: true });
	}

	function close() {
		selectionMenu.dismiss();
		open = false;
	}

	function setOpen(nextOpen: boolean) {
		if (!nextOpen) selectionMenu.dismiss();
		open = nextOpen;
	}

	function contentReference(popover: PopoverState): Attachment<HTMLElement> {
		return (node) => {
			popoverState = popover;
			contentElement = node;
			const cleanupState = selectionMenu.contentReference(node);
			node.addEventListener('pointerdown', selectionMenu.preserveSelection);

			return () => {
				node.removeEventListener('pointerdown', selectionMenu.preserveSelection);
				cleanupState?.();
				if (contentElement === node) contentElement = null;
				if (popoverState === popover) popoverState = null;
			};
		};
	}
</script>

<span
	hidden
	aria-hidden="true"
	data-slot="selection-menu-marker"
	{@attach selectionMenu.markerReference}
></span>

<Popover
	bind:open={() => open, setOpen}
	ref={selectionMenu.anchor}
	trigger={false}
	{position}
	{offset}
	{size}
	{transition}
	{directedTransition}
	{closeOnEscape}
	{closeOnClickOutside}
	lockScroll={false}
	class={classes.popover({ className: popoverClass })}
	theme={popoverTheme}
	onAfterOpen={() => onAfterOpen?.(payload)}
	onAfterClose={() => onAfterClose?.(payload)}
>
	{#snippet children(popover)}
		{#if content}
			<div
				data-slot="selection-menu-content"
				class={classes.content({ className: contentClass })}
				{@attach contentReference(popover)}
				{...attachments}
			>
				<Slot render={content} {payload} />
			</div>
		{:else}
			<ToggleMenu
				bind:value={valueState.value}
				{defaultValue}
				{ariaLabel}
				{size}
				{color}
				{variant}
				{disabled}
				{onValueChange}
				class={className}
				theme={toggleMenuTheme}
				{@attach contentReference(popover)}
				{...attachments}
			/>
		{/if}
	{/snippet}
</Popover>
